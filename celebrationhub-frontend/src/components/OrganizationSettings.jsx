'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import {
    getOrganizationSettings,
    removeOrganizationLogo,
    updateOrganizationMessageTemplates,
    updateOrganizationSettings,
    uploadOrganizationLogo,
} from '@/lib/api';

const defaultSettings = {
    name: '',
    email: '',
    phone: '',
    logo_url: '',
    timezone: 'Africa/Lagos',
    send_time: '06:00',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    department_label: 'Department',
    designation_label: 'Designation',
    unit_label: 'Unit',
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    primary_channel: 'email',
    email_mailer: 'smtp',
    email_host: '',
    email_port: '587',
    email_username: '',
    email_password: '',
    email_encryption: 'tls',
    email_from_address: '',
    email_from_name: '',
    sms_sender_id: '',
    sms_provider: 'termii',
    whatsapp_sender_id: '',
    whatsapp_provider: 'termii',
    whatsapp_phone_number: '',
    facebook_page_url: '',
    instagram_handle: '',
    x_handle: '',
    youtube_url: '',
    telegram_link: '',
    tiktok_handle: '',
    website_url: '',
    birthday_template: '',
    anniversary_template: '',
    custom_signature: '',
};

const getStatus = (enabled, configured) => {
    if (!enabled) return { label: 'Off', tone: 'muted' };
    if (configured) return { label: 'Ready', tone: 'success' };
    return { label: 'Needs setup', tone: 'warning' };
};

