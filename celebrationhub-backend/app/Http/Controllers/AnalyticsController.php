<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $now   = Carbon::now();

        // --- Birthday counts ---
        $birthdaysThisMonth = Member::where('organization_id', $orgId)
            ->whereMonth('birthday', $now->month)
            ->count();

        $birthdaysLastMonth = Member::where('organization_id', $orgId)
            ->whereMonth('birthday', $now->copy()->subMonth()->month)
            ->count();

        $birthdayTrend = $birthdaysLastMonth > 0
            ? round((($birthdaysThisMonth - $birthdaysLastMonth) / $birthdaysLastMonth) * 100)
            : 0;

        // --- Member totals ---
        $totalMembers       = Member::where('organization_id', $orgId)->count();
        $newMembersThisMonth = Member::where('organization_id', $orgId)
            ->where('created_at', '>=', $now->copy()->startOfMonth())
            ->count();

        // --- Growth data (last 3 months) ---
        $growthData = [];
        for ($i = 2; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $count = Member::where('organization_id', $orgId)
                ->where('created_at', '<=', $month->copy()->endOfMonth())
                ->count();
            $growthData[] = ['month' => $month->format('M'), 'count' => $count];
        }

        // --- Upcoming celebrations (next 7 days) — single queries, no loop ---
        $upcoming = $this->getUpcomingCelebrations($orgId);

        // --- Message delivery stats ---
        // TODO: replace with real MessageLog aggregation
        $messageStats = [
            'messages'      => 0,
            'messageTrend'  => 0,
            'deliveryRate'  => 0,
            'deliveryTrend' => 0,
        ];

        return response()->json([
            'monthSummary' => [
                'birthdays'      => $birthdaysThisMonth,
                'birthdayTrend'  => $birthdayTrend,
                'messages'       => $messageStats['messages'],
                'messageTrend'   => $messageStats['messageTrend'],
                'deliveryRate'   => $messageStats['deliveryRate'],
                'deliveryTrend'  => $messageStats['deliveryTrend'],
            ],
            'totalMembers'        => $totalMembers,
            'newMembersThisMonth' => $newMembersThisMonth,
            'growthData'          => $growthData,
            'upcoming'            => $upcoming,
            'delivery'            => ['email' => 0, 'sms' => 0, 'whatsapp' => 0],
        ]);
    }

    /**
     * Fetch upcoming birthdays and anniversaries in two queries instead of 14.
     */
    private function getUpcomingCelebrations(int $orgId): array
    {
        $today  = Carbon::today();
        $window = collect(range(0, 6))->map(fn ($d) => $today->copy()->addDays($d));

        // Build list of (day, month) pairs for the 7-day window
        $pairs = $window->map(fn ($d) => [$d->day, $d->month]);

        // One query per celebration type
        $birthdayMembers = Member::where('organization_id', $orgId)
            ->active()
            ->approved()
            ->whereNotNull('birthday')
            ->where(function ($q) use ($pairs) {
                foreach ($pairs as [$day, $month]) {
                    $q->orWhere(function ($q2) use ($day, $month) {
                        $q2->whereRaw('DAY(birthday) = ?', [$day])
                           ->whereRaw('MONTH(birthday) = ?', [$month]);
                    });
                }
            })
            ->get(['first_name', 'last_name', 'title', 'birthday']);

        $anniversaryMembers = Member::where('organization_id', $orgId)
            ->active()
            ->approved()
            ->whereNotNull('anniversary')
            ->where(function ($q) use ($pairs) {
                foreach ($pairs as [$day, $month]) {
                    $q->orWhere(function ($q2) use ($day, $month) {
                        $q2->whereRaw('DAY(anniversary) = ?', [$day])
                           ->whereRaw('MONTH(anniversary) = ?', [$month]);
                    });
                }
            })
            ->get(['first_name', 'last_name', 'title', 'anniversary']);

        $upcoming = [];

        foreach ($window as $date) {
            $dayBirthdays = $birthdayMembers->filter(
                fn ($m) => $m->birthday &&
                    $m->birthday->day === $date->day &&
                    $m->birthday->month === $date->month
            );

            if ($dayBirthdays->isNotEmpty()) {
                $upcoming[] = [
                    'day'   => $date->format('d'),
                    'month' => $date->format('M'),
                    'count' => $dayBirthdays->count(),
                    'type'  => 'birthdays',
                    'names' => $dayBirthdays->map->full_name->values()->all(),
                ];
            }

            $dayAnniversaries = $anniversaryMembers->filter(
                fn ($m) => $m->anniversary &&
                    $m->anniversary->day === $date->day &&
                    $m->anniversary->month === $date->month
            );

            if ($dayAnniversaries->isNotEmpty()) {
                $upcoming[] = [
                    'day'   => $date->format('d'),
                    'month' => $date->format('M'),
                    'count' => $dayAnniversaries->count(),
                    'type'  => 'anniversary',
                    'names' => $dayAnniversaries->map->full_name->values()->all(),
                ];
            }
        }

        return $upcoming;
    }
}
