<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('celebrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            
            $table->string('type'); // birthday, anniversary
            
            // Message Content
            $table->text('message_text')->nullable();
            $table->string('design_url')->nullable();
            
            // Delivery
            $table->json('channels')->nullable();
            
            $table->string('status')->default('pending'); // pending, sent, failed
            
            // Timestamps
            $table->timestamp('scheduled_for');
            $table->timestamp('sent_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['scheduled_for', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('celebrations');
    }
};