<?php

namespace App\Jobs;

use App\Models\MessageCampaign;
use App\Models\MessageLog;
use App\Models\Member;
use App\Services\EmailService;
use App\Services\TermiiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendBulkMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $campaign;

    public function __construct(MessageCampaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function handle(EmailService $emailService, TermiiService $termiiService): void
    {
        Log::info("Starting bulk message campaign: {$this->campaign->name}");

        $this->campaign->update(['status' => 'sending']);
        $organization = $this->campaign->organization;
        $settings = $organization->settings ?? [];
        $integrations = $settings['integrations'] ?? [];
        $smsIntegration = $integrations['sms'] ?? [];
        $whatsappIntegration = $integrations['whatsapp'] ?? [];

        // Get recipients based on filters
        $query = Member::where('organization_id', $this->campaign->organization_id)
            ->active()
            ->approved();

        // Apply filters if any
        if ($filters = $this->campaign->filters) {
            if (! empty($filters['member_ids'])) {
                $query->whereIn('id', $filters['member_ids']);
            }

            if (isset($filters['tags'])) {
                $query->whereJsonContains('tags', $filters['tags']);
            }
        }

        $members = $query->get();
        $this->campaign->update(['recipient_count' => $members->count()]);

        $sent = 0;
        $failed = 0;

        foreach ($members as $member) {
            try {
                $message = $this->personalizeMessage($this->campaign->message, $member);
                $success = false;

                foreach ($this->resolveChannels() as $channel) {
                    $result = $this->sendThroughChannel(
                        $channel,
                        $member,
                        $message,
                        $emailService,
                        $termiiService,
                        $smsIntegration,
                        $whatsappIntegration
                    );

                    $success = $result['success'] || $success;
                }

                if ($success) {
                    $sent++;
                } else {
                    $failed++;
                }

            } catch (\Exception $e) {
                Log::error("Failed to send to {$member->full_name}", ['error' => $e->getMessage()]);
                $failed++;
            }
        }

        $this->campaign->update([
            'status' => 'completed',
            'sent_count' => $sent,
            'failed_count' => $failed,
        ]);

        Log::info("Campaign completed: {$sent} sent, {$failed} failed");
    }

    protected function resolveChannels(): array
    {
        return match ($this->campaign->type) {
            'all' => ['email', 'sms', 'whatsapp'],
            default => [$this->campaign->type],
        };
    }

    protected function sendThroughChannel(
        string $channel,
        Member $member,
        string $message,
        EmailService $emailService,
        TermiiService $termiiService,
        array $smsIntegration,
        array $whatsappIntegration
    ): array {
        if ($channel === 'email') {
            if (! $member->email) {
                $this->recordLog($member->id, 'email', false, null, 'No email address on member record.');

                return ['success' => false];
            }

            $result = $emailService->sendCelebration(
                $member->email,
                $member->full_name,
                $this->campaign->name,
                $message,
                '',
                $this->campaign->organization
            );

            $this->recordLog($member->id, 'email', $result['success'], null, $result['error'] ?? null);

            return $result;
        }

        if (! $member->phone) {
            $this->recordLog($member->id, $channel, false, null, 'No phone number on member record.');

            return ['success' => false];
        }

        $result = $channel === 'sms'
            ? $termiiService->sendSMS($member->phone, $message, $smsIntegration['sender_id'] ?? null)
            : $termiiService->sendWhatsApp($member->phone, $message, $whatsappIntegration['sender_id'] ?? null);

        $this->recordLog(
            $member->id,
            $channel,
            $result['success'],
            $result['message_id'] ?? null,
            $result['error'] ?? null
        );

        return $result;
    }

    protected function recordLog(int $memberId, string $channel, bool $success, ?string $providerMessageId, ?string $errorMessage): void
    {
        MessageLog::create([
            'organization_id' => $this->campaign->organization_id,
            'member_id' => $memberId,
            'campaign_id' => $this->campaign->id,
            'channel' => $channel,
            'status' => $success ? 'sent' : 'failed',
            'provider_message_id' => $providerMessageId,
            'error_message' => $errorMessage,
            'sent_at' => $success ? now() : null,
        ]);
    }

    protected function personalizeMessage(string $message, Member $member): string
    {
        return str_replace(
            ['{{title}}', '{{name}}', '{{first_name}}', '{{last_name}}'],
            [$member->title, $member->full_name, $member->first_name, $member->last_name],
            $message
        );
    }
}
