<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\MembersImport;
use App\Exports\MembersTemplateExport;
use App\Exports\MembersExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class MemberImportController extends Controller
{
    /**
     * Download import template
     */
    public function downloadTemplate()
    {
        return Excel::download(
            new MembersTemplateExport, 
            'members-import-template.xlsx'
        );
    }

    /**
     * Import members from file
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120', // 5MB max
        ]);

        try {
            $import = new MembersImport($request->user()->organization_id);
            
            Excel::import($import, $request->file('file'));

            $stats = $import->getStats();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$stats['imported']} members",
                'data' => [
                    'imported' => $stats['imported'],
                    'errors_count' => count($stats['errors']),
                    'errors' => $stats['errors'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export members to Excel
     */
    public function export(Request $request)
    {
        return Excel::download(
            new MembersExport($request->user()->organization_id),
            'members-export-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}