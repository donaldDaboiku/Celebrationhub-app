<?php

namespace App\Jobs;

use App\Models\Member;
use App\Models\Celebration;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DetectCelebrations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('Running celebration detection...');

        $today = Carbon::today();
        $day   = $today->day;
        $month = $today->month;

        // Use generated virtual columns (indexed) instead of DAY()/MONTH() functions
        $birthdayMembers = Member::active()
            ->approved()
            ->whereNotNull('birthday')
            ->where('birthday_day', $day)
            ->where('birthday_month', $month)
            ->with('organization')
            ->get();

        Log::info("Found {$birthdayMembers->count()} birthdays today");

        foreach ($birthdayMembers as $member) {
            /** @var Member $member */
            $this->scheduleCelebration($member, 'birthday');
        }

        $anniversaryMembers = Member::active()
            ->approved()
            ->whereNotNull('anniversary')
            ->where('anniversary_day', $day)
            ->where('anniversary_month', $month)
            ->with('organization')
            ->get();

        Log::info("Found {$anniversaryMembers->count()} anniversaries today");

        foreach ($anniversaryMembers as $member) {
            /** @var Member $member */
            $this->scheduleCelebration($member, 'anniversary');
        }

        Log::info('Celebration detection completed');
    }

    protected function scheduleCelebration(Member $member, string $type): void
    {
        // Skip if already scheduled today
        $exists = Celebration::where('member_id', $member->id)
            ->where('type', $type)
            ->whereDate('scheduled_for', Carbon::today())
            ->exists();

        if ($exists) {
            Log::info("Celebration already scheduled for {$member->full_name}");
            return;
        }

        $settings    = $member->organization->settings ?? [];
        $sendTime    = $settings['send_time'] ?? '06:00';
        $timezone    = $settings['timezone'] ?? 'Africa/Lagos';

        $scheduledFor = Carbon::today($timezone)->setTimeFromTimeString($sendTime);

        if ($scheduledFor->isPast()) {
            $scheduledFor = Carbon::now();
        }

        $celebration = Celebration::create([
            'member_id'       => $member->id,
            'organization_id' => $member->organization_id,
            'type'            => $type,
            'status'          => 'pending',
            'scheduled_for'   => $scheduledFor,
            'message_text'    => $this->generateMessage($member, $type),
        ]);

        SendCelebrationMessages::dispatch($celebration)->delay($scheduledFor);

        Log::info("Scheduled {$type} for {$member->full_name} at {$scheduledFor}");
    }

    protected function generateMessage(Member $member, string $type): string
    {
        $settings = $member->organization->settings ?? [];
        $messages = $settings['messages'] ?? [];

        if ($type === 'birthday') {
            $template = $messages['birthday_template']
                ?? "🎉 Happy Birthday {$member->full_name}!\n\nMay God bless you with long life, good health, and prosperity.\n\nFrom your church family 💙";
        } else {
            $template = $messages['anniversary_template']
                ?? "💍 Happy Wedding Anniversary {$member->full_name}!\n\nMay your home continue to be blessed with love, joy, and peace.\n\nFrom your church family 💙";
        }

        return str_replace(
            ['{{name}}', '{{first_name}}', '{{title}}'],
            [$member->full_name, $member->first_name, $member->title ?? ''],
            $template
        );
    }
}
