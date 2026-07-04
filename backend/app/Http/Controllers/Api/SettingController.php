<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function getSettings(): JsonResponse
    {
        $setting = Setting::firstOrCreate(
            ['id' => 1],
            [
                'academy_name' => 'Borsa Academy',
                'center_director_name' => 'كريم ابو رمضان',
            ]
        );

        if (is_null($setting->center_director_name)) {
            $setting->update(['center_director_name' => 'كريم ابو رمضان']);
        }

        return response()->json([
            'data' => $setting,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academy_name' => 'sometimes|required|string|max:255',
            'admin_email' => 'nullable|email|max:255',
            'logo_path' => 'nullable|string|max:2048',
            'general_description' => 'nullable|string',
            'center_director_name' => 'nullable|string|max:255',
        ]);

        $setting = Setting::firstOrCreate(
            ['id' => 1],
            [
                'academy_name' => 'Borsa Academy',
                'center_director_name' => 'كريم ابو رمضان',
            ]
        );

        $setting->update($validated);

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => $setting,
        ]);
    }
}
