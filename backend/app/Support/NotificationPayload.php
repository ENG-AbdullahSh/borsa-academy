<?php

namespace App\Support;

final class NotificationPayload
{
    /**
     * @param  array<string, mixed>  $entities
     * @param  array<int, string>  $channels
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    public static function make(
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $entities = [],
        string $audience = 'user',
        string $priority = 'normal',
        string $icon = 'notifications',
        array $channels = ['database'],
        array $metadata = [],
    ): array {
        return [
            'schema_version' => 1,
            'type' => $type,
            'category' => str_contains($type, '.') ? str($type)->before('.')->value() : $type,
            'audience' => $audience,
            'priority' => $priority,
            'icon' => $icon,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'entities' => $entities,
            'channels' => $channels,
            'metadata' => $metadata,
        ];
    }
}
