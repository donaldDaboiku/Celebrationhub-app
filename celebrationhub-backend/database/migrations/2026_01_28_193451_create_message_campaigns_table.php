<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            
            $table->string('name');
            $table->text('message');
            $table->string('type'); // sms, email, whatsapp, all
            
            $table->string('status')->default('draft'); // draft, scheduled, sending, completed
            $table->timestamp('scheduled_for')->nullable();
            
            $table->integer('recipient_count')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('delivered_count')->default(0);
            $table->integer('failed_count')->default(0);
            
            $table->json('filters')->nullable(); // Store recipient filters
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_campaigns');
    }
};