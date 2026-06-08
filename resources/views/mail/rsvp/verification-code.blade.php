<x-mail::message>
# Codigo de confirmacao

Use o codigo abaixo para confirmar sua resposta no evento **{{ $event->name }}**.

<x-mail::panel>
## {{ $code }}
</x-mail::panel>

Este codigo expira em {{ $expiresInMinutes }} minutos. Se voce nao solicitou este codigo, ignore este e-mail.

Obrigado,<br>
{{ config('app.name') }}
</x-mail::message>
