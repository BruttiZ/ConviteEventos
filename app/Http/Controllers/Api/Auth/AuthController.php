<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Invitely Demo',
                'plan' => 'community',
                'settings' => ['locale' => 'pt_BR', 'timezone' => 'America/Sao_Paulo'],
            ],
        );

        $user = User::query()->create([
            'tenant_id' => $request->validated('role') === 'platform_admin' ? null : $tenant->id,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make((string) $request->validated('password')),
            'role' => $request->validated('role'),
        ]);

        return response()->json([
            'data' => $this->issueToken($user, (string) ($request->validated('device_name') ?: 'web')),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check((string) $request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('The provided credentials are incorrect.'),
            ]);
        }

        return response()->json([
            'data' => $this->issueToken($user, (string) ($request->validated('device_name') ?: 'web')),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessao encerrada.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function issueToken(User $user, string $deviceName): array
    {
        $abilities = match ($user->role) {
            'platform_admin' => ['platform:admin'],
            'guest' => ['event:guest'],
            default => ['tenant:owner'],
        };

        $token = $user->createToken(
            name: $deviceName,
            abilities: $abilities,
            expiresAt: now()->addDays(30),
        );

        return [
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
            ],
        ];
    }
}
