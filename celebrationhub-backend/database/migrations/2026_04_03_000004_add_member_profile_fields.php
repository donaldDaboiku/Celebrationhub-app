<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('department')->nullable()->after('zip');
            $table->string('designation')->nullable()->after('department');
            $table->string('unit')->nullable()->after('designation');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['department', 'designation', 'unit']);
        });
    }
};
