<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'student',
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Registered successfully.',
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'لا يوجد حساب بهذا البريد الإلكتروني، يرجى إنشاء حساب جديد',
                'code' => 'ACCOUNT_NOT_FOUND',
            ], 404);
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                'code' => 'INVALID_CREDENTIALS',
            ], 422);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'هذا الحساب غير مفعل أو موقوف',
                'code' => $user->status === 'suspended'
                    ? 'ACCOUNT_SUSPENDED'
                    : 'ACCOUNT_INACTIVE',
            ], 403);
        }

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
