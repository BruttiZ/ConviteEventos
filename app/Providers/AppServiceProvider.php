<?php

namespace App\Providers;

use App\Domain\Events\Repositories\EventRepository;
use App\Domain\Guests\Repositories\GuestRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentEventRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentGuestRepository;
use App\Support\Tenancy\TenantContext;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);
        $this->app->bind(EventRepository::class, EloquentEventRepository::class);
        $this->app->bind(GuestRepository::class, EloquentGuestRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by(
            $request->user()?->id ?: $request->ip()
        ));

        RateLimiter::for('rsvp', fn (Request $request) => Limit::perMinute(12)->by(
            $request->ip().'|'.$request->route('slug')
        ));

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by(
            $request->ip().'|'.$request->string('email')->lower()
        ));
    }
}
