<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Send celebration email
     */
    public function sendCelebration(
        string $to,
        string $name,
        string $subject,
        string $message,
        string $designUrl
    ): array {
        try {
            Mail::send('emails.celebration', [
                'name' => $name,
                'message' => $message,
                'designUrl' => $designUrl,
            ], function ($mail) use ($to, $subject) {
                $mail->to($to)
                     ->subject($subject);
            });

            Log::info('Email sent', ['to' => $to]);

            return [
                'success' => true,
                'to' => $to,
            ];
        } catch (\Exception $e) {
            Log::error('Email sending failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}