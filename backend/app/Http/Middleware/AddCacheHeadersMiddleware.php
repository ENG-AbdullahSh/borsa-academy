<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCacheHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $options = ''): Response
    {
        $response = $next($request);

        // Only apply caching to successful GET requests
        if ($request->isMethod('GET') && $response->getStatusCode() === 200) {
            
            // Parse options (e.g. 'public;max_age=31536000;immutable')
            $maxAge = 31536000; // default 1 year
            $isImmutable = false;
            $isPublic = true;

            if ($options) {
                $parts = explode(';', $options);
                foreach ($parts as $part) {
                    if (str_starts_with($part, 'max_age=')) {
                        $maxAge = (int) substr($part, 8);
                    }
                    if ($part === 'immutable') {
                        $isImmutable = true;
                    }
                    if ($part === 'private') {
                        $isPublic = false;
                    }
                }
            }

            $cacheControl = $isPublic ? 'public' : 'private';
            $cacheControl .= ", max-age={$maxAge}";
            
            if ($isImmutable) {
                $cacheControl .= ', immutable';
            }

            $response->headers->set('Cache-Control', $cacheControl);
            $response->headers->set('Pragma', 'cache');
            
            // Remove headers that prevent caching
            $response->headers->remove('Expires');
        }

        return $response;
    }
}
