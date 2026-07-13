<?php

namespace App\Services;

use App\Models\CreditTransaction;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;

class CreditService
{
    public function hasCredits(Organization $organization, int $amount = 1): bool
    {
        return ($organization->sms_credits ?? 0) >= $amount;
    }

    public function debit(Organization $organization, int $amount, array $metadata = []): bool
    {
        if ($amount <= 0) {
            return true;
        }

        return DB::transaction(function () use ($organization, $amount, $metadata) {
            $locked = Organization::whereKey($organization->id)->lockForUpdate()->first();

            if (! $locked || $locked->sms_credits < $amount) {
                return false;
            }

            $locked->decrement('sms_credits', $amount);

            CreditTransaction::create([
                'organization_id' => $locked->id,
                'type' => 'debit',
                'amount' => -$amount,
                'balance_after' => $locked->sms_credits,
                'reference' => $metadata['reference'] ?? null,
                'metadata' => $metadata,
            ]);

            $organization->sms_credits = $locked->sms_credits;

            return true;
        });
    }
}
