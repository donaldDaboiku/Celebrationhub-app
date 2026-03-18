<?php

namespace App\Console\Commands;

use App\Jobs\DetectCelebrations as DetectCelebrationsJob;
use Illuminate\Console\Command;

class DetectCelebrations extends Command
{
    protected $signature = 'celebrations:detect';
    protected $description = 'Manually detect and schedule celebrations';

    public function handle(): int
    {
        $this->info('Detecting celebrations...');

        DetectCelebrationsJob::dispatch();

        $this->info('Detection job dispatched!');
        $this->info('Run "php artisan queue:work" to process the job.');

        return self::SUCCESS;
    }
}
