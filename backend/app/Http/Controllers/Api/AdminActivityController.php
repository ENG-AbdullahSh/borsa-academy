<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Fetch only admin activity notifications for the authenticated admin
        $notifications = $request->user()->notifications()
            ->where('data->is_admin_activity', true)
            ->latest()
            ->take(20) // Limit to recent 20 for the widget
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'icon' => $n->data['icon'] ?? 'info',
                'title' => $n->data['title'] ?? '',
                'message' => $n->data['message'] ?? '',
                'user_name' => $n->data['user_name'] ?? '',
                'course_title' => $n->data['course_title'] ?? '',
                'is_read' => $n->read_at !== null,
                'created_at' => $n->created_at->toIso8601String(),
                'time_ago' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }
}
