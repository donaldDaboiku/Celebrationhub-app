'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
    archiveCampaign,
    createCampaign,
    deleteCampaign,
    getCampaignDetails,
    getCampaigns,
    getCelebrations,
    getMembers,
    getOrganizationSettings,
    resendCelebration,
    resendFailedCampaign,
    sendCampaign,
    sendCelebrationNow,
} from '@/lib/api';

const initialManualForm = { member_id: '', type: 'birthday', message_text: '', send_now: true, scheduled_for: '' };
const initialCampaignForm = { name: '', message: '', type: 'sms', send_mode: 'all', member_ids: [], scheduled_for: '' };

const formatDateTime = (value) => {
    if (!value) return 'Not sent';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatChannel = (channel) => (channel === 'sms' ? 'SMS' : channel ? `${channel.charAt(0).toUpperCase()}${channel.slice(1)}` : 'Unknown');
const getMemberName = (member) => member?.full_name || [member?.title, member?.first_name, member?.last_name].filter(Boolean).join(' ') || 'Unknown member';

export default function MessageCenter() {
    const [members, setMembers] = useState([]);
    const [celebrations, setCelebrations] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);
    const [sending, setSending] = useState(false);
    const [resendingId, setResendingId] = useState(null);
    const [creatingCampaign, setCreatingCampaign] = useState(false);
    const [retryingCampaignId, setRetryingCampaignId] = useState(null);
    const [archivingCampaignId, setArchivingCampaignId] = useState(null);
    const [deletingCampaignId, setDeletingCampaignId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
    const [deliveryChannelFilter, setDeliveryChannelFilter] = useState('all');
    const [manualForm, setManualForm] = useState(initialManualForm);
    const [campaignForm, setCampaignForm] = useState(initialCampaignForm);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [channelStatus, setChannelStatus] = useState({
        email: { enabled: true, ready: false },
        sms: { enabled: false, ready: false },
        whatsapp: { enabled: false, ready: false },
    });

    const setFeedback = (type, text) => setMessage({ type, text });

    const loadData = async (status = statusFilter) => {
        setLoading(true);
        try {
            const [membersResponse, celebrationsResponse, settingsResponse, campaignsResponse] = await Promise.all([
                getMembers({ limit: 500 }),
                getCelebrations(status ? { status } : {}),
                getOrganizationSettings(),
                getCampaigns(),
            ]);

            const availableMembers = membersResponse.data.members || [];
            const settings = settingsResponse.data.settings || {};
            const messaging = settings.messaging || {};
            const integrations = settings.integrations || {};
            const sms = integrations.sms || {};
            const whatsapp = integrations.whatsapp || {};
            const nextCampaigns = campaignsResponse.data.data || [];

            setMembers(availableMembers);
            setCelebrations(celebrationsResponse.data.data || []);
            setCampaigns(nextCampaigns);
            setChannelStatus({
                email: { enabled: messaging.email_enabled ?? true, ready: Boolean(settingsResponse.data.email) },
                sms: { enabled: messaging.sms_enabled ?? false, ready: Boolean(sms.sender_id) },
                whatsapp: { enabled: messaging.whatsapp_enabled ?? false, ready: Boolean(whatsapp.sender_id || whatsapp.phone_number) },
            });
            setSelectedCampaignId((current) => current && nextCampaigns.some((campaign) => campaign.id === current) ? current : nextCampaigns[0]?.id ?? null);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to load message center.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    useEffect(() => {
        if (!selectedCampaignId) {
            setSelectedCampaign(null);
            return;
        }

        let active = true;
        const loadCampaignDetails = async () => {
            setLoadingCampaignDetails(true);
            try {
                const response = await getCampaignDetails(selectedCampaignId);
                if (active) setSelectedCampaign(response.data);
            } catch (error) {
                if (active) setFeedback('error', error.message || 'Failed to load campaign details.');
            } finally {
                if (active) setLoadingCampaignDetails(false);
            }
        };

        loadCampaignDetails();
        return () => { active = false; };
    }, [selectedCampaignId]);

    const selectedCampaignMembers = useMemo(
        () => members.filter((member) => campaignForm.member_ids.includes(member.id)),
        [campaignForm.member_ids, members]
    );

    const filteredDeliveryLogs = useMemo(
        () => (selectedCampaign?.logs || []).filter((log) => (
            (deliveryStatusFilter === 'all' || log.status === deliveryStatusFilter) &&
            (deliveryChannelFilter === 'all' || log.channel === deliveryChannelFilter)
        )),
        [deliveryChannelFilter, deliveryStatusFilter, selectedCampaign]
    );

    const handleSend = async (event) => {
        event.preventDefault();
        setSending(true);
        setFeedback('', '');
        try {
            await sendCelebrationNow({
                member_id: Number(manualForm.member_id),
                type: manualForm.type,
                message_text: manualForm.message_text || null,
                send_now: manualForm.send_now,
                scheduled_for: manualForm.send_now ? null : manualForm.scheduled_for || null,
            });
            setManualForm(initialManualForm);
            setFeedback('success', manualForm.send_now ? 'Celebration sent successfully.' : 'Celebration scheduled successfully.');
            await loadData();
        } catch (error) {
            setFeedback('error', error.message || 'Failed to send celebration.');
        } finally {
            setSending(false);
        }
    };

    const handleResend = async (celebrationId) => {
        setResendingId(celebrationId);
        setFeedback('', '');
        try {
            await resendCelebration(celebrationId);
            setFeedback('success', 'Celebration resent successfully.');
            await loadData();
        } catch (error) {
            setFeedback('error', error.message || 'Failed to resend celebration.');
        } finally {
            setResendingId(null);
        }
    };

    const toggleCampaignMember = (memberId) => {
        setCampaignForm((current) => ({
            ...current,
            member_ids: current.member_ids.includes(memberId) ? current.member_ids.filter((id) => id !== memberId) : [...current.member_ids, memberId],
        }));
    };

    const handleCreateCampaign = async (event) => {
        event.preventDefault();
        setCreatingCampaign(true);
        setFeedback('', '');
        try {
            if (campaignForm.send_mode === 'selected' && campaignForm.member_ids.length === 0) {
                throw new Error('Select at least one member for a selected-members campaign.');
            }

            const created = await createCampaign({
                name: campaignForm.name,
                message: campaignForm.message,
                type: campaignForm.type,
                scheduled_for: campaignForm.scheduled_for || null,
                filters: campaignForm.send_mode === 'selected' ? { member_ids: campaignForm.member_ids } : {},
            });

            const sent = await sendCampaign(created.data.id);
            setCampaignForm(initialCampaignForm);
            setSelectedCampaignId(sent.data.id);
            setFeedback('success', campaignForm.scheduled_for ? 'Campaign scheduled successfully.' : 'Bulk campaign sent successfully.');
            await loadData();
        } catch (error) {
            setFeedback('error', error.message || 'Failed to create bulk campaign.');
        } finally {
            setCreatingCampaign(false);
        }
    };

    const handleRetryFailedCampaign = async (campaignId) => {
        setRetryingCampaignId(campaignId);
        setFeedback('', '');
        try {
            const response = await resendFailedCampaign(campaignId);
            setFeedback('success', `Retry finished: ${response.data.sent} sent, ${response.data.failed} still failing.`);
            await loadData();
            if (selectedCampaignId === campaignId) {
                const campaignResponse = await getCampaignDetails(campaignId);
                setSelectedCampaign(campaignResponse.data);
            }
        } catch (error) {
            setFeedback('error', error.message || 'Failed to retry campaign recipients.');
        } finally {
            setRetryingCampaignId(null);
        }
    };

    const handleArchiveCampaign = async (campaignId) => {
        setArchivingCampaignId(campaignId);
        setFeedback('', '');
        try {
            await archiveCampaign(campaignId);
            setFeedback('success', 'Campaign archived successfully.');
            await loadData();

            if (selectedCampaignId === campaignId) {
                setSelectedCampaignId((current) => {
                    if (current !== campaignId) {
                        return current;
                    }

                    const remaining = campaigns.filter((campaign) => campaign.id !== campaignId);
                    return remaining[0]?.id ?? null;
                });
            }
        } catch (error) {
            setFeedback('error', error.message || 'Failed to archive campaign.');
        } finally {
            setArchivingCampaignId(null);
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        setDeletingCampaignId(campaignId);
        setFeedback('', '');
        try {
            await deleteCampaign(campaignId);
            setFeedback('success', 'Campaign deleted successfully.');
            await loadData();

            if (selectedCampaignId === campaignId) {
                setSelectedCampaignId((current) => {
                    if (current !== campaignId) {
                        return current;
                    }

                    const remaining = campaigns.filter((campaign) => campaign.id !== campaignId);
                    return remaining[0]?.id ?? null;
                });
            }
        } catch (error) {
            setFeedback('error', error.message || 'Failed to delete campaign.');
        } finally {
            setDeletingCampaignId(null);
        }
    };

    const estimatedRecipients = campaignForm.send_mode === 'all' ? members.length : selectedCampaignMembers.length;

    return (
        <div className="message-center">
            <div className="card hero">
                <div>
                    <p className="eyebrow">Messaging</p>
                    <h1>Send, resend, and broadcast</h1>
                    <p>Bulk campaigns now include recipient-level delivery details and retry for failed member/channel combinations.</p>
                </div>
                <div className="brand">
                    <Image src="/brand/celebrationhub-icon-192.png" alt="CelebrationHub icon" width={72} height={72} />
                    <div>
                        <strong>Campaign control</strong>
                        <p>Using the real web icon from your project assets.</p>
                    </div>
                </div>
            </div>

            <div className="channel-strip">
                <div className="card channel-card">
                    <strong>Email</strong>
                    <p>Primary path for delivery right now.</p>
                    <span className={`pill ${channelStatus.email.ready && channelStatus.email.enabled ? 'sent' : 'failed'}`}>
                        {channelStatus.email.ready && channelStatus.email.enabled ? 'Ready' : 'Needs email setup'}
                    </span>
                </div>
                <div className="card channel-card">
                    <strong>SMS</strong>
                    <p>Best channel for bulk alerts.</p>
                    <span className={`pill ${channelStatus.sms.enabled && channelStatus.sms.ready ? 'sent' : channelStatus.sms.enabled ? 'pending' : 'failed'}`}>
                        {channelStatus.sms.enabled && channelStatus.sms.ready ? 'Ready' : channelStatus.sms.enabled ? 'Enabled but incomplete' : 'Off'}
                    </span>
                </div>
                <div className="card channel-card">
                    <strong>WhatsApp</strong>
                    <p>Optional follow-up channel.</p>
                    <span className={`pill ${channelStatus.whatsapp.enabled && channelStatus.whatsapp.ready ? 'sent' : channelStatus.whatsapp.enabled ? 'pending' : 'failed'}`}>
                        {channelStatus.whatsapp.enabled && channelStatus.whatsapp.ready ? 'Ready' : channelStatus.whatsapp.enabled ? 'Enabled but incomplete' : 'Off'}
                    </span>
                </div>
            </div>

            {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}
            <div className="split">
                <section className="card section">
                    <h2>Manual send</h2>
                    <form className="form-grid" onSubmit={handleSend}>
                        <label className="field">
                            <span>Member</span>
                            <select value={manualForm.member_id} onChange={(event) => setManualForm({ ...manualForm, member_id: event.target.value })} required>
                                <option value="">Select a member</option>
                                {members.map((member) => <option key={member.id} value={member.id}>{getMemberName(member)}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Celebration type</span>
                            <select value={manualForm.type} onChange={(event) => setManualForm({ ...manualForm, type: event.target.value })}>
                                <option value="birthday">Birthday</option>
                                <option value="anniversary">Anniversary</option>
                            </select>
                        </label>
                        <label className="field checkbox">
                            <input type="checkbox" checked={manualForm.send_now} onChange={(event) => setManualForm({ ...manualForm, send_now: event.target.checked })} />
                            <span>Send immediately</span>
                        </label>
                        {!manualForm.send_now && (
                            <label className="field">
                                <span>Schedule for</span>
                                <input type="datetime-local" value={manualForm.scheduled_for} onChange={(event) => setManualForm({ ...manualForm, scheduled_for: event.target.value })} />
                            </label>
                        )}
                        <label className="field wide">
                            <span>Custom message override</span>
                            <textarea rows={4} value={manualForm.message_text} onChange={(event) => setManualForm({ ...manualForm, message_text: event.target.value })} placeholder="Leave blank to use your default message." />
                        </label>
                        <div className="actions wide">
                            <button className="primary" type="submit" disabled={sending}>{sending ? 'Sending...' : manualForm.send_now ? 'Send celebration' : 'Schedule celebration'}</button>
                        </div>
                    </form>
                </section>

                <section className="card section">
                    <div className="section-head">
                        <div>
                            <h2>Recent celebration sends</h2>
                            <p>Resend a missed birthday or anniversary quickly.</p>
                        </div>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    {loading ? <div className="empty">Loading celebration history...</div> : celebrations.length === 0 ? <div className="empty">No celebration sends found yet.</div> : (
                        <div className="stack">
                            {celebrations.map((celebration) => (
                                <article key={celebration.id} className="history-item">
                                    <div>
                                        <strong>{getMemberName(celebration.member)}</strong>
                                        <p>{celebration.type} • scheduled {formatDateTime(celebration.scheduled_for)}</p>
                                    </div>
                                    <div className="row">
                                        <span className={`pill ${celebration.status}`}>{celebration.status}</span>
                                        <button className="ghost" onClick={() => handleResend(celebration.id)} disabled={resendingId === celebration.id}>
                                            {resendingId === celebration.id ? 'Resending...' : 'Resend'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className="card section">
                <div className="section-head">
                    <div>
                        <h2>Bulk campaigns</h2>
                        <p>Send to all active members or a selected group.</p>
                    </div>
                    <div className="row">
                        <Image src="/brand/celebrationhub-icon-192.png" alt="" width={36} height={36} className="mini-icon" />
                        <span className="pill pending">{estimatedRecipients} recipient{estimatedRecipients === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <form className="form-grid" onSubmit={handleCreateCampaign}>
                    <label className="field">
                        <span>Campaign name</span>
                        <input value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} placeholder="Sunday reminder" required />
                    </label>
                    <label className="field">
                        <span>Channel</span>
                        <select value={campaignForm.type} onChange={(event) => setCampaignForm({ ...campaignForm, type: event.target.value })}>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="all">All channels</option>
                        </select>
                    </label>
                    <label className="field">
                        <span>Audience</span>
                        <select value={campaignForm.send_mode} onChange={(event) => setCampaignForm({ ...campaignForm, send_mode: event.target.value, member_ids: [] })}>
                            <option value="all">All active + approved members</option>
                            <option value="selected">Selected members only</option>
                        </select>
                    </label>
                    <label className="field">
                        <span>Schedule time</span>
                        <input type="datetime-local" value={campaignForm.scheduled_for} onChange={(event) => setCampaignForm({ ...campaignForm, scheduled_for: event.target.value })} />
                    </label>
                    <label className="field wide">
                        <span>Message</span>
                        <textarea rows={4} value={campaignForm.message} onChange={(event) => setCampaignForm({ ...campaignForm, message: event.target.value })} placeholder="Use placeholders like {{first_name}} or {{name}}." required />
                    </label>
                    {campaignForm.send_mode === 'selected' && (
                        <div className="member-picker wide">
                            <div className="section-head">
                                <strong>Select recipients</strong>
                                <span>{selectedCampaignMembers.length} selected</span>
                            </div>
                            <div className="member-list">
                                {members.map((member) => (
                                    <label key={member.id} className="member-option">
                                        <input type="checkbox" checked={campaignForm.member_ids.includes(member.id)} onChange={() => toggleCampaignMember(member.id)} />
                                        <span>{getMemberName(member)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="actions wide">
                        <button className="primary" type="submit" disabled={creatingCampaign}>
                            {creatingCampaign ? 'Sending...' : campaignForm.scheduled_for ? 'Create and schedule campaign' : 'Create and send campaign'}
                        </button>
                    </div>
                </form>
            </section>

            <div className="split">
                <section className="card section">
                    <h2>Campaign history</h2>
                    {loading ? <div className="empty">Loading campaigns...</div> : campaigns.length === 0 ? <div className="empty">No bulk campaigns yet.</div> : (
                        <div className="stack">
                            {campaigns.map((campaign) => (
                                <article key={campaign.id} className={`history-item ${selectedCampaignId === campaign.id ? 'active' : ''}`}>
                                    <div>
                                        <strong>{campaign.name}</strong>
                                        <p>{formatChannel(campaign.type)} • {campaign.recipient_count} recipients</p>
                                        <p>{campaign.sent_count} sent • {campaign.failed_count} failed</p>
                                    </div>
                                    <div className="actions-inline">
                                        <span className={`pill ${campaign.status === 'completed' ? 'sent' : campaign.status === 'scheduled' ? 'pending' : 'failed'}`}>{campaign.status}</span>
                                        <button className="ghost" onClick={() => setSelectedCampaignId(campaign.id)}>{selectedCampaignId === campaign.id ? 'Viewing' : 'View details'}</button>
                                        {campaign.failed_count > 0 && (
                                            <button className="ghost warm" onClick={() => handleRetryFailedCampaign(campaign.id)} disabled={retryingCampaignId === campaign.id}>
                                                {retryingCampaignId === campaign.id ? 'Retrying...' : 'Retry failed'}
                                            </button>
                                        )}
                                        <button className="ghost" onClick={() => handleArchiveCampaign(campaign.id)} disabled={archivingCampaignId === campaign.id}>
                                            {archivingCampaignId === campaign.id ? 'Archiving...' : 'Archive'}
                                        </button>
                                        <button className="ghost danger" onClick={() => handleDeleteCampaign(campaign.id)} disabled={deletingCampaignId === campaign.id}>
                                            {deletingCampaignId === campaign.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="card section">
                    <div className="section-head">
                        <div>
                            <h2>Delivery details</h2>
                            <p>See who failed and why.</p>
                        </div>
                        {selectedCampaign && (
                            <div className="row">
                                <select value={deliveryChannelFilter} onChange={(event) => setDeliveryChannelFilter(event.target.value)}>
                                    <option value="all">All channels</option>
                                    {(selectedCampaign.delivery_summary?.channels || []).map((channel) => <option key={channel} value={channel}>{formatChannel(channel)}</option>)}
                                </select>
                                <select value={deliveryStatusFilter} onChange={(event) => setDeliveryStatusFilter(event.target.value)}>
                                    <option value="all">All statuses</option>
                                    <option value="sent">Sent</option>
                                    <option value="failed">Failed</option>
                                    <option value="queued">Queued</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                        )}
                    </div>
                    {loadingCampaignDetails ? <div className="empty">Loading delivery details...</div> : !selectedCampaign ? <div className="empty">Select a campaign to inspect logs.</div> : (
                        <div className="stack">
                            <div className="detail-card">
                                <div className="row top">
                                    <Image src="/brand/celebrationhub-icon-192.png" alt="" width={72} height={72} className="mini-icon large" />
                                    <div>
                                        <strong>{selectedCampaign.name}</strong>
                                        <p>{formatChannel(selectedCampaign.type)} • {selectedCampaign.recipient_count} recipients</p>
                                        <p>{selectedCampaign.sent_count} sent • {selectedCampaign.failed_count} failed</p>
                                    </div>
                                </div>
                                <div className="summary-row">
                                    {Object.entries(selectedCampaign.delivery_summary?.per_channel || {}).map(([channel, counts]) => (
                                        <div key={channel} className="summary-box">
                                            <strong>{formatChannel(channel)}</strong>
                                            <p>{counts.sent} sent</p>
                                            <p>{counts.failed} failed</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedCampaign.failed_count > 0 && (
                                <div className="retry-box">
                                    <div>
                                        <strong>Retry failed recipients</strong>
                                        <p>Only the latest failed member/channel combinations are retried.</p>
                                    </div>
                                    <button className="primary" onClick={() => handleRetryFailedCampaign(selectedCampaign.id)} disabled={retryingCampaignId === selectedCampaign.id}>
                                        {retryingCampaignId === selectedCampaign.id ? 'Retrying...' : 'Retry failed recipients'}
                                    </button>
                                </div>
                            )}
                            {filteredDeliveryLogs.length === 0 ? <div className="empty">No delivery logs match these filters.</div> : (
                                <div className="stack">
                                    {filteredDeliveryLogs.map((log) => (
                                        <article key={log.id} className="history-item">
                                            <div>
                                                <strong>{getMemberName(log.member)}</strong>
                                                <p>{formatChannel(log.channel)} • {formatDateTime(log.sent_at || log.created_at)}</p>
                                                <p>{log.error_message || 'Delivered without an error message.'}</p>
                                            </div>
                                            <span className={`pill ${log.status === 'delivered' ? 'sent' : log.status}`}>{log.status}</span>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
                .message-center { display: grid; gap: 20px; }
                .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 24px; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06); }
                .hero, .section, .channel-card { padding: 24px; }
                .hero { display: flex; justify-content: space-between; gap: 20px; background: linear-gradient(135deg, rgba(249,115,22,.12), rgba(29,78,216,.08)); }
                .channel-strip, .split, .form-grid, .member-list, .summary-row { display: grid; }
                .channel-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
                .split { grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                .member-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-height: 220px; overflow: auto; }
                .summary-row { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
                .brand, .row, .actions, .actions-inline, .section-head, .history-item, .retry-box { display: flex; gap: 12px; }
                .section-head, .history-item, .retry-box { justify-content: space-between; align-items: flex-start; }
                .field { display: flex; flex-direction: column; gap: 8px; }
                .field span, .eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
                .eyebrow { color: #c2410c; }
                .wide { grid-column: 1 / -1; }
                input, select, textarea { width: 100%; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; font-size: 14px; }
                .checkbox { flex-direction: row; align-items: center; border: 1px solid #dbe4f0; border-radius: 14px; padding: 12px 14px; }
                .checkbox input, .member-option input { width: auto; }
                .member-picker, .detail-card, .summary-box { border: 1px solid #e5e7eb; border-radius: 18px; padding: 16px; }
                .member-option { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border: 1px solid #eef2f7; border-radius: 12px; }
                .detail-card { background: linear-gradient(135deg, rgba(29,78,216,.05), rgba(249,115,22,.05)); }
                .summary-box { background: #fff; }
                .retry-box { align-items: center; padding: 16px; border: 1px solid #fed7aa; border-radius: 18px; background: #fff7ed; }
                .stack { display: grid; gap: 12px; }
                .history-item { padding: 16px; border: 1px solid #eef2f7; border-radius: 18px; }
                .history-item.active { border-color: rgba(29, 78, 216, 0.3); }
                .notice { padding: 14px 16px; border-radius: 18px; font-weight: 600; }
                .notice.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                .notice.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
                .pill.pending { background: #fff7ed; color: #c2410c; }
                .pill.sent { background: #ecfdf5; color: #047857; }
                .pill.failed { background: #fef2f2; color: #b91c1c; }
                .pill.queued { background: #eff6ff; color: #1d4ed8; }
                .primary, .ghost { border: none; border-radius: 999px; padding: 12px 16px; font-size: 14px; font-weight: 700; cursor: pointer; }
                .primary { background: linear-gradient(135deg, #1d4ed8, #f97316); color: white; }
                .ghost { background: #eff6ff; color: #1d4ed8; }
                .ghost.warm { background: #fff7ed; color: #c2410c; }
                .ghost.danger { background: #fef2f2; color: #b91c1c; }
                .mini-icon { width: 36px; height: 36px; border-radius: 12px; }
                .mini-icon.large, .brand img { width: 72px; height: 72px; border-radius: 18px; }
                .empty { padding: 24px; text-align: center; color: #64748b; }
                @media (max-width: 960px) {
                    .hero, .brand, .section-head, .history-item, .retry-box, .actions-inline { flex-direction: column; }
                    .channel-strip, .split, .form-grid, .member-list, .summary-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
