<?php

namespace App\Imports;

use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MembersImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use SkipsErrors;

    protected $organizationId;
    protected $imported = 0;
    protected $errors = [];

    public function __construct($organizationId)
    {
        $this->organizationId = $organizationId;
    }

    /**
     * @param array $row
     * @return Member|null
     */
    public function model(array $row)
    {
        try {
            // Parse dates
            $birthday = $this->parseDate($row['birthday'] ?? null);
            $anniversary = $this->parseDate($row['anniversary'] ?? null);

            $member = new Member([
                'organization_id' => $this->organizationId,
                'title' => $row['title'] ?? null,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'] ?? null,
                'birthday' => $birthday,
                'anniversary' => $anniversary,
                'email' => $row['email'] ?? null,
                'phone' => $row['phone'] ?? null,
                'address' => $row['address'] ?? null,
                'city' => $row['city'] ?? null,
                'state' => $row['state'] ?? null,
                'country' => $row['country'] ?? null,
                'zip' => $row['zip'] ?? null,
                'department' => $row['department'] ?? null,
                'designation' => $row['designation'] ?? null,
                'unit' => $row['unit'] ?? null,
                'photo_url' => $row['photo_url'] ?? null,
                'active' => true,
                'approved' => true,
            ]);

            $this->imported++;
            return $member;

        } catch (\Exception $e) {
            Log::error('Import row error', [
                'row' => $row,
                'error' => $e->getMessage()
            ]);
            
            $this->errors[] = [
                'row' => $row,
                'error' => $e->getMessage()
            ];
            
            return null;
        }
    }

    /**
     * Parse date from various formats
     */
    protected function parseDate($date)
    {
        if (empty($date)) {
            return null;
        }

        try {
            // Handle Excel serial date
            if (is_numeric($date)) {
                return Carbon::createFromFormat('Y-m-d', \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($date)->format('Y-m-d'));
            }

            // Handle standard date formats
            return Carbon::parse($date);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
        ];
    }

    /**
     * Get import statistics
     */
    public function getStats()
    {
        return [
            'imported' => $this->imported,
            'errors' => $this->errors,
        ];
    }

    /**
     * Handle errors
     */
    public function onError(\Throwable $e)
    {
        // Handle error
    }
}
