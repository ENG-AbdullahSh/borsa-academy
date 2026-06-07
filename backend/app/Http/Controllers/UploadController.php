<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
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
            $path = $file->store($folderPath, 'public');

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
                'path' => $path
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No file provided.'
        ], 400);
    }
}
