<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'birthday' => 'date',
        'anniversary' => 'date',
        'active' => 'boolean',
        'approved' => 'boolean',
        'tags' => 'array',
    ];

    protected $appends = ['full_name'];

    // Accessors
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->title,
            $this->first_name,
            $this->last_name,
        ]);
        
        return implode(' ', $parts);
    }

    // Relationships
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function celebrations(): HasMany
    {
        return $this->hasMany(Celebration::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeApproved($query)
    {
        return $query->where('approved', true);
    }

    public function scopeUpcomingBirthdays($query, $days = 7)
    {
        $today = now();
        $futureDate = now()->addDays($days);

        return $query->whereNotNull('birthday')
            ->where(function ($q) use ($today, $futureDate) {
                $q->whereRaw('MONTH(birthday) = ?', [$today->month])
                  ->whereRaw('DAY(birthday) >= ?', [$today->day])
                  ->whereRaw('DAY(birthday) <= ?', [$futureDate->day]);
            });
    }
}