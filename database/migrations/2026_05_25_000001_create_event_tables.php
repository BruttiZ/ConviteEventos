<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('category')->default('premium');
            $table->json('tokens');
            $table->json('schema')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
        });

        Schema::create('events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('template_id')->nullable()->constrained('event_templates')->nullOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('status')->default('draft');
            $table->string('timezone')->default('America/Sao_Paulo');
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at')->nullable();
            $table->string('venue_name')->nullable();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('spotify_playlist_url')->nullable();
            $table->json('hero');
            $table->json('content');
            $table->json('theme');
            $table->json('gallery')->nullable();
            $table->json('seo')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'starts_at']);
        });

        Schema::create('guests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('invited');
            $table->unsignedSmallInteger('party_size')->default(1);
            $table->unsignedSmallInteger('max_companions')->default(0);
            $table->string('invite_token')->unique();
            $table->timestampTz('invited_at')->nullable();
            $table->timestampTz('last_seen_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'status']);
            $table->unique(['event_id', 'email']);
        });

        Schema::create('rsvps', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('guest_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->unsignedSmallInteger('companions')->default(0);
            $table->text('message')->nullable();
            $table->string('source')->default('public');
            $table->json('answers')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'guest_id']);
            $table->index(['event_id', 'status']);
        });

        Schema::create('check_ins', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('guest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('checked_in_at');
            $table->string('method')->default('qr_code');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'guest_id']);
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('subject_type')->nullable();
            $table->string('subject_id')->nullable();
            $table->json('properties')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('check_ins');
        Schema::dropIfExists('rsvps');
        Schema::dropIfExists('guests');
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_templates');
    }
};
