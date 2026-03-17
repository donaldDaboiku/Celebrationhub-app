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

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Running celebration detection...');

        $today = Carbon::today();
        $day = $today->day;
        $month = $today->month;

        // Find members with birthdays today
        $birthdayMembers = Member::active()
            ->approved()
            ->whereNotNull('birthday')
            ->whereRaw('DAY(birthday) = ?', [$day])
            ->whereRaw('MONTH(birthday) = ?', [$month])
            ->get();

        Log::info("Found {$birthdayMembers->count()} birthdays today");

        foreach ($birthdayMembers as $member) {
            $this->scheduleCelebration($member, 'birthday');
        }

        // Find members with anniversaries today
        $anniversaryMembers = Member::active()
            ->approved()
            ->whereNotNull('anniversary')
            ->whereRaw('DAY(anniversary) = ?', [$day])
            ->whereRaw('MONTH(anniversary) = ?', [$month])
            ->get();

        Log::info("Found {$anniversaryMembers->count()} anniversaries today");

        foreach ($anniversaryMembers as $member) {
            $this->scheduleCelebration($member, 'anniversary');
        }

        Log::info('Celebration detection completed');
    }

    /**
     * Schedule celebration for member
     */
    protected function scheduleCelebration(Member $member, string $type): void
    {
        // Check if already scheduled for today
        $existing = Celebration::where('member_id', $member->id)
            ->where('type', $type)
            ->whereDate('scheduled_for', Carbon::today())
            ->exists();

        if ($existing) {
            Log::info("Celebration already scheduled for {$member->full_name}");
            return;
        }

        // Get organization settings
        $settings = $member->organization->settings;
        $sendTime = $settings['send_time'] ?? '06:00';

        // Calculate send time
        $scheduledFor = Carbon::today()->setTimeFromTimeString($sendTime);

        // If time has passed today, send now
        if ($scheduledFor->isPast()) {
            $scheduledFor = Carbon::now();
        }

        // Create celebration record
        $celebration = Celebration::create([
            'member_id' => $member->id,
            'organization_id' => $member->organization_id,
            'type' => $type,
            'status' => 'pending',
            'scheduled_for' => $scheduledFor,
            'message_text' => $this->generateMessage($member, $type),
        ]);

        // Dispatch job to send messages
        SendCelebrationMessages::dispatch($celebration)
            ->delay($scheduledFor);

        Log::info("Scheduled {$type} for {$member->full_name} at {$scheduledFor}");
    }

    /**
     * Generate celebration message
     */
    protected function generateMessage(Member $member, string $type): string
    {
        if ($type === 'birthday') {
            return "🎉 Happy Birthday {$member->full_name}!\n\n"
                . "May God bless you with long life, good health, and prosperity.\n\n"
                . "From your church family 💙";
        }

        return "💍 Happy Wedding Anniversary {$member->full_name}!\n\n"
            . "May your home continue to be blessed with love, joy, and peace.\n\n"
            . "From your church family 💙";
    }
}