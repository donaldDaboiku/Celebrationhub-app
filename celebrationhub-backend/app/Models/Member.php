<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

/**
 * @property Carbon|null $birthday
 * @property Carbon|null $anniversary
 * @property-read string $full_name
 */
class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
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
        'photo_url',
        'active',
        'approved',
        'tags',
        'notes',
    ];

    protected $casts = [
        'birthday'    => 'date',
        'anniversary' => 'date',
        'active'      => 'boolean',
        'approved'    => 'boolean',
        'tags'        => 'array',
    ];

    protected $appends = ['full_name'];

    // --- Accessors ---

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->title,
            $this->first_name,
            $this->last_name,
        ]);

        return implode(' ', $parts);
    }

    // --- Relationships ---

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function celebrations(): HasMany
    {
        return $this->hasMany(Celebration::class);
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeApproved($query)
    {
        return $query->where('approved', true);
    }

    /**
     * Upcoming birthdays within the next $days days.
     *
     * Handles cross-month windows correctly (e.g. Jan 28 → Feb 3).
     */
    public function scopeUpcomingBirthdays($query, int $days = 7)
    {
        $today  = Carbon::today();
        $window = collect(range(0, $days - 1))
            ->map(fn ($d) => $today->copy()->addDays($d));

        return $query->whereNotNull('birthday')
            ->where(function ($q) use ($window) {
                foreach ($window as $date) {
                    $q->orWhere(function ($q2) use ($date) {
                        $q2->whereRaw('DAY(birthday) = ?', [$date->day])
                           ->whereRaw('MONTH(birthday) = ?', [$date->month]);
                    });
                }
            });
    }

    /**
     * Upcoming anniversaries within the next $days days.
     */
    public function scopeUpcomingAnniversaries($query, int $days = 7)
    {
        $today  = Carbon::today();
        $window = collect(range(0, $days - 1))
            ->map(fn ($d) => $today->copy()->addDays($d));

        return $query->whereNotNull('anniversary')
            ->where(function ($q) use ($window) {
                foreach ($window as $date) {
                    $q->orWhere(function ($q2) use ($date) {
                        $q2->whereRaw('DAY(anniversary) = ?', [$date->day])
                           ->whereRaw('MONTH(anniversary) = ?', [$date->month]);
                    });
                }
            });
    }
}
