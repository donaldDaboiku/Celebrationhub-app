<?php

namespace Tests\Feature;

use App\Models\CreditTransaction;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class CreditTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_authenticated_user_can_view_credit_balance_and_transactions(): void
    {
        $auth = $this->createAuthenticatedUser(['sms_credits' => 150]);

        CreditTransaction::create([
            'organization_id' => $auth['organization']->id,
            'type' => 'purchase',
            'amount' => 100,
            'balance_after' => 100,
            'reference' => 'ref-100',
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/credits');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.balance', 150)
            ->assertJsonPath('data.status', 'healthy')
            ->assertJsonPath('data.transactions.0.type', 'purchase')
            ->assertJsonPath('data.transactions.0.amount', 100);
    }

    public function test_paystack_webhook_records_credit_purchase_once(): void
    {
        $auth = $this->createAuthenticatedUser(['sms_credits' => 0]);
        $secret = config('services.paystack.secret_key', 'test-secret');
        config(['services.paystack.secret_key' => 'test-secret']);

        $payload = [
            'event' => 'charge.success',
            'data' => [
                'reference' => 'pay-ref-123',
                'amount' => 20000,
                'metadata' => [
                    'type' => 'credit_purchase',
                    'package' => '100',
                    'credits' => 100,
                    'organization_id' => $auth['organization']->id,
                ],
            ],
        ];

        $body = json_encode($payload);
        $signature = hash_hmac('sha512', $body, 'test-secret');

        $response = $this->call(
            'POST',
            '/api/credits/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_PAYSTACK_SIGNATURE' => $signature,
            ],
            $body
        );

        $response->assertOk();

        $auth['organization']->refresh();

        $this->assertSame(100, $auth['organization']->sms_credits);
        $this->assertDatabaseHas('credit_transactions', [
            'organization_id' => $auth['organization']->id,
            'type' => 'purchase',
            'amount' => 100,
            'reference' => 'pay-ref-123',
        ]);

        $duplicate = $this->call(
            'POST',
            '/api/credits/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_PAYSTACK_SIGNATURE' => $signature,
            ],
            $body
        );

        $duplicate->assertOk();
        $auth['organization']->refresh();
        $this->assertSame(100, $auth['organization']->sms_credits);
        $this->assertSame(1, CreditTransaction::where('reference', 'pay-ref-123')->count());

        config(['services.paystack.secret_key' => $secret]);
    }
}
