<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            
            $table->string('plan_tier'); // starter, basic, pro, enterprise
            $table->string('status')->default('active');
            
            $table->timestamp('current_period_start');
            $table->timestamp('current_period_end');
            
            // Payment
            $table->string('payment_provider')->nullable();
            $table->string('payment_provider_subscription_id')->nullable();
            
            // Usage
            $table->integer('member_count')->default(0);
            $table->integer('message_count')->default(0);
            
            $table->boolean('cancel_at_period_end')->default(false);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};