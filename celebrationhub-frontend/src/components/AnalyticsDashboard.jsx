'use client';
import { useState, useEffect } from 'react';
import { mockAnalytics } from '@/lib/mockData';

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const loadData = async () => {
            try {
                // For now, use mock data
                // Later: const response = await fetchAPI('/analytics/dashboard');
                setTimeout(() => {
                    setData(mockAnalytics);
                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Failed to load analytics:', error);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading analytics...</div>;
    }

    if (!data) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Failed to load analytics</div>;
    }

    return (
        <div className="analytics-dashboard">
            {/* Month Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">🎂</span>
                        <span className="card-label">Birthdays This Month</span>
                    </div>
                    <div className="card-value">{data.monthSummary.birthdays}</div>
                    <div className={`card-trend ${data.monthSummary.birthdayTrend > 0 ? 'positive' : 'negative'}`}>
                        {data.monthSummary.birthdayTrend > 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.birthdayTrend)}% vs last month
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">💌</span>
                        <span className="card-label">Messages Sent</span>
                    </div>
                    <div className="card-value">{data.monthSummary.messages}</div>
                    <div className={`card-trend ${data.monthSummary.messageTrend > 0 ? 'positive' : 'negative'}`}>
                        {data.monthSummary.messageTrend > 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.messageTrend)}% vs last month
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">✓</span>
                        <span className="card-label">Delivery Rate</span>
                    </div>
                    <div className="card-value">{data.monthSummary.deliveryRate}%</div>
                    <div className={`card-trend ${data.monthSummary.deliveryTrend > 0 ? 'positive' : 'negative'}`}>
                        {data.monthSummary.deliveryTrend > 0 ? '↑' : '↓'} {Math.abs(data.monthSummary.deliveryTrend)}% vs last month
                    </div>
                </div>
            </div>

            {/* Member Growth Chart */}
            <div className="growth-section">
                <h2>Member Growth</h2>
                <p className="growth-stats">
                    <strong>{data.totalMembers}</strong> total members • <strong>+{data.newMembersThisMonth}</strong> this month
                </p>
                <div className="chart">
                    {data.growthData.map((item, index) => (
                        <div key={index} className="chart-bar">
                            <div className="bar" style={{ height: `${(item.count / 600) * 200}px` }}>
                                <span className="bar-value">{item.count}</span>
                            </div>
                            <span className="bar-label">{item.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Celebrations */}
            <div className="upcoming-section">
                <h2>Upcoming Celebrations</h2>
                <div className="upcoming-list">
                    {data.upcoming.map((event, index) => (
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
                    ))}
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

        h2 {
          font-family: Georgia, serif;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .growth-stats {
          color: #666;
          margin-bottom: 24px;
        }

        .chart {
          display: flex;
          align-items: flex-end;
          gap: 40px;
          height: 250px;
          padding: 20px 0;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
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

          .chart {
            gap: 20px;
          }
        }
      `}</style>
        </div>
    );
}