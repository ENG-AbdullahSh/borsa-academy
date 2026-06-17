<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesInstructorCourseOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessons\StoreLessonRequest;
use App\Http\Requests\Lessons\UpdateLessonRequest;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Notifications\NewLessonPublishedNotification;
use App\Services\NotificationRecipientService;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class LessonController extends Controller
{
    use AuthorizesInstructorCourseOwnership;

    public function __construct(
        private readonly NotificationRecipientService $notificationRecipients,
        private readonly QuizService $quizService,
    ) {}

    public function store(StoreLessonRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $section = CourseSection::with('course')->findOrFail($validated['section_id']);
        $this->authorizeCourseOwnership($request, $section->course);

        // Filter out uploaded file objects because we only persist their stored paths.
        foreach (['pdf', 'video'] as $fileField) {
            if (array_key_exists($fileField, $validated)) {
                unset($validated[$fileField]);
            }
        }

        if (($validated['duration_minutes'] ?? null) === null) {
            unset($validated['duration_minutes']);
        }

        // New lessons always start as drafts. Publishing is allowed only after
        // a ready lesson quiz exists, so students never receive video access first.
        $validated['is_published'] = false;

        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('lessons/videos', 'public');
            $validated['video_path'] = $path;
        }

        if ($request->hasFile('pdf')) {
            $path = $request->file('pdf')->store('lessons/pdfs', 'public');
            $validated['pdf_path'] = $path;
        }

        $lesson = Lesson::create($validated);
        $lesson->load('section.course');

        if ($lesson->is_published) {
            $this->notifyStudentsAboutPublishedLesson($lesson, $request);
        }

        return response()->json([
            'message' => 'Lesson created successfully.',
            'data' => $lesson,
        ], 201);
    }

    public function update(UpdateLessonRequest $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $wasPublished = (bool) $lesson->is_published;
        $validated = $request->validated();
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        if (isset($validated['section_id']) && $validated['section_id'] !== $lesson->section_id) {
            $targetSection = CourseSection::with('course')->findOrFail($validated['section_id']);
            $this->authorizeCourseOwnership($request, $targetSection->course);
        }

        $wantsToPublish = ! $wasPublished
            && array_key_exists('is_published', $validated)
            && filter_var($validated['is_published'], FILTER_VALIDATE_BOOL);

        if ($wantsToPublish) {
            if (! $this->lessonHasReadyQuiz($lesson)) {
                return response()->json([
                    'message' => 'Create and complete a ready quiz before publishing this lesson.',
                ], 422);
            }
        }

        $lesson->update($validated);
        $lesson->refresh()->load('section.course');

        if ($wantsToPublish) {
            $this->notifyStudentsAboutPublishedLesson($lesson, $request);
        }

        return response()->json([
            'message' => 'Lesson updated successfully.',
            'data' => $lesson,
        ]);
    }

    public function uploadVideo(Request $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/mpeg,video/quicktime,video/webm', 'max:512000'],
        ]);

        if ($request->hasFile('video')) {
            // Delete old video file if it exists in disk
            if ($lesson->video_path) {
                Storage::disk('public')->delete($lesson->video_path);
            }

            // Store new video file in the lessons/videos directory on the public disk
            $path = $request->file('video')->store('lessons/videos', 'public');

            // Save the resulting file path to the video_path column
            $lesson->video_path = $path;
            $lesson->save();

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully.',
                'video_path' => $path,
                'video_url' => $lesson->video_url, // uses the accessor we defined in the Lesson model!
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No video file provided.',
        ], 400);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        // Delete the video from disk if it exists
        if ($lesson->video_path) {
            Storage::disk('public')->delete($lesson->video_path);
        }

        $lesson->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully.',
        ]);
    }

    private function notifyStudentsAboutPublishedLesson(Lesson $lesson, Request $request): void
    {
        try {
            $this->notificationRecipients->notifyCourseStudents(
                $lesson->section->course,
                new NewLessonPublishedNotification($lesson, $request->user()),
            );
        } catch (Throwable $exception) {
            Log::warning('New lesson notification failed', [
                'lesson_id' => $lesson->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function lessonHasReadyQuiz(Lesson $lesson): bool
    {
        $lesson->loadMissing('quiz.questions.options');

        return $lesson->quiz !== null
            && $lesson->quiz->is_active
            && $this->quizService->isReady($lesson->quiz);
    }
}
