<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminCertificateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $certificates = Certificate::query()
            ->with(['user:id,name', 'course:id,title'])
            ->latest('issued_at')
            ->paginate($validated['per_page'] ?? 20)
            ->withQueryString();

        return CertificateResource::collection($certificates);
    }
}
