<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            
            // Personal Info
            $table->string('title')->nullable();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            
            // Dates
            $table->date('birthday')->nullable();
            $table->date('anniversary')->nullable();
            
            // Contact
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('zip')->nullable();
            
            // Media
            $table->string('photo_url')->nullable();
            
            // Status
            $table->boolean('active')->default(true);
            $table->boolean('approved')->default(true);
            
            // Metadata
            $table->json('tags')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('birthday');
            $table->index('anniversary');
            $table->index(['active', 'approved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};