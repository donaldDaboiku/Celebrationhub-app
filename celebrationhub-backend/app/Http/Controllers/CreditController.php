<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CreditController extends Controller
{
    public function balance()
    {
        // Get user's organization
        // $org = auth()->user()->organization;

        return response()->json([
            'balance' => 245 // Replace with: $org->sms_credits
        ]);
    }

    public function transactions(Request $request)
    {
        $limit = $request->input('limit', 10);

        // Later: Get from CreditTransaction model
        // $transactions = CreditTransaction::where('organization_id', auth()->user()->organization_id)
        //     ->orderBy('created_at', 'desc')
        //     ->limit($limit)
        //     ->get();

        $transactions = [
            [
                'id' => 123,
                'type' => 'purchase',
                'amount' => 500,
                'balanceAfter' => 745,
                'reference' => 'PSK_abc123def',
                'createdAt' => now()->subDays(2)->toISOString()
            ],
            [
                'id' => 122,
                'type' => 'usage',
                'amount' => -1,
                'balanceAfter' => 245,
                'reference' => null,
                'createdAt' => now()->subHours(5)->toISOString()
            ]
        ];

        return response()->json(['transactions' => $transactions]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'package' => 'required|in:100,500,1000'
        ]);

        $package = $request->input('package');

        $packages = [
            '100' => ['credits' => 100, 'price' => 20000], // Price in kobo (₦200)
            '500' => ['credits' => 500, 'price' => 90000], // ₦900
            '1000' => ['credits' => 1000, 'price' => 160000] // ₦1600
        ];

        $packageDetails = $packages[$package];

        // Initialize Paystack payment
        $paystackSecretKey = env('PAYSTACK_SECRET_KEY');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$paystackSecretKey}",
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => 'user@example.com', // Replace with: auth()->user()->email
            'amount' => $packageDetails['price'],
            'metadata' => [
                'type' => 'credit_purchase',
                'package' => $package,
                'credits' => $packageDetails['credits'],
                'organization_id' => 1 // Replace with: auth()->user()->organization_id
            ],
            'callback_url' => env('FRONTEND_URL') . '/dashboard/credits/callback'
        ]);

        $data = json_decode((string) $response, true) ?? [];

        if ($data['status']) {
            return response()->json([
                'paymentUrl' => $data['data']['authorization_url'],
                'reference' => $data['data']['reference']
            ]);
        }

        return response()->json([
            'error' => 'Failed to initialize payment'
        ], 400);
    }

    public function paystackWebhook(Request $request)
    {
        // Verify Paystack signature
        $paystackSecretKey = env('PAYSTACK_SECRET_KEY');
        $signature = $request->header('x-paystack-signature');

        if ($signature !== hash_hmac('sha512', $request->getContent(), $paystackSecretKey)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        if ($data['event'] === 'charge.success') {
            $metadata = $data['data']['metadata'];

            if ($metadata['type'] === 'credit_purchase') {
                // Update organization credits
                // $org = Organization::find($metadata['organization_id']);
                // $org->increment('sms_credits', $metadata['credits']);

                // Create transaction record
                // CreditTransaction::create([
                //     'organization_id' => $org->id,
                //     'type' => 'purchase',
                //     'amount' => $metadata['credits'],
                //     'balance_after' => $org->sms_credits,
                //     'reference' => $data['data']['reference']
                // ]);

                // Send confirmation email
                // Mail::to($org->email)->send(new CreditPurchaseConfirmation($org, $metadata['credits']));
            }
        }

        return response()->json(['status' => 'success']);
    }
}
