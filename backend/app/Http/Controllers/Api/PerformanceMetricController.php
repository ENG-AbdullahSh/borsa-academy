<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PerformanceMetricController extends Controller
{
    /**
     * Store Core Web Vitals performance telemetry sent from the frontend client.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Use validation rules that are permissive since telemetry is non-critical
        $validated = $request->validate([
            'lcp'       => ['nullable', 'numeric', 'min:0'],
            'fid'       => ['nullable', 'numeric', 'min:0'],
            'cls'       => ['nullable', 'numeric', 'min:0'],
            'fcp'       => ['nullable', 'numeric', 'min:0'],
            'ttfb'      => ['nullable', 'numeric', 'min:0'],
            'url'       => ['required', 'string', 'max:255'],
            'userAgent' => ['required', 'string', 'max:500'],
        ]);

        // Append request metadata
        $validated['ip'] = $request->ip();
        $validated['timestamp'] = now()->toIso8601String();

        // Log telemetry data to a custom log file (performance.log)
        Log::channel('single')->info('Core Web Vitals Telemetry', $validated);

        return response()->json([
            'success' => true,
            'message' => 'Telemetry registered.'
        ]);
    }
}
