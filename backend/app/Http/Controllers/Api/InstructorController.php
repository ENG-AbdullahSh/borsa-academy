<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InstructorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Instructor::query()
                ->with('user:id,name,email,role,status')
                ->withCount('courses')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $instructor = DB::transaction(function () use ($validated): Instructor {
            $userId = $validated['user_id'] ?? null;

            if (! empty($validated['login_email'])) {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['login_email'],
                    'password' => $validated['password'],
                    'role' => 'instructor',
                    'status' => 'active',
                ]);
                $userId = $user->id;
            }

            return Instructor::create([
                'user_id' => $userId,
                ...$this->profileData($validated),
            ]);
        });

        return response()->json([
            'message' => 'تم إنشاء ملف المدرب بنجاح.',
            'data' => $instructor->load('user:id,name,email,role,status')->loadCount('courses'),
        ], 201);
    }

    public function show(Instructor $instructor): JsonResponse
    {
        return response()->json([
            'data' => $instructor->load('user:id,name,email,role,status')->loadCount('courses'),
        ]);
    }

    public function update(Request $request, Instructor $instructor): JsonResponse
    {
        $validated = $this->validated($request, $instructor);

        DB::transaction(function () use ($validated, $instructor): void {
            $instructor->update($this->profileData($validated, true));

            if (array_key_exists('user_id', $validated)) {
                $instructor->update(['user_id' => $validated['user_id']]);
            }

            if (! empty($validated['login_email'])) {
                $user = $instructor->user;

                if ($user) {
                    $user->update([
                        'name' => $instructor->name,
                        'email' => $validated['login_email'],
                        ...(! empty($validated['password']) ? ['password' => $validated['password']] : []),
                    ]);
                } else {
                    $user = User::create([
                        'name' => $instructor->name,
                        'email' => $validated['login_email'],
                        'password' => $validated['password'],
                        'role' => 'instructor',
                        'status' => 'active',
                    ]);
                    $instructor->update(['user_id' => $user->id]);
                }
            } elseif ($instructor->user && array_key_exists('name', $validated)) {
                $instructor->user->update(['name' => $instructor->name]);
            }
        });

        return response()->json([
            'message' => 'تم تحديث بيانات المدرب بنجاح.',
            'data' => $instructor->refresh()
                ->load('user:id,name,email,role,status')
                ->loadCount('courses'),
        ]);
    }

    public function destroy(Instructor $instructor): JsonResponse
    {
        $instructor->delete();

        return response()->json([
            'message' => 'تم حذف ملف المدرب. لم يتم حذف حساب المستخدم المرتبط.',
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(?Instructor $instructor = null): array
    {
        $linkedUserId = $instructor?->user_id;

        return [
            'name' => [$instructor ? 'sometimes' : 'required', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'profile_image_path' => ['nullable', 'string', 'max:2048'],
            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', 'instructor'),
                Rule::unique('instructors', 'user_id')->ignore($instructor?->id),
            ],
            'login_email' => [
                'nullable',
                'email',
                'max:191',
                'required_with:password',
                Rule::unique('users', 'email')->ignore($linkedUserId),
            ],
            'password' => [
                'nullable',
                'string',
                'min:8',
                'required_with:login_email',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Instructor $instructor = null): array
    {
        $validated = $request->validate($this->rules($instructor));

        if ($request->filled('user_id') && $request->filled('login_email')) {
            throw ValidationException::withMessages([
                'user_id' => 'اختر حساباً موجوداً أو أنشئ بيانات دخول جديدة، وليس كليهما.',
            ]);
        }

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function profileData(array $validated, bool $partial = false): array
    {
        $fields = ['name', 'bio', 'specialization', 'profile_image_path'];

        return collect($fields)
            ->filter(fn (string $field): bool => ! $partial || array_key_exists($field, $validated))
            ->mapWithKeys(fn (string $field): array => [$field => $validated[$field] ?? null])
            ->all();
    }
}
