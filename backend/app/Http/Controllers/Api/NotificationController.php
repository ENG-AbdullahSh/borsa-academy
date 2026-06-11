<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Return all notifications for the authenticated user,
     * most recent first, with read/unread state.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $request->user()
            ->notifications()   // ordered by created_at desc by default
            ->paginate(50);

        $formatted = $paginator->getCollection()->map(fn (DatabaseNotification $n): array => [
            'id'         => $n->id,
            'type'       => $n->data['type'] ?? 'system',
            'title'      => $n->data['title'] ?? '',
            'message'    => $n->data['message'] ?? '',
            'action_url' => $n->data['action_url'] ?? null,
            'certificate_url' => $n->data['certificate_url'] ?? null,
            'is_read'    => $n->read_at !== null,
            'read_at'    => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at->toIso8601String(),
        ]);

        $paginator->setCollection($formatted);

        return response()->json([
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'has_more'     => $paginator->hasMorePages(),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Return only the unread notification count — lightweight polling endpoint.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a specific notification as read, or mark ALL as read
     * when the request body contains { "all": true }.
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->boolean('all')) {
            $user->unreadNotifications->markAsRead();

            return response()->json(['message' => 'All notifications marked as read.']);
        }

        $validated = $request->validate([
            'id' => ['required', 'uuid'],
        ]);

        $notification = $user->notifications()->find($validated['id']);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully.']);
    }
}
