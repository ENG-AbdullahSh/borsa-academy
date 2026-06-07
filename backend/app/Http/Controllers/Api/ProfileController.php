<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Update the authenticated user's name and/or profile image.
     *
     * Accepts:
     *   - name             (string, required)
     *   - profile_image_path (string, nullable) – relative path returned by POST /api/upload
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => ['required', 'string', 'min:2', 'max:100'],
            'profile_image_path'  => ['nullable', 'string', 'max:500'],
            'profile_image'       => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        $user->name = $validated['name'];

        if (array_key_exists('profile_image_path', $validated) && $validated['profile_image_path']) {
            $user->avatar = $validated['profile_image_path'];
        } elseif (array_key_exists('profile_image', $validated) && $validated['profile_image']) {
            $user->avatar = $validated['profile_image'];
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => [
                'id'                 => $user->id,
                'name'               => $user->name,
                'email'              => $user->email,
                'role'               => $user->role,
                'avatar'             => $user->avatar,
                'profile_image_path' => $user->avatar,
            ],
        ]);
    }

    /**
     * Change the authenticated user's password.
     *
     * Accepts:
     *   - current_password         (string, required)
     *   - new_password             (string, required, min 8, confirmed)
     *   - new_password_confirmation (string, required)
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Verify the current password is correct before allowing any change
        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password you entered is incorrect.'],
            ]);
        }

        // Prevent reusing the same password
        if (Hash::check($validated['new_password'], $user->password)) {
            throw ValidationException::withMessages([
                'new_password' => ['The new password must be different from your current password.'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}
