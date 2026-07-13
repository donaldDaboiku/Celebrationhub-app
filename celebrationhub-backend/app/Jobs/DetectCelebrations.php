<?php

namespace App\Jobs;

use App\Models\Celebration;
use App\Models\Member;
use App\Models\Organization;
use App\Support\MemberDateFilters;
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
        Log::info('Running org-aware celebration detection...');

        Organization::query()
            ->select(['id', 'settings'])
            ->each(fn (Organization $organization) => $this->processOrganization($organization));

        Log::info('Celebration detection completed');
    }

    protected function processOrganization(Organization $organization): void
    {
        $settings = $organization->settings ?? [];
        $timezone = $settings['timezone'] ?? 'Africa/Lagos';
        $sendTime = $settings['send_time'] ?? '06:00';
        $localNow = Carbon::now($timezone);

        if (! $this->isDetectionWindow($localNow, $sendTime)) {
            return;
        }

        $day = $localNow->day;
        $month = $localNow->month;

        $birthdayMembers = Member::where('organization_id', $organization->id)
            ->active()
            ->approved()
            ->whereNotNull('birthday')
            ->tap(fn ($query) => MemberDateFilters::whereMonthDay($query, 'birthday', $day, $month))
            ->get();

        foreach ($birthdayMembers as $member) {
            $member->setRelation('organization', $organization);
            $this->scheduleCelebration($member, 'birthday', $localNow, $timezone, $sendTime);
        }

        $anniversaryMembers = Member::where('organization_id', $organization->id)
            ->active()
            ->approved()
            ->whereNotNull('anniversary')
            ->tap(fn ($query) => MemberDateFilters::whereMonthDay($query, 'anniversary', $day, $month))
            ->get();

        foreach ($anniversaryMembers as $member) {
            $member->setRelation('organization', $organization);
            $this->scheduleCelebration($member, 'anniversary', $localNow, $timezone, $sendTime);
        }

        Log::info("Processed org {$organization->id}: {$birthdayMembers->count()} birthdays, {$anniversaryMembers->count()} anniversaries");
    }

    protected function isDetectionWindow(Carbon $localNow, string $sendTime): bool
    {
        [$sendHour] = array_pad(explode(':', $sendTime), 2, '0');

        return (int) $localNow->format('G') === (int) $sendHour;
    }

    protected function scheduleCelebration(
        Member $member,
        string $type,
        Carbon $localNow,
        string $timezone,
        string $sendTime
    ): void {
        $exists = Celebration::where('member_id', $member->id)
            ->where('type', $type)
            ->whereDate('scheduled_for', $localNow->toDateString())
            ->exists();

        if ($exists) {
            Log::info("Celebration already scheduled for {$member->full_name}");
            return;
        }

        [$sendHour, $sendMinute] = array_pad(explode(':', $sendTime), 2, '0');
        $scheduledFor = $localNow->copy()->setTime((int) $sendHour, (int) $sendMinute, 0);

        if ($scheduledFor->isPast()) {
            $scheduledFor = $localNow->copy();
        }

        $celebration = Celebration::create([
            'member_id' => $member->id,
            'organization_id' => $member->organization_id,
            'type' => $type,
            'status' => 'pending',
            'scheduled_for' => $scheduledFor,
            'message_text' => $this->generateMessage($member, $type),
        ]);

        SendCelebrationMessages::dispatch($celebration)->delay($scheduledFor);

        Log::info("Scheduled {$type} for {$member->full_name} at {$scheduledFor} ({$timezone})");
    }

    protected function generateMessage(Member $member, string $type): string
    {
        $settings = $member->organization->settings ?? [];
        $messages = $settings['messages'] ?? [];

        if ($type === 'birthday') {
            $template = $messages['birthday_template']
                ?? "Happy Birthday {$member->full_name}! May God bless you with long life, good health, and prosperity.";
        } else {
            $template = $messages['anniversary_template']
                ?? "Happy Wedding Anniversary {$member->full_name}! May your home continue to be blessed with love, joy, and peace.";
        }

        return str_replace(
            ['{{name}}', '{{first_name}}', '{{title}}'],
            [$member->full_name, $member->first_name, $member->title ?? ''],
            $template
        );
    }
}
