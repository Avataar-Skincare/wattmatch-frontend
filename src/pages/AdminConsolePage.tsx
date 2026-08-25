import { useEffect, useState, type FormEvent } from 'react';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Internal PoC test tool, same bar as /admin-vetting and /buyer-console — unstyled, functional, not
// linked from site nav. Reached via the shared DashboardShell (routes.tsx), which already gates
// this to a logged-in admin — no login form of its own any more. This is where a WattMatch
// admin/ops person runs the entire operational tender lifecycle on the buyer's behalf: turn a
// buyer's tender request into a real, live tender with its own per-tender pricing
// (TENDER_WORKFLOW_STAKEHOLDER_PLAN.md — fees vary tender to tender, set deliberately here, not
// read from a platform-wide flat fee), see which generators match, manage the document checklist,
// review a generator's document submissions, and resolve EMD submissions. The buyer has no
// operational role in any of this once they've submitted a request — admin runs it all, the buyer
// is informed of outcomes separately. Admin accounts aren't self-registered (see
// scripts/create-admin.mjs) — log in with credentials created that way.
//
// This is the "Dashboard" tab of the admin view (DashboardShell's nav also links to "Vetting", i.e.
// /admin-vetting) — split into its own two inner tabs per the tender/auction PRD: "Create Tender"
// (details + a configurable document checklist, then post) and "View Existing Tenders" (browse
// what's already been created, then drill into matches/checklist/document-review/EMD for one).
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface PendingRequest {
  id: number;
  buyerOrgId: number;
  title: string;
  requiredCapacityMw: string;
  requirementsDetail: string | null;
}

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

interface EmdSubmissionView {
  organizationId: number;
  bankName: string;
  guaranteeNumber: string;
  amountPaise: number;
  validUpto: string;
  documentUrl: string | null;
  status: 'submitted' | 'released' | 'invoked';
  resolvedReason: string | null;
  dispatchReference: string | null;
}

interface TenderSummary {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
}

// Mirrors the server's seeded default checklist (defaultTenderDocumentFields.ts) exactly, key for
// key — that file remains the source of truth for what actually gets created; this copy exists only
// so the admin can preview and uncheck items BEFORE posting the tender, since the real registry rows
// don't exist yet at that point. Keep in sync if that file's list ever changes.
interface DefaultDocField {
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
}

const DEFAULT_DOCUMENT_CHECKLIST: DefaultDocField[] = [
  { envelope: 'technical', key: 'covering_letter', label: 'Covering Letter (Format 7.1)', required: true },
  { envelope: 'technical', key: 'power_of_attorney', label: 'Power of Attorney (Format 7.2, if applicable)', required: false },
  { envelope: 'technical', key: 'emd_instrument_format', label: 'EMD Instrument Format (7.3A/B/C)', required: true },
  { envelope: 'technical', key: 'board_resolutions', label: 'Board Resolutions (Format 7.4)', required: true },
  { envelope: 'technical', key: 'consortium_agreement', label: 'Consortium Agreement (Format 7.5, if applicable)', required: false },
  { envelope: 'technical', key: 'financial_requirements', label: 'Financial Requirements (Format 7.6)', required: true },
  { envelope: 'technical', key: 'undertaking', label: 'Undertaking (Format 7.7)', required: true },
  { envelope: 'technical', key: 'related_company_disclosure', label: 'Related Company Disclosure (Format 7.8/7.8A)', required: true },
  { envelope: 'technical', key: 'technology_tie_up_declaration', label: 'Technology Tie-Up Declaration (Format 7.9)', required: true },
  { envelope: 'technical', key: 'integrity_pact', label: 'Integrity Pact (Format 7.10)', required: true },
  { envelope: 'technical', key: 'moa', label: 'Memorandum of Association (MoA)', required: true },
  { envelope: 'technical', key: 'aoa', label: 'Articles of Association (AoA)', required: true },
  { envelope: 'technical', key: 'certificate_of_incorporation', label: 'Certificate of Incorporation', required: true },
  { envelope: 'technical', key: 'shareholding_certificate', label: 'Shareholding Certificate', required: true },
  { envelope: 'technical', key: 'pending_conversion_securities', label: 'Pending-Conversion Securities Details', required: false },
  { envelope: 'technical', key: 'consortium_documents', label: 'Consortium Documents (if applicable)', required: false },
  { envelope: 'technical', key: 'spv_moa_aoa', label: 'SPV MoA/AoA (if applicable)', required: false },
  { envelope: 'technical', key: 'ca_certificate', label: 'CA / Statutory Auditor Certificate', required: true },
  { envelope: 'technical', key: 'audited_accounts', label: 'Audited / Provisional Accounts', required: true },
  { envelope: 'technical', key: 'balance_sheet', label: 'Balance Sheet', required: true },
  { envelope: 'technical', key: 'profit_and_loss', label: 'Profit & Loss Statement', required: true },
  { envelope: 'technical', key: 'schedules', label: 'Schedules', required: true },
  { envelope: 'technical', key: 'cash_flow_statement', label: 'Cash Flow Statement', required: true },
  { envelope: 'technical', key: 'bank_statements', label: 'Bank Statements (where applicable)', required: false },
  { envelope: 'technical', key: 'eligibility_supporting_docs', label: 'Documents Supporting Eligibility Criteria', required: true },
  { envelope: 'technical', key: 'neft_rtgs_bid_purchase_fee', label: 'NEFT/RTGS Proof — Bid Purchase Fee (where required)', required: false },
  { envelope: 'technical', key: 'neft_rtgs_bid_processing_fee', label: 'NEFT/RTGS Proof — Bid Processing Fee (where required)', required: false },
  { envelope: 'financial', key: 'financial_bid_covering_letter', label: 'Financial Bid Covering Letter (Format 7.11)', required: true },
  { envelope: 'financial', key: 'preliminary_cost_estimate', label: 'Preliminary Estimate of Cost of Project (Format 7.12)', required: true },
];

