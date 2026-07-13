<?php

namespace App\Jobs;

use App\Models\Celebration;
use App\Models\MessageLog;
use App\Services\CreditService;
use App\Services\DesignService;
use App\Services\EmailService;
use App\Services\TermiiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCelebrationMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $celebration;

    /**
     * Create a new job instance.
     */
    public function __construct(Celebration $celebration)
    {
        $this->celebration = $celebration;
    }

    /**
     * Execute the job.
     */
    public function handle(
        DesignService $designService,
        EmailService $emailService,
        TermiiService $termiiService,
        CreditService $creditService
    ): void {
        $member = $this->celebration->member;
        $organization = $this->celebration->organization;
        $settings = $organization->settings ?? [];
        $integrations = $settings['integrations'] ?? [];
        $smsIntegration = $integrations['sms'] ?? [];
        $whatsappIntegration = $integrations['whatsapp'] ?? [];

        Log::info("Sending {$this->celebration->type} messages for {$member->full_name}");

        $channels = [
            'email' => ['sent' => false, 'error' => null],
            'sms' => ['sent' => false, 'error' => null],
            'whatsapp' => ['sent' => false, 'error' => null],
        ];

        // Generate design
        try {
            $designUrl = $designService->generateCard(
                $this->celebration->type,
                $member->title ?? '',
                $member->full_name,
                $member->photo_url
            );

            $this->celebration->update(['design_url' => $designUrl]);
        } catch (\Exception $e) {
            Log::error('Design generation failed', ['error' => $e->getMessage()]);
            $designUrl = 'https://via.placeholder.com/1080x1080/667eea/ffffff?text=Celebration';
        }

        // Send Email
        $messagingSettings = $settings['messaging'] ?? [];
        if (($messagingSettings['email_enabled'] ?? false) && $member->email) {
            $result = $emailService->sendCelebration(
                $member->email,
                $member->full_name,
                $this->celebration->type === 'birthday' 
                    ? 'Happy Birthday! 🎉' 
                    : 'Happy Anniversary! 💍',
                $this->celebration->message_text,
                $designUrl,
                $organization
            );

            $channels['email'] = [
                'sent' => $result['success'],
                'sent_at' => now()->toDateTimeString(),
                'error' => $result['error'] ?? null,
            ];

            $this->recordLog(
                'email',
                $result['success'],
                $result['message_id'] ?? null,
                $result['error'] ?? null
            );
        } else {
            $channels['email']['error'] = 'Email channel disabled or member has no email address.';
            $this->recordLog('email', false, null, $channels['email']['error']);
        }

        // Send SMS
        if (($messagingSettings['sms_enabled'] ?? false) && $member->phone) {
            if (! $creditService->hasCredits($organization)) {
                $error = 'Insufficient SMS credits.';
                $channels['sms'] = ['sent' => false, 'error' => $error];
                $this->recordLog('sms', false, null, $error);
            } else {
                $result = $termiiService->sendSMS(
                    $member->phone,
                    $this->celebration->message_text,
                    $smsIntegration['sender_id'] ?? null
                );

                if ($result['success']) {
                    $creditService->debit($organization, 1, [
                        'source' => 'celebration',
                        'celebration_id' => $this->celebration->id,
                        'member_id' => $member->id,
                    ]);
                }

                $channels['sms'] = [
                    'sent' => $result['success'],
                    'sent_at' => now()->toDateTimeString(),
                    'provider_id' => $result['message_id'] ?? null,
                    'error' => $result['error'] ?? null,
                ];

                $this->recordLog(
                    'sms',
                    $result['success'],
                    $result['message_id'] ?? null,
                    $result['error'] ?? null
                );
            }
        } else {
            $channels['sms']['error'] = 'SMS channel disabled or member has no phone number.';
            $this->recordLog('sms', false, null, $channels['sms']['error']);
        }

        // Send WhatsApp
        if (($messagingSettings['whatsapp_enabled'] ?? false) && $member->phone) {
            $message = $this->celebration->message_text;
            if ($designUrl) {
                $message .= "\n\nView design: " . $designUrl;
            }

            $result = $termiiService->sendWhatsApp(
                $member->phone,
                $message,
                $whatsappIntegration['sender_id'] ?? null
            );

            $channels['whatsapp'] = [
                'sent' => $result['success'],
                'sent_at' => now()->toDateTimeString(),
                'provider_id' => $result['message_id'] ?? null,
                'error' => $result['error'] ?? null,
            ];

            $this->recordLog(
                'whatsapp',
                $result['success'],
                $result['message_id'] ?? null,
                $result['error'] ?? null
            );
        } else {
            $channels['whatsapp']['error'] = 'WhatsApp channel disabled or member has no phone number.';
            $this->recordLog('whatsapp', false, null, $channels['whatsapp']['error']);
        }

        $sentChannels = collect($channels)->filter(fn ($channel) => $channel['sent'] ?? false)->count();
        $status = $sentChannels > 0 ? 'sent' : 'failed';

        // Update celebration status
        $this->celebration->update([
            'status' => $status,
            'sent_at' => $sentChannels > 0 ? now() : null,
            'channels' => $channels,
        ]);

        Log::info("Completed sending messages for {$member->full_name}", [
            'status' => $status,
            'sent_channels' => $sentChannels,
        ]);
    }

    protected function recordLog(string $channel, bool $success, ?string $providerMessageId, ?string $errorMessage): void
    {
        MessageLog::create([
            'organization_id' => $this->celebration->organization_id,
            'member_id' => $this->celebration->member_id,
            'celebration_id' => $this->celebration->id,
            'channel' => $channel,
            'status' => $success ? 'sent' : 'failed',
            'provider_message_id' => $providerMessageId,
            'error_message' => $errorMessage,
            'sent_at' => $success ? now() : null,
        ]);
    }
}
