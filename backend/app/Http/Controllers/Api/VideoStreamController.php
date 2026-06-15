<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * VideoStreamController
 *
 * Streams a lesson video file with full HTTP Range request support,
 * enabling video seeking (scrubbing) in all browsers.
 *
 * Route: GET /api/lessons/{lesson}/stream
 * Auth:  Sanctum (must be enrolled OR lesson is_preview)
 */
class VideoStreamController extends Controller
{
    public function stream(Request $request, Lesson $lesson): Response
    {
        $user = Auth::user();
        if (! $lesson->is_published) {
            $isAuthorized = false;
            if ($user) {
                if ($user->role === 'admin') {
                    $isAuthorized = true;
                } elseif ($user->role === 'instructor') {
                    $instructor = Instructor::where('user_id', $user->id)->first();
                    $course = $lesson->section?->course;
                    if ($instructor && $course && $course->instructor_id === $instructor->id) {
                        $isAuthorized = true;
                    }
                }
            }
            if (! $isAuthorized) {
                abort(403, 'الدرس غير منشور بعد.');
            }
        }

        // ── 1. Authorization ─────────────────────────────────────────────
        // Allow public preview lessons; otherwise require enrollment.
        if (! $lesson->is_preview) {
            if (! $user) {
                abort(401, 'Unauthenticated');
            }
            // Check enrollment via the lesson's section → course
            $course = $lesson->section?->course;
            if ($course) {
                $enrolled = $course->enrollments()
                    ->where('user_id', $user->id)
                    ->exists();
                if (! $enrolled) {
                    abort(403, 'Not enrolled in this course');
                }
            }
        }

        // ── 2. Resolve the physical file path ────────────────────────────
        if (empty($lesson->video_path)) {
            abort(404, 'No video file found for this lesson');
        }

        // video_path is relative to the "public" Storage disk
        $disk = Storage::disk('public');
        $filePath = $lesson->video_path;

        if (! $disk->exists($filePath)) {
            abort(404, 'Video file not found on disk');
        }

        $fullPath = $disk->path($filePath);
        $fileSize = filesize($fullPath);
        $mimeType = $this->getMimeType($fullPath);

        // ── 3. Parse Range header ────────────────────────────────────────
        $rangeHeader = $request->header('Range');
        [$start, $end, $statusCode] = $this->parseRange($rangeHeader, $fileSize);

        $length = $end - $start + 1;

        // ── 4. Build response headers ────────────────────────────────────
        $lastModified = gmdate('D, d M Y H:i:s', filemtime($fullPath)).' GMT';
        $etag = '"'.md5($fullPath.$fileSize.filemtime($fullPath)).'"';

        // 304 Not Modified shortcut — saves re-streaming the whole range
        $ifNoneMatch = $request->header('If-None-Match');
        $ifModified = $request->header('If-Modified-Since');
        if (
            ($ifNoneMatch && $ifNoneMatch === $etag) ||
            ($ifModified && $ifModified === $lastModified)
        ) {
            return new Response('', 304, [
                'Cache-Control' => 'private, max-age=3600',
                'ETag' => $etag,
                'Last-Modified' => $lastModified,
                'Access-Control-Allow-Origin' => $request->header('Origin', '*'),
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Expose-Headers' => 'ETag, Last-Modified',
            ]);
        }

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes {$start}-{$end}/{$fileSize}",
            'Accept-Ranges' => 'bytes',
            // private: only user's browser caches (not shared CDN/proxies since video is auth-protected)
            // max-age=3600: browser may reuse cached chunks for 1 hour without re-asking
            'Cache-Control' => 'private, max-age=3600',
            'ETag' => $etag,
            'Last-Modified' => $lastModified,
            'X-Content-Type-Options' => 'nosniff',
            // Allow the React frontend to read these headers cross-origin
            'Access-Control-Allow-Origin' => $request->header('Origin', '*'),
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Range, Accept-Ranges, ETag',
        ];

        // ── 5. Stream the requested byte range ───────────────────────────
        $response = new StreamedResponse(function () use ($fullPath, $start, $length) {
            $handle = fopen($fullPath, 'rb');
            if ($handle === false) {
                abort(500, 'Cannot open video file');
            }

            fseek($handle, $start);

            $remaining = $length;
            $bufferSize = 1024 * 64; // 64 KB chunks

            while (! feof($handle) && $remaining > 0) {
                $read = min($bufferSize, $remaining);
                $chunk = fread($handle, $read);
                if ($chunk === false) {
                    break;
                }
                echo $chunk;
                $remaining -= strlen($chunk);

                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }

            fclose($handle);
        }, $statusCode, $headers);

        return $response;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /**
     * Parse the Range header and return [start, end, statusCode].
     * Returns the full file range (200) if no Range header is present.
     *
     * @return array{int, int, int}
     */
    private function parseRange(?string $header, int $fileSize): array
    {
        if (empty($header) || ! str_starts_with($header, 'bytes=')) {
            // No range requested — serve the whole file
            return [0, $fileSize - 1, 200];
        }

        // e.g. "bytes=0-1023" or "bytes=1024-"
        $range = substr($header, 6);
        [$startStr, $endStr] = explode('-', $range, 2) + ['0', ''];

        $start = (int) $startStr;
        $end = $endStr !== '' ? (int) $endStr : $fileSize - 1;

        // Clamp to valid bounds
        $start = max(0, $start);
        $end = min($end, $fileSize - 1);

        if ($start > $end) {
            abort(416, 'Requested range not satisfiable');
        }

        return [$start, $end, 206]; // 206 Partial Content
    }

    /**
     * Detect MIME type from file extension (avoids shell_exec on Windows).
     */
    private function getMimeType(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'ogg' => 'video/ogg',
            'mov' => 'video/quicktime',
            'avi' => 'video/x-msvideo',
            'mkv' => 'video/x-matroska',
            default => 'application/octet-stream',
        };
    }
}