function defaultChecklistState(): Record<string, boolean> {
  return Object.fromEntries(DEFAULT_DOCUMENT_CHECKLIST.map((f) => [f.key, true]));
}

interface ExtraDocField {
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
  template: File | null;
}

export default function AdminConsolePage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dashboardTab, setDashboardTab] = useState<'create' | 'existing'>('create');

  const [requests, setRequests] = useState<PendingRequest[] | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [nextTenderId, setNextTenderId] = useState<number | null>(null);

  // Convert-a-request / ad-hoc creation form. Rupees in the UI, converted to paise on submit —
  // every amount server-side is paise (Payment.amountPaise), same convention as the payment module.
  const [title, setTitle] = useState('');
  const [requiredCapacityMw, setRequiredCapacityMw] = useState('');
  const [requirementsDetail, setRequirementsDetail] = useState('');
  const [buyerOrgId, setBuyerOrgId] = useState('');
  const [rfsDocumentFeeRupees, setRfsDocumentFeeRupees] = useState('');
  const [bidProcessingFeeRupees, setBidProcessingFeeRupees] = useState('');
  const [emdAmountRupees, setEmdAmountRupees] = useState('');

  // The two tender-level PDFs — free RfS document, and the tender document gated behind the RfS
  // Document / Bid Purchase fee. Distinct from the per-field checklist below.
  const [rfsDocumentFile, setRfsDocumentFile] = useState<File | null>(null);
  const [tenderDocumentFile, setTenderDocumentFile] = useState<File | null>(null);

  // Document checklist configuration — shown and editable BEFORE the tender is posted (§2.1 of the
  // tender/auction PRD). The server always seeds the full default list on creation; the deltas here
  // (unchecked defaults, added extras) are applied as a follow-up pass right after, over the
  // existing add/delete endpoints — there's no dedicated "create with this exact list" endpoint.
  const [checklistIncluded, setChecklistIncluded] = useState<Record<string, boolean>>(defaultChecklistState());
  const [extraFields, setExtraFields] = useState<ExtraDocField[]>([]);
  const [newExtraEnvelope, setNewExtraEnvelope] = useState<'technical' | 'financial'>('technical');
  const [newExtraKey, setNewExtraKey] = useState('');
  const [newExtraLabel, setNewExtraLabel] = useState('');
  const [newExtraRequired, setNewExtraRequired] = useState(true);
  const [newExtraTemplate, setNewExtraTemplate] = useState<File | null>(null);

  const [allTenders, setAllTenders] = useState<TenderSummary[] | null>(null);

  const [tenderRefInput, setTenderRefInput] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);

  const [fields, setFields] = useState<DocumentField[] | null>(null);
  const [newFieldEnvelope, setNewFieldEnvelope] = useState<'technical' | 'financial'>('technical');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldTemplate, setNewFieldTemplate] = useState<File | null>(null);

  const [existingRfsDocumentFile, setExistingRfsDocumentFile] = useState<File | null>(null);
  const [existingTenderDocumentFile, setExistingTenderDocumentFile] = useState<File | null>(null);

  const [reviewOrgId, setReviewOrgId] = useState('');
  const [reviewDocuments, setReviewDocuments] = useState<DocumentStatus[] | null>(null);

  const [emdSubmissions, setEmdSubmissions] = useState<EmdSubmissionView[] | null>(null);
  const [emdReason, setEmdReason] = useState<Record<number, string>>({});
  const [emdDispatchReference, setEmdDispatchReference] = useState<Record<number, string>>({});

  async function loadRequests() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tender-requests`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tender requests');
    }
  }

  async function loadNextTenderId() {
    try {
      const res = await fetch(`${API_BASE}/api/tenders/next-id`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNextTenderId(data.nextTenderId);
    } catch {
      // informational only — a failed fetch here shouldn't block the rest of the page
    }
  }

  async function loadAllTenders() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders`);
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setAllTenders(data.tenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing tenders');
    }
  }

  useEffect(() => {
    loadNextTenderId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dashboardTab === 'existing' && allTenders === null) loadAllTenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardTab]);

  function selectRequest(r: PendingRequest) {
    setSelectedRequest(r);
    setTitle(r.title);
    setRequiredCapacityMw(r.requiredCapacityMw);
    setRequirementsDetail(r.requirementsDetail ?? '');
    setBuyerOrgId('');
  }

  function startAdHoc() {
    setSelectedRequest(null);
    setTitle('');
    setRequiredCapacityMw('');
    setRequirementsDetail('');
    setBuyerOrgId('');
  }

  function toggleChecklistItem(key: string) {
    setChecklistIncluded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function addExtraField() {
    if (!newExtraKey.trim() || !newExtraLabel.trim()) {
      setError('An extra document needs both a key and a label');
      return;
    }
    setError(null);
    setExtraFields((prev) => [
      ...prev,
      { envelope: newExtraEnvelope, key: newExtraKey.trim(), label: newExtraLabel.trim(), required: newExtraRequired, template: newExtraTemplate },
    ]);
    setNewExtraKey('');
    setNewExtraLabel('');
    setNewExtraRequired(true);
    setNewExtraTemplate(null);
  }

  function removeExtraField(key: string) {
    setExtraFields((prev) => prev.filter((f) => f.key !== key));
  }

  // Applies the admin's checklist configuration to the just-created tender: the server always seeds
  // the full default list on POST /tenders, so unchecked defaults are removed here, and any admin-
  // added extras are added here — both over tenderDocuments.ts's existing per-field endpoints.
  async function applyDocumentChecklist(tenderId: number) {
    const uncheckedKeys = new Set(DEFAULT_DOCUMENT_CHECKLIST.filter((f) => !checklistIncluded[f.key]).map((f) => f.key));
    if (uncheckedKeys.size > 0) {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        for (const f of data.fields as DocumentField[]) {
          if (uncheckedKeys.has(f.key)) {
            await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields/${f.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    }

    for (const extra of extraFields) {
      const form = new FormData();
      form.append('envelope', extra.envelope);
      form.append('key', extra.key);
      form.append('label', extra.label);
      form.append('required', String(extra.required));
      if (extra.template) form.append('template', extra.template);
      await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    }
  }

  async function uploadTenderDocument(tenderId: number, kind: 'rfs-document' | 'tender-document', file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/${kind}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || `Failed to upload ${kind}`);
  }

  async function uploadExistingTenderDocument(kind: 'rfs-document' | 'tender-document', file: File | null) {
    if (!tenderRefInput || !file) return;
    setError(null);
    setSuccess(null);
    try {
      await uploadTenderDocument(Number(tenderRefInput), kind, file);
      setSuccess(kind === 'rfs-document' ? 'RfS document uploaded.' : 'Tender document uploaded.');
      if (kind === 'rfs-document') setExistingRfsDocumentFile(null);
      else setExistingTenderDocumentFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${kind}`);
    }
  }

  async function postTender(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          requiredCapacityMw: Number(requiredCapacityMw),
          requirementsDetail: requirementsDetail || undefined,
          tenderRequestId: selectedRequest?.id,
          buyerOrgId: selectedRequest ? undefined : Number(buyerOrgId),
          rfsDocumentFeePaise: Math.round(Number(rfsDocumentFeeRupees) * 100),
          bidProcessingFeePaise: Math.round(Number(bidProcessingFeeRupees) * 100),
          emdAmountPaise: Math.round(Number(emdAmountRupees) * 100),
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);

      const tenderId = data.tenderId as number;
      await applyDocumentChecklist(tenderId);
      if (rfsDocumentFile) await uploadTenderDocument(tenderId, 'rfs-document', rfsDocumentFile);
      if (tenderDocumentFile) await uploadTenderDocument(tenderId, 'tender-document', tenderDocumentFile);

      setSuccess(`Tender #${tenderId} posted — ${data.autoInvitedOrganizationIds.length} generator(s) auto-invited.`);
      setSelectedRequest(null);
      setTenderRefInput(String(tenderId));
      setChecklistIncluded(defaultChecklistState());
      setExtraFields([]);
      setRfsDocumentFile(null);
      setTenderDocumentFile(null);
      await loadRequests();
      await loadNextTenderId();
      setAllTenders(null);
      // Show the finalized document checklist immediately, reflecting whatever was unchecked/added
      // above — otherwise the admin has no visibility into the real end state until they separately
      // load fields for a tender id they'd have to know.
      await loadFields(String(tenderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post tender');
    }
  }

  function viewExistingTender(id: number) {
    setTenderRefInput(String(id));
    setMatches(null);
    setFields(null);
    setReviewDocuments(null);
    setEmdSubmissions(null);
  }

  async function loadMatches() {
    setError(null);
    setMatches(null);
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

  async function loadFields(idOverride?: string) {
    setError(null);
    try {
      const id = idOverride ?? tenderRefInput;
      const res = await fetch(`${API_BASE}/api/tenders/${id}/document-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setFields(data.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document fields');
    }
  }

  async function addField(e: FormEvent) {
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
      setError(err instanceof Error ? err.message : "Failed to load that generator's documents");
    }
  }

  async function loadEmdSubmissions() {
    setError(null);
    setEmdSubmissions(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/emd-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setEmdSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EMD submissions');
    }
  }

  async function resolveEmd(organizationId: number, action: 'release' | 'invoke') {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/emd-submissions/${organizationId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reason: emdReason[organizationId] || '',
          ...(action === 'release' && emdDispatchReference[organizationId] ? { dispatchReference: emdDispatchReference[organizationId] } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadEmdSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} EMD`);
    }
  }

  const technicalChecklist = DEFAULT_DOCUMENT_CHECKLIST.filter((f) => f.envelope === 'technical');
  const financialChecklist = DEFAULT_DOCUMENT_CHECKLIST.filter((f) => f.envelope === 'financial');

  return (
    <>
      <Seo title="Admin console (internal test)" description="Internal admin tool for converting tender requests into priced tenders." path="/admin-console" />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Dashboard</h1>
            <p>Review buyer tender requests and post them as real, priced tenders — or create one ad hoc — and browse tenders already posted.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 760 }}>
            {error && <p className="admin-alert error">{error}</p>}
            {success && <p className="admin-alert success">{success}</p>}

            <div className="admin-subtabs">
              <button
                type="button"
                className={dashboardTab === 'create' ? 'btn btn-solar' : 'btn btn-outline'}
                onClick={() => setDashboardTab('create')}
              >
                Create Tender
              </button>
              <button
                type="button"
                className={dashboardTab === 'existing' ? 'btn btn-solar' : 'btn btn-outline'}
                onClick={() => setDashboardTab('existing')}
              >
                View Existing Tenders
              </button>
            </div>

            {dashboardTab === 'create' && (
              <>
                <div className="admin-card">
                  <h2>1. Pending tender requests</h2>
                  <button type="button" className="btn btn-outline" onClick={loadRequests}>
                    Load pending requests
                  </button>
                  {requests && (
                    <ul className="admin-list">
                      {requests.map((r) => (
                        <li key={r.id} className="admin-list-row">
                          <span className="row-main">
                            #{r.id} — {r.title}
                            <span className="meta">{r.requiredCapacityMw} MW · buyer org #{r.buyerOrgId}</span>
                          </span>
                          <button type="button" className="link-btn" onClick={() => selectRequest(r)}>
                            Convert this
                          </button>
                        </li>
                      ))}
                      {requests.length === 0 && <li className="admin-list-empty">No pending requests.</li>}
                    </ul>
                  )}
                  <button type="button" className="link-btn" onClick={startAdHoc} style={{ marginTop: '0.85rem' }}>
                    Or create a tender ad hoc (no request)
                  </button>
                </div>

                <form onSubmit={postTender} className="admin-card">
                  <h2>
                    2. {selectedRequest ? `Convert request #${selectedRequest.id}` : 'Tender details'}
                  </h2>
                  {nextTenderId !== null && <span className="admin-field-hint">Auto-generated id: #{nextTenderId}</span>}

                  <div className="admin-field full">
                    <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="admin-field full">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Required capacity (MW)"
                      value={requiredCapacityMw}
                      onChange={(e) => setRequiredCapacityMw(e.target.value)}
                      required
                    />
                  </div>
                  {!selectedRequest && (
                    <div className="admin-field full">
                      <input
                        type="number"
                        placeholder="Buyer organization id"
                        value={buyerOrgId}
                        onChange={(e) => setBuyerOrgId(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="admin-field full">
                    <textarea
                      placeholder="Full requirements (only visible to invited generators)"
                      value={requirementsDetail}
                      onChange={(e) => setRequirementsDetail(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <h3>Per-tender pricing (₹)</h3>
                  <div className="admin-field full">
                    <input type="number" min="0" step="0.01" placeholder="RfS Document / Bid Purchase Fee" value={rfsDocumentFeeRupees} onChange={(e) => setRfsDocumentFeeRupees(e.target.value)} required />
                  </div>
                  <div className="admin-field full">
                    <input type="number" min="0" step="0.01" placeholder="Bid Processing Fee" value={bidProcessingFeeRupees} onChange={(e) => setBidProcessingFeeRupees(e.target.value)} required />
                  </div>
                  <div className="admin-field full">
                    <input type="number" min="0" step="0.01" placeholder="EMD amount (disclosed only — collected as a Bank Guarantee, not a payment)" value={emdAmountRupees} onChange={(e) => setEmdAmountRupees(e.target.value)} required />
                  </div>

                  <h3>Tender documents</h3>
                  <p className="sub sub-tight">
                    RfS document is free to download the moment the tender is posted. Tender document
                    stays locked behind the RfS Document / Bid Purchase fee above. Both optional — add
                    later from "View Existing Tenders" if you don't have them yet.
                  </p>
                  <div className="admin-field-row">
                    <label className="admin-field-hint">RfS document (PDF, free)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setRfsDocumentFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="admin-field-row">
                    <label className="admin-field-hint">Tender document (PDF, paid)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setTenderDocumentFile(e.target.files?.[0] ?? null)} />
                  </div>

                  <h3>Required documents</h3>
                  <p className="sub sub-tight">
                    Every tender starts from this standard checklist. Uncheck anything generators won't
                    need to submit for this particular tender, and add anything extra below — then post.
                  </p>

                  <div className="checklist-envelope">
                    <span className="env-label">Technical envelope</span>
                    <div className="checklist-items">
                      {technicalChecklist.map((f) => (
                        <label key={f.key} className="checklist-row">
                          <input type="checkbox" checked={checklistIncluded[f.key] ?? true} onChange={() => toggleChecklistItem(f.key)} />
                          <span>
                            {f.label}
                            {!f.required && <span className="optional-tag"> (optional)</span>}
                          </span>
                        </label>
                      ))}
                    </div>

                    <span className="env-label">Financial envelope</span>
                    <div className="checklist-items">
                      {financialChecklist.map((f) => (
                        <label key={f.key} className="checklist-row">
                          <input type="checkbox" checked={checklistIncluded[f.key] ?? true} onChange={() => toggleChecklistItem(f.key)} />
                          <span>
                            {f.label}
                            {!f.required && <span className="optional-tag"> (optional)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {extraFields.length > 0 && (
                    <>
                      <span className="env-label">Additional documents (added for this tender)</span>
                      <ul className="checklist-extra-list">
                        {extraFields.map((f) => (
                          <li key={f.key}>
                            <span>
                              [{f.envelope}] {f.label}
                              <span className="req-tag">{f.required ? 'required' : 'optional'}</span>
                            </span>
                            <button type="button" className="link-btn danger" onClick={() => removeExtraField(f.key)}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="admin-field-row" style={{ marginTop: '0.5rem' }}>
                    <select value={newExtraEnvelope} onChange={(e) => setNewExtraEnvelope(e.target.value as 'technical' | 'financial')}>
                      <option value="technical">Technical</option>
                      <option value="financial">Financial</option>
                    </select>
                    <input type="text" placeholder="key (e.g. site_layout_plan)" value={newExtraKey} onChange={(e) => setNewExtraKey(e.target.value)} />
                    <input type="text" placeholder="Label" value={newExtraLabel} onChange={(e) => setNewExtraLabel(e.target.value)} />
                    <label className="checkbox">
                      <input type="checkbox" checked={newExtraRequired} onChange={(e) => setNewExtraRequired(e.target.checked)} /> Required
                    </label>
                    <input type="file" accept="application/pdf" onChange={(e) => setNewExtraTemplate(e.target.files?.[0] ?? null)} />
                    <button type="button" className="btn btn-outline" onClick={addExtraField}>
                      Add extra document
                    </button>
                  </div>

                  <button type="submit" className="btn btn-solar" style={{ marginTop: '1.25rem' }}>
                    {selectedRequest ? 'Post tender (convert request)' : 'Post tender'}
                  </button>
                </form>
              </>
            )}

            {dashboardTab === 'existing' && (
              <>
                <div className="admin-card">
                  <h2>Existing tenders</h2>
                  <button type="button" className="btn btn-outline" onClick={loadAllTenders}>
                    Refresh
                  </button>
                  {allTenders && (
                    <ul className="admin-list">
                      {allTenders.map((t) => (
                        <li key={t.id} className="admin-list-row">
                          <span className="row-main">
                            #{t.id} — {t.title}
                            <span className="meta">{t.requiredCapacityMw} MW</span>
                            <span className={`status-pill ${t.status}`}>{t.status}</span>
                          </span>
                          <button type="button" className="link-btn" onClick={() => viewExistingTender(t.id)}>
                            View details
                          </button>
                        </li>
                      ))}
                      {allTenders.length === 0 && <li className="admin-list-empty">No tenders posted yet.</li>}
                    </ul>
                  )}
                </div>

                <div className="admin-card">
                  <h2>Tender detail</h2>
                  <div className="admin-field-row">
                    <input
                      type="text"
                      placeholder="Tender id"
                      value={tenderRefInput}
                      onChange={(e) => setTenderRefInput(e.target.value)}
                    />
                  </div>
                  <p className="sub sub-tight">Pick a tender above, or type an id directly.</p>

                  <h3>Matched generators</h3>
                  <button type="button" className="btn btn-outline" onClick={loadMatches} disabled={!tenderRefInput}>
                    Load matches
                  </button>
                  {matches && (
                    <ul className="admin-list">
                      {matches.map((m) => (
                        <li key={m.organizationId} className="admin-list-row">
                          <span className="row-main">
                            #{m.organizationId} — {m.name}
                            <span className="meta">{m.capacityMw} MW</span>
                          </span>
                          {m.alreadyInvited && <span className="status-pill invited">invited</span>}
                        </li>
                      ))}
                      {matches.length === 0 && <li className="admin-list-empty">No capacity-matched generators.</li>}
                    </ul>
                  )}

                  <h3>Tender &amp; RfS documents</h3>
                  <div className="admin-field-row">
                    <label className="admin-field-hint">RfS document (PDF, free)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setExistingRfsDocumentFile(e.target.files?.[0] ?? null)} />
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={!tenderRefInput || !existingRfsDocumentFile}
                      onClick={() => uploadExistingTenderDocument('rfs-document', existingRfsDocumentFile)}
                    >
                      Upload / replace
                    </button>
                  </div>
                  <div className="admin-field-row">
                    <label className="admin-field-hint">Tender document (PDF, paid)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setExistingTenderDocumentFile(e.target.files?.[0] ?? null)} />
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={!tenderRefInput || !existingTenderDocumentFile}
                      onClick={() => uploadExistingTenderDocument('tender-document', existingTenderDocumentFile)}
                    >
                      Upload / replace
                    </button>
                  </div>

                  <h3>Document checklist</h3>
                  <button type="button" className="btn btn-outline" onClick={() => loadFields()} disabled={!tenderRefInput}>
                    Load fields
                  </button>
                  {fields && (
                    <ul className="admin-list">
                      {fields.map((f) => (
                        <li key={f.id} className="admin-list-row">
                          <span className="row-main">
                            [{f.envelope}] {f.label}
                            {f.required && <span className="req-tag">required</span>}
                            {f.hasTemplate && <span className="meta">has template</span>}
                          </span>
                          <button type="button" className="link-btn danger" onClick={() => deleteField(f.id)}>
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="admin-field-row" style={{ marginTop: '0.75rem' }}>
                    <form onSubmit={addField} className="admin-field-row" style={{ margin: 0 }}>
                      <select value={newFieldEnvelope} onChange={(e) => setNewFieldEnvelope(e.target.value as 'technical' | 'financial')}>
                        <option value="technical">Technical</option>
                        <option value="financial">Financial</option>
                      </select>
                      <input type="text" placeholder="key (e.g. site_layout_plan)" value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} required />
                      <input type="text" placeholder="Label" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} required />
                      <label className="checkbox">
                        <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} /> Required
                      </label>
                      <input type="file" accept="application/pdf" onChange={(e) => setNewFieldTemplate(e.target.files?.[0] ?? null)} />
                      <button type="submit" className="btn btn-solar">Add field</button>
                    </form>
                  </div>

                  <h3>Review a generator's uploaded documents</h3>
                  <p className="sub sub-tight">
                    Only available once the technical envelope's opening ceremony has run for this
                    tender — these checklist documents are themselves part of the technical bid.
                  </p>
                  <div className="admin-field-row">
                    <input type="text" placeholder="Generator organization id" value={reviewOrgId} onChange={(e) => setReviewOrgId(e.target.value)} />
                    <button type="button" className="btn btn-outline" onClick={loadReviewDocuments} disabled={!tenderRefInput}>
                      Load documents
                    </button>
                  </div>
                  {reviewDocuments && (
                    <ul className="doc-status-list">
                      {reviewDocuments.map((d) => (
                        <li key={d.fieldId}>
                          <span>{d.label}</span>
                          {d.uploaded ? (
                            <span className="doc-uploaded">
                              ✓ {d.originalFilename} {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer">(view)</a>}
                            </span>
                          ) : (
                            <span className="doc-missing">not uploaded</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3>EMD submissions</h3>
                  <p className="sub sub-tight">
                    EMD is a Bank Guarantee document, not a payment — release it once you've physically
                    returned the instrument, or invoke it with the issuing bank if the generator backs out.
                    Both are manual, explicit actions with a required reason.
                  </p>
                  <button type="button" className="btn btn-outline" onClick={loadEmdSubmissions} disabled={!tenderRefInput}>
                    Load EMD submissions
                  </button>
                  {emdSubmissions && (
                    <ul className="emd-list">
                      {emdSubmissions.map((s) => (
                        <li key={s.organizationId} className="emd-row">
                          <div className="row-main">
                            #{s.organizationId} — {s.bankName} / {s.guaranteeNumber} — ₹{(s.amountPaise / 100).toFixed(2)} — valid till {s.validUpto}
                            <span className={`status-pill ${s.status}`}>{s.status}</span>
                            {s.documentUrl && <a href={s.documentUrl} target="_blank" rel="noreferrer">(view document)</a>}
                          </div>
                          {s.resolvedReason && <div className="emd-note">Reason: {s.resolvedReason}</div>}
                          {s.dispatchReference && <div className="emd-note">Dispatch ref: {s.dispatchReference}</div>}
                          {s.status === 'submitted' && (
                            <div className="emd-actions">
                              <input
                                type="text"
                                placeholder="Reason"
                                value={emdReason[s.organizationId] ?? ''}
                                onChange={(e) => setEmdReason((prev) => ({ ...prev, [s.organizationId]: e.target.value }))}
                              />
                              <input
                                type="text"
                                placeholder="Dispatch reference (optional)"
                                value={emdDispatchReference[s.organizationId] ?? ''}
                                onChange={(e) => setEmdDispatchReference((prev) => ({ ...prev, [s.organizationId]: e.target.value }))}
                              />
                              <button type="button" className="btn btn-outline" onClick={() => resolveEmd(s.organizationId, 'release')}>
                                Release
                              </button>
                              <button type="button" className="btn btn-outline" onClick={() => resolveEmd(s.organizationId, 'invoke')}>
                                Invoke
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                      {emdSubmissions.length === 0 && <li className="admin-list-empty">No EMD submissions yet for this tender.</li>}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
