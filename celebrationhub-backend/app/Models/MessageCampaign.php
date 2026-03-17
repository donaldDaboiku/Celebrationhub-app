<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'message',
        'type',
        'status',
        'scheduled_for',
        'recipient_count',
        'sent_count',
        'delivered_count',
        'failed_count',
        'filters',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'filters' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}