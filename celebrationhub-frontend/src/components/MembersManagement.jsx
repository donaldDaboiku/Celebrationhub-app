'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import {
    createMember,
    deleteMember,
    downloadMembersTemplate,
    exportMembers,
    getMember,
    getMembers,
    getOrganizationSettings,
    importMembers,
    removeMemberPhoto,
    updateMember,
    uploadMemberPhoto,
} from '@/lib/api';

const emptyForm = {
    title: '',
    first_name: '',
    last_name: '',
    birthday: '',
    anniversary: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    department: '',
    designation: '',
    unit: '',
    notes: '',
    active: true,
    approved: true,
};

const defaultFieldLabels = {
    department: 'Department',
    designation: 'Designation',
    unit: 'Unit',
};

const resolveFieldLabels = (settings = {}) => {
    const memberFields = settings.member_fields || {};

    return {
        department: memberFields.department_label?.trim() || defaultFieldLabels.department,
        designation: memberFields.designation_label?.trim() || defaultFieldLabels.designation,
        unit: memberFields.unit_label?.trim() || defaultFieldLabels.unit,
    };
};

const toPayload = (form) => ({
    title: form.title || null,
    first_name: form.first_name.trim(),
    last_name: form.last_name || null,
    birthday: form.birthday || null,
    anniversary: form.anniversary || null,
    email: form.email || null,
    phone: form.phone || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    zip: form.zip || null,
    department: form.department || null,
    designation: form.designation || null,
    unit: form.unit || null,
    notes: form.notes || null,
    active: Boolean(form.active),
    approved: Boolean(form.approved),
});

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Not set';

const formatAddress = (member) =>
    [member.address, member.city, member.state, member.country, member.zip].filter(Boolean).join(', ') || 'No address added yet';

