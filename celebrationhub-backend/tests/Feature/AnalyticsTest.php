<?php

namespace Tests\Feature;

use App\Models\MessageLog;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_dashboard_returns_message_stats_from_logs(): void
    {
        $auth = $this->createAuthenticatedUser();

        MessageLog::create([
            'organization_id' => $auth['organization']->id,
            'channel' => 'email',
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        MessageLog::create([
            'organization_id' => $auth['organization']->id,
            'channel' => 'sms',
            'status' => 'failed',
            'error_message' => 'No credits',
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/analytics/dashboard');

        $response->assertOk()
            ->assertJsonPath('monthSummary.messages', 2)
            ->assertJsonPath('monthSummary.deliveryRate', 50)
            ->assertJsonPath('delivery.email', 1)
            ->assertJsonPath('delivery.sms', 0);
    }
}
