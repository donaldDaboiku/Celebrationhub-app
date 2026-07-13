'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCredits } from '@/lib/api';
import { getCreditBalanceStatus } from '@/lib/credits';

export function useSmsCredits({ enabled = true } = {}) {
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        if (!enabled) {
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await getCredits();
            const nextBalance = response.data?.balance ?? 0;
            setBalance(nextBalance);
            setTransactions(response.data?.transactions || []);
            return nextBalance;
        } catch (err) {
            setError(err.message || 'Failed to load credits');
            return null;
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const status = getCreditBalanceStatus(balance);

    return {
        balance,
        transactions,
        status,
        loading,
        error,
        refresh,
    };
}