export default function MembersManagement() {
    const [members, setMembers] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, per_page: 10, current_page: 1, last_page: 1 });
    const [draftSearch, setDraftSearch] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [approvedFilter, setApprovedFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [busyDownload, setBusyDownload] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loadingMember, setLoadingMember] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [removingPhoto, setRemovingPhoto] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fieldLabels, setFieldLabels] = useState(defaultFieldLabels);

    const setFeedback = (type, text) => setMessage({ type, text });

    useEffect(() => {
        const loadFieldLabels = async () => {
            try {
                const response = await getOrganizationSettings();
                setFieldLabels(resolveFieldLabels(response.data?.settings));
            } catch {
                setFieldLabels(defaultFieldLabels);
            }
        };

        const handleSettingsUpdated = (event) => {
            setFieldLabels(resolveFieldLabels(event.detail));
        };

        loadFieldLabels();
        window.addEventListener('organization-settings-updated', handleSettingsUpdated);

        return () => window.removeEventListener('organization-settings-updated', handleSettingsUpdated);
    }, []);

    const loadMembers = async (page = 1) => {
        setLoading(true);
        setFeedback('', '');

        try {
            const response = await getMembers({
                page,
                limit: pagination.per_page,
                search,
                active: activeFilter === 'all' ? undefined : activeFilter,
                approved: approvedFilter === 'all' ? undefined : approvedFilter,
            });

            setMembers(response.data.members);
            setPagination(response.data.pagination);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to load members.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeFilter, approvedFilter]);

    const openCreateForm = () => {
        setEditingMember(null);
        setForm(emptyForm);
        setShowForm(true);
        setFeedback('', '');
    };

    const openEditForm = (member) => {
        setEditingMember(member);
        setForm({
            title: member.title || '',
            first_name: member.first_name || '',
            last_name: member.last_name || '',
            birthday: member.birthday || '',
            anniversary: member.anniversary || '',
            email: member.email || '',
            phone: member.phone || '',
            address: member.address || '',
            city: member.city || '',
            state: member.state || '',
            country: member.country || '',
            zip: member.zip || '',
            department: member.department || '',
            designation: member.designation || '',
            unit: member.unit || '',
            notes: member.notes || '',
            active: member.active,
            approved: member.approved,
        });
        setShowForm(true);
        setFeedback('', '');
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMember(null);
        setForm(emptyForm);
    };

    const loadMemberDetails = async (memberId) => {
        setLoadingMember(true);

        try {
            const response = await getMember(memberId);
            setSelectedMember(response.data);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to load member details.');
        } finally {
            setLoadingMember(false);
        }
    };

    const openMemberDetails = (member) => {
        setFeedback('', '');
        loadMemberDetails(member.id);
    };

    const closeMemberDetails = () => {
        setSelectedMember(null);
        setSelectedPhotoFile(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFeedback('', '');

        try {
            if (editingMember) {
                const response = await updateMember(editingMember.id, toPayload(form));
                if (selectedMember?.id === editingMember.id) {
                    setSelectedMember(response.data);
                }
                setFeedback('success', 'Member updated successfully.');
            } else {
                await createMember(toPayload(form));
                setFeedback('success', 'Member created successfully.');
            }

            closeForm();
            await loadMembers(editingMember ? pagination.current_page : 1);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to save member.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (member) => {
        if (!window.confirm(`Delete ${member.full_name || member.first_name}?`)) {
            return;
        }

        try {
            await deleteMember(member.id);
            if (selectedMember?.id === member.id) {
                closeMemberDetails();
            }
            setFeedback('success', 'Member deleted successfully.');
            await loadMembers(members.length === 1 && pagination.current_page > 1 ? pagination.current_page - 1 : pagination.current_page);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to delete member.');
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            setFeedback('error', 'Choose an Excel or CSV file to import.');
            return;
        }

        setImporting(true);
        setFeedback('', '');

        try {
            const response = await importMembers(selectedFile);
            const imported = response.data?.imported ?? 0;
            const errorsCount = response.data?.errors_count ?? 0;
            setSelectedFile(null);
            setFeedback(
                'success',
                errorsCount ? `Imported ${imported} members with ${errorsCount} row issues.` : `Imported ${imported} members successfully.`
            );
            await loadMembers(1);
        } catch (error) {
            setFeedback('error', error.message || 'Failed to import members.');
        } finally {
            setImporting(false);
        }
    };

    const handleDownload = async (kind, callback) => {
        setBusyDownload(kind);
        setFeedback('', '');

        try {
            await callback();
            setFeedback('success', kind === 'template' ? 'Import template downloaded.' : 'Members export downloaded.');
        } catch (error) {
            setFeedback('error', error.message || 'Download failed.');
        } finally {
            setBusyDownload('');
        }
    };

    const handleUploadPhoto = async () => {
        if (!selectedMember || !selectedPhotoFile) {
            setFeedback('error', 'Choose a member photo before uploading.');
            return;
        }

        setUploadingPhoto(true);
        setFeedback('', '');

        try {
            const response = await uploadMemberPhoto(selectedMember.id, selectedPhotoFile);
            setSelectedMember(response.data);
            setSelectedPhotoFile(null);
            setMembers((current) => current.map((member) => (member.id === response.data.id ? response.data : member)));
            setFeedback('success', 'Member photo uploaded successfully.');
        } catch (error) {
            setFeedback('error', error.message || 'Failed to upload member photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!selectedMember) {
            return;
        }

        setRemovingPhoto(true);
        setFeedback('', '');

        try {
            const response = await removeMemberPhoto(selectedMember.id);
            setSelectedMember(response.data);
            setMembers((current) => current.map((member) => (member.id === response.data.id ? response.data : member)));
            setFeedback('success', 'Member photo removed successfully.');
        } catch (error) {
            setFeedback('error', error.message || 'Failed to remove member photo.');
        } finally {
            setRemovingPhoto(false);
        }
    };

    return (
        <div className="members-page">
            <div className="page-head card">
                <div>
                    <p className="eyebrow">People</p>
                    <h1>Members</h1>
                    <p>Add members, import Excel lists, and keep celebration data ready for your campaigns.</p>
                </div>
                <div className="toolbar">
                    <button className="ghost" onClick={() => handleDownload('template', downloadMembersTemplate)}>
                        {busyDownload === 'template' ? 'Preparing...' : 'Import Template'}
                    </button>
                    <button className="ghost" onClick={() => handleDownload('export', exportMembers)}>
                        {busyDownload === 'export' ? 'Preparing...' : 'Export Members'}
                    </button>
                    <button className="primary" onClick={openCreateForm}>Add Member</button>
                </div>
            </div>

            <div className="card filters">
                <div className="row">
                    <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search by name or email" />
                    <button className="ghost" onClick={() => setSearch(draftSearch.trim())}>Search</button>
                    <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
                        <option value="all">All activity</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <select value={approvedFilter} onChange={(event) => setApprovedFilter(event.target.value)}>
                        <option value="all">All approval</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                </div>
                <div className="row">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                    <button className="primary" onClick={handleImport} disabled={importing}>
                        {importing ? 'Importing...' : 'Import Excel'}
                    </button>
                    {selectedFile && <span className="muted">{selectedFile.name}</span>}
                </div>
            </div>

            {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

            <div className="card table-card">
                {loading ? (
                    <div className="empty">Loading members...</div>
                ) : members.length === 0 ? (
                    <div className="empty">No members found for the current filters.</div>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Birthday</th>
                                        <th>Anniversary</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id} className="member-row" onClick={() => openMemberDetails(member)}>
                                            <td>
                                                <strong>{member.full_name || member.first_name}</strong>
                                                <span>{member.notes || 'No notes yet'}</span>
                                            </td>
                                            <td>{formatDate(member.birthday)}</td>
                                            <td>{formatDate(member.anniversary)}</td>
                                            <td>
                                                <strong>{member.email || 'No email'}</strong>
                                                <span>{member.phone || 'No phone'}</span>
                                            </td>
                                            <td>
                                                <div className="stack">
                                                    <span className={`pill ${member.active ? 'green' : 'gray'}`}>{member.active ? 'Active' : 'Inactive'}</span>
                                                    <span className={`pill ${member.approved ? 'blue' : 'amber'}`}>{member.approved ? 'Approved' : 'Pending'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="stack">
                                                    <button className="ghost small" onClick={(event) => { event.stopPropagation(); openMemberDetails(member); }}>View</button>
                                                    <button className="ghost small" onClick={(event) => { event.stopPropagation(); openEditForm(member); }}>Edit</button>
                                                    <button className="danger small" onClick={(event) => { event.stopPropagation(); handleDelete(member); }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination">
                            <button className="ghost" disabled={pagination.current_page <= 1} onClick={() => loadMembers(pagination.current_page - 1)}>Previous</button>
                            <span className="muted">Page {pagination.current_page} of {pagination.last_page} • {pagination.total} members</span>
                            <button className="ghost" disabled={pagination.current_page >= pagination.last_page} onClick={() => loadMembers(pagination.current_page + 1)}>Next</button>
                        </div>
                    </>
                )}
            </div>

            {showForm && (
                <div className="overlay" onClick={closeForm}>
                    <div className="modal card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2>{editingMember ? 'Edit member' : 'Add member'}</h2>
                                <p>Capture the details that matter for birthdays and anniversaries.</p>
                            </div>
                            <button className="ghost close" onClick={closeForm}>×</button>
                        </div>
                        <form className="form-grid" onSubmit={handleSubmit}>
                            <label className="field">
                                <span>Title</span>
                                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Mr, Mrs, Pastor" />
                            </label>
                            <label className="field">
                                <span>First name</span>
                                <input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} placeholder="First name" required />
                            </label>
                            <label className="field">
                                <span>Last name</span>
                                <input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} placeholder="Last name" />
                            </label>
                            <label className="field">
                                <span>Email</span>
                                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="member@example.com" />
                            </label>
                            <label className="field">
                                <span>Phone</span>
                                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="080..." />
                            </label>
                            <label className="field wide">
                                <span>Address</span>
                                <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address" />
                            </label>
                            <label className="field">
                                <span>City</span>
                                <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="City" />
                            </label>
                            <label className="field">
                                <span>State</span>
                                <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="State" />
                            </label>
                            <label className="field">
                                <span>Country</span>
                                <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="Country" />
                            </label>
                            <label className="field">
                                <span>Postal code</span>
                                <input value={form.zip} onChange={(event) => setForm({ ...form, zip: event.target.value })} placeholder="Postal code" />
                            </label>
                            <label className="field">
                                <span>{fieldLabels.department}</span>
                                <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder={fieldLabels.department} />
                            </label>
                            <label className="field">
                                <span>{fieldLabels.designation}</span>
                                <input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} placeholder={fieldLabels.designation} />
                            </label>
                            <label className="field">
                                <span>{fieldLabels.unit}</span>
                                <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder={fieldLabels.unit} />
                            </label>
                            <label className="field">
                                <span>Birthday</span>
                                <input type="date" value={form.birthday} onChange={(event) => setForm({ ...form, birthday: event.target.value })} />
                            </label>
                            <label className="field">
                                <span>Anniversary</span>
                                <input type="date" value={form.anniversary} onChange={(event) => setForm({ ...form, anniversary: event.target.value })} />
                            </label>
                            <label className="check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Active member</label>
                            <label className="check"><input type="checkbox" checked={form.approved} onChange={(event) => setForm({ ...form, approved: event.target.checked })} />Approved</label>
                            <label className="field wide">
                                <span>Notes</span>
                                <textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes" />
                            </label>
                            <div className="actions wide">
                                <button type="button" className="ghost" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving...' : editingMember ? 'Save Changes' : 'Create Member'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(selectedMember || loadingMember) && (
                <div className="overlay" onClick={closeMemberDetails}>
                    <div className="modal card details-modal" onClick={(event) => event.stopPropagation()}>
                        {loadingMember ? (
                            <div className="empty">Loading member profile...</div>
                        ) : (
                            <>
                                <div className="modal-head">
                                    <div className="profile-summary">
                                        <div className="photo-shell">
                                            {selectedMember.photo_url ? (
                                                <img src={selectedMember.photo_url} alt={`${selectedMember.full_name || selectedMember.first_name} photo`} className="profile-photo" />
                                            ) : (
                                                <span className="photo-fallback">{selectedMember.first_name?.[0] || 'M'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="eyebrow">Member Profile</p>
                                            <h2>{selectedMember.full_name || selectedMember.first_name}</h2>
                                            <p>{formatAddress(selectedMember)}</p>
                                        </div>
                                    </div>
                                    <div className="actions-inline">
                                        <button className="ghost" onClick={() => { closeMemberDetails(); openEditForm(selectedMember); }}>Edit Member</button>
                                        <button className="ghost close" onClick={closeMemberDetails}>×</button>
                                    </div>
                                </div>

                                <div className="details-layout">
                                    <div className="photo-card">
                                        <div className="photo-preview">
                                            {selectedMember.photo_url ? (
                                                <img src={selectedMember.photo_url} alt={`${selectedMember.full_name || selectedMember.first_name} photo`} className="profile-photo large" />
                                            ) : (
                                                <span className="photo-fallback large">{selectedMember.first_name?.[0] || 'M'}</span>
                                            )}
                                        </div>
                                        <div className="upload-row">
                                            <input type="file" accept=".jpg,.jpeg,.png" onChange={(event) => setSelectedPhotoFile(event.target.files?.[0] || null)} />
                                            <button className="primary" onClick={handleUploadPhoto} disabled={uploadingPhoto}>
                                                {uploadingPhoto ? 'Uploading...' : selectedMember.photo_url ? 'Replace Photo' : 'Upload Photo'}
                                            </button>
                                            {selectedMember.photo_url && (
                                                <button className="danger" onClick={handleRemovePhoto} disabled={removingPhoto}>
                                                    {removingPhoto ? 'Removing...' : 'Remove Photo'}
                                                </button>
                                            )}
                                        </div>
                                        {selectedPhotoFile && <p className="muted">{selectedPhotoFile.name}</p>}
                                    </div>

                                    <div className="details-grid profile-details">
                                        <div className="detail-card">
                                            <span className="detail-label">Contact</span>
                                            <strong>{selectedMember.email || 'No email added'}</strong>
                                            <p>{selectedMember.phone || 'No phone added'}</p>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">Address</span>
                                            <strong>{selectedMember.address || 'No street address added'}</strong>
                                            <p>{formatAddress(selectedMember)}</p>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">{fieldLabels.department}</span>
                                            <strong>{selectedMember.department || `No ${fieldLabels.department.toLowerCase()} set`}</strong>
                                            <p>{fieldLabels.unit}: {selectedMember.unit || `No ${fieldLabels.unit.toLowerCase()} set`}</p>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">{fieldLabels.designation}</span>
                                            <strong>{selectedMember.designation || `No ${fieldLabels.designation.toLowerCase()} set`}</strong>
                                            <p>{selectedMember.title || 'No title set'}</p>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">Celebrations</span>
                                            <strong>Birthday: {formatDate(selectedMember.birthday)}</strong>
                                            <p>Anniversary: {formatDate(selectedMember.anniversary)}</p>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">Status</span>
                                            <div className="detail-pills">
                                                <span className={`pill ${selectedMember.active ? 'green' : 'gray'}`}>{selectedMember.active ? 'Active' : 'Inactive'}</span>
                                                <span className={`pill ${selectedMember.approved ? 'blue' : 'amber'}`}>{selectedMember.approved ? 'Approved' : 'Pending'}</span>
                                            </div>
                                            <p>{[selectedMember.city, selectedMember.state, selectedMember.country, selectedMember.zip].filter(Boolean).join(' • ') || 'No region details set'}</p>
                                        </div>
                                        <div className="detail-card full">
                                            <span className="detail-label">Notes</span>
                                            <p>{selectedMember.notes || 'No notes added yet.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .members-page { display: grid; gap: 20px; }
                .card { background: white; border: 1px solid #e5e7eb; border-radius: 24px; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06); }
                .page-head { padding: 28px; display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; background: linear-gradient(135deg, rgba(251,191,36,.14), rgba(37,99,235,.08)); }
                .eyebrow { margin-bottom: 8px; color: #c2410c; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
                h1, h2 { margin-bottom: 8px; }
                p, .muted, td span { color: #64748b; }
                .toolbar, .row, .stack, .pagination, .actions, .modal-head { display: flex; gap: 10px; align-items: center; }
                .toolbar, .stack { flex-wrap: wrap; }
                .filters, .table-card, .modal { padding: 20px; }
                .filters { display: grid; gap: 12px; }
                input, select, textarea { width: 100%; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; font-size: 14px; }
                button { border: none; cursor: pointer; font-weight: 700; transition: opacity .15s ease, transform .15s ease; }
                button:hover { transform: translateY(-1px); }
                button:disabled { opacity: .6; transform: none; cursor: not-allowed; }
                .primary, .ghost, .danger { padding: 12px 16px; border-radius: 999px; font-size: 14px; }
                .small { padding: 8px 12px; font-size: 13px; }
                .primary { background: linear-gradient(135deg, #1d4ed8, #f97316); color: white; }
                .ghost { background: #eff6ff; color: #1d4ed8; }
                .danger { background: #fef2f2; color: #dc2626; }
                .notice { padding: 14px 16px; border-radius: 18px; font-weight: 600; }
                .notice.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                .notice.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .empty { padding: 28px; text-align: center; color: #64748b; }
                .table-wrap { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 14px 10px; border-bottom: 1px solid #eef2f7; text-align: left; vertical-align: top; }
                th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
                .member-row { cursor: pointer; }
                .member-row:hover { background: #f8fafc; }
                td strong { display: block; color: #0f172a; }
                .profile-summary, .upload-row, .actions-inline { display: flex; gap: 14px; align-items: center; }
                .details-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
                .photo-card, .detail-card { padding: 18px; border: 1px solid #eef2f7; border-radius: 18px; background: #f8fafc; }
                .photo-shell, .photo-preview { width: 88px; height: 88px; border-radius: 24px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(29,78,216,.08), rgba(249,115,22,.12)); }
                .photo-preview { width: 100%; height: 240px; border-radius: 24px; background: linear-gradient(135deg, rgba(29,78,216,.08), rgba(249,115,22,.12)); margin-bottom: 16px; }
                .profile-photo { width: 100%; height: 100%; object-fit: cover; }
                .photo-fallback { font-size: 28px; font-weight: 700; color: #1d4ed8; }
                .photo-fallback.large { font-size: 64px; }
                .pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
                .green { background: #ecfdf5; color: #047857; }
                .gray { background: #f1f5f9; color: #475569; }
                .blue { background: #eff6ff; color: #1d4ed8; }
                .amber { background: #fff7ed; color: #c2410c; }
                .pagination { justify-content: space-between; margin-top: 16px; }
                .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, .6); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 1000; }
                .modal { width: min(860px, 100%); }
                .details-modal { width: min(980px, 100%); max-height: calc(100vh - 48px); overflow: auto; }
                .close { width: 40px; height: 40px; padding: 0; font-size: 24px; }
                .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                .details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
                .detail-card strong { display: block; color: #0f172a; margin-bottom: 8px; }
                .detail-card p { margin: 0; color: #64748b; line-height: 1.6; }
                .detail-label { display: block; margin-bottom: 8px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
                .detail-pills { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
                .profile-details { margin-top: 0; }
                .full { grid-column: 1 / -1; }
                .field { display: flex; flex-direction: column; gap: 8px; }
                .field span { color: #334155; font-size: 13px; font-weight: 700; }
                .wide { grid-column: 1 / -1; }
                .check { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border: 1px solid #dbe4f0; border-radius: 14px; color: #334155; }
                .check input { width: auto; }
                .actions { justify-content: flex-end; }
                @media (max-width: 900px) {
                    .page-head, .toolbar, .row, .pagination, .modal-head, .actions, .profile-summary, .upload-row, .actions-inline { flex-direction: column; align-items: stretch; }
                    .details-layout,
                    .form-grid, .details-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
