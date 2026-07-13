<?php

namespace App\Services;

use App\Models\User;
use App\Models\Organization;
use App\Models\Subscription;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AuthService
{
    public function register($data)
    {
        DB::beginTransaction();

        try {
            // Create slug
            $slug = Str::slug($data['organization_name']);
            if (Organization::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::random(4);
            }

            // Organization
            $organization = Organization::create([
                'name' => $data['organization_name'],
                'slug' => $slug,
                'email' => $data['email'],
                'settings' => $this->defaultSettings($data),
            ]);

            // User
            $user = User::create([
                'organization_id' => $organization->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'admin',
            ]);

            // Subscription
            Subscription::create([
                'organization_id' => $organization->id,
                'plan_tier' => 'starter',
                'status' => 'trial',
                'current_period_start' => now(),
                'current_period_end' => now()->addDays(14),
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            DB::commit();

            return [
                'user' => $user,
                'organization' => $organization,
                'token' => $token,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function login($data)
    {
        $user = User::with('organization')->where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return null;
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'organization' => $user->organization,
            'token' => $token,
        ];
    }

    private function defaultSettings($data)
    {
        return [
            'timezone' => 'Africa/Lagos',
            'send_time' => '06:00',
            'branding' => [
                'primary_color' => '#667eea',
                'secondary_color' => '#764ba2',
            ],
            'messaging' => [
                'email_enabled' => true,
                'sms_enabled' => false,
                'whatsapp_enabled' => false,
                'primary_channel' => 'email',
            ],
            'integrations' => [
                'email' => [
                    'mailer' => 'smtp',
                    'host' => '',
                    'port' => 587,
                    'username' => '',
                    'password' => '',
                    'encryption' => 'tls',
                    'from_address' => $data['email'],
                    'from_name' => $data['organization_name'],
                ],
            ],
        ];
    }
}