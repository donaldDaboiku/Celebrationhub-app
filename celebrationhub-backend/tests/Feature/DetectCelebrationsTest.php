<?php

namespace Tests\Feature;

use App\Jobs\DetectCelebrations;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class DetectCelebrationsTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_job_runs_for_organization_during_send_hour(): void
    {
        Queue::fake();

        Carbon::setTestNow(Carbon::parse('2026-06-24 06:30:00', 'Africa/Lagos'));

        $auth = $this->createAuthenticatedUser([
            'slug' => 'detect-test-org',
        ]);

        $auth['organization']->update([
            'settings' => [
                'timezone' => 'Africa/Lagos',
                'send_time' => '06:00',
            ],
        ]);

        Member::create([
            'organization_id' => $auth['organization']->id,
            'first_name' => 'Birthday',
            'last_name' => 'Person',
            'birthday' => '1990-06-24',
            'active' => true,
            'approved' => true,
        ]);

        (new DetectCelebrations())->handle();

        $this->assertDatabaseHas('celebrations', [
            'organization_id' => $auth['organization']->id,
            'type' => 'birthday',
        ]);

        Carbon::setTestNow();
    }

    public function test_job_skips_organization_outside_send_hour(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-24 09:30:00', 'Africa/Lagos'));

        $auth = $this->createAuthenticatedUser([
            'slug' => 'skip-test-org',
        ]);

        $auth['organization']->update([
            'settings' => [
                'timezone' => 'Africa/Lagos',
                'send_time' => '06:00',
            ],
        ]);

        Member::create([
            'organization_id' => $auth['organization']->id,
            'first_name' => 'Birthday',
            'last_name' => 'Person',
            'birthday' => '1990-06-24',
            'active' => true,
            'approved' => true,
        ]);

        (new DetectCelebrations())->handle();

        $this->assertDatabaseMissing('celebrations', [
            'organization_id' => $auth['organization']->id,
        ]);

        Carbon::setTestNow();
    }
}
