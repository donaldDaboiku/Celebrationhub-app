<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Celebration extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'organization_id',
        'type',
        'message_text',
        'design_url',
        'channels',
        'status',
        'scheduled_for',
        'sent_at',
    ];

    protected $casts = [
        'channels' => 'array',
        'scheduled_for' => 'datetime',
        'sent_at' => 'datetime',
    ];

    // Relationships
    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}