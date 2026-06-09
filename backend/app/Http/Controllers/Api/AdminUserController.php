<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

        $user->update(['role' => $validated['role']]);

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
}
