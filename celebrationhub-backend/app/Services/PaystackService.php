<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    protected $secretKey;
    protected $publicKey;
    protected $baseUrl = 'https://api.paystack.co';

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');
        $this->publicKey = config('services.paystack.public_key');
    }

    /**
     * Initialize payment transaction
     */
    public function initializeTransaction(array $data): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/transaction/initialize", [
                'email' => $data['email'],
                'amount' => $data['amount'] * 100, // Convert to kobo
                'callback_url' => $data['callback_url'] ?? config('app.url') . '/api/payments/callback',
                'metadata' => $data['metadata'] ?? [],
                'plan' => $data['plan'] ?? null,
            ]);

            /** @var \Illuminate\Http\Client\Response $response */
            $result = $response->json();

            if ($response->successful() && $result['status']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Transaction initialization failed',
            ];
        } catch (\Exception $e) {
            Log::error('Paystack initialization failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment transaction
     */
    public function verifyTransaction(string $reference): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get("{$this->baseUrl}/transaction/verify/{$reference}");

            /** @var \Illuminate\Http\Client\Response $response */
            $result = $response->json();

            if ($response->successful() && $result['status']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Paystack verification failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create subscription plan
     */
    public function createPlan(array $data): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/plan", [
                'name' => $data['name'],
                'amount' => $data['amount'] * 100, // Convert to kobo
                'interval' => $data['interval'] ?? 'monthly',
                'description' => $data['description'] ?? '',
            ]);

            /** @var \Illuminate\Http\Client\Response $response */
            $result = $response->json();

            return [
                'success' => $response->successful() && $result['status'],
                'data' => $result['data'] ?? null,
                'message' => $result['message'] ?? 'Failed to create plan',
            ];
        } catch (\Exception $e) {
            Log::error('Paystack plan creation failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create subscription
     */
    public function createSubscription(string $email, string $planCode): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/subscription", [
                'customer' => $email,
                'plan' => $planCode,
            ]);

            /** @var \Illuminate\Http\Client\Response $response */
            $result = $response->json();

            return [
                'success' => $response->successful() && $result['status'],
                'data' => $result['data'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Paystack subscription failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }
}
