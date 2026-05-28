<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class ResolveTenant
{
    public function __construct(private TenantContext $context) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;
        $tenantSlug = $request->header('X-Tenant');
        $host = $request->getHost();

        if ($tenantSlug) {
            $tenant = Tenant::query()->where('slug', $tenantSlug)->first();
        }

        if (! $tenant && ! str_contains($host, 'localhost')) {
            $tenant = Tenant::query()->where('domain', $host)->first();
        }

        $this->context->set($tenant);

        return $next($request);
    }
}
