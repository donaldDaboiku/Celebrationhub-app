<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_user_can_register_organization(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'organization_name' => 'Grace Community',
            'name' => 'Jane Admin',
            'email' => 'jane@gracecommunity.test',
            'password' => 'securepass123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => ['id', 'email', 'name', 'role'],
                    'organization' => ['id', 'name', 'slug'],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@gracecommunity.test',
            'role' => 'admin',
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $this->createAuthenticatedUser([
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'login@example.com')
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $this->createAuthenticatedUser([
            'email' => 'wrong@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'incorrect',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $auth = $this->createAuthenticatedUser();

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $auth['user']->email);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $auth = $this->createAuthenticatedUser();

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $auth['user']->id,
            'tokenable_type' => User::class,
        ]);
    }
}
