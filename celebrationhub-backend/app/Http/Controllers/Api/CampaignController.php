<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendBulkMessages;
use App\Models\Member;
use App\Models\MessageCampaign;
use App\Models\MessageLog;
use App\Services\EmailService;
use App\Services\TermiiService;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;

class CampaignController extends Controller
{
    private function buildRecipientQuery(MessageCampaign $campaign)
    {
        $query = Member::where('organization_id', $campaign->organization_id)
            ->active()
            ->approved();

        $filters = $campaign->filters ?? [];

        if (! empty($filters['member_ids'])) {
            $query->whereIn('id', $filters['member_ids']);
        }

        if (! empty($filters['tags'])) {
            $query->whereJsonContains('tags', $filters['tags']);
        }

        return $query;
    }

    private function ensureOwnership(Request $request, MessageCampaign $campaign)
    {
        if ($campaign->organization_id !== $request->user()->organization_id) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Campaign not found',
            ], 404));
        }
    }

    private function resolveChannels(MessageCampaign $campaign): array
    {
        return match ($campaign->type) {
            'all' => ['email', 'sms', 'whatsapp'],
            default => [$campaign->type],
        };
    }

    private function personalizeMessage(string $message, Member $member): string
    {
        return str_replace(
            ['{{title}}', '{{name}}', '{{first_name}}', '{{last_name}}'],
            [$member->title, $member->full_name, $member->first_name, $member->last_name],
            $message
        );
    }

    private function buildDeliverySummary(MessageCampaign $campaign): array
    {
        $latestLogs = $campaign->logs()
            ->latest('id')
            ->get()
            ->unique(fn (MessageLog $log) => ($log->member_id ?? 'unknown').'-'.$log->channel);

        $channels = $this->resolveChannels($campaign);
        $perChannel = [];

        foreach ($channels as $channel) {
            $channelLogs = $latestLogs->where('channel', $channel);
            $perChannel[$channel] = [
                'sent' => $channelLogs->whereIn('status', ['sent', 'delivered'])->count(),
                'failed' => $channelLogs->where('status', 'failed')->count(),
                'queued' => $channelLogs->where('status', 'queued')->count(),
            ];
        }

        return [
            'channels' => $channels,
            'per_channel' => $perChannel,
        ];
    }

    private function refreshCampaignCounts(MessageCampaign $campaign): void
    {
        $channels = $this->resolveChannels($campaign);
        $latestLogs = $campaign->logs()
            ->latest('id')
            ->get()
            ->filter(fn (MessageLog $log) => $log->member_id !== null)
            ->unique(fn (MessageLog $log) => $log->member_id.'-'.$log->channel)
            ->groupBy('member_id');

        $sentCount = 0;
        $failedCount = 0;

        foreach ($latestLogs as $memberLogs) {
            $relevantLogs = $memberLogs->whereIn('channel', $channels);

            if ($relevantLogs->contains(fn (MessageLog $log) => in_array($log->status, ['sent', 'delivered'], true))) {
                $sentCount++;
                continue;
            }

            if ($relevantLogs->isNotEmpty()) {
                $failedCount++;
            }
        }

        $campaign->update([
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
        ]);
    }

    private function sendSingleChannel(
        MessageCampaign $campaign,
        Member $member,
        string $channel,
        EmailService $emailService,
        TermiiService $termiiService
    ): array {
        $settings = $campaign->organization->settings ?? [];
        $integrations = $settings['integrations'] ?? [];
        $smsIntegration = $integrations['sms'] ?? [];
        $whatsappIntegration = $integrations['whatsapp'] ?? [];
        $message = $this->personalizeMessage($campaign->message, $member);

        if ($channel === 'email') {
            if (! $member->email) {
                return ['success' => false, 'error' => 'No email address on member record.'];
            }

            return $emailService->sendCelebration(
                $member->email,
                $member->full_name,
                $campaign->name,
                $message,
                '',
                $campaign->organization
            );
        }

        if (! $member->phone) {
            return ['success' => false, 'error' => 'No phone number on member record.'];
        }

        if ($channel === 'sms') {
            return $termiiService->sendSMS(
                $member->phone,
                $message,
                $smsIntegration['sender_id'] ?? null
            );
        }

        return $termiiService->sendWhatsApp(
            $member->phone,
            $message,
            $whatsappIntegration['sender_id'] ?? null
        );
    }

    /**
     * List campaigns
     */
    public function index(Request $request)
    {
        $campaigns = MessageCampaign::where('organization_id', $request->user()->organization_id)
            ->when(! $request->boolean('include_archived'), fn ($query) => $query->where('status', '!=', 'archived'))
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Create campaign
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'required|in:sms,email,whatsapp,all',
            'scheduled_for' => 'nullable|date|after:now',
            'filters' => 'nullable|array',
            'filters.member_ids' => 'nullable|array',
            'filters.member_ids.*' => 'integer',
            'filters.tags' => 'nullable|array',
            'filters.tags.*' => 'string',
        ]);

        $campaign = MessageCampaign::create([
            ...$validated,
            'organization_id' => $request->user()->organization_id,
            'status' => 'draft',
        ]);

        $recipientCount = $this->buildRecipientQuery($campaign)->count();
        $campaign->update(['recipient_count' => $recipientCount]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign created successfully',
            'data' => $campaign->fresh(),
        ], 201);
    }

    /**
     * Send campaign now
     */
    public function send(Request $request, MessageCampaign $campaign)
    {
        $this->ensureOwnership($request, $campaign);

        if ($campaign->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Campaign already sent or in progress',
            ], 400);
        }

        if ($campaign->scheduled_for) {
            SendBulkMessages::dispatch($campaign)->delay($campaign->scheduled_for);
            $campaign->update(['status' => 'scheduled']);

            return response()->json([
                'success' => true,
                'message' => 'Campaign queued for sending',
                'data' => $campaign->fresh(),
            ]);
        }

        SendBulkMessages::dispatchSync($campaign);

        return response()->json([
            'success' => true,
            'message' => 'Campaign sent successfully',
            'data' => $campaign->fresh(),
        ]);
    }

    /**
     * Get campaign details
     */
    public function show(Request $request, MessageCampaign $campaign)
    {
        $this->ensureOwnership($request, $campaign);

        $campaign->load([
            'logs' => fn ($query) => $query->latest('id'),
            'logs.member:id,title,first_name,last_name,email,phone',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                ...$campaign->toArray(),
                'delivery_summary' => $this->buildDeliverySummary($campaign),
            ],
        ]);
    }

    /**
     * Retry only the most recent failed delivery per member/channel.
     */
    public function resendFailed(
        Request $request,
        MessageCampaign $campaign,
        EmailService $emailService,
        TermiiService $termiiService
    ) {
        $this->ensureOwnership($request, $campaign);

        $campaign->load('organization');

        $retryCandidates = $campaign->logs()
            ->with('member')
            ->latest('id')
            ->get()
            ->filter(fn (MessageLog $log) => $log->member_id !== null)
            ->unique(fn (MessageLog $log) => $log->member_id.'-'.$log->channel)
            ->filter(fn (MessageLog $log) => $log->status === 'failed' && $log->member);

        if ($retryCandidates->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No failed recipients to retry for this campaign.',
            ], 400);
        }

        $retried = 0;
        $sent = 0;
        $failed = 0;

        foreach ($retryCandidates as $failedLog) {
            $result = $this->sendSingleChannel(
                $campaign,
                $failedLog->member,
                $failedLog->channel,
                $emailService,
                $termiiService
            );

            MessageLog::create([
                'organization_id' => $campaign->organization_id,
                'member_id' => $failedLog->member_id,
                'campaign_id' => $campaign->id,
                'channel' => $failedLog->channel,
                'status' => $result['success'] ? 'sent' : 'failed',
                'provider_message_id' => $result['message_id'] ?? null,
                'error_message' => $result['error'] ?? null,
                'sent_at' => $result['success'] ? now() : null,
            ]);

            $retried++;

            if ($result['success']) {
                $sent++;
            } else {
                $failed++;
            }
        }

        $this->refreshCampaignCounts($campaign);

        return response()->json([
            'success' => true,
            'message' => 'Failed campaign deliveries retried.',
            'data' => [
                'retried' => $retried,
                'sent' => $sent,
                'failed' => $failed,
                'campaign' => $campaign->fresh(),
            ],
        ]);
    }

    public function archive(Request $request, MessageCampaign $campaign)
    {
        $this->ensureOwnership($request, $campaign);

        if ($campaign->status === 'archived') {
            return response()->json([
                'success' => false,
                'message' => 'Campaign is already archived.',
            ], 400);
        }

        $campaign->update(['status' => 'archived']);

        return response()->json([
            'success' => true,
            'message' => 'Campaign archived successfully.',
            'data' => $campaign->fresh(),
        ]);
    }

    public function destroy(Request $request, MessageCampaign $campaign)
    {
        $this->ensureOwnership($request, $campaign);

        $campaign->logs()->delete();
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted successfully.',
        ]);
    }
}
