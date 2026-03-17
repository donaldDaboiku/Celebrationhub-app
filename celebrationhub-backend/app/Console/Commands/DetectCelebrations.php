<?php

namespace app\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Member;
use App\Services\DesignService;
use App\Services\EmailService;
use App\Services\TermiiService;

class DetectCelebrations extends Command
{
    protected $signature = 'celebrations:detect';

    protected $description = 'Detect today\'s celebrations and send messages';

    public function handle()
    {
        $today = now()->toDateString();

        $members = Member::whereDate('birthday', $today)
            ->where('active', true)
            ->where('approved', true)
            ->get();

        if ($members->isEmpty()) {
            $this->info('No celebrations today 🎉');
            return Command::SUCCESS;
        }

        $this->info("Found {$members->count()} celebration(s)");

        foreach ($members as $member) {
            $org = $member->organization;

            // Generate design
            $designUrl = app(DesignService::class)->generateCard(
                'Happy Birthday 🎉',
                $member->full_name
            );

            // Email
            if (data_get($org->settings, 'messaging.email_enabled')) {
                app(EmailService::class)->sendCelebration(
                    $member->email,
                    'Happy Birthday 🎂',
                    "Dear {$member->full_name},\n\nWe celebrate you today 🎉\n\n$designUrl"
                );
            }

            // SMS (optional)
            if (data_get($org->settings, 'messaging.sms_enabled')) {
                app(TermiiService::class)->sendSms(
                    $member->phone,
                    "Happy Birthday {$member->first_name}! 🎉\n$designUrl",
                    $org->settings['sender_id'] ?? 'CelebrationHub'
                );
            }
        }

        $this->info('Celebrations processed successfully ✅');

        return Command::SUCCESS;
    }
}
