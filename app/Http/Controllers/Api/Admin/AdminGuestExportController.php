<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class AdminGuestExportController extends Controller
{
    public function __invoke(Event $event): StreamedResponse
    {
        $this->authorize('view', $event);

        $filename = $event->slug.'-guests.csv';

        return response()->streamDownload(function () use ($event): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            fputcsv($output, ['name', 'email', 'phone', 'status', 'party_size', 'max_companions', 'checked_in']);

            $event->guests()
                ->with('checkIn')
                ->orderBy('name')
                ->chunk(250, function ($guests) use ($output): void {
                    foreach ($guests as $guest) {
                        fputcsv($output, [
                            $guest->name,
                            $guest->email,
                            $guest->phone,
                            $guest->status,
                            $guest->party_size,
                            $guest->max_companions,
                            $guest->checkIn ? 'yes' : 'no',
                        ]);
                    }
                });

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
