<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add generated virtual columns for birthday and anniversary day/month so
 * MySQL can use an index instead of scanning with DAY()/MONTH() functions.
 *
 * Also adds sms_credits to organizations.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('members', function (Blueprint $table) use ($driver) {
            if ($driver === 'mysql') {
                $table->tinyInteger('birthday_day')
                    ->virtualAs('DAY(birthday)')
                    ->nullable()
                    ->after('birthday');

                $table->tinyInteger('birthday_month')
                    ->virtualAs('MONTH(birthday)')
                    ->nullable()
                    ->after('birthday_day');

                $table->tinyInteger('anniversary_day')
                    ->virtualAs('DAY(anniversary)')
                    ->nullable()
                    ->after('anniversary');

                $table->tinyInteger('anniversary_month')
                    ->virtualAs('MONTH(anniversary)')
                    ->nullable()
                    ->after('anniversary_day');
            } else {
                $table->tinyInteger('birthday_day')->nullable()->after('birthday');
                $table->tinyInteger('birthday_month')->nullable()->after('birthday_day');
                $table->tinyInteger('anniversary_day')->nullable()->after('anniversary');
                $table->tinyInteger('anniversary_month')->nullable()->after('anniversary_day');
            }

            $table->index(['birthday_month', 'birthday_day'], 'idx_birthday_md');
            $table->index(['anniversary_month', 'anniversary_day'], 'idx_anniversary_md');
            $table->index(['organization_id', 'active', 'approved'], 'idx_org_active_approved');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->unsignedInteger('sms_credits')->default(0)->after('member_limit');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropIndex('idx_birthday_md');
            $table->dropIndex('idx_anniversary_md');
            $table->dropIndex('idx_org_active_approved');
            $table->dropColumn([
                'birthday_day', 'birthday_month',
                'anniversary_day', 'anniversary_month',
            ]);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('sms_credits');
        });
    }
};
