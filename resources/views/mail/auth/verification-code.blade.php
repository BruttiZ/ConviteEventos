<x-mail::message>
# Confirme seu e-mail

Use o codigo abaixo para ativar sua conta no **{{ config('app.name') }}**.

<x-mail::panel>
## {{ $code }}
</x-mail::panel>

Este codigo expira em {{ $expiresInMinutes }} minutos. Se voce nao criou uma conta, ignore este e-mail.

Obrigado,<br>
{{ config('app.name') }}
</x-mail::message>
