<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Config;
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
        string $designUrl,
        ?Organization $organization = null
    ): array {
        try {
            $mailer = $this->resolveMailer($organization);

            Mail::mailer($mailer)->send('emails.celebration', [
                'name' => $name,
                'messageText' => $message,
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

    protected function resolveMailer(?Organization $organization): string
    {
        $emailSettings = $organization?->settings['integrations']['email'] ?? [];
        $host = $emailSettings['host'] ?? null;
        $username = $emailSettings['username'] ?? null;
        $fromAddress = $emailSettings['from_address'] ?? null;

        if (! $host || ! $username || ! $fromAddress) {
            return config('mail.default', 'smtp');
        }

        Config::set('mail.mailers.org_smtp', [
            'transport' => $emailSettings['mailer'] ?? 'smtp',
            'host' => $host,
            'port' => (int) ($emailSettings['port'] ?? 587),
            'username' => $username,
            'password' => $emailSettings['password'] ?? null,
            'encryption' => $emailSettings['encryption'] ?? 'tls',
            'timeout' => null,
            'local_domain' => parse_url((string) config('app.url', 'http://localhost'), PHP_URL_HOST),
        ]);

        Config::set('mail.from', [
            'address' => $fromAddress,
            'name' => $emailSettings['from_name'] ?? $organization?->name ?? config('mail.from.name'),
        ]);

        app('mail.manager')->purge('org_smtp');

        return 'org_smtp';
    }

    public function sendAccessReset(
        string $to,
        string $name,
        string $token,
        string $resetUrl,
        ?Organization $organization = null
    ): array {
        try {
            $mailer = $this->resolveMailer($organization);

            Mail::mailer($mailer)->send('emails.access-reset', [
                'name' => $name,
                'token' => $token,
                'resetUrl' => $resetUrl,
                'organizationName' => $organization?->name ?? config('app.name', 'CelebrationHub'),
            ], function ($mail) use ($to, $organization) {
                $mail->to($to)->subject(($organization?->name ?? 'CelebrationHub') . ' access reset code');
            });

            Log::info('Access reset email sent', ['to' => $to]);

            return [
                'success' => true,
                'to' => $to,
            ];
        } catch (\Exception $e) {
            Log::error('Access reset email failed', [
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
