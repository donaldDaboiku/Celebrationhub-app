<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        // You'll need to get the authenticated user's organization
        // For now, we'll use mock data until you set up authentication
        
        $orgId = $request->user()->organization_id ?? 1; // Replace with actual auth
        
        // Get current month data
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();
        
        // Birthdays this month
        $birthdaysThisMonth = Member::where('organization_id', $orgId)
            ->whereMonth('birthday', $now->month)
            ->count();
        
        $birthdaysLastMonth = Member::where('organization_id', $orgId)
            ->whereMonth('birthday', $now->subMonth()->month)
            ->count();
        
        $birthdayTrend = $birthdaysLastMonth > 0 
            ? round((($birthdaysThisMonth - $birthdaysLastMonth) / $birthdaysLastMonth) * 100)
            : 0;
        
        // Total members
        $totalMembers = Member::where('organization_id', $orgId)->count();
        
        // New members this month
        $newMembersThisMonth = Member::where('organization_id', $orgId)
            ->where('created_at', '>=', $startOfMonth)
            ->count();
        
        // Growth data (last 3 months)
        $growthData = [];
        for ($i = 2; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $count = Member::where('organization_id', $orgId)
                ->where('created_at', '<=', $month->endOfMonth())
                ->count();
            
            $growthData[] = [
                'month' => $month->format('M'),
                'count' => $count
            ];
        }
        
        // Upcoming celebrations (next 7 days)
        $upcoming = [];
        $today = Carbon::today();
        
        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            
            $birthdays = Member::where('organization_id', $orgId)
                ->whereMonth('birthday', $date->month)
                ->whereDay('birthday', $date->day)
                ->get();
            
            if ($birthdays->count() > 0) {
                $upcoming[] = [
                    'day' => $date->format('d'),
                    'month' => $date->format('M'),
                    'count' => $birthdays->count(),
                    'type' => 'birthdays',
                    'names' => $birthdays->pluck('full_name')->toArray()
                ];
            }
            
            $anniversaries = Member::where('organization_id', $orgId)
                ->whereMonth('anniversary', $date->month)
                ->whereDay('anniversary', $date->day)
                ->get();
            
            if ($anniversaries->count() > 0) {
                $upcoming[] = [
                    'day' => $date->format('d'),
                    'month' => $date->format('M'),
                    'count' => $anniversaries->count(),
                    'type' => 'anniversary',
                    'names' => $anniversaries->pluck('full_name')->toArray()
                ];
            }
        }
        
        return response()->json([
            'monthSummary' => [
                'birthdays' => $birthdaysThisMonth,
                'birthdayTrend' => $birthdayTrend,
                'messages' => 135, // You'll track this in a messages table
                'messageTrend' => 8,
                'deliveryRate' => 97.8, // Track this in message delivery logs
                'deliveryTrend' => 2
            ],
            'totalMembers' => $totalMembers,
            'newMembersThisMonth' => $newMembersThisMonth,
            'growthData' => $growthData,
            'upcoming' => $upcoming,
            'delivery' => [
                'email' => 98,
                'sms' => 96,
                'whatsapp' => 95
            ]
        ]);
    }
}