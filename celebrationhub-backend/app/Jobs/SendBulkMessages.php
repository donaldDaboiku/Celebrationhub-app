<?php

namespace App\Jobs;

use App\Models\MessageCampaign;
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

        // Get recipients based on filters
        $query = Member::where('organization_id', $this->campaign->organization_id)
            ->active()
            ->approved();

        // Apply filters if any
        if ($filters = $this->campaign->filters) {
            // Example filters
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
                // Personalize message
                $message = $this->personalizeMessage($this->campaign->message, $member);

                // Send based on type
                $success = false;
                
                if (in_array($this->campaign->type, ['email', 'all']) && $member->email) {
                    $result = $emailService->sendCelebration(
                        $member->email,
                        $member->full_name,
                        $this->campaign->name,
                        $message,
                        ''
                    );
                    $success = $result['success'] || $success;
                }

                if (in_array($this->campaign->type, ['sms', 'all']) && $member->phone) {
                    $result = $termiiService->sendSMS($member->phone, $message);
                    $success = $result['success'] || $success;
                }

                if (in_array($this->campaign->type, ['whatsapp', 'all']) && $member->phone) {
                    $result = $termiiService->sendWhatsApp($member->phone, $message);
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

    protected function personalizeMessage(string $message, Member $member): string
    {
        return str_replace(
            ['{{title}}', '{{name}}', '{{first_name}}', '{{last_name}}'],
            [$member->title, $member->full_name, $member->first_name, $member->last_name],
            $message
        );
    }
}