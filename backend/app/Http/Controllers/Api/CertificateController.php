<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use App\Models\CourseSection;
use App\Services\CertificateService;
use ArPHP\I18N\Arabic;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CertificateController extends Controller
{
    public function __construct(
        private readonly CertificateService $certificateService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $certificates = $request->user()
            ->certificates()
            ->with(['user:id,name', 'course:id,title', 'section:id,title,course_id'])
            ->latest('issued_at')
            ->get()
            ->filter(function (Certificate $certificate) use ($request): bool {
                $eligibility = $this->eligibilityForCertificate($request, $certificate);

                return (bool) ($eligibility['certificate_unlocked'] ?? false);
            })
            ->values();

        return CertificateResource::collection($certificates);
    }

    public function show(Request $request, Certificate $certificate): CertificateResource|JsonResponse
    {
        if ($certificate->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Certificate was not found.',
            ], 404);
        }

        $eligibility = $this->eligibilityForCertificate($request, $certificate);

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message' => $eligibility['locked_message'] ?? 'Certificate is locked.',
                'locked_reason' => $eligibility['locked_reason'] ?? 'not_enrolled',
                'certificate_status' => $eligibility,
            ], 423);
        }

        return new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        );
    }

    public function course(Request $request, int $courseId): JsonResponse
    {
        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $courseId)
            ->first();

        if (! $enrollment) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $eligibility = $this->certificateService->eligibilityForEnrollment($enrollment);

        if (! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message'            => $eligibility['locked_message'],
                'locked_reason'      => $eligibility['locked_reason'],
                'certificate_status' => $eligibility,
            ], $eligibility['locked_reason'] === 'course_incomplete' ? 422 : 423);
        }

        $certificate = $this->certificateService->issueForEnrollment($enrollment);

        return (new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        ))->response()->setStatusCode(200);
    }

    public function section(Request $request, int $courseId, CourseSection $section): JsonResponse
    {
        if ($section->course_id !== $courseId) {
            return response()->json([
                'message' => 'Section was not found in this course.',
            ], 404);
        }

        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $courseId)
            ->first();

        if (! $enrollment) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $eligibility = $this->certificateService->eligibilityForSection($enrollment, $section);

        if (! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message' => $eligibility['locked_message'],
                'locked_reason' => $eligibility['locked_reason'],
                'certificate_status' => $eligibility,
            ], 423);
        }

        $certificate = $this->certificateService->issueForSection($enrollment, $section);

        return (new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        ))->response()->setStatusCode(200);
    }

    /**
     * Generate and download a PDF certificate for the authenticated user.
     *
     * Arabic text shaping pipeline (required for DomPDF):
     *  DomPDF/CPDF renders text as a left-to-right glyph stream without
     *  native Unicode bidirectional or Arabic contextual shaping support.
     *  We use ArPHP\I18N\Arabic::utf8Glyphs() to:
     *    (a) Convert each Arabic character to its correct contextual glyph
     *        form (Isolated / Initial / Medial / Final).
     *    (b) Reverse the visual order of the string so the first displayed
     *        character ends up on the right inside DomPDF's LTR renderer.
     *  The resulting strings are then embedded directly in the Blade view
     *  alongside the @font-face-loaded Cairo TTF.
     */
    public function downloadPdf(Request $request, int $id): Response|JsonResponse
    {
        $certificate = Certificate::with(['user:id,name', 'course:id,title', 'section:id,title,course_id'])
            ->find($id);

        // 404 - certificate does not exist
        if (! $certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        // 403 - certificate belongs to someone else
        if ($certificate->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        // Verify the student actually earned this (course + quiz complete)
        $eligibility = $this->eligibilityForCertificate($request, $certificate);

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json(['message' => 'Certificate is not yet unlocked.'], 423);
        }

        // --- 1. Build raw Arabic strings -----------------------------------
        $rawStudentName = $certificate->user?->name ?? 'الطالب';

        $rawCourseName = $certificate->section
            ? (($certificate->course?->title ?? 'الدورة') . ' - ' . $certificate->section->title)
            : ($certificate->course?->title ?? 'الدورة');

        // Arabic date fallback (Carbon locale)
        $rawIssuedAt = \Carbon\Carbon::parse($certificate->issued_at ?? now())
            ->locale('ar')
            ->translatedFormat('j F Y');

        // --- 2. Shape Arabic glyphs for DomPDF -----------------------------
        $arabic = new Arabic();

        $shapedStudentName = $arabic->utf8Glyphs($rawStudentName);
        $shapedCourseName  = $arabic->utf8Glyphs($rawCourseName);
        $shapedIssuedAt    = $arabic->utf8Glyphs($rawIssuedAt);

        // Static Arabic UI labels (shaped once)
        $labels = [
            'certTitle'       => $arabic->utf8Glyphs('شهادة إتمام دورة'),
            'presentedTo'     => $arabic->utf8Glyphs('تشهد أكاديمية بورصة بأن الطالب/ة'),
            'completionText'  => $arabic->utf8Glyphs('قد أتم/ت بنجاح دورة'),
            'labelDate'       => $arabic->utf8Glyphs('تاريخ الإصدار'),
            'labelCertNumber' => $arabic->utf8Glyphs('رقم الشهادة'),
            'labelProgress'   => $arabic->utf8Glyphs('نسبة الإنجاز'),
        ];

        // --- 3. Manage Fonts (Download official Cairo if missing/corrupt) ---
        $cairoRegularPath = storage_path('fonts/Cairo-Regular.ttf');
        $cairoBoldPath    = storage_path('fonts/Cairo-Bold.ttf');
        $downloaded       = false;
        $useAmiri         = false;

        // Ensure directory exists
        if (!file_exists(storage_path('fonts'))) {
            @mkdir(storage_path('fonts'), 0755, true);
        }

        // Force download if file is missing, too small, or is the Amiri fallback copy (562520 bytes)
        $shouldDownloadRegular = !file_exists($cairoRegularPath) || filesize($cairoRegularPath) < 50000 || filesize($cairoRegularPath) == 562520;
        if ($shouldDownloadRegular) {
            $fontData = @file_get_contents('https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1Q.ttf');
            if ($fontData) {
                @file_put_contents($cairoRegularPath, $fontData);
                $downloaded = true;
            } else {
                $useAmiri = true;
            }
        }

        $shouldDownloadBold = !file_exists($cairoBoldPath) || filesize($cairoBoldPath) < 50000 || filesize($cairoBoldPath) == 562520;
        if ($shouldDownloadBold) {
            $fontData = @file_get_contents('https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hAc5W1Q.ttf');
            if ($fontData) {
                @file_put_contents($cairoBoldPath, $fontData);
                $downloaded = true;
            } else {
                $useAmiri = true;
            }
        }

        // Check if the current file sizes are still corrupt or if we had to use Amiri
        if (!$useAmiri) {
            if (!file_exists($cairoRegularPath) || filesize($cairoRegularPath) < 50000 || filesize($cairoRegularPath) == 562520) {
                $useAmiri = true;
            }
            if (!file_exists($cairoBoldPath) || filesize($cairoBoldPath) < 50000 || filesize($cairoBoldPath) == 562520) {
                $useAmiri = true;
            }
        }

        if ($downloaded) {
            // Remove DomPDF's caches for both cairo and caironew to force rebuild
            foreach (glob(storage_path('fonts/cairo_*')) as $file) {
                @unlink($file);
            }
            foreach (glob(storage_path('fonts/caironew_*')) as $file) {
                @unlink($file);
            }
            @unlink(storage_path('fonts/installed-fonts.json'));
        }

        $fontRegular = $useAmiri 
            ? base_path('vendor/khaled.alshamaa/ar-php/examples/fonts/Amiri-Regular.ttf') 
            : $cairoRegularPath;

        $fontBold = $useAmiri 
            ? base_path('vendor/khaled.alshamaa/ar-php/examples/fonts/Amiri-Regular.ttf') 
            : $cairoBoldPath;

        // --- 4. Render & stream PDF ----------------------------------------
        $pdf = Pdf::loadView('certificates.pdf', [
            'studentName' => $shapedStudentName,
            'courseName'  => $shapedCourseName,
            'issuedAt'    => $shapedIssuedAt,
            'certNumber'  => $certificate->certificate_number,
            'progress'    => $certificate->progress_percentage ?? 100,
            'labels'      => $labels,
            'fontRegular' => $fontRegular,
            'fontBold'    => $fontBold,
        ])->setPaper('a4', 'landscape');

        event(new \App\Events\FileDownloadedEvent($request->user(), 'certificate-' . $id . '.pdf'));
        event(new \App\Events\UserGeneratedCertificateEvent($request->user(), $certificate->course));

        return $pdf->download('certificate-' . $id . '.pdf');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function eligibilityForCertificate(Request $request, Certificate $certificate): ?array
    {
        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $certificate->course_id)
            ->first();

        if (! $enrollment) {
            return null;
        }

        if ($certificate->scope_type === 'section') {
            $section = $certificate->section;

            return $section
                ? $this->certificateService->eligibilityForSection($enrollment, $section)
                : null;
        }

        return $this->certificateService->eligibilityForEnrollment($enrollment);
    }
}
