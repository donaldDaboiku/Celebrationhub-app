<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        /*
         |--------------------------------------------------------------------------
         | Celebration Detection Scheduler
         |--------------------------------------------------------------------------
         | Runs daily to detect birthdays/anniversaries
         | Time can later be made org/timezone aware
         */


    // Run celebration detection daily at midnight
    $schedule->job(new \App\Jobs\DetectCelebrations)
        ->dailyAt('00:00')
        ->timezone('Africa/Lagos');

    // Also run at 6 AM as backup
    $schedule->job(new \App\Jobs\DetectCelebrations)
        ->dailyAt('06:00')
        ->timezone('Africa/Lagos');

        /*
         |--------------------------------------------------------------------------
         | (Optional) Queue health check
         |--------------------------------------------------------------------------
         | Uncomment if you want periodic queue monitoring
         */

        // $schedule->command('queue:restart')->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
    protected $middlewareGroups = [
    'api' => [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];
}
