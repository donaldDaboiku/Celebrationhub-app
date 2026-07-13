<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;
use App\Models\MessageLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $organization = $request->user()->organization;
        $orgId = $organization->id;
        $now   = Carbon::now();
        $growthPeriod = $request->string('period')->toString() ?: 'monthly';
        $memberFieldLabels = $this->resolveMemberFieldLabels($organization->settings ?? []);

        if (! in_array($growthPeriod, ['monthly', 'quarterly', 'yearly'], true)) {
            $growthPeriod = 'monthly';
        }

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

        $growth = $this->buildGrowthData($orgId, $now, $growthPeriod);

        // --- Upcoming celebrations (next 7 days) — single queries, no loop ---
        $upcoming = $this->getUpcomingCelebrations($orgId);

        $messageStats = $this->buildMessageStats($orgId, $now);
        $deliveryByChannel = $this->buildDeliveryByChannel($orgId, $now);

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
            'growthPeriod'        => $growth['period'],
            'newMembersInPeriod'  => $growth['new_members'],
            'newMembersLabel'     => $growth['new_members_label'],
            'growthRangeLabel'    => $growth['current_label'],
            'growthData'          => $growth['data'],
            'memberBreakdowns'    => $this->buildMemberBreakdowns($orgId, $memberFieldLabels),
            'upcoming'            => $upcoming,
            'delivery'            => $deliveryByChannel,
        ]);
    }

    private function buildMessageStats(int $orgId, Carbon $now): array
    {
        $monthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $messagesThisMonth = MessageLog::where('organization_id', $orgId)
            ->where('created_at', '>=', $monthStart)
            ->count();

        $messagesLastMonth = MessageLog::where('organization_id', $orgId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $messageTrend = $messagesLastMonth > 0
            ? round((($messagesThisMonth - $messagesLastMonth) / $messagesLastMonth) * 100)
            : ($messagesThisMonth > 0 ? 100 : 0);

        $attemptsThisMonth = $messagesThisMonth;
        $successfulThisMonth = MessageLog::where('organization_id', $orgId)
            ->where('created_at', '>=', $monthStart)
            ->whereIn('status', ['sent', 'delivered'])
            ->count();

        $deliveryRate = $attemptsThisMonth > 0
            ? round(($successfulThisMonth / $attemptsThisMonth) * 100, 1)
            : 0;

        $attemptsLastMonth = $messagesLastMonth;
        $successfulLastMonth = MessageLog::where('organization_id', $orgId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->whereIn('status', ['sent', 'delivered'])
            ->count();

        $lastDeliveryRate = $attemptsLastMonth > 0
            ? round(($successfulLastMonth / $attemptsLastMonth) * 100, 1)
            : 0;

        $deliveryTrend = $attemptsLastMonth > 0
            ? round($deliveryRate - $lastDeliveryRate, 1)
            : ($attemptsThisMonth > 0 ? $deliveryRate : 0);

        return [
            'messages' => $messagesThisMonth,
            'messageTrend' => $messageTrend,
            'deliveryRate' => $deliveryRate,
            'deliveryTrend' => $deliveryTrend,
        ];
    }

    private function buildDeliveryByChannel(int $orgId, Carbon $now): array
    {
        $monthStart = $now->copy()->startOfMonth();

        $counts = MessageLog::where('organization_id', $orgId)
            ->where('created_at', '>=', $monthStart)
            ->whereIn('status', ['sent', 'delivered'])
            ->selectRaw('channel, COUNT(*) as total')
            ->groupBy('channel')
            ->pluck('total', 'channel');

        return [
            'email' => (int) ($counts['email'] ?? 0),
            'sms' => (int) ($counts['sms'] ?? 0),
            'whatsapp' => (int) ($counts['whatsapp'] ?? 0),
        ];
    }

    private function resolveMemberFieldLabels(array $settings): array
    {
        $memberFields = $settings['member_fields'] ?? [];

        return [
            'department' => trim($memberFields['department_label'] ?? '') ?: 'Department',
            'designation' => trim($memberFields['designation_label'] ?? '') ?: 'Designation',
            'unit' => trim($memberFields['unit_label'] ?? '') ?: 'Unit',
        ];
    }

    private function buildGrowthData(int $orgId, Carbon $now, string $period): array
    {
        $config = match ($period) {
            'quarterly' => [
                'points' => 6,
                'shift' => fn (Carbon $date, int $steps) => $date->copy()->startOfQuarter()->subQuarters($steps),
                'end' => fn (Carbon $date) => $date->copy()->endOfQuarter(),
                'label' => fn (Carbon $date) => 'Q' . $date->quarter . ' ' . $date->format('Y'),
                'short_label' => fn (Carbon $date) => 'Q' . $date->quarter,
                'new_members_label' => 'this quarter',
            ],
            'yearly' => [
                'points' => 5,
                'shift' => fn (Carbon $date, int $steps) => $date->copy()->startOfYear()->subYears($steps),
                'end' => fn (Carbon $date) => $date->copy()->endOfYear(),
                'label' => fn (Carbon $date) => $date->format('Y'),
                'short_label' => fn (Carbon $date) => $date->format('Y'),
                'new_members_label' => 'this year',
            ],
            default => [
                'points' => 6,
                'shift' => fn (Carbon $date, int $steps) => $date->copy()->startOfMonth()->subMonths($steps),
                'end' => fn (Carbon $date) => $date->copy()->endOfMonth(),
                'label' => fn (Carbon $date) => $date->format('M Y'),
                'short_label' => fn (Carbon $date) => $date->format('M'),
                'new_members_label' => 'this month',
            ],
        };

        $data = [];

        for ($i = $config['points'] - 1; $i >= 0; $i--) {
            $start = $config['shift']($now, $i);
            $end = $config['end']($start);

            $data[] = [
                'label' => $config['label']($start),
                'short_label' => $config['short_label']($start),
                'count' => Member::where('organization_id', $orgId)
                    ->where('created_at', '<=', $end)
                    ->count(),
                'new_members' => Member::where('organization_id', $orgId)
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),
            ];
        }

        $currentStart = $config['shift']($now, 0);
        $currentEnd = $config['end']($currentStart);

        return [
            'period' => $period,
            'current_label' => $config['label']($currentStart),
            'new_members_label' => $config['new_members_label'],
            'new_members' => Member::where('organization_id', $orgId)
                ->whereBetween('created_at', [$currentStart, $currentEnd])
                ->count(),
            'data' => $data,
        ];
    }

    private function buildMemberBreakdowns(int $orgId, array $labels): array
    {
        return collect(['department', 'designation', 'unit'])->map(function (string $field) use ($orgId, $labels) {
            if (! Schema::hasColumn('members', $field)) {
                return [
                    'key' => $field,
                    'label' => $labels[$field] ?? ucfirst($field),
                    'items' => [],
                    'filled_members' => 0,
                ];
            }

            $items = Member::where('organization_id', $orgId)
                ->whereNotNull($field)
                ->where($field, '!=', '')
                ->selectRaw($field . ' as value, COUNT(*) as aggregate')
                ->groupBy($field)
                ->orderByDesc('aggregate')
                ->limit(6)
                ->get()
                ->map(fn ($item) => [
                    'name' => $item->value,
                    'count' => (int) $item->aggregate,
                ])
                ->values()
                ->all();

            return [
                'key' => $field,
                'label' => $labels[$field] ?? ucfirst($field),
                'items' => $items,
                'filled_members' => array_sum(array_column($items, 'count')),
            ];
        })->values()->all();
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

        $birthdayMembers = Member::where('organization_id', $orgId)
            ->active()
            ->approved()
            ->whereNotNull('birthday')
            ->where(function ($q) use ($pairs) {
                $this->applyCelebrationDateWindow($q, 'birthday', $pairs);
            })
            ->get(['first_name', 'last_name', 'title', 'birthday']);

        $anniversaryMembers = Member::where('organization_id', $orgId)
            ->active()
            ->approved()
            ->whereNotNull('anniversary')
            ->where(function ($q) use ($pairs) {
                $this->applyCelebrationDateWindow($q, 'anniversary', $pairs);
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

    private function applyCelebrationDateWindow($query, string $column, $pairs): void
    {
        $driver = Schema::getConnection()->getDriverName();

        $query->where(function ($q) use ($pairs, $column, $driver) {
            foreach ($pairs as [$day, $month]) {
                $q->orWhere(function ($q2) use ($day, $month, $column, $driver) {
                    if ($driver === 'sqlite') {
                        $q2->whereRaw("strftime('%d', {$column}) = ?", [sprintf('%02d', $day)])
                            ->whereRaw("strftime('%m', {$column}) = ?", [sprintf('%02d', $month)]);
                    } else {
                        $q2->whereRaw("DAY({$column}) = ?", [$day])
                            ->whereRaw("MONTH({$column}) = ?", [$month]);
                    }
                });
            }
        });
    }
}
