export const CREDIT_THRESHOLDS = {
    low: 50,
    critical: 20,
};

export function getCreditBalanceStatus(balance) {
    if (balance === null || balance === undefined) {
        return 'unknown';
    }

    if (balance < CREDIT_THRESHOLDS.critical) {
        return 'critical';
    }

    if (balance < CREDIT_THRESHOLDS.low) {
        return 'low';
    }

    return 'healthy';
}

export function shouldShowCreditWarning(status) {
    return status === 'low' || status === 'critical';
}

export function getCreditWarningCopy(balance, status) {
    if (status === 'critical') {
        return {
            title: 'SMS credits critically low',
            message: `You have ${balance} credit${balance === 1 ? '' : 's'} left. SMS messages may fail until you top up.`,
        };
    }

    if (status === 'low') {
        return {
            title: 'SMS credits running low',
            message: `You have ${balance} credits remaining. Consider topping up before your next campaign or celebration send.`,
        };
    }

    return null;
}
