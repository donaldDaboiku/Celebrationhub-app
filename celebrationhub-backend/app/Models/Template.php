<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'content',
        'preview_url',
        'is_public',
        'organization_id',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];
}
