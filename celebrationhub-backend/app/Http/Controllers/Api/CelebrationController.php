<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Jobs\SendCelebrationMessages;
use App\Models\Celebration;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CelebrationController extends Controller
{
    public function index(Request $request)
    {
        $celebrations = Celebration::with('member:id,first_name,last_name,title')
            ->where('organization_id', $request->user()->organization_id)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate(20);

        return ApiResponse::success($celebrations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|integer',
            'type' => 'required|in:birthday,anniversary',
            'message_text' => 'nullable|string|max:2000',
            'scheduled_for' => 'nullable|date',
            'send_now' => 'nullable|boolean',
        ]);

        $member = Member::where('organization_id', $request->user()->organization_id)
            ->findOrFail($validated['member_id']);

        $sendNow = filter_var($validated['send_now'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $scheduledFor = ! empty($validated['scheduled_for'])
            ? Carbon::parse($validated['scheduled_for'])
            : now();

        $celebration = Celebration::create([
            'member_id' => $member->id,
            'organization_id' => $member->organization_id,
            'type' => $validated['type'],
            'message_text' => $validated['message_text'] ?: $this->generateMessage($member, $validated['type']),
            'status' => 'pending',
            'scheduled_for' => $sendNow ? now() : $scheduledFor,
        ]);

        if ($sendNow || $scheduledFor->isPast()) {
            SendCelebrationMessages::dispatchSync($celebration);
            $celebration->refresh();

            return ApiResponse::success($celebration, 'Message sent immediately', 201);
        }

        SendCelebrationMessages::dispatch($celebration)->delay($scheduledFor);

        return ApiResponse::success($celebration, 'Celebration queued successfully', 201);
    }

    public function resend(Request $request, Celebration $celebration)
    {
        if ($celebration->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Celebration not found', 404);
        }

        $freshCelebration = Celebration::create([
            'member_id' => $celebration->member_id,
            'organization_id' => $celebration->organization_id,
            'type' => $celebration->type,
            'message_text' => $celebration->message_text,
            'status' => 'pending',
            'scheduled_for' => now(),
        ]);

        SendCelebrationMessages::dispatchSync($freshCelebration);

        return ApiResponse::success(
            $freshCelebration->fresh('member:id,first_name,last_name,title'),
            'Celebration resent successfully'
        );
    }

    private function generateMessage(Member $member, string $type): string
    {
        $settings = $member->organization->settings ?? [];
        $messages = $settings['messages'] ?? [];

        $template = $type === 'birthday'
            ? ($messages['birthday_template'] ?? 'Happy Birthday {{name}}! We celebrate you today.')
            : ($messages['anniversary_template'] ?? 'Happy Anniversary {{name}}! Wishing you continued joy and peace.');

        return str_replace(
            ['{{name}}', '{{first_name}}', '{{title}}'],
            [$member->full_name, $member->first_name, $member->title ?? ''],
            $template
        );
    }
}