export default function OrganizationSettings() {
    const [form, setForm] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingMessages, setSavingMessages] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [removingLogo, setRemovingLogo] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadSettings = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await getOrganizationSettings();
            const data = response.data;
            const settings = data.settings || {};
            const branding = settings.branding || {};
            const messaging = settings.messaging || {};
            const messages = settings.messages || {};
            const integrations = settings.integrations || {};
            const memberFields = settings.member_fields || {};
            const emailIntegration = integrations.email || {};
            const sms = integrations.sms || {};
            const whatsapp = integrations.whatsapp || {};
            const socials = settings.socials || {};

            setForm({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                logo_url: data.logo_url || '',
                timezone: settings.timezone || 'Africa/Lagos',
                send_time: settings.send_time || '06:00',
                primary_color: branding.primary_color || '#667eea',
                secondary_color: branding.secondary_color || '#764ba2',
                department_label: memberFields.department_label || 'Department',
                designation_label: memberFields.designation_label || 'Designation',
                unit_label: memberFields.unit_label || 'Unit',
                email_enabled: messaging.email_enabled ?? true,
                sms_enabled: messaging.sms_enabled ?? false,
                whatsapp_enabled: messaging.whatsapp_enabled ?? false,
                primary_channel: messaging.primary_channel || 'email',
                email_mailer: emailIntegration.mailer || 'smtp',
                email_host: emailIntegration.host || '',
                email_port: String(emailIntegration.port || 587),
                email_username: emailIntegration.username || '',
                email_password: emailIntegration.password || '',
                email_encryption: emailIntegration.encryption || 'tls',
                email_from_address: emailIntegration.from_address || data.email || '',
                email_from_name: emailIntegration.from_name || data.name || '',
                sms_sender_id: sms.sender_id || '',
                sms_provider: sms.provider || 'termii',
                whatsapp_sender_id: whatsapp.sender_id || '',
                whatsapp_provider: whatsapp.provider || 'termii',
                whatsapp_phone_number: whatsapp.phone_number || '',
                facebook_page_url: socials.facebook_page_url || '',
                instagram_handle: socials.instagram_handle || '',
                x_handle: socials.x_handle || '',
                youtube_url: socials.youtube_url || '',
                telegram_link: socials.telegram_link || '',
                tiktok_handle: socials.tiktok_handle || '',
                website_url: socials.website_url || '',
                birthday_template: messages.birthday_template || '',
                anniversary_template: messages.anniversary_template || '',
                custom_signature: messages.custom_signature || '',
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const saveProfile = async () => {
        setSavingProfile(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await updateOrganizationSettings({
                name: form.name,
                email: form.email,
                phone: form.phone,
                settings: {
                    timezone: form.timezone,
                    send_time: form.send_time,
                    branding: {
                        primary_color: form.primary_color,
                        secondary_color: form.secondary_color,
                    },
                    member_fields: {
                        department_label: form.department_label,
                        designation_label: form.designation_label,
                        unit_label: form.unit_label,
                    },
                    messaging: {
                        email_enabled: form.email_enabled,
                        sms_enabled: form.sms_enabled,
                        whatsapp_enabled: form.whatsapp_enabled,
                        primary_channel: form.primary_channel,
                    },
                    integrations: {
                        email: {
                            mailer: form.email_mailer,
                            host: form.email_host,
                            port: Number(form.email_port) || 587,
                            username: form.email_username,
                            password: form.email_password,
                            encryption: form.email_encryption,
                            from_address: form.email_from_address,
                            from_name: form.email_from_name,
                        },
                        sms: {
                            provider: form.sms_provider,
                            sender_id: form.sms_sender_id,
                        },
                        whatsapp: {
                            provider: form.whatsapp_provider,
                            sender_id: form.whatsapp_sender_id,
                            phone_number: form.whatsapp_phone_number,
                        },
                    },
                    socials: {
                        facebook_page_url: form.facebook_page_url,
                        instagram_handle: form.instagram_handle,
                        x_handle: form.x_handle,
                        youtube_url: form.youtube_url,
                        telegram_link: form.telegram_link,
                        tiktok_handle: form.tiktok_handle,
                        website_url: form.website_url,
                    },
                },
            });
            const data = response.data;
            const settings = data.settings || {};
            const branding = settings.branding || {};
            const messaging = settings.messaging || {};
            const integrations = settings.integrations || {};
            const memberFields = settings.member_fields || {};
            const emailIntegration = integrations.email || {};
            const sms = integrations.sms || {};
            const whatsapp = integrations.whatsapp || {};
            const socials = settings.socials || {};

            setForm((current) => ({
                ...current,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                logo_url: data.logo_url || current.logo_url,
                timezone: settings.timezone || current.timezone,
                send_time: settings.send_time || current.send_time,
                primary_color: branding.primary_color || current.primary_color,
                secondary_color: branding.secondary_color || current.secondary_color,
                department_label: memberFields.department_label || current.department_label,
                designation_label: memberFields.designation_label || current.designation_label,
                unit_label: memberFields.unit_label || current.unit_label,
                email_enabled: messaging.email_enabled ?? current.email_enabled,
                sms_enabled: messaging.sms_enabled ?? current.sms_enabled,
                whatsapp_enabled: messaging.whatsapp_enabled ?? current.whatsapp_enabled,
                primary_channel: messaging.primary_channel || current.primary_channel,
                email_mailer: emailIntegration.mailer || 'smtp',
                email_host: emailIntegration.host || '',
                email_port: String(emailIntegration.port || current.email_port || 587),
                email_username: emailIntegration.username || '',
                email_password: emailIntegration.password || '',
                email_encryption: emailIntegration.encryption || 'tls',
                email_from_address: emailIntegration.from_address || data.email || '',
                email_from_name: emailIntegration.from_name || data.name || '',
                sms_sender_id: sms.sender_id || '',
                sms_provider: sms.provider || 'termii',
                whatsapp_sender_id: whatsapp.sender_id || '',
                whatsapp_provider: whatsapp.provider || 'termii',
                whatsapp_phone_number: whatsapp.phone_number || '',
                facebook_page_url: socials.facebook_page_url || '',
                instagram_handle: socials.instagram_handle || '',
                x_handle: socials.x_handle || '',
                youtube_url: socials.youtube_url || '',
                telegram_link: socials.telegram_link || '',
                tiktok_handle: socials.tiktok_handle || '',
                website_url: socials.website_url || '',
            }));
            setMessage({ type: 'success', text: 'Organization settings saved successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to save organization settings.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const saveMessages = async () => {
        setSavingMessages(true);
        setMessage({ type: '', text: '' });

        try {
            await updateOrganizationMessageTemplates({
                birthday_template: form.birthday_template,
                anniversary_template: form.anniversary_template,
                custom_signature: form.custom_signature,
            });
            setMessage({ type: 'success', text: 'Message templates updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to save message templates.' });
        } finally {
            setSavingMessages(false);
        }
    };

    const uploadLogo = async () => {
        if (!logoFile) {
            setMessage({ type: 'error', text: 'Choose a logo file before uploading.' });
            return;
        }

        setUploadingLogo(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await uploadOrganizationLogo(logoFile);
            setForm((current) => ({ ...current, logo_url: response.data.logo_url }));
            setLogoFile(null);
            setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload logo.' });
        } finally {
            setUploadingLogo(false);
        }
    };

    const clearLogo = async () => {
        setRemovingLogo(true);
        setMessage({ type: '', text: '' });

        try {
            await removeOrganizationLogo();
            setForm((current) => ({ ...current, logo_url: '' }));
            setLogoFile(null);
            setMessage({ type: 'success', text: 'Logo removed successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to remove logo.' });
        } finally {
            setRemovingLogo(false);
        }
    };

    const channelStatuses = useMemo(() => ({
        email: getStatus(form.email_enabled, Boolean(form.email_host && form.email_username && form.email_from_address)),
        sms: getStatus(form.sms_enabled, Boolean(form.sms_sender_id)),
        whatsapp: getStatus(form.whatsapp_enabled, Boolean(form.whatsapp_sender_id || form.whatsapp_phone_number)),
    }), [form]);

    if (loading) {
        return <div className="card loading">Loading organization settings...</div>;
    }

    return (
        <div className="settings-page">
            <div className="card hero">
                <div>
                    <p className="eyebrow">Organization</p>
                    <h1>Settings</h1>
                    <p>Email is the primary delivery path for now. SMTP, SMS, WhatsApp, Facebook, and other channels can all be configured here as you grow.</p>
                </div>
                <div className="preview" style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})` }}>
                    {form.logo_url ? <img src={form.logo_url} alt="Organization logo" /> : <span>{form.name?.[0] || 'C'}</span>}
                </div>
            </div>

            {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

            <section className="status-grid">
                {[
                    { label: 'Email', helper: 'Primary channel right now', status: channelStatuses.email },
                    { label: 'SMS', helper: 'Future-ready via Termii', status: channelStatuses.sms },
                    { label: 'WhatsApp', helper: 'Future-ready via Termii or Meta later', status: channelStatuses.whatsapp },
                ].map((item) => (
                    <div key={item.label} className="card status-card">
                        <div>
                            <strong>{item.label}</strong>
                            <p>{item.helper}</p>
                        </div>
                        <span className={`pill ${item.status.tone}`}>{item.status.label}</span>
                    </div>
                ))}
            </section>

            <div className="grid">
                <section className="card section">
                    <h2>Profile and branding</h2>
                    <div className="form-grid">
                        <label className="field">
                            <span>Organization name</span>
                            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Organization name" />
                        </label>
                        <label className="field">
                            <span>Organization email</span>
                            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Organization email" />
                        </label>
                        <label className="field">
                            <span>Phone number</span>
                            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" />
                        </label>
                        <label className="field">
                            <span>Timezone</span>
                            <input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} placeholder="Timezone" />
                        </label>
                        <label className="field">
                            <span>Daily send time</span>
                            <input type="time" value={form.send_time} onChange={(event) => setForm({ ...form, send_time: event.target.value })} />
                        </label>
                        <label className="field">
                            <span>Primary delivery channel</span>
                            <select value={form.primary_channel} onChange={(event) => setForm({ ...form, primary_channel: event.target.value })}>
                                <option value="email">Email first</option>
                                <option value="sms">SMS first</option>
                                <option value="whatsapp">WhatsApp first</option>
                            </select>
                        </label>
                        <div className="palette-row">
                            <label className="field">
                                <span>Primary color</span>
                                <input type="color" value={form.primary_color} onChange={(event) => setForm({ ...form, primary_color: event.target.value })} />
                            </label>
                            <label className="field">
                                <span>Secondary color</span>
                                <input type="color" value={form.secondary_color} onChange={(event) => setForm({ ...form, secondary_color: event.target.value })} />
                            </label>
                        </div>
                        <label className="check"><input type="checkbox" checked={form.email_enabled} onChange={(event) => setForm({ ...form, email_enabled: event.target.checked })} />Email enabled</label>
                        <label className="check"><input type="checkbox" checked={form.sms_enabled} onChange={(event) => setForm({ ...form, sms_enabled: event.target.checked })} />SMS enabled</label>
                        <label className="check"><input type="checkbox" checked={form.whatsapp_enabled} onChange={(event) => setForm({ ...form, whatsapp_enabled: event.target.checked })} />WhatsApp enabled</label>
                    </div>
                    <div className="actions">
                        <button className="primary" onClick={saveProfile} disabled={savingProfile}>
                            {savingProfile ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </section>

                <section className="card section">
                    <h2>Logo</h2>
                    <p className="muted">Upload a JPG or PNG logo for your organization profile.</p>
                    <div className="logo-box">
                        {form.logo_url ? <img src={form.logo_url} alt="Current organization logo" /> : <span>No logo uploaded yet</span>}
                    </div>
                    <div className="upload-row">
                        <input type="file" accept=".jpg,.jpeg,.png" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
                        <button className="primary" onClick={uploadLogo} disabled={uploadingLogo}>
                            {uploadingLogo ? 'Uploading...' : form.logo_url ? 'Replace Logo' : 'Upload Logo'}
                        </button>
                        {form.logo_url && (
                            <button className="ghost" onClick={clearLogo} disabled={removingLogo}>
                                {removingLogo ? 'Removing...' : 'Remove Logo'}
                            </button>
                        )}
                    </div>
                    {logoFile && <p className="muted">{logoFile.name}</p>}
                </section>
            </div>

            <section className="card section">
                <h2>Email configuration</h2>
                <p className="muted">Add SMTP details here so celebration emails and bulk email campaigns can use your organization mailbox instead of only the server default.</p>
                <div className="form-grid">
                    <label className="field">
                        <span>Mailer</span>
                        <input value={form.email_mailer} onChange={(event) => setForm({ ...form, email_mailer: event.target.value })} placeholder="smtp" />
                    </label>
                    <label className="field">
                        <span>SMTP host</span>
                        <input value={form.email_host} onChange={(event) => setForm({ ...form, email_host: event.target.value })} placeholder="smtp.hostinger.com" />
                    </label>
                    <label className="field">
                        <span>SMTP port</span>
                        <input value={form.email_port} onChange={(event) => setForm({ ...form, email_port: event.target.value })} placeholder="587" />
                    </label>
                    <label className="field">
                        <span>Encryption</span>
                        <select value={form.email_encryption} onChange={(event) => setForm({ ...form, email_encryption: event.target.value })}>
                            <option value="tls">TLS</option>
                            <option value="ssl">SSL</option>
                            <option value="">None</option>
                        </select>
                    </label>
                    <label className="field">
                        <span>SMTP username</span>
                        <input value={form.email_username} onChange={(event) => setForm({ ...form, email_username: event.target.value })} placeholder="noreply@yourorg.org" />
                    </label>
                    <label className="field">
                        <span>SMTP password</span>
                        <input type="password" value={form.email_password} onChange={(event) => setForm({ ...form, email_password: event.target.value })} placeholder="SMTP password" />
                    </label>
                    <label className="field">
                        <span>From email</span>
                        <input type="email" value={form.email_from_address} onChange={(event) => setForm({ ...form, email_from_address: event.target.value })} placeholder="noreply@yourorg.org" />
                    </label>
                    <label className="field">
                        <span>From name</span>
                        <input value={form.email_from_name} onChange={(event) => setForm({ ...form, email_from_name: event.target.value })} placeholder="CelebrationHub" />
                    </label>
                </div>
                <div className="actions">
                    <button className="primary" onClick={saveProfile} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Email Settings'}
                    </button>
                </div>
            </section>

            <section className="card section">
                <h2>Channel setup</h2>
                <p className="muted">Email stays primary. Add sender IDs and provider hints now so SMS and WhatsApp are ready when you decide to switch them on.</p>
                <div className="form-grid">
                    <label className="field">
                        <span>SMS provider</span>
                        <input value={form.sms_provider} onChange={(event) => setForm({ ...form, sms_provider: event.target.value })} placeholder="termii" />
                    </label>
                    <label className="field">
                        <span>SMS sender ID</span>
                        <input value={form.sms_sender_id} onChange={(event) => setForm({ ...form, sms_sender_id: event.target.value })} placeholder="Your sender ID" />
                    </label>
                    <label className="field">
                        <span>WhatsApp provider</span>
                        <input value={form.whatsapp_provider} onChange={(event) => setForm({ ...form, whatsapp_provider: event.target.value })} placeholder="termii or meta" />
                    </label>
                    <label className="field">
                        <span>WhatsApp sender ID</span>
                        <input value={form.whatsapp_sender_id} onChange={(event) => setForm({ ...form, whatsapp_sender_id: event.target.value })} placeholder="Sender ID or business name" />
                    </label>
                    <label className="field wide">
                        <span>WhatsApp business phone</span>
                        <input value={form.whatsapp_phone_number} onChange={(event) => setForm({ ...form, whatsapp_phone_number: event.target.value })} placeholder="+234..." />
                    </label>
                </div>
            </section>

            <section className="card section">
                <h2>Member field labels</h2>
                <p className="muted">Rename member fields to fit your organization. For example: school = Class, Role, House. Company = Department, Job Title, Team.</p>
                <div className="form-grid">
                    <label className="field">
                        <span>First grouping label</span>
                        <input value={form.department_label} onChange={(event) => setForm({ ...form, department_label: event.target.value })} placeholder="Department or Class" />
                    </label>
                    <label className="field">
                        <span>Second grouping label</span>
                        <input value={form.designation_label} onChange={(event) => setForm({ ...form, designation_label: event.target.value })} placeholder="Designation or Role" />
                    </label>
                    <label className="field wide">
                        <span>Third grouping label</span>
                        <input value={form.unit_label} onChange={(event) => setForm({ ...form, unit_label: event.target.value })} placeholder="Unit, Team, House, or Arm" />
                    </label>
                </div>
                <div className="actions">
                    <button className="primary" onClick={saveProfile} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Member Labels'}
                    </button>
                </div>
            </section>

            <section className="card section">
                <h2>Social presence</h2>
                <p className="muted">These links do not send messages yet, but they are stored now so the social media layer can be connected later without redesign.</p>
                <div className="form-grid">
                    <label className="field">
                        <span>Facebook page URL</span>
                        <input value={form.facebook_page_url} onChange={(event) => setForm({ ...form, facebook_page_url: event.target.value })} placeholder="https://facebook.com/yourpage" />
                    </label>
                    <label className="field">
                        <span>Instagram handle</span>
                        <input value={form.instagram_handle} onChange={(event) => setForm({ ...form, instagram_handle: event.target.value })} placeholder="@yourministry" />
                    </label>
                    <label className="field">
                        <span>X handle</span>
                        <input value={form.x_handle} onChange={(event) => setForm({ ...form, x_handle: event.target.value })} placeholder="@yourorg" />
                    </label>
                    <label className="field">
                        <span>YouTube URL</span>
                        <input value={form.youtube_url} onChange={(event) => setForm({ ...form, youtube_url: event.target.value })} placeholder="https://youtube.com/..." />
                    </label>
                    <label className="field">
                        <span>Telegram link</span>
                        <input value={form.telegram_link} onChange={(event) => setForm({ ...form, telegram_link: event.target.value })} placeholder="https://t.me/..." />
                    </label>
                    <label className="field">
                        <span>TikTok handle</span>
                        <input value={form.tiktok_handle} onChange={(event) => setForm({ ...form, tiktok_handle: event.target.value })} placeholder="@yourorg" />
                    </label>
                    <label className="field wide">
                        <span>Website URL</span>
                        <input value={form.website_url} onChange={(event) => setForm({ ...form, website_url: event.target.value })} placeholder="https://yourorg.org" />
                    </label>
                </div>
            </section>

            <section className="card section">
                <h2>Celebration messages</h2>
                <div className="form-grid single">
                    <label className="field">
                        <span>Birthday message template</span>
                        <textarea rows={4} value={form.birthday_template} onChange={(event) => setForm({ ...form, birthday_template: event.target.value })} placeholder="Birthday message template" />
                    </label>
                    <label className="field">
                        <span>Anniversary message template</span>
                        <textarea rows={4} value={form.anniversary_template} onChange={(event) => setForm({ ...form, anniversary_template: event.target.value })} placeholder="Anniversary message template" />
                    </label>
                    <label className="field">
                        <span>Custom signature</span>
                        <textarea rows={3} value={form.custom_signature} onChange={(event) => setForm({ ...form, custom_signature: event.target.value })} placeholder="Custom signature" />
                    </label>
                </div>
                <div className="actions">
                    <button className="primary" onClick={saveMessages} disabled={savingMessages}>
                        {savingMessages ? 'Saving...' : 'Save Message Templates'}
                    </button>
                </div>
            </section>

            <style jsx>{`
                .settings-page { display: grid; gap: 20px; }
                .card { background: white; border: 1px solid #e5e7eb; border-radius: 24px; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06); }
                .hero, .section, .status-card { padding: 24px; }
                .hero { display: flex; justify-content: space-between; gap: 20px; align-items: center; background: linear-gradient(135deg, rgba(29,78,216,.08), rgba(118,75,162,.12)); }
                .eyebrow { margin-bottom: 8px; color: #1d4ed8; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
                h1, h2 { margin-bottom: 8px; }
                p, .muted { color: #64748b; }
                .notice { padding: 14px 16px; border-radius: 18px; font-weight: 600; }
                .notice.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                .notice.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .status-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
                .status-card { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
                .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                .preview, .logo-box { width: 120px; height: 120px; border-radius: 28px; display: flex; align-items: center; justify-content: center; overflow: hidden; color: white; font-size: 42px; font-weight: 700; }
                .preview img, .logo-box img { width: 100%; height: 100%; object-fit: cover; }
                .logo-box { width: 100%; max-width: 260px; background: #f8fafc; color: #64748b; font-size: 14px; }
                .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
                .single { grid-template-columns: 1fr; }
                .field { display: flex; flex-direction: column; gap: 8px; }
                .field span { color: #334155; font-size: 13px; font-weight: 700; }
                input, textarea, select { width: 100%; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; font-size: 14px; }
                .palette-row { display: flex; gap: 12px; align-items: stretch; }
                .palette-row .field { flex: 1; }
                .palette-row input { padding: 0; height: 44px; }
                .check { display: flex; gap: 8px; align-items: center; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; color: #334155; }
                .check input { width: auto; }
                .actions, .upload-row { display: flex; gap: 10px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
                .pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
                .pill.success { background: #ecfdf5; color: #047857; }
                .pill.warning { background: #fff7ed; color: #c2410c; }
                .pill.muted { background: #f1f5f9; color: #475569; }
                .primary { border: none; border-radius: 999px; padding: 12px 16px; background: linear-gradient(135deg, #1d4ed8, #764ba2); color: white; font-weight: 700; cursor: pointer; }
                .primary:disabled { opacity: .6; cursor: not-allowed; }
                .ghost { border: 1px solid #e2e8f0; border-radius: 999px; padding: 12px 16px; background: #fff; color: #b91c1c; font-weight: 700; cursor: pointer; }
                .ghost:disabled { opacity: .6; cursor: not-allowed; }
                .loading { padding: 26px; color: #64748b; }
                @media (max-width: 960px) {
                    .status-grid, .grid, .form-grid { grid-template-columns: 1fr; }
                    .hero, .actions, .upload-row, .status-card { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
}
