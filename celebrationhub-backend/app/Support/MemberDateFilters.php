<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class MemberDateFilters
{
    public static function whereMonthDay(Builder $query, string $column, int $day, int $month): Builder
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            $dayColumn = $column === 'birthday' ? 'birthday_day' : 'anniversary_day';
            $monthColumn = $column === 'birthday' ? 'birthday_month' : 'anniversary_month';

            return $query
                ->where($dayColumn, $day)
                ->where($monthColumn, $month);
        }

        return $query->where(function ($inner) use ($column, $day, $month) {
            $inner->whereRaw("strftime('%d', {$column}) = ?", [sprintf('%02d', $day)])
                ->whereRaw("strftime('%m', {$column}) = ?", [sprintf('%02d', $month)]);
        });
    }
}
