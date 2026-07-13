'use client';
import { useState } from 'react';
import { purchaseCredits } from '@/lib/api';
import { getCreditWarningCopy } from '@/lib/credits';
import { useSmsCredits } from '@/hooks/useSmsCredits';

export default function SMSCreditManagement() {
  const { balance: credits, transactions, status, loading, refresh } = useSmsCredits();
  const [purchasing, setPurchasing] = useState(false);

  const packages = [
    {
      id: '100',
      credits: 100,
      price: 200,
      pricePerCredit: 2.00,
      discount: 0,
      popular: false
    },
    {
      id: '500',
      credits: 500,
      price: 900,
      pricePerCredit: 1.80,
      discount: 10,
      popular: true
    },
    {
      id: '1000',
      credits: 1000,
      price: 1600,
      pricePerCredit: 1.60,
      discount: 20,
      popular: false
    }
  ];
 
  const handlePurchase = async (packageId) => {
    setPurchasing(true);
    try {
      const response = await purchaseCredits(packageId);
      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        await refresh();
      }
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      alert(error.message || 'Failed to initiate purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getBalanceStatus = () => status;

  const statusLabel = getBalanceStatus();
  const warningCopy = getCreditWarningCopy(credits, statusLabel);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="sms-credit-management">
      {warningCopy && (
        <div className={`balance-warning ${statusLabel}`} role="alert">
          <strong>{warningCopy.title}</strong>
          <p>{warningCopy.message}</p>
        </div>
      )}

      {/* Current Balance */}
      <div className={`balance-card status-${statusLabel}`}>
        <div className="balance-header">
          <span className="balance-label">SMS Credit Balance</span>
          <span className={`status-badge ${statusLabel}`}>
            {statusLabel === 'healthy' && '🟢 Healthy'}
            {statusLabel === 'low' && '🟡 Low'}
            {statusLabel === 'critical' && '🔴 Critical'}
          </span>
        </div>
        <div className="balance-value">{credits}</div>
        <p className="balance-subtitle">credits remaining</p>
      </div>

      {/* Purchase Packages */}
      <div className="packages-section">
        <h2>Top Up Credits</h2>
        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.id} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="popular-badge">Most Popular</div>}
              <div className="package-credits">{pkg.credits}</div>
              <div className="package-label">Credits</div>
              <div className="package-price">₦{pkg.price.toLocaleString()}</div>
              <div className="package-rate">₦{pkg.pricePerCredit} per credit</div>
              {pkg.discount > 0 && (
                <div className="package-discount">Save {pkg.discount}%</div>
              )}
              <button
                className="purchase-btn"
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="transactions-section">
        <h2>Recent Transactions</h2>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <p className="no-transactions">No transactions yet</p>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type === 'purchase' ? '💳' : '📤'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-type">
                    {tx.type === 'purchase' ? 'Credit Purchase' : tx.type === 'debit' ? 'SMS Sent' : 'Transaction'}
                  </div>
                  <div className="transaction-date">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className={`transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .sms-credit-management {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .balance-warning {
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .balance-warning.low {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          color: #92400e;
        }

        .balance-warning.critical {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .balance-warning strong {
          display: block;
          margin-bottom: 4px;
        }

        .balance-warning p {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
        }

        .balance-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .balance-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
        }

        .balance-card.status-healthy::before {
          background: linear-gradient(90deg, #16a34a, #22c55e);
        }

        .balance-card.status-low::before {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .balance-card.status-critical::before {
          background: linear-gradient(90deg, #dc2626, #ef4444);
        }

        .balance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .balance-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.healthy {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.low {
          background: #fef3c7;
          color: #f59e0b;
        }

        .status-badge.critical {
          background: #fee2e2;
          color: #dc2626;
        }

        .balance-value {
          font-size: 64px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 8px;
        }

        .balance-subtitle {
          color: #666;
          font-size: 16px;
        }

        .packages-section, .transactions-section {
          margin-bottom: 40px;
        }

        h2 {
          font-family: Georgia, serif;
          font-size: 28px;
          margin-bottom: 24px;
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .package-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .package-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .package-card.popular {
          border: 2px solid #4f46e5;
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #4f46e5;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .package-credits {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .package-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }

        .package-price {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .package-rate {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .package-discount {
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 16px;
        }

        .purchase-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }

        .purchase-btn:hover:not(:disabled) {
          background: #4338ca;
        }

        .purchase-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .transactions-list {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .transaction-item:last-child {
          border-bottom: none;
        }

        .transaction-icon {
          font-size: 32px;
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-type {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .transaction-date {
          font-size: 13px;
          color: #666;
        }

        .transaction-amount {
          font-size: 18px;
          font-weight: bold;
        }

        .transaction-amount.positive {
          color: #16a34a;
        }

        .transaction-amount.negative {
          color: #dc2626;
        }

        .no-transactions {
          text-align: center;
          color: #666;
          padding: 32px;
        }

        @media (max-width: 768px) {
          .sms-credit-management {
            padding: 16px;
          }

          .balance-value {
            font-size: 48px;
          }

          .packages-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}