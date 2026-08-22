import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Internal PoC test tool, same bar as /admin-vetting and /submit-bid — unstyled, functional, not
// linked from site nav. Covers the buyer-side half of the invitation flow: log in, post a tender,
// see which registered generators match on capacity, and invite the ones you want to see it.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface Match {
  organizationId: number;
  name: string;
  capacityMw: string;
  alreadyInvited: boolean;
}

interface DocumentField {
  id: number;
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
  hasTemplate: boolean;
}

interface DocumentStatus {
  fieldId: number;
  label: string;
  uploaded: boolean;
  originalFilename: string | null;
  downloadUrl: string | null;
}

export default function BuyerTenderConsolePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [requiredCapacityMw, setRequiredCapacityMw] = useState('');
  const [requirementsDetail, setRequirementsDetail] = useState('');
  const [tenderId, setTenderId] = useState<number | null>(null);

  const [tenderRefInput, setTenderRefInput] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [invitedIds, setInvitedIds] = useState<number[] | null>(null);

  const [fields, setFields] = useState<DocumentField[] | null>(null);
  const [newFieldEnvelope, setNewFieldEnvelope] = useState<'technical' | 'financial'>('technical');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldTemplate, setNewFieldTemplate] = useState<File | null>(null);

  const [reviewOrgId, setReviewOrgId] = useState('');
  const [reviewDocuments, setReviewDocuments] = useState<DocumentStatus[] | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function postTender(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          requiredCapacityMw: Number(requiredCapacityMw),
          requirementsDetail: requirementsDetail || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setTenderId(data.tenderId);
      setTenderRefInput(String(data.tenderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post tender');
    }
  }

  async function loadMatches() {
    setError(null);
    setMatches(null);
    setSelected(new Set());
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    }
  }

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function invite() {
    setError(null);
    setInvitedIds(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setInvitedIds(data.invitedOrganizationIds);
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite generators');
    }
  }

  async function loadFields() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setFields(data.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document fields');
    }
  }

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const form = new FormData();
      form.append('envelope', newFieldEnvelope);
      form.append('key', newFieldKey);
      form.append('label', newFieldLabel);
      form.append('required', String(newFieldRequired));
      if (newFieldTemplate) form.append('template', newFieldTemplate);

      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setNewFieldKey('');
      setNewFieldLabel('');
      setNewFieldTemplate(null);
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document field');
    }
  }

  async function deleteField(fieldId: number) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document field');
    }
  }

  async function loadReviewDocuments() {
    setError(null);
    setReviewDocuments(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/documents/${reviewOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setReviewDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load that generator\'s documents');
    }
  }

  return (
    <div className="content-page">
      <Seo title="Buyer console (internal test)" description="Internal buyer tender + matching + invitation tool." path="/buyer-console" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Buyer console</h1>
            <p>Post a tender, see which registered generators match on capacity, and invite the ones you want to bid.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}

            {!token ? (
              <form onSubmit={login}>
                <h2>1. Log in as a buyer</h2>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="btn btn-solar">Log in</button>
              </form>
            ) : (
              <p>Logged in.</p>
            )}

            {token && (
              <>
                <form onSubmit={postTender}>
                  <h2>2. Post a tender</h2>
                  <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Required capacity (MW)"
                    value={requiredCapacityMw}
                    onChange={(e) => setRequiredCapacityMw(e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Full requirements (only visible to invited generators)"
                    value={requirementsDetail}
                    onChange={(e) => setRequirementsDetail(e.target.value)}
                    rows={4}
                    style={{ width: '100%' }}
                  />
                  <button type="submit" className="btn btn-solar">Post tender</button>
                  {tenderId && <p>Posted as tender #{tenderId}.</p>}
                </form>

                <div>
                  <h2>3. Load matches for a tender</h2>
                  <input
                    type="text"
                    placeholder="Tender id"
                    value={tenderRefInput}
                    onChange={(e) => setTenderRefInput(e.target.value)}
                  />
                  <button type="button" className="btn btn-solar" onClick={loadMatches}>
                    Load matches
                  </button>
                  {matches && (
                    <ul>
                      {matches.map((m) => (
                        <li key={m.organizationId}>
                          <label>
                            <input
                              type="checkbox"
                              disabled={m.alreadyInvited}
                              checked={selected.has(m.organizationId)}
                              onChange={() => toggleSelected(m.organizationId)}
                            />{' '}
                            #{m.organizationId} — {m.name} — {m.capacityMw} MW{m.alreadyInvited ? ' (already invited)' : ''}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {matches && matches.length > 0 && (
                    <button type="button" className="btn btn-solar" onClick={invite} disabled={selected.size === 0}>
                      Invite selected
                    </button>
                  )}
                  {invitedIds && <p>Invited: {invitedIds.length ? invitedIds.join(', ') : 'none (already invited or none selected)'}</p>}
                </div>

                <div>
                  <h2>4. Manage document checklist (uses tender id above)</h2>
                  <button type="button" className="btn btn-solar" onClick={loadFields}>
                    Load fields
                  </button>
                  {fields && (
                    <ul>
                      {fields.map((f) => (
                        <li key={f.id}>
                          [{f.envelope}] {f.label}{f.required ? ' *' : ''} {f.hasTemplate ? '(has template)' : ''}{' '}
                          <button type="button" onClick={() => deleteField(f.id)}>
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={addField} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
                    <select value={newFieldEnvelope} onChange={(e) => setNewFieldEnvelope(e.target.value as 'technical' | 'financial')}>
                      <option value="technical">Technical</option>
                      <option value="financial">Financial</option>
                    </select>
                    <input type="text" placeholder="key (e.g. site_layout_plan)" value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} required />
                    <input type="text" placeholder="Label" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} required />
                    <label>
                      <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} /> Required
                    </label>
                    <input type="file" accept="application/pdf" onChange={(e) => setNewFieldTemplate(e.target.files?.[0] ?? null)} />
                    <button type="submit" className="btn btn-solar">Add field</button>
                  </form>
                </div>

                <div>
                  <h2>5. Review a generator's uploaded documents</h2>
                  <input type="text" placeholder="Generator organization id" value={reviewOrgId} onChange={(e) => setReviewOrgId(e.target.value)} />
                  <button type="button" className="btn btn-solar" onClick={loadReviewDocuments}>
                    Load documents
                  </button>
                  {reviewDocuments && (
                    <ul>
                      {reviewDocuments.map((d) => (
                        <li key={d.fieldId}>
                          {d.label}: {d.uploaded ? (
                            <span style={{ color: '#2F7A3E' }}>
                              ✓ {d.originalFilename} {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer">(view)</a>}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>not uploaded</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
