<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'member_id',
        'celebration_id',
        'campaign_id',
        'channel',
        'status',
        'provider_message_id',
        'error_message',
        'sent_at',
        'delivered_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function celebration()
    {
        return $this->belongsTo(Celebration::class);
    }

    public function campaign()
    {
        return $this->belongsTo(MessageCampaign::class, 'campaign_id');
    }
}
