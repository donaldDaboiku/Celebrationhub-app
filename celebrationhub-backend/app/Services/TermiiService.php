<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TermiiService
{
    protected $apiKey;
    protected $senderId;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.termii.api_key');
        $this->senderId = config('services.termii.sender_id');
        $this->baseUrl = config('services.termii.base_url', 'https://api.ng.termii.com/api');
    }

    /**
     * Send SMS
     */
    public function sendSMS(string $phone, string $message, ?string $senderId = null): array
    {
        try {
            $response = Http::post("{$this->baseUrl}/sms/send", [
                'to' => $this->normalizePhone($phone),
                'from' => $senderId ?: $this->senderId,
                'sms' => $message,
                'type' => 'plain',
                'channel' => 'generic',
                'api_key' => $this->apiKey,
            ]);

            $result = $response->json();

            Log::info('SMS sent', [
                'phone' => $phone,
                'status' => $result['message'] ?? 'unknown',
            ]);

            return [
                'success' => $response->successful(),
                'message_id' => $result['message_id'] ?? null,
                'response' => $result,
                'error' => $response->successful() ? null : ($result['message'] ?? $result['error'] ?? 'SMS request failed'),
            ];
        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send WhatsApp
     */
    public function sendWhatsApp(string $phone, string $message, ?string $senderId = null): array
    {
        try {
            $response = Http::post("{$this->baseUrl}/whatsapp/send", [
                'to' => $this->normalizePhone($phone),
                'from' => $senderId ?: $this->senderId,
                'message' => $message,
                'api_key' => $this->apiKey,
            ]);

            $result = $response->json();

            Log::info('WhatsApp sent', [
                'phone' => $phone,
                'status' => $result['status'] ?? 'unknown',
            ]);

            return [
                'success' => $response->successful(),
                'message_id' => $result['message_id'] ?? null,
                'response' => $result,
                'error' => $response->successful() ? null : ($result['message'] ?? $result['error'] ?? 'WhatsApp request failed'),
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp sending failed', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Normalize Nigerian phone numbers
     */
    protected function normalizePhone(string $phone): string
    {
        // Remove spaces and special characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Convert to international format
        if (str_starts_with($phone, '0')) {
            return '234' . substr($phone, 1);
        }

        if (str_starts_with($phone, '+234')) {
            return substr($phone, 1);
        }

        if (str_starts_with($phone, '234')) {
            return $phone;
        }

        // If just 10 digits, assume Nigerian
        if (strlen($phone) === 10) {
            return '234' . $phone;
        }

        return $phone;
    }
}
