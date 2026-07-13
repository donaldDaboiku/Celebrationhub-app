<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Organization;
use Tests\CreatesTestOrganization;
use Tests\TestCase;

class MemberTest extends TestCase
{
    use CreatesTestOrganization;

    public function test_authenticated_user_can_list_members(): void
    {
        $auth = $this->createAuthenticatedUser();

        Member::create([
            'organization_id' => $auth['organization']->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/members');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.members.0.first_name', 'John')
            ->assertJsonStructure(['data' => ['members', 'pagination']]);
    }

    public function test_authenticated_user_can_create_member(): void
    {
        $auth = $this->createAuthenticatedUser();

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->postJson('/api/members', [
                'first_name' => 'Ada',
                'last_name' => 'Lovelace',
                'birthday' => '1815-12-10',
                'email' => 'ada@example.com',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.first_name', 'Ada');

        $this->assertDatabaseHas('members', [
            'organization_id' => $auth['organization']->id,
            'first_name' => 'Ada',
        ]);
    }

    public function test_user_cannot_access_another_organizations_member(): void
    {
        $auth = $this->createAuthenticatedUser();

        $otherOrg = Organization::create([
            'name' => 'Other Org',
            'slug' => 'other-org',
            'email' => 'other@example.com',
        ]);

        $foreignMember = Member::create([
            'organization_id' => $otherOrg->id,
            'first_name' => 'Foreign',
            'last_name' => 'Member',
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->getJson('/api/members/' . $foreignMember->id);

        $response->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_authenticated_user_can_delete_member(): void
    {
        $auth = $this->createAuthenticatedUser();

        $member = Member::create([
            'organization_id' => $auth['organization']->id,
            'first_name' => 'Delete',
            'last_name' => 'Me',
        ]);

        $response = $this->withHeaders($this->authHeaders($auth['token']))
            ->deleteJson('/api/members/' . $member->id);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('members', ['id' => $member->id]);
    }
}
