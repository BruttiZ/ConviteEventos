<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResendConfirmationRequest;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

final class SupabaseConfirmationController extends Controller
{
    /**
     * Reenvia o e-mail de confirmacao usando a API publica do Supabase Auth.
     */
    public function resend(ResendConfirmationRequest $request): JsonResponse
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $supabaseKey = (string) config('services.supabase.anon_key');

        if ($supabaseUrl === '' || $supabaseKey === '') {
            throw ValidationException::withMessages([
                'email' => __('Supabase Auth nao esta configurado no backend.'),
            ]);
        }

        try {
            $response = Http::withToken($supabaseKey)
                ->acceptJson()
                ->asJson()
                ->post($supabaseUrl.'/auth/v1/resend', [
                    'type' => 'signup',
                    'email' => (string) $request->validated('email'),
                    'options' => [
                        'email_redirect_to' => $this->siteUrl().'/login',
                    ],
                ]);
        } catch (ConnectionException) {
            throw ValidationException::withMessages([
                'email' => __('Nao foi possivel conectar ao Supabase agora.'),
            ]);
        }

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'email' => $response->json('msg')
                    ?? $response->json('message')
                    ?? __('Nao foi possivel reenviar o e-mail de confirmacao.'),
            ]);
        }

        return response()->json([
            'message' => 'Se existir uma conta pendente para este e-mail, enviaremos um novo link de confirmacao.',
        ]);
    }

    private function siteUrl(): string
    {
        $siteUrl = (string) config('app.frontend_url');

        if ($siteUrl !== '') {
            return rtrim($siteUrl, '/');
        }

        return rtrim((string) config('app.url'), '/');
    }
}
