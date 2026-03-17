<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MembersTemplateExport implements FromArray, WithHeadings, WithStyles
{
    /**
     * Return sample data
     */
    public function array(): array
    {
        return [
            [
                'Mr',
                'John',
                'Doe',
                '1990-01-15',
                '2015-06-20',
                'john@example.com',
                '08012345678',
                '',
            ],
            [
                'Mrs',
                'Jane',
                'Smith',
                '1985-03-22',
                '',
                'jane@example.com',
                '08087654321',
                '',
            ],
        ];
    }

    /**
     * Column headings
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
            'photo_url',
        ];
    }

    /**
     * Style the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }
}