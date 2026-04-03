'use client';
import { useEffect, useState } from 'react';
import { getDashboardAnalytics } from '@/lib/api';

const growthOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [growthPeriod, setGrowthPeriod] = useState('monthly');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const response = await getDashboardAnalytics(growthPeriod);
                setData(response);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [growthPeriod]);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading analytics...</div>;
    }

    if (!data) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Failed to load analytics</div>;
    }

    const maxGrowthCount = Math.max(...data.growthData.map((item) => item.count), 1);
    const trendTone = (value) => (value >= 0 ? 'positive' : 'negative');

    return (
        <div className="analytics-dashboard">
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">🎂</span>
                        <span className="card-label">Birthdays This Month</span>
                    </div>
                    <div className="card-value">{data.monthSummary.birthdays}</div>
                    <div className={`card-trend ${trendTone(data.monthSummary.birthdayTrend)}`}>
                        {data.monthSummary.birthdayTrend >= 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.birthdayTrend)}% vs last month
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">💌</span>
                        <span className="card-label">Messages Sent</span>
                    </div>
                    <div className="card-value">{data.monthSummary.messages}</div>
                    <div className={`card-trend ${trendTone(data.monthSummary.messageTrend)}`}>
                        {data.monthSummary.messageTrend >= 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.messageTrend)}% vs last month
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">✓</span>
                        <span className="card-label">Delivery Rate</span>
                    </div>
                    <div className="card-value">{data.monthSummary.deliveryRate}%</div>
                    <div className={`card-trend ${trendTone(data.monthSummary.deliveryTrend)}`}>
                        {data.monthSummary.deliveryTrend >= 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.deliveryTrend)}% vs last month
                    </div>
                </div>
            </div>

            <div className="growth-section">
                <div className="growth-head">
                    <div>
                        <h2>Member Growth</h2>
                        <p className="growth-copy">Track growth month by month, by quarter, or across full years.</p>
                    </div>
                    <div className="growth-toggle" role="tablist" aria-label="Member growth period">
                        {growthOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={growthPeriod === option.value ? 'toggle active' : 'toggle'}
                                onClick={() => setGrowthPeriod(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="growth-stats">
                    <strong>{data.totalMembers}</strong> total members • <strong>+{data.newMembersInPeriod}</strong> {data.newMembersLabel}
                </p>
                <p className="growth-range">Current view: {data.growthRangeLabel}</p>
                <div className="chart">
                    {data.growthData.map((item, index) => (
                        <div key={index} className="chart-bar">
                            <div className="bar-shell">
                                <div className="bar" style={{ height: `${Math.max((item.count / maxGrowthCount) * 220, 24)}px` }}>
                                    <span className="bar-value">{item.count}</span>
                                </div>
                            </div>
                            <span className="bar-label">{item.short_label || item.label}</span>
                            <span className="bar-note">+{item.new_members}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="breakdown-grid">
                {data.memberBreakdowns.map((breakdown) => {
                    const maxBreakdownCount = Math.max(...breakdown.items.map((item) => item.count), 1);

                    return (
                        <div key={breakdown.key} className="breakdown-card">
                            <div className="breakdown-head">
                                <div>
                                    <h2>Members by {breakdown.label}</h2>
                                    <p className="breakdown-copy">
                                        {breakdown.items.length > 0
                                            ? `${breakdown.filled_members} members have ${breakdown.label.toLowerCase()} values saved.`
                                            : `No ${breakdown.label.toLowerCase()} values saved yet.`}
                                    </p>
                                </div>
                            </div>

                            {breakdown.items.length === 0 ? (
                                <div className="empty-state">Add member {breakdown.label.toLowerCase()} values to see this breakdown.</div>
                            ) : (
                                <div className="breakdown-list">
                                    {breakdown.items.map((item) => (
                                        <div key={`${breakdown.key}-${item.name}`} className="breakdown-item">
                                            <div className="breakdown-row">
                                                <span className="breakdown-name">{item.name}</span>
                                                <strong className="breakdown-count">{item.count}</strong>
                                            </div>
                                            <div className="breakdown-track">
                                                <div
                                                    className="breakdown-fill"
                                                    style={{ width: `${Math.max((item.count / maxBreakdownCount) * 100, 12)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="upcoming-section">
                <h2>Upcoming Celebrations</h2>
                <div className="upcoming-list">
                    {data.upcoming.length === 0 ? (
                        <div className="empty-state">No birthdays or anniversaries in the next 7 days.</div>
                    ) : (
                        data.upcoming.map((event, index) => (
                            <div key={index} className="upcoming-item">
                                <div className="date-badge">
                                    <div className="date-day">{event.day}</div>
                                    <div className="date-month">{event.month}</div>
                                </div>
                                <div className="event-details">
                                    <div className="event-type">{event.count} {event.type}</div>
                                    <div className="event-names">{event.names.join(', ')}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style jsx>{`
        .analytics-dashboard {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .card-icon {
          font-size: 24px;
        }

        .card-label {
          font-size: 14px;
          color: #666;
        }

        .card-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .card-trend {
          font-size: 13px;
        }

        .card-trend.positive {
          color: #16a34a;
        }

        .card-trend.negative {
          color: #dc2626;
        }

        .growth-section, .upcoming-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .breakdown-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        h2 {
          font-family: Georgia, serif;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .growth-head {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .growth-copy {
          margin: 0;
          color: #666;
        }

        .breakdown-copy {
          margin: 0;
          color: #666;
        }

        .growth-stats {
          color: #666;
          margin-bottom: 8px;
        }

        .growth-range {
          margin-bottom: 24px;
          color: #475569;
          font-size: 14px;
        }

        .growth-toggle {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .toggle {
          border: 1px solid #dbe4f0;
          background: #f8fafc;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .toggle.active {
          background: linear-gradient(135deg, #4f46e5 0%, #f97316 100%);
          color: white;
          border-color: transparent;
        }

        .chart {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          min-height: 280px;
          padding: 20px 0;
          overflow-x: auto;
        }

        .chart-bar {
          min-width: 82px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bar-shell {
          width: 100%;
          height: 220px;
          display: flex;
          align-items: flex-end;
        }

        .bar {
          width: 100%;
          background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 12px;
          transition: all 0.3s ease;
          animation: growUp 0.6s ease-out;
        }

        .bar:hover {
          background: linear-gradient(180deg, #4338ca 0%, #4f46e5 100%);
        }

        .bar-value {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .bar-label {
          margin-top: 12px;
          color: #666;
          font-size: 14px;
          font-weight: 600;
        }

        .bar-note {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .breakdown-item {
          display: grid;
          gap: 8px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .breakdown-name {
          color: #0f172a;
          font-weight: 600;
        }

        .breakdown-count {
          color: #475569;
        }

        .breakdown-track {
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .breakdown-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(135deg, #4f46e5 0%, #f97316 100%);
        }

        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upcoming-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .upcoming-item:hover {
          background: #f3f4f6;
        }

        .date-badge {
          background: #4f46e5;
          color: white;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          min-width: 60px;
        }

        .date-day {
          font-size: 24px;
          font-weight: bold;
          line-height: 1;
        }

        .date-month {
          font-size: 11px;
          margin-top: 4px;
        }

        .event-details {
          flex: 1;
        }

        .event-type {
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: capitalize;
        }

        .event-names {
          font-size: 14px;
          color: #666;
        }

        .empty-state {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          color: #666;
          text-align: center;
        }

        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .analytics-dashboard {
            padding: 16px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .growth-head {
            flex-direction: column;
          }

          .chart {
            gap: 16px;
          }
        }
      `}</style>
        </div>
    );
}
