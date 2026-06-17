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
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'unread' => ['nullable', 'boolean'],
            'type' => ['nullable', 'string', 'max:100'],
        ]);

        $paginator = $request->user()
            ->notifications()
            ->when($request->has('unread'), function ($query) use ($request): void {
                $request->boolean('unread')
                    ? $query->whereNull('read_at')
                    : $query->whereNotNull('read_at');
            })
            ->when($validated['type'] ?? null, fn ($query, string $type) => $query->where('data->type', $type))
            ->paginate($validated['per_page'] ?? 50)
            ->withQueryString();

        $formatted = $paginator->getCollection()
            ->map(fn (DatabaseNotification $notification): array => $this->formatNotification($notification));

        $paginator->setCollection($formatted);

        return response()->json([
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
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

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $this->formatNotification($notification->refresh()),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markOneAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $this->formatNotification($notification->refresh()),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
            'unread_count' => 0,
        ]);
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

    /**
     * Delete all notifications for the authenticated user.
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $deleted = $request->user()->notifications()->delete();

        return response()->json([
            'message' => 'All notifications deleted successfully.',
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatNotification(DatabaseNotification $notification): array
    {
        $data = $notification->data;
        $actionUrl = $data['action_url'] ?? $data['link'] ?? null;

        return [
            'id' => $notification->id,
            'type' => $data['type'] ?? class_basename($notification->type),
            'category' => $data['category'] ?? 'system',
            'audience' => $data['audience'] ?? 'user',
            'priority' => $data['priority'] ?? 'normal',
            'icon' => $data['icon'] ?? 'notifications',
            'title' => $data['title'] ?? '',
            'message' => $data['message'] ?? '',
            'action_url' => $actionUrl,
            'certificate_url' => $data['certificate_url'] ?? null,
            'entities' => $data['entities'] ?? [],
            'metadata' => $data['metadata'] ?? [],
            'channels' => $data['channels'] ?? ['database'],
            'is_read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at->toIso8601String(),
            'raw_type' => $notification->type,
        ];
    }
}
