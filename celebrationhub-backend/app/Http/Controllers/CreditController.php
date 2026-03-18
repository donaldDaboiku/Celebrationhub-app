<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use App\Models\Organization;
use App\Services\PaystackService;

class CreditController extends Controller
{
    public function balance(Request $request)
    {
        $org = $request->user()->organization;

        return response()->json([
            'balance' => $org->sms_credits ?? 0,
        ]);
    }

    public function transactions(Request $request)
    {
        $limit = $request->input('limit', 10);
        $orgId = $request->user()->organization_id;

        // TODO: uncomment when CreditTransaction model is created
        // $transactions = \App\Models\CreditTransaction::where('organization_id', $orgId)
        //     ->orderBy('created_at', 'desc')
        //     ->limit($limit)
        //     ->get();

        // Placeholder until CreditTransaction model exists
        $transactions = [];

        return response()->json(['transactions' => $transactions]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'package' => 'required|in:100,500,1000',
        ]);

        $packages = [
            '100'  => ['credits' => 100,  'price' => 20000],
            '500'  => ['credits' => 500,  'price' => 90000],
            '1000' => ['credits' => 1000, 'price' => 160000],
        ];

        $package        = $request->input('package');
        $packageDetails = $packages[$package];
        $user           = $request->user();
        $org            = $user->organization;

        $paystackSecretKey = config('services.paystack.secret_key');

        /** @var Response $response */
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$paystackSecretKey}",
            'Content-Type'  => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email'        => $user->email,
            'amount'       => $packageDetails['price'],
            'metadata'     => [
                'type'            => 'credit_purchase',
                'package'         => $package,
                'credits'         => $packageDetails['credits'],
                'organization_id' => $org->id,
            ],
            'callback_url' => config('app.frontend_url') . '/dashboard/credits/callback',
        ]);

        $data = $response->json();

        if ($response->successful() && ($data['status'] ?? false)) {
            return response()->json([
                'paymentUrl' => $data['data']['authorization_url'],
                'reference'  => $data['data']['reference'],
            ]);
        }

        return response()->json(['error' => 'Failed to initialize payment'], 400);
    }

    public function paystackWebhook(Request $request)
    {
        $paystackSecretKey = config('services.paystack.secret_key');
        $signature         = $request->header('x-paystack-signature');

        if ($signature !== hash_hmac('sha512', $request->getContent(), $paystackSecretKey)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        if (($data['event'] ?? '') === 'charge.success') {
            $metadata = $data['data']['metadata'] ?? [];

            if (($metadata['type'] ?? '') === 'credit_purchase') {
                $org = Organization::find($metadata['organization_id']);

                if ($org) {
                    $org->increment('sms_credits', $metadata['credits']);

                    // TODO: create CreditTransaction record
                    // \App\Models\CreditTransaction::create([
                    //     'organization_id' => $org->id,
                    //     'type'            => 'purchase',
                    //     'amount'          => $metadata['credits'],
                    //     'balance_after'   => $org->sms_credits,
                    //     'reference'       => $data['data']['reference'],
                    // ]);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
