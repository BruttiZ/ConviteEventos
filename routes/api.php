<?php

use App\Http\Controllers\Api\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminEventController;
use App\Http\Controllers\Api\Admin\AdminGuestController;
use App\Http\Controllers\Api\Public\PublicEventController;
use App\Http\Controllers\Api\Public\PublicRsvpController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api', 'tenant.optional'])->group(function (): void {
    Route::get('/events/{slug}', [PublicEventController::class, 'show']);
    Route::post('/events/{slug}/rsvp', [PublicRsvpController::class, 'store'])->middleware('throttle:rsvp');

    Route::middleware(['auth:sanctum'])->prefix('admin')->group(function (): void {
        Route::apiResource('events', AdminEventController::class);
        Route::get('events/{event}/analytics', AdminAnalyticsController::class);
        Route::apiResource('events.guests', AdminGuestController::class)->shallow();
    });
});
