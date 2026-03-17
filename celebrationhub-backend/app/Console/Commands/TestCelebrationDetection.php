<?php

namespace App\Console\Commands;

use App\Jobs\DetectCelebrations;
use Illuminate\Console\Command;

class TestCelebrationDetection extends Command
{
    protected $signature = 'celebrations:detect';
    protected $description = 'Manually detect and schedule celebrations';

    public function handle()
    {
        $this->info('Detecting celebrations...');
        
        DetectCelebrations::dispatch();
        
        $this->info('Detection job dispatched!');
        $this->info('Run "php artisan queue:work" to process the job');
        
        return 0;
    }
}