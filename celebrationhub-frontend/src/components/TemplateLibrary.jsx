'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import {
    createTemplate,
    deleteTemplate,
    getTemplates,
    setDefaultTemplate,
    updateTemplate,
} from '@/lib/api';

const emptyForm = {
    name: '',
    type: 'birthday',
    description: '',
    preview_url: '',
    background_url: '',
};

function TemplatePreview({ template, large = false }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = template.preview_url || template.background_url || '';
    const accentClass = template.type === 'birthday' ? 'birthday' : 'anniversary';

    return (
        <div className={`preview-shell ${large ? 'large' : ''} ${accentClass}`}>
            {imageUrl && !imageFailed && (
                <img
                    src={imageUrl}
                    alt={template.name}
                    onError={() => setImageFailed(true)}
                />
            )}
            <div className="fallback">
                <span className="fallback-type">{template.type}</span>
                <strong>{template.name}</strong>
                <p>{template.description || 'Celebration template preview'}</p>
            </div>
        </div>
    );
}

export default function TemplateLibrary() {
    const [templates, setTemplates] = useState([]);
    const [defaults, setDefaults] = useState({ birthday: null, anniversary: null });
    const [activeTab, setActiveTab] = useState('birthday');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadTemplates = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await getTemplates();
            setTemplates(response.templates || []);
            setDefaults(response.currentDefaults || { birthday: null, anniversary: null });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to load templates.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const filteredTemplates = useMemo(
        () => templates.filter((template) => template.type === activeTab),
        [templates, activeTab]
    );

    const openCreateForm = () => {
        setEditingTemplate(null);
        setForm({ ...emptyForm, type: activeTab });
        setShowForm(true);
    };

    const openEditForm = (template) => {
        setEditingTemplate(template);
        setForm({
            name: template.name || '',
            type: template.type || activeTab,
            description: template.description || '',
            preview_url: template.preview_url || '',
            background_url: template.background_url || '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingTemplate(null);
        setForm(emptyForm);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, form);
                setMessage({ type: 'success', text: 'Template updated successfully.' });
            } else {
                await createTemplate(form);
                setMessage({ type: 'success', text: 'Template created successfully.' });
            }

            closeForm();
            await loadTemplates();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to save template.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm(`Delete "${template.name}"?`)) {
            return;
        }

        try {
            await deleteTemplate(template.id);
            setMessage({ type: 'success', text: 'Template deleted successfully.' });
            await loadTemplates();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete template.' });
        }
    };

    const handleSetDefault = async (template) => {
        try {
            await setDefaultTemplate(template.id, template.type);
            setDefaults((current) => ({ ...current, [template.type]: template.id }));
            setMessage({ type: 'success', text: `${template.name} is now the default ${template.type} template.` });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to set the default template.' });
        }
    };

    return (
        <div className="template-library">
            <div className="card header">
                <div>
                    <p className="eyebrow">Design</p>
                    <h1>Template Library</h1>
                    <p>Choose a default design, and create your own organization-specific celebration templates.</p>
                </div>
                <button className="primary" onClick={openCreateForm}>Add Custom Template</button>
            </div>

            <div className="tabs">
                <button className={activeTab === 'birthday' ? 'active' : ''} onClick={() => setActiveTab('birthday')}>Birthday</button>
                <button className={activeTab === 'anniversary' ? 'active' : ''} onClick={() => setActiveTab('anniversary')}>Anniversary</button>
            </div>

            {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

            {loading ? (
                <div className="card empty">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
                <div className="card empty">No templates available for this category yet.</div>
            ) : (
                <div className="grid">
                    {filteredTemplates.map((template) => (
                        <article key={template.id} className="card template-card">
                            <button className="preview" onClick={() => setSelectedTemplate(template)}>
                                <TemplatePreview template={template} />
                            </button>

                            <div className="template-body">
                                <div className="template-top">
                                    <div>
                                        <h2>{template.name}</h2>
                                        <p>{template.description || 'No description added yet.'}</p>
                                    </div>
                                    <div className="badge-row">
                                        <span className={`badge ${template.is_public ? 'public' : 'custom'}`}>
                                            {template.is_public ? 'System' : 'Custom'}
                                        </span>
                                        {defaults[template.type] === template.id && <span className="badge default">Default</span>}
                                    </div>
                                </div>

                                <div className="actions">
                                    <button className="ghost" onClick={() => handleSetDefault(template)}>Set Default</button>
                                    {!template.is_public && <button className="ghost" onClick={() => openEditForm(template)}>Edit</button>}
                                    {!template.is_public && <button className="danger" onClick={() => handleDelete(template)}>Delete</button>}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {selectedTemplate && (
                <div className="overlay" onClick={() => setSelectedTemplate(null)}>
                    <div className="card modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2>{selectedTemplate.name}</h2>
                                <p>{selectedTemplate.description || 'No description added yet.'}</p>
                            </div>
                            <button className="ghost close" onClick={() => setSelectedTemplate(null)}>×</button>
                        </div>
                        <div className="preview large">
                            <TemplatePreview template={selectedTemplate} large />
                        </div>
                        <div className="actions">
                            <button className="primary" onClick={() => handleSetDefault(selectedTemplate)}>Set as Default</button>
                            {!selectedTemplate.is_public && <button className="ghost" onClick={() => openEditForm(selectedTemplate)}>Edit Template</button>}
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="overlay" onClick={closeForm}>
                    <div className="card modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2>{editingTemplate ? 'Edit template' : 'Create template'}</h2>
                                <p>Use image URLs for quick previews while we keep the template system lightweight.</p>
                            </div>
                            <button className="ghost close" onClick={closeForm}>×</button>
                        </div>
                        <form className="form-grid" onSubmit={handleSave}>
                            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Template name" required />
                            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                                <option value="birthday">Birthday</option>
                                <option value="anniversary">Anniversary</option>
                            </select>
                            <textarea className="wide" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description" />
                            <input className="wide" value={form.preview_url} onChange={(event) => setForm({ ...form, preview_url: event.target.value })} placeholder="Preview image URL" />
                            <input className="wide" value={form.background_url} onChange={(event) => setForm({ ...form, background_url: event.target.value })} placeholder="Background image URL" />
                            <div className="actions wide">
                                <button type="button" className="ghost" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .template-library { display: grid; gap: 20px; }
                .card { background: white; border: 1px solid #e5e7eb; border-radius: 24px; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06); }
                .header, .template-card, .modal { padding: 24px; }
                .header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; background: linear-gradient(135deg, rgba(37,99,235,.08), rgba(4,120,87,.1)); }
                .eyebrow { margin-bottom: 8px; color: #047857; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
                h1, h2 { margin-bottom: 8px; }
                p { color: #64748b; }
                .tabs { display: flex; gap: 10px; flex-wrap: wrap; }
                .tabs button, .primary, .ghost, .danger { border: none; border-radius: 999px; padding: 12px 16px; font-size: 14px; font-weight: 700; cursor: pointer; }
                .tabs button { background: #e2e8f0; color: #334155; }
                .tabs button.active { background: #0f766e; color: white; }
                .primary { background: linear-gradient(135deg, #0f766e, #1d4ed8); color: white; }
                .ghost { background: #eff6ff; color: #1d4ed8; }
                .danger { background: #fef2f2; color: #dc2626; }
                .notice { padding: 14px 16px; border-radius: 18px; font-weight: 600; }
                .notice.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                .notice.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .template-card { display: grid; gap: 16px; }
                .preview { width: 100%; padding: 0; background: #f8fafc; border-radius: 18px; overflow: hidden; border: none; cursor: pointer; }
                .preview :global(.preview-shell) { position: relative; width: 100%; min-height: 220px; display: grid; align-items: end; overflow: hidden; }
                .preview.large :global(.preview-shell) { min-height: 360px; }
                .preview :global(.preview-shell img) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
                .preview :global(.fallback) { position: relative; z-index: 1; display: grid; gap: 6px; padding: 22px; color: white; background: linear-gradient(180deg, rgba(15,23,42,.08), rgba(15,23,42,.68)); min-height: 220px; align-content: end; text-align: left; }
                .preview.large :global(.fallback) { min-height: 360px; }
                .preview :global(.fallback strong) { font-size: 24px; line-height: 1.1; }
                .preview :global(.fallback p) { color: rgba(255,255,255,.84); }
                .preview :global(.fallback-type) { display: inline-flex; width: fit-content; padding: 6px 10px; border-radius: 999px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; background: rgba(255,255,255,.16); backdrop-filter: blur(4px); }
                .preview :global(.preview-shell.birthday) { background: linear-gradient(135deg, #1d4ed8, #f97316); }
                .preview :global(.preview-shell.anniversary) { background: linear-gradient(135deg, #0f766e, #7c3aed); }
                .template-top, .actions, .badge-row, .modal-head { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; }
                .template-top, .modal-head { flex-wrap: wrap; }
                .actions { flex-wrap: wrap; }
                .badge { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
                .badge.public { background: #eff6ff; color: #1d4ed8; }
                .badge.custom { background: #fff7ed; color: #c2410c; }
                .badge.default { background: #ecfdf5; color: #047857; }
                .empty { padding: 28px; text-align: center; color: #64748b; }
                .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, .6); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 1000; }
                .modal { width: min(780px, 100%); display: grid; gap: 16px; }
                .close { width: 40px; height: 40px; padding: 0; font-size: 24px; }
                .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                .form-grid input, .form-grid textarea, .form-grid select { width: 100%; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; font-size: 14px; }
                .wide { grid-column: 1 / -1; }
                @media (max-width: 900px) {
                    .header, .template-top, .actions, .modal-head { flex-direction: column; align-items: stretch; }
                    .form-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
