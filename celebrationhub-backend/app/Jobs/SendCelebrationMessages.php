<?php

namespace App\Jobs;

use App\Models\Celebration;
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
        TermiiService $termiiService
    ): void {
        $member = $this->celebration->member;
        $organization = $this->celebration->organization;
        $settings = $organization->settings ?? [];

        Log::info("Sending {$this->celebration->type} messages for {$member->full_name}");

        $channels = [
            'email' => ['sent' => false],
            'sms' => ['sent' => false],
            'whatsapp' => ['sent' => false],
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
                $designUrl
            );

            $channels['email'] = [
                'sent' => $result['success'],
                'sent_at' => now()->toDateTimeString(),
            ];
        }

        // Send SMS
        if (($messagingSettings['sms_enabled'] ?? false) && $member->phone) {
            $result = $termiiService->sendSMS(
                $member->phone,
                $this->celebration->message_text
            );

            $channels['sms'] = [
                'sent' => $result['success'],
                'sent_at' => now()->toDateTimeString(),
                'provider_id' => $result['message_id'] ?? null,
            ];
        }

        // Send WhatsApp
        if (($messagingSettings['whatsapp_enabled'] ?? false) && $member->phone) {
            $message = $this->celebration->message_text;
            if ($designUrl) {
                $message .= "\n\nView design: " . $designUrl;
            }

            $result = $termiiService->sendWhatsApp(
                $member->phone,
                $message
            );

            $channels['whatsapp'] = [
                'sent' => $result['success'],
                'sent_at' => now()->toDateTimeString(),
                'provider_id' => $result['message_id'] ?? null,
            ];
        }

        // Update celebration status
        $this->celebration->update([
            'status' => 'sent',
            'sent_at' => now(),
            'channels' => $channels,
        ]);

        Log::info("Completed sending messages for {$member->full_name}");
    }
}