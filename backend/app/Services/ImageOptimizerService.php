<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ImageOptimizerService
{
    /**
     * Optimize an uploaded image by converting it to WebP and compressing it.
     * Non-image files will be stored without modification.
     *
     * @param UploadedFile $file The uploaded file instance
     * @param string $folder Destination folder inside public storage
     * @param int $quality Compression quality (0-100)
     * @param int $maxWidth Max width to resize down to (null to skip resizing)
     * @return array Array containing: 'path' (stored relative path) and 'success' (boolean)
     */
    public function optimizeAndStore(UploadedFile $file, string $folder = 'uploads', int $quality = 80, ?int $maxWidth = 1200): array
    {
        $mimeType = $file->getMimeType();

        // 1. Check if the file is an image and can be processed with GD
        if (!Str::startsWith($mimeType, 'image/') || $mimeType === 'image/svg+xml') {
            // Fallback for PDF, SVGs, or other non-image files
            $path = $file->store($folder, 'public');
            return [
                'path' => $path,
                'success' => false,
                'message' => 'File stored directly (not an optimizable image).'
            ];
        }

        try {
            // Read image into GD
            $fileData = file_get_contents($file->getRealPath());
            $srcImage = @imagecreatefromstring($fileData);

            if (!$srcImage) {
                // If GD fails to parse image, store original file safely
                $path = $file->store($folder, 'public');
                return [
                    'path' => $path,
                    'success' => false,
                    'message' => 'GD failed to create image. Stored original file.'
                ];
            }

            // Get original sizes
            $origWidth = imagesx($srcImage);
            $origHeight = imagesy($srcImage);

            // Auto-rotate image based on EXIF orientation if available
            $srcImage = $this->autoRotateImage($srcImage, $file->getRealPath());

            // 2. Optional Resize
            if ($maxWidth && $origWidth > $maxWidth) {
                $ratio = $maxWidth / $origWidth;
                $newWidth = $maxWidth;
                $newHeight = (int)($origHeight * $ratio);

                $dstImage = imagecreatetruecolor($newWidth, $newHeight);

                // Preserve transparency for PNGs/WebPs
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);

                imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagedestroy($srcImage);
                $srcImage = $dstImage;
            }

            // 3. Generate filename and save as WebP
            $filename = Str::random(40) . '.webp';
            $relativeStoragePath = trim($folder, '/') . '/' . $filename;
            $absoluteStoragePath = storage_path('app/public/' . $relativeStoragePath);

            // Make sure the destination directory exists
            $dir = dirname($absoluteStoragePath);
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }

            // Convert and save
            $saved = imagewebp($srcImage, $absoluteStoragePath, $quality);
            imagedestroy($srcImage);

            if ($saved) {
                return [
                    'path' => $relativeStoragePath,
                    'success' => true,
                    'message' => 'Image optimized and converted to WebP.'
                ];
            }
        } catch (Throwable $e) {
            Log::error('Image optimization failed: ' . $e->getMessage(), [
                'file' => $file->getClientOriginalName(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        // Final safe fallback in case of any failure
        $path = $file->store($folder, 'public');
        return [
            'path' => $path,
            'success' => false,
            'message' => 'Optimization failed. Stored original file as fallback.'
        ];
    }

    /**
     * Fix image orientation based on EXIF metadata (JPEG only).
     */
    private function autoRotateImage($image, string $filePath)
    {
        if (!function_exists('exif_read_data')) {
            return $image;
        }

        try {
            $exif = @exif_read_data($filePath);
            if (!$exif || empty($exif['Orientation'])) {
                return $image;
            }

            switch ($exif['Orientation']) {
                case 3:
                    $image = imagerotate($image, 180, 0);
                    break;
                case 6:
                    $image = imagerotate($image, -90, 0);
                    break;
                case 8:
                    $image = imagerotate($image, 90, 0);
                    break;
            }
        } catch (Throwable $e) {
            // Fail silently, orientation is not critical
        }

        return $image;
    }

    /**
     * Documentation Note: How this would be done using Intervention Image (v3):
     * 
     * use Intervention\Image\ImageManager;
     * use Intervention\Image\Drivers\Gd\Driver;
     * 
     * public function optimizeWithIntervention($file, $folder)
     * {
     *     $manager = new ImageManager(new Driver());
     *     $image = $manager->read($file->getRealPath());
     *     
     *     // Resize if larger than 1200px
     *     if ($image->width() > 1200) {
     *         $image->scale(width: 1200);
     *     }
     *     
     *     $filename = Str::random(40) . '.webp';
     *     $path = trim($folder, '/') . '/' . $filename;
     *     
     *     // Encode to WebP with compression quality 80
     *     $encoded = $image->toWebp(80);
     *     
     *     Storage::disk('public')->put($path, $encoded);
     *     return $path;
     * }
     */
}
