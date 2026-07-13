<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\CreditTransaction;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CreditController extends Controller
{
    public function index(Request $request)
    {
        $org = $request->user()->organization;
        $limit = (int) $request->input('limit', 10);

        $transactions = CreditTransaction::where('organization_id', $org->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (CreditTransaction $tx) => [
                'id' => $tx->id,
                'type' => $tx->type,
                'amount' => $tx->amount,
                'createdAt' => $tx->created_at?->toIso8601String(),
            ]);

        return ApiResponse::success([
            'balance' => $org->sms_credits ?? 0,
            'status' => $this->resolveBalanceStatus($org->sms_credits ?? 0),
            'thresholds' => [
                'low' => 50,
                'critical' => 20,
            ],
            'transactions' => $transactions,
        ]);
    }

    public function balance(Request $request)
    {
        $org = $request->user()->organization;

        return ApiResponse::success([
            'balance' => $org->sms_credits ?? 0,
        ]);
    }

    public function transactions(Request $request)
    {
        $limit = (int) $request->input('limit', 10);
        $orgId = $request->user()->organization_id;

        $transactions = CreditTransaction::where('organization_id', $orgId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (CreditTransaction $tx) => [
                'id' => $tx->id,
                'type' => $tx->type,
                'amount' => $tx->amount,
                'createdAt' => $tx->created_at?->toIso8601String(),
            ]);

        return ApiResponse::success(['transactions' => $transactions]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'package' => 'required|in:100,500,1000',
        ]);

        $packages = [
            '100' => ['credits' => 100, 'price' => 20000],
            '500' => ['credits' => 500, 'price' => 90000],
            '1000' => ['credits' => 1000, 'price' => 160000],
        ];

        $package = $request->input('package');
        $packageDetails = $packages[$package];
        $user = $request->user();
        $org = $user->organization;

        $paystackSecretKey = config('services.paystack.secret_key');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$paystackSecretKey}",
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $user->email,
            'amount' => $packageDetails['price'],
            'metadata' => [
                'type' => 'credit_purchase',
                'package' => $package,
                'credits' => $packageDetails['credits'],
                'organization_id' => $org->id,
            ],
            'callback_url' => config('app.frontend_url') . '/dashboard/credits/callback',
        ]);

        $data = $response->json();

        if ($response->successful() && ($data['status'] ?? false)) {
            return ApiResponse::success([
                'paymentUrl' => $data['data']['authorization_url'],
                'reference' => $data['data']['reference'],
            ]);
        }

        return ApiResponse::error('Failed to initialize payment', 400);
    }

    public function paystackWebhook(Request $request)
    {
        $paystackSecretKey = config('services.paystack.secret_key');
        $signature = $request->header('x-paystack-signature');

        if ($signature !== hash_hmac('sha512', $request->getContent(), $paystackSecretKey)) {
            return ApiResponse::error('Invalid signature', 401);
        }

        $data = $request->all();

        if (($data['event'] ?? '') === 'charge.success') {
            $metadata = $data['data']['metadata'] ?? [];

            if (($metadata['type'] ?? '') === 'credit_purchase') {
                $org = Organization::find($metadata['organization_id']);

                if ($org) {
                    $reference = $data['data']['reference'] ?? null;

                    if ($reference && CreditTransaction::where('reference', $reference)->exists()) {
                        return ApiResponse::success(null, 'Already processed');
                    }

                    $org->increment('sms_credits', (int) $metadata['credits']);
                    $org->refresh();

                    CreditTransaction::create([
                        'organization_id' => $org->id,
                        'type' => 'purchase',
                        'amount' => (int) $metadata['credits'],
                        'balance_after' => $org->sms_credits,
                        'reference' => $reference,
                        'metadata' => [
                            'package' => $metadata['package'] ?? null,
                            'paystack_amount' => $data['data']['amount'] ?? null,
                        ],
                    ]);
                }
            }
        }

        return ApiResponse::success(null, 'Webhook received');
    }

    private function resolveBalanceStatus(int $balance): string
    {
        if ($balance < 20) {
            return 'critical';
        }

        if ($balance < 50) {
            return 'low';
        }

        return 'healthy';
    }
}
