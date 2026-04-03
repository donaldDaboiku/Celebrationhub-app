<?php

namespace App\Exports;

use App\Models\Member;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MembersExport implements FromQuery, WithHeadings, WithMapping
{
    protected $organizationId;

    public function __construct($organizationId)
    {
        $this->organizationId = $organizationId;
    }

    /**
     * Query members
     */
    public function query()
    {
        return Member::query()
            ->where('organization_id', $this->organizationId)
            ->orderBy('first_name');
    }

    /**
     * Map data
     */
    public function map($member): array
    {
        return [
            $member->title,
            $member->first_name,
            $member->last_name,
            $member->birthday ? $member->birthday->format('Y-m-d') : '',
            $member->anniversary ? $member->anniversary->format('Y-m-d') : '',
            $member->email,
            $member->phone,
            $member->address,
            $member->city,
            $member->state,
            $member->country,
            $member->zip,
            $member->department,
            $member->designation,
            $member->unit,
            $member->photo_url,
        ];
    }

    /**
     * Headings
     */
    public function headings(): array
    {
        return [
            'title',
            'first_name',
            'last_name',
            'birthday',
            'anniversary',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'country',
            'zip',
            'department',
            'designation',
            'unit',
            'photo_url',
        ];
    }
}
