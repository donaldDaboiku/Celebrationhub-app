<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\CelebrationMail;
use Illuminate\Support\Facades\Log;
use App\Services\TermiiService;

class SendCelebrationMessages extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'send:celebration-messages';

    /**
     * The console command description.
     */
    protected $description = 'Send celebration messages (Birthday / Anniversary) to users using dynamic sender IDs';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $today = Carbon::today();

        // Fetch birthday users
        $birthdayUsers = User::whereMonth('date_of_birth', $today->month)
                             ->whereDay('date_of_birth', $today->day)
                             ->get();

        // Fetch anniversary users
        $anniversaryUsers = User::whereMonth('anniversary_date', $today->month)
                                ->whereDay('anniversary_date', $today->day)
                                ->get();

        $this->info('Found ' . $birthdayUsers->count() . ' birthday users and ' . $anniversaryUsers->count() . ' anniversary users.');

        // Send messages
        foreach ($birthdayUsers as $user) {
            $this->sendCelebration($user, 'Happy Birthday!');
        }

        foreach ($anniversaryUsers as $user) {
            $this->sendCelebration($user, 'Happy Anniversary!');
        }

        $this->info('Celebration messages sent successfully.');
    }

    /**
     * Send celebration via Email and Termii (SMS/WhatsApp) with dynamic sender ID
     */
    protected function sendCelebration($user, $message)
    {
        // --- 1️⃣ Send Email ---
        try {
            Mail::to($user->email)->queue(new CelebrationMail($user, $message));
        } catch (\Exception $e) {
            Log::error("Email failed for user {$user->id}: " . $e->getMessage());
        }

        // --- 2️⃣ Send SMS / WhatsApp via Termii ---
        try {
            $termii = app(TermiiService::class);

            // Use dynamic sender ID from subscriber profile
            $senderId = $user->sender_id ?? config('services.termii.sender');

            $termii->sendSms($user->phone, $message, $senderId);
        } catch (\Exception $e) {
            Log::error("SMS/WhatsApp failed for user {$user->id}: " . $e->getMessage());
        }

        $this->info("Sent celebration to {$user->name} ({$user->email}) with sender ID: " . ($user->sender_id ?? config('services.termii.sender')));
    }
}
