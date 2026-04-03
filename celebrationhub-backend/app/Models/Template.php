<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'description',
        'preview_url',
        'background_url',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];
}
