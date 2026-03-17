<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Member;
use Carbon\Carbon;

class MemberSeeder extends Seeder
{
    public function run()
    {
        $members = [
            [
                'organization_id' => 1,
                'title' => 'Mr',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john.doe@example.com',
                'phone' => '08012345678',
                'birthday' => Carbon::create(1990, 1, 29),
                'anniversary' => null,
            ],
            [
                'organization_id' => 1,
                'title' => 'Mrs',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '08087654321',
                'birthday' => Carbon::create(1985, 1, 29),
                'anniversary' => null,
            ],
            [
                'organization_id' => 1,
                'title' => 'Mr & Mrs',
                'first_name' => 'Robert',
                'last_name' => 'Johnson',
                'email' => 'johnson@example.com',
                'phone' => '08011112222',
                'birthday' => null,
                'anniversary' => Carbon::create(2015, 1, 30),
            ],
            [
                'organization_id' => 1,
                'title' => 'Dr',
                'first_name' => 'Sarah',
                'last_name' => 'Williams',
                'email' => 'sarah.w@example.com',
                'phone' => '08099998888',
                'birthday' => Carbon::create(1992, 2, 15),
                'anniversary' => null,
            ],
            [
                'organization_id' => 1,
                'title' => 'Mr',
                'first_name' => 'Michael',
                'last_name' => 'Brown',
                'email' => 'michael.b@example.com',
                'phone' => '08077776666',
                'birthday' => Carbon::create(1988, 3, 20),
                'anniversary' => null,
            ],
        ];

        foreach ($members as $member) {
            Member::create($member);
        }
    }
}