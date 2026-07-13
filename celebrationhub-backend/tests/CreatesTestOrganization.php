<?php

namespace Tests;

use App\Models\Organization;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

trait CreatesTestOrganization
{
    use RefreshDatabase;

    protected function createAuthenticatedUser(array $overrides = []): array
    {
        $organization = Organization::create([
            'name' => $overrides['organization_name'] ?? 'Test Organization',
            'slug' => $overrides['slug'] ?? ('test-org-' . Str::lower(Str::random(8))),
            'email' => $overrides['organization_email'] ?? 'org@example.com',
            'sms_credits' => $overrides['sms_credits'] ?? 0,
        ]);

        Subscription::create([
            'organization_id' => $organization->id,
            'plan_tier' => 'starter',
            'status' => 'trial',
            'current_period_start' => now(),
            'current_period_end' => now()->addDays(14),
        ]);

        $user = User::create([
            'organization_id' => $organization->id,
            'name' => $overrides['name'] ?? 'Test Admin',
            'email' => $overrides['email'] ?? 'admin@example.com',
            'password' => Hash::make($overrides['password'] ?? 'password123'),
            'role' => 'admin',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        return compact('organization', 'user', 'token');
    }

    protected function authHeaders(string $token): array
    {
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }
}
