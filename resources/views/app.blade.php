<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Invitely is an open source digital invitation and event RSVP platform.">
        <meta property="og:title" content="{{ config('app.name', 'Invitely') }}">
        <meta property="og:type" content="website">
        <meta property="og:description" content="Premium digital invitations, RSVP, QR check-in and event analytics.">
        <title>{{ config('app.name', 'Invitely') }}</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
