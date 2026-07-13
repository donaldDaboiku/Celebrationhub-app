<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\MessageLog;
use App\Services\CreditService;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class CreditDebitTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_credit_service_debits_balance_on_successful_send(): void
    {
        $auth = $this->createAuthenticatedUser(['sms_credits' => 5]);
        $creditService = app(CreditService::class);

        $this->assertTrue($creditService->debit($auth['organization'], 1, [
            'source' => 'test',
        ]));

        $auth['organization']->refresh();
        $this->assertSame(4, $auth['organization']->sms_credits);
        $this->assertDatabaseHas('credit_transactions', [
            'organization_id' => $auth['organization']->id,
            'type' => 'debit',
            'amount' => -1,
            'balance_after' => 4,
        ]);
    }

    public function test_credit_service_refuses_debit_when_balance_is_insufficient(): void
    {
        $auth = $this->createAuthenticatedUser(['sms_credits' => 0]);
        $creditService = app(CreditService::class);

        $this->assertFalse($creditService->debit($auth['organization'], 1, [
            'source' => 'test',
        ]));

        $auth['organization']->refresh();
        $this->assertSame(0, $auth['organization']->sms_credits);
    }

    public function test_sms_credit_debit_transaction_appears_in_credit_history(): void
    {
        $auth = $this->createAuthenticatedUser(['sms_credits' => 10]);

        app(CreditService::class)->debit($auth['organization'], 1, [
            'source' => 'campaign',
            'member_id' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/credits');

        $response->assertOk()
            ->assertJsonPath('data.balance', 9)
            ->assertJsonPath('data.transactions.0.type', 'debit')
            ->assertJsonPath('data.transactions.0.amount', -1);
    }
}
