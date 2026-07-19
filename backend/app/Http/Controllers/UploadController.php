<?php

namespace App\Http\Controllers;

use App\Services\ImageOptimizerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
    public function __construct(
        protected ImageOptimizerService $imageOptimizer
    ) {}

    public function uploadFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,svg,pdf|max:10240',
            'folder' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $folder = $request->input('folder', '');
        $folderPath = $folder ? 'uploads/' . trim($folder, '/') : 'uploads';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Pass through our image optimizer service
            $result = $this->imageOptimizer->optimizeAndStore($file, $folderPath);

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $result['path']),
                'path' => $result['path'],
                'optimized' => $result['success']
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No file provided.'
        ], 400);
    }
}
