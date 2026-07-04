<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\User;
use App\Notifications\AccountStatusChangedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Throwable;

class AdminUserController extends Controller
{
    /**
     * List users with server-side search, filters, counts, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in(['admin', 'instructor', 'student'])],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'status', 'avatar', 'created_at'])
            ->withCount(['enrollments', 'certificates'])
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $term = '%'.addcslashes(trim($search), '%_\\').'%';

                $query->where(function ($query) use ($term): void {
                    $query->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
            })
            ->when($validated['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return response()->json($users);
    }

    /**
     * Create a new user from the admin dashboard.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
            'role'     => ['required', Rule::in(['admin', 'instructor', 'student'])],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $newUser = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role'     => $validated['role'],
                'status'   => 'active', // default status
            ]);

            if ($newUser->role === 'instructor') {
                $this->ensureInstructorProfile($newUser);
            }

            return $newUser;
        });

        $user->loadCount(['enrollments', 'certificates']);

        return response()->json([
            'message' => 'تم إضافة المستخدم بنجاح.',
            'data'    => $this->userData($user),
        ], 201);
    }

    /**
     * Display one user with the same data exposed by the list.
     */
    public function show(User $user): JsonResponse
    {
        $user->loadCount(['enrollments', 'certificates']);

        return response()->json([
            'data' => $this->userData($user),
        ]);
    }

    /**
     * Update account access without deleting the user.
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        if ($request->user()->is($user) && $validated['status'] !== 'active') {
            return response()->json([
                'message' => 'لا يمكنك تعطيل أو إيقاف حسابك الشخصي.',
            ], 422);
        }

        $user->update(['status' => $validated['status']]);

        try {
            $user->notify(new AccountStatusChangedNotification($validated['status']));
        } catch (Throwable $exception) {
            Log::warning('Account status notification failed', [
                'user_id' => $user->id,
                'status' => $validated['status'],
                'error' => $exception->getMessage(),
            ]);
        }

        if ($user->status !== 'active') {
            $user->tokens()->delete();
        }

        $user->loadCount(['enrollments', 'certificates']);

        return response()->json([
            'message' => 'تم تحديث حالة المستخدم بنجاح.',
            'data' => $this->userData($user),
        ]);
    }

    /**
     * Update a role while ensuring the application always has an active admin.
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'instructor', 'student'])],
        ]);

        if ($request->user()->is($user) && $validated['role'] !== 'admin') {
            return response()->json([
                'message' => 'لا يمكنك إزالة صلاحية المسؤول من حسابك الشخصي.',
            ], 422);
        }

        if (
            $user->role === 'instructor'
            && $validated['role'] !== 'instructor'
            && $user->instructorProfile()->exists()
        ) {
            return response()->json([
                'message' => 'افصل حساب المستخدم عن ملف المدرب قبل تغيير دوره.',
            ], 422);
        }

        if (
            $user->role === 'admin'
            && $validated['role'] !== 'admin'
            && ! User::query()
                ->whereKeyNot($user->getKey())
                ->where('role', 'admin')
                ->where('status', 'active')
                ->exists()
        ) {
            return response()->json([
                'message' => 'يجب الإبقاء على مسؤول نشط واحد على الأقل.',
            ], 422);
        }

        $roleChanged = $user->role !== $validated['role'];

        DB::transaction(function () use ($user, $validated): void {
            $user->update(['role' => $validated['role']]);

            if ($user->role === 'instructor') {
                $this->ensureInstructorProfile($user);
            }
        });

        if ($roleChanged) {
            $user->tokens()->delete();
        }

        $user->loadCount(['enrollments', 'certificates']);

        return response()->json([
            'message' => 'تم تحديث دور المستخدم بنجاح.',
            'data' => $this->userData($user),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userData(User $user): array
    {
        return [
            'id'                  => $user->id,
            'name'                => $user->name,
            'email'               => $user->email,
            'role'                => $user->role,
            'status'              => $user->status,
            'avatar'              => $user->avatar,
            'avatar_url'          => $user->avatar_url,
            'created_at'          => $user->created_at,
            'enrollments_count'   => $user->enrollments_count,
            'certificates_count'  => $user->certificates_count,
        ];
    }

    private function ensureInstructorProfile(User $user): void
    {
        if ($user->instructorProfile()->exists()) {
            return;
        }

        $existingProfile = Instructor::query()
            ->whereNull('user_id')
            ->where('name', $user->name)
            ->oldest()
            ->first();

        if ($existingProfile) {
            $existingProfile->update(['user_id' => $user->id]);

            return;
        }

        Instructor::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'profile_image_path' => $user->avatar,
        ]);
    }
}
