<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['birthday', 'anniversary']);
            $table->string('description')->nullable();
            $table->string('preview_url')->nullable();
            $table->string('background_url')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            $table->index(['type', 'is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
