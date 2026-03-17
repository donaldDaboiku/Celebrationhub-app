<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageCampaign;
use App\Jobs\SendBulkMessages;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    /**
     * List campaigns
     */
    public function index(Request $request)
    {
        $campaigns = MessageCampaign::where('organization_id', $request->user()->organization_id)
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
        ]);

        $campaign = MessageCampaign::create([
            ...$validated,
            'organization_id' => $request->user()->organization_id,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign created successfully',
            'data' => $campaign,
        ], 201);
    }

    /**
     * Send campaign now
     */
    public function send(Request $request, MessageCampaign $campaign)
    {
        // Verify ownership
        if ($campaign->organization_id !== $request->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign not found',
            ], 404);
        }

        if ($campaign->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Campaign already sent or in progress',
            ], 400);
        }

        // Dispatch job
        if ($campaign->scheduled_for) {
            SendBulkMessages::dispatch($campaign)->delay($campaign->scheduled_for);
        } else {
            SendBulkMessages::dispatch($campaign);
        }

        $campaign->update(['status' => 'scheduled']);

        return response()->json([
            'success' => true,
            'message' => 'Campaign queued for sending',
            'data' => $campaign,
        ]);
    }

    /**
     * Get campaign details
     */
    public function show(Request $request, MessageCampaign $campaign)
    {
        if ($campaign->organization_id !== $request->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $campaign,
        ]);
    }
}