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
  buyerName: string | null;
  buyerCompany: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
}

interface Match {
  organizationId: number;
  name: string;
  capacityMw: string;
  alreadyInvited: boolean;
}

interface CeremonySchedule {
  bidSubmissionDeadline: string | null;
  technicalBidOpenAt: string | null;
  financialBidOpenAt: string | null;
  technicalCeremony: { notifiedCount: number; totalCustodians: number; completed: boolean };
  financialCeremony: { notifiedCount: number; totalCustodians: number; completed: boolean };
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's own local time, not the ISO string
// the server returns — mirrors the same conversion the create-tender form already does in reverse.
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DocumentField {
  id: number;
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
  hasTemplate: boolean;
  templateUrl: string | null;
}

interface TenderSummary {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
}

interface TenderHistoryEntry {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
  useLandedRate: boolean;
  createdAt: string;
  buyer: { id: number; name: string; email: string } | null;
  auction: {
    id: number;
    status: 'scheduled' | 'live' | 'closed';
    openingBid: string;
    winningBid: string | null;
    winner: { alias: string; organizationName: string | null; rate: string | null; returnPercent: string | null } | null;
  } | null;
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

function defaultChecklistRequiredState(): Record<string, boolean> {
  return Object.fromEntries(DEFAULT_DOCUMENT_CHECKLIST.map((f) => [f.key, f.required]));
}

interface ExtraDocField {
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
  template: File | null;
}

interface NewFieldRow {
  envelope: 'technical' | 'financial';
  key: string;
  label: string;
  required: boolean;
  template: File | null;
}

function emptyFieldRow(): NewFieldRow {
  return { envelope: 'technical', key: '', label: '', required: true, template: null };
}

export default function AdminConsolePage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dashboardTab, setDashboardTab] = useState<'create' | 'existing' | 'history'>('create');

  const [tenderHistory, setTenderHistory] = useState<TenderHistoryEntry[] | null>(null);

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

  // Ceremony scheduling — required, strictly ordered (bidSubmissionDeadline < technicalBidOpenAt <
  // financialBidOpenAt; see routes/tenders.ts's postTenderBodySchema). technicalBidOpenAt/
  // financialBidOpenAt drive when custodian ceremony invites are emailed automatically.
  const [bidSubmissionDeadline, setBidSubmissionDeadline] = useState('');
  const [technicalBidOpenAt, setTechnicalBidOpenAt] = useState('');
  const [financialBidOpenAt, setFinancialBidOpenAt] = useState('');

  // Per-tender switch: landed-rate auction (equityValue/totalUnitsPerYear required below) vs a
  // normal-rate auction (today's original behavior — a single rate, lowest wins). Defaults off,
  // matching the DB default, so this stays opt-in per tender.
  const [useLandedRate, setUseLandedRate] = useState(false);
  // Landed-rate live-auction inputs (see auctionEngine.ts's computeLandedRate on the server) —
  // only required/sent when useLandedRate is checked above, copied onto the Auction row this
  // tender eventually promotes to.
  const [equityValue, setEquityValue] = useState('');
  const [totalUnitsPerYear, setTotalUnitsPerYear] = useState('');
  // Capacity alone doesn't say how many units a plant actually delivers over a year — CUF (Capacity
  // Utilisation Factor) is the missing piece (see content.ts's own glossary entry: "Indian solar
  // plants typically run at 19–22% CUF"). 21 is this range's midpoint, not a measured figure — purely
  // a starting point admin can override with a real site estimate when they have one, same as every
  // other pre-filled default on this form.
  const [cufPercent, setCufPercent] = useState('21');

  // The two tender-level PDFs — free RfS document, and the tender document gated behind the RfS
  // Document / Bid Purchase fee. Distinct from the per-field checklist below.
  const [rfsDocumentFile, setRfsDocumentFile] = useState<File | null>(null);
  const [tenderDocumentFile, setTenderDocumentFile] = useState<File | null>(null);

  // Document checklist configuration — shown and editable BEFORE the tender is posted (§2.1 of the
  // tender/auction PRD). The server always seeds the full default list on creation; the deltas here
  // (unchecked defaults, added extras) are applied as a follow-up pass right after, over the
  // existing add/delete endpoints — there's no dedicated "create with this exact list" endpoint.
  const [checklistIncluded, setChecklistIncluded] = useState<Record<string, boolean>>(defaultChecklistState());
  const [checklistRequired, setChecklistRequired] = useState<Record<string, boolean>>(defaultChecklistRequiredState());
  // Standard-format templates staged for a checklist item before the tender exists — key is the
  // standard field's key, uploaded as a follow-up pass in applyDocumentChecklist once real field
  // ids exist, same as the required-override pass.
  const [standardTemplates, setStandardTemplates] = useState<Record<string, File | null>>({});
  const [extraFields, setExtraFields] = useState<ExtraDocField[]>([]);
  const [newExtraRows, setNewExtraRows] = useState<NewFieldRow[]>([emptyFieldRow()]);

  const [allTenders, setAllTenders] = useState<TenderSummary[] | null>(null);

  const [tenderRefInput, setTenderRefInput] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [ceremonySchedule, setCeremonySchedule] = useState<CeremonySchedule | null>(null);
  const [editBidSubmissionDeadline, setEditBidSubmissionDeadline] = useState('');
  const [editTechnicalBidOpenAt, setEditTechnicalBidOpenAt] = useState('');
  const [editFinancialBidOpenAt, setEditFinancialBidOpenAt] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [submittingTender, setSubmittingTender] = useState(false);
  const [submittingFieldRows, setSubmittingFieldRows] = useState(false);
  const [addingStandardField, setAddingStandardField] = useState(false);
  const [deletingFieldId, setDeletingFieldId] = useState<number | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingAllTenders, setLoadingAllTenders] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTenderDetail, setLoadingTenderDetail] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingFieldsList, setLoadingFieldsList] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  const [fields, setFields] = useState<DocumentField[] | null>(null);
  const [newFieldRows, setNewFieldRows] = useState<NewFieldRow[]>([emptyFieldRow()]);
  const [standardFieldToAdd, setStandardFieldToAdd] = useState('');
  const [uploadingTemplateFieldId, setUploadingTemplateFieldId] = useState<number | null>(null);

  const [existingRfsDocumentFile, setExistingRfsDocumentFile] = useState<File | null>(null);
  const [existingTenderDocumentFile, setExistingTenderDocumentFile] = useState<File | null>(null);

  async function loadRequests() {
    setError(null);
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/api/tender-requests`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tender requests');
    } finally {
      setLoadingRequests(false);
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
    setLoadingAllTenders(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders`);
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setAllTenders(data.tenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing tenders');
    } finally {
      setLoadingAllTenders(false);
    }
  }

  async function loadTenderHistory() {
    setError(null);
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setTenderHistory(data.tenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tender history');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadNextTenderId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps total units/year in sync with capacity × CUF while landed-rate is on — recomputed live so
  // adjusting either input immediately shows its effect. The field underneath stays a normal,
  // directly-editable input (not disabled) for a final hand override; changing capacity or CUF again
  // afterward resyncs it, same tradeoff as any other spreadsheet-style derived field.
  useEffect(() => {
    if (!useLandedRate) return;
    const capacityNum = Number(requiredCapacityMw);
    const cufNum = Number(cufPercent);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0 || !Number.isFinite(cufNum) || cufNum <= 0) return;
    const unitsPerYear = capacityNum * 1000 * 8760 * (cufNum / 100);
    setTotalUnitsPerYear(String(Math.round(unitsPerYear)));
  }, [useLandedRate, requiredCapacityMw, cufPercent]);

  useEffect(() => {
    if (dashboardTab === 'existing' && allTenders === null) loadAllTenders();
    if (dashboardTab === 'history' && tenderHistory === null) loadTenderHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardTab]);

  // The error banner renders once, at the top of this long page — a validation error from a form
  // buried far down the page (e.g. "Add extra document" clicked without a key/label) otherwise looks
  // like the button did nothing at all, since the only feedback lands off-screen above the fold.
  useEffect(() => {
    if (error) document.querySelector('.admin-alert.error')?.scrollIntoView({ block: 'center' });
  }, [error]);

  function selectRequest(r: PendingRequest) {
    setSelectedRequest(r);
    setTitle(r.title);
    // '0' is registrations.ts's placeholder for "no capacity given at registration time" — left
    // blank here (rather than prefilled as "0") since it's not a real value and the field is
    // required, forcing a conscious entry instead of a confusing pre-filled zero.
    setRequiredCapacityMw(Number(r.requiredCapacityMw) > 0 ? r.requiredCapacityMw : '');
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

  function toggleChecklistRequired(key: string) {
    setChecklistRequired((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateExtraRow(index: number, patch: Partial<NewFieldRow>) {
    setNewExtraRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addExtraRow() {
    setNewExtraRows((prev) => [...prev, emptyFieldRow()]);
  }

  function removeExtraRow(index: number) {
    setNewExtraRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  // Stages every filled-in row into extraFields at once — same "+ add a row, fill several, commit
  // together" pattern as the batch add-field form in View Existing Tenders, just staged locally
  // instead of posted immediately (the tender doesn't exist yet at this point).
  function commitExtraRows() {
    const rowsToAdd = newExtraRows.filter((r) => r.key.trim() && r.label.trim());
    if (rowsToAdd.length === 0) {
      setError('Add at least one extra document with a key and a label');
      return;
    }
    setError(null);
    setExtraFields((prev) => [
      ...prev,
      ...rowsToAdd.map((r) => ({ envelope: r.envelope, key: r.key.trim(), label: r.label.trim(), required: r.required, template: r.template })),
    ]);
    setNewExtraRows([emptyFieldRow()]);
  }

  function removeExtraField(key: string) {
    setExtraFields((prev) => prev.filter((f) => f.key !== key));
  }

  // Applies the admin's checklist configuration to the just-created tender: the server always seeds
  // the full default list on POST /tenders, so unchecked defaults are removed here, and any admin-
  // added extras are added here — both over tenderDocuments.ts's existing per-field endpoints.
  // Returns a list of what failed (empty if everything applied) — every call here used to be
  // fire-and-forget with no check on the response, so a single field customization failing (a
  // duplicate key, a bad template upload) was silently dropped while the caller still reported
  // "tender posted successfully," leaving the admin believing the checklist matched what they'd
  // configured when it might not have. Each item is still attempted independently — one failure
  // doesn't stop the rest — matching this codebase's usual "don't let one failure take down the
  // others" pattern for batch operations.
  async function applyDocumentChecklist(tenderId: number): Promise<string[]> {
    const failures: string[] = [];
    const uncheckedKeys = new Set(DEFAULT_DOCUMENT_CHECKLIST.filter((f) => !checklistIncluded[f.key]).map((f) => f.key));
    // Standard fields whose required/optional toggle was flipped away from its default — the
    // server always seeds the default's own `required` value, so these need a follow-up PATCH.
    const requiredOverrides = new Map(
      DEFAULT_DOCUMENT_CHECKLIST.filter((f) => checklistIncluded[f.key] && checklistRequired[f.key] !== f.required).map((f) => [f.key, checklistRequired[f.key]])
    );
    // Standard-format templates staged before the tender existed — DEFAULT_DOCUMENT_CHECKLIST has
    // no template of its own, so any of these need a follow-up upload once real field ids exist.
    const templatesToUpload = new Map(
      DEFAULT_DOCUMENT_CHECKLIST.filter((f) => checklistIncluded[f.key] && standardTemplates[f.key]).map((f) => [f.key, standardTemplates[f.key] as File])
    );
    if (uncheckedKeys.size > 0 || requiredOverrides.size > 0 || templatesToUpload.size > 0) {
      try {
        const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) {
          failures.push('Could not load the checklist back to apply your customizations');
        } else {
          for (const f of data.fields as DocumentField[]) {
            if (uncheckedKeys.has(f.key)) {
              const delRes = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields/${f.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!delRes.ok) failures.push(`Failed to remove "${f.label}" from the checklist`);
              continue;
            }
            if (requiredOverrides.has(f.key)) {
              const patchRes = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields/${f.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ required: requiredOverrides.get(f.key) }),
              });
              if (!patchRes.ok) failures.push(`Failed to update the required/optional setting for "${f.label}"`);
            }
            if (templatesToUpload.has(f.key)) {
              const templateForm = new FormData();
              templateForm.append('template', templatesToUpload.get(f.key) as File);
              const templateRes = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields/${f.id}/template`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: templateForm,
              });
              if (!templateRes.ok) failures.push(`Failed to upload the template for "${f.label}"`);
            }
          }
        }
      } catch (err) {
        failures.push(err instanceof Error ? err.message : 'Failed to apply checklist customizations');
      }
    }

    for (const extra of extraFields) {
      try {
        const form = new FormData();
        form.append('envelope', extra.envelope);
        form.append('key', extra.key);
        form.append('label', extra.label);
        form.append('required', String(extra.required));
        if (extra.template) form.append('template', extra.template);
        const extraRes = await fetch(`${API_BASE}/api/tenders/${tenderId}/document-fields`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!extraRes.ok) failures.push(`Failed to add the extra document "${extra.label}"`);
      } catch (err) {
        failures.push(err instanceof Error ? err.message : `Failed to add the extra document "${extra.label}"`);
      }
    }

    return failures;
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

    if (!bidSubmissionDeadline || !technicalBidOpenAt || !financialBidOpenAt) {
      setError('Set all three ceremony dates: bid submission deadline, technical opening, and financial opening.');
      return;
    }
    const equityValueNum = Number(equityValue);
    const totalUnitsPerYearNum = Number(totalUnitsPerYear);
    if (useLandedRate) {
      if (!equityValue || !Number.isFinite(equityValueNum) || equityValueNum <= 0) {
        setError('Equity value must be a positive number.');
        return;
      }
      if (!totalUnitsPerYear || !Number.isFinite(totalUnitsPerYearNum) || totalUnitsPerYearNum <= 0) {
        setError('Total units/year must be a positive number.');
        return;
      }
    }
    // datetime-local inputs have no timezone of their own — new Date() reads them in the browser's
    // local time, and toISOString() converts to the UTC-with-Z shape the backend's zod schema
    // requires (z.string().datetime()) and its own ordering check compares against.
    const bidSubmissionDeadlineIso = new Date(bidSubmissionDeadline).toISOString();
    const technicalBidOpenAtIso = new Date(technicalBidOpenAt).toISOString();
    const financialBidOpenAtIso = new Date(financialBidOpenAt).toISOString();
    if (new Date(bidSubmissionDeadlineIso).getTime() <= Date.now()) {
      setError('Bid submission deadline must be in the future.');
      return;
    }
    if (new Date(technicalBidOpenAtIso).getTime() <= new Date(bidSubmissionDeadlineIso).getTime()) {
      setError('Technical opening must be after the bid submission deadline.');
      return;
    }
    if (new Date(financialBidOpenAtIso).getTime() <= new Date(technicalBidOpenAtIso).getTime()) {
      setError('Financial opening must be after the technical opening.');
      return;
    }

    // Guards against a double-click creating two tenders — the ad-hoc path (no tenderRequestId) has
    // no server-side idempotency check the way converting a request does (that one blocks reuse once
    // its status flips to 'converted'), so this is the only thing standing between a slow connection
    // and a duplicate.
    if (submittingTender) return;
    setSubmittingTender(true);
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
          bidSubmissionDeadline: bidSubmissionDeadlineIso,
          technicalBidOpenAt: technicalBidOpenAtIso,
          financialBidOpenAt: financialBidOpenAtIso,
          useLandedRate,
          equityValue: useLandedRate ? equityValueNum : undefined,
          totalUnitsPerYear: useLandedRate ? totalUnitsPerYearNum : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);

      const tenderId = data.tenderId as number;
      const checklistFailures = await applyDocumentChecklist(tenderId);
      if (rfsDocumentFile) await uploadTenderDocument(tenderId, 'rfs-document', rfsDocumentFile);
      if (tenderDocumentFile) await uploadTenderDocument(tenderId, 'tender-document', tenderDocumentFile);

      setSuccess(`Tender #${tenderId} posted — ${data.autoInvitedOrganizationIds.length} generator(s) auto-invited.`);
      // The tender itself was created fine — this is specifically about checklist customizations
      // that may not have applied, surfaced separately so it doesn't get lost inside (or silently
      // contradict) the success message above.
      if (checklistFailures.length > 0) {
        setError(`Tender posted, but some checklist customizations didn't apply — check and redo manually: ${checklistFailures.join('; ')}`);
      }
      setSelectedRequest(null);
      setTenderRefInput(String(tenderId));
      setChecklistIncluded(defaultChecklistState());
      setChecklistRequired(defaultChecklistRequiredState());
      setStandardTemplates({});
      setExtraFields([]);
      setNewExtraRows([emptyFieldRow()]);
      setRfsDocumentFile(null);
      setTenderDocumentFile(null);
      setBidSubmissionDeadline('');
      setTechnicalBidOpenAt('');
      setFinancialBidOpenAt('');
      setUseLandedRate(false);
      setEquityValue('');
      setTotalUnitsPerYear('');
      setCufPercent('21');
      await loadRequests();
      await loadNextTenderId();
      setAllTenders(null);
      // Show the finalized document checklist immediately, reflecting whatever was unchecked/added
      // above — otherwise the admin has no visibility into the real end state until they separately
      // load fields for a tender id they'd have to know.
      await loadFields(String(tenderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post tender');
    } finally {
      setSubmittingTender(false);
    }
  }

  // Selecting a tender (from the dropdown below, or "View details" in the list above) loads both
  // its matched generators and its document checklist right away — previously both needed a
  // separate manual "Load" click even after picking a tender, which was pure friction, not a real
  // choice point.
  async function selectTenderDetail(idStr: string) {
    setTenderRefInput(idStr);
    setMatches(null);
    setFields(null);
    setCeremonySchedule(null);
    setScheduleMessage(null);
    if (!idStr) return;
    setLoadingTenderDetail(true);
    try {
      await Promise.all([loadMatches(idStr), loadFields(idStr), loadCeremonySchedule(idStr)]);
    } finally {
      setLoadingTenderDetail(false);
    }
  }

  async function loadCeremonySchedule(idOverride?: string) {
    setScheduleMessage(null);
    setLoadingSchedule(true);
    try {
      const id = idOverride ?? tenderRefInput;
      const res = await fetch(`${API_BASE}/api/tenders/${id}/ceremony-dates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      const schedule: CeremonySchedule = {
        bidSubmissionDeadline: data.bidSubmissionDeadline,
        technicalBidOpenAt: data.technicalBidOpenAt,
        financialBidOpenAt: data.financialBidOpenAt,
        technicalCeremony: data.technicalCeremony,
        financialCeremony: data.financialCeremony,
      };
      setCeremonySchedule(schedule);
      setEditBidSubmissionDeadline(toDatetimeLocal(schedule.bidSubmissionDeadline));
      setEditTechnicalBidOpenAt(toDatetimeLocal(schedule.technicalBidOpenAt));
      setEditFinancialBidOpenAt(toDatetimeLocal(schedule.financialBidOpenAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ceremony schedule');
    } finally {
      setLoadingSchedule(false);
    }
  }

  // datetime-local has no timezone of its own — new Date() reads it in the browser's local time,
  // same conversion the create-tender form already relies on for these same two fields.
  async function saveCeremonySchedule() {
    setScheduleMessage(null);
    setError(null);
    if (!tenderRefInput) return;
    setSavingSchedule(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/ceremony-schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bidSubmissionDeadline: new Date(editBidSubmissionDeadline).toISOString(),
          technicalBidOpenAt: new Date(editTechnicalBidOpenAt).toISOString(),
          financialBidOpenAt: new Date(editFinancialBidOpenAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setScheduleMessage(data.error);
        return;
      }
      setScheduleMessage('Ceremony schedule updated.');
      await loadCeremonySchedule();
    } catch (err) {
      setScheduleMessage(err instanceof Error ? err.message : 'Failed to update ceremony schedule');
    } finally {
      setSavingSchedule(false);
    }
  }

  function viewExistingTender(id: number) {
    void selectTenderDetail(String(id));
  }

  async function loadMatches(idOverride?: string) {
    setError(null);
    setMatches(null);
    setLoadingMatches(true);
    try {
      const id = idOverride ?? tenderRefInput;
      const res = await fetch(`${API_BASE}/api/tenders/${id}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoadingMatches(false);
    }
  }

  async function loadFields(idOverride?: string) {
    setError(null);
    setLoadingFieldsList(true);
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
    } finally {
      setLoadingFieldsList(false);
    }
  }

  function updateFieldRow(index: number, patch: Partial<NewFieldRow>) {
    setNewFieldRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addFieldRow() {
    setNewFieldRows((prev) => [...prev, emptyFieldRow()]);
  }

  function removeFieldRow(index: number) {
    setNewFieldRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  // Submits every row that has both a key and a label in one go — added so the admin can stage
  // several new checklist documents at once instead of re-filling and submitting the form per field.
  async function submitFieldRows(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const rowsToAdd = newFieldRows.filter((r) => r.key.trim() && r.label.trim());
    if (rowsToAdd.length === 0) {
      setError('Add at least one document field with a key and a label');
      return;
    }
    setSubmittingFieldRows(true);
    try {
      for (const row of rowsToAdd) {
        const form = new FormData();
        form.append('envelope', row.envelope);
        form.append('key', row.key.trim());
        form.append('label', row.label.trim());
        form.append('required', String(row.required));
        if (row.template) form.append('template', row.template);
        const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || `Failed to add document field "${row.label}"`);
      }
      setNewFieldRows([emptyFieldRow()]);
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document field(s)');
    } finally {
      setSubmittingFieldRows(false);
    }
  }

  // Re-adds a document that was originally part of the standard checklist (DEFAULT_DOCUMENT_CHECKLIST)
  // but got deleted from this specific tender — looks up its exact key/label/envelope/required from
  // the standard list so the admin doesn't have to retype them by hand in the generic add-field form.
  async function addStandardField() {
    setError(null);
    const standard = DEFAULT_DOCUMENT_CHECKLIST.find((f) => f.key === standardFieldToAdd);
    if (!standard) return;
    setAddingStandardField(true);
    try {
      const form = new FormData();
      form.append('envelope', standard.envelope);
      form.append('key', standard.key);
      form.append('label', standard.label);
      form.append('required', String(standard.required));
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setStandardFieldToAdd('');
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-add document field');
    } finally {
      setAddingStandardField(false);
    }
  }

  async function deleteField(fieldId: number) {
    setError(null);
    setDeletingFieldId(fieldId);
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
    } finally {
      setDeletingFieldId(null);
    }
  }

  // Flips required/optional on an already-posted tender's field in place — keeps whatever uploads
  // already exist against it, unlike delete-then-re-add which cascades those away.
  async function toggleFieldRequired(fieldId: number, required: boolean) {
    setError(null);
    setFields((prev) => (prev ? prev.map((f) => (f.id === fieldId ? { ...f, required } : f)) : prev));
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ required }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        await loadFields();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document field');
      await loadFields();
    }
  }

  // Uploads the moment a file is picked — a separate "Upload" click on top of the file picker was
  // just a redundant second step for what is, from the admin's point of view, one action.
  async function uploadFieldTemplate(fieldId: number, file: File) {
    setError(null);
    setUploadingTemplateFieldId(fieldId);
    try {
      const form = new FormData();
      form.append('template', file);
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRefInput}/document-fields/${fieldId}/template`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload template');
    } finally {
      setUploadingTemplateFieldId(null);
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
              <button
                type="button"
                className={dashboardTab === 'history' ? 'btn btn-solar' : 'btn btn-outline'}
                onClick={() => setDashboardTab('history')}
              >
                Tender History
              </button>
            </div>

            {dashboardTab === 'create' && (
              <>
                <div className="admin-card">
                  <h2>1. Pending tender requests</h2>
                  <button type="button" className="btn btn-outline" onClick={loadRequests} disabled={loadingRequests}>
                    {loadingRequests ? 'Loading…' : 'Load pending requests'}
                  </button>
                  {requests && (
                    <ul className="admin-list">
                      {requests.map((r) => {
                        const metaParts = [
                          r.buyerName,
                          r.buyerCompany && r.buyerCompany !== r.buyerName ? r.buyerCompany : null,
                          r.buyerEmail,
                          r.buyerPhone,
                          Number(r.requiredCapacityMw) > 0 ? `${r.requiredCapacityMw} MW` : 'capacity not given — fill in below',
                          `buyer org #${r.buyerOrgId}`,
                        ].filter(Boolean);
                        return (
                          <li key={r.id} className="admin-list-row">
                            <span className="row-main">
                              #{r.id} — {r.title}
                              <span className="meta">{metaParts.join(' · ')}</span>
                            </span>
                            <button type="button" className="link-btn" onClick={() => selectRequest(r)}>
                              Convert this
                            </button>
                          </li>
                        );
                      })}
                      {requests.length === 0 && <li className="admin-list-empty">No pending requests.</li>}
                    </ul>
                  )}
                  <button type="button" className="link-btn" onClick={startAdHoc} style={{ display: 'block', marginTop: '0.85rem' }}>
                    Or create a tender ad hoc (no request)
                  </button>
                </div>

                <form onSubmit={postTender} className="admin-card">
                  <h2>
                    2. {selectedRequest ? `Convert request #${selectedRequest.id}` : 'Tender details'}
                  </h2>
                  {nextTenderId !== null && <span className="admin-field-hint">Auto-generated id: #{nextTenderId}</span>}

                  <div className="admin-field full">
                    <label className="admin-field-hint" htmlFor="tenderTitle">Title</label>
                    <input id="tenderTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="admin-field-grid">
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderCapacity">Required capacity (MW)</label>
                      <input
                        id="tenderCapacity"
                        type="number"
                        min="1"
                        step="1"
                        value={requiredCapacityMw}
                        onChange={(e) => setRequiredCapacityMw(e.target.value)}
                        required
                      />
                    </div>
                    {!selectedRequest && (
                      <div className="admin-field">
                        <label className="admin-field-hint" htmlFor="tenderBuyerOrgId">Buyer organization id</label>
                        <input
                          id="tenderBuyerOrgId"
                          type="number"
                          value={buyerOrgId}
                          onChange={(e) => setBuyerOrgId(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                  <div className="admin-field full">
                    <label className="admin-field-hint" htmlFor="tenderRequirements">Full requirements (only visible to invited generators)</label>
                    <textarea
                      id="tenderRequirements"
                      value={requirementsDetail}
                      onChange={(e) => setRequirementsDetail(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <h3>Per-tender pricing (₹)</h3>
                  <div className="admin-field-grid">
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderRfsFee">RfS Document / Bid Purchase Fee</label>
                      <input id="tenderRfsFee" type="number" min="0" step="0.01" value={rfsDocumentFeeRupees} onChange={(e) => setRfsDocumentFeeRupees(e.target.value)} required />
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderBidProcessingFee">Bid Processing Fee</label>
                      <input id="tenderBidProcessingFee" type="number" min="0" step="0.01" value={bidProcessingFeeRupees} onChange={(e) => setBidProcessingFeeRupees(e.target.value)} required />
                    </div>
                  </div>
                  <div className="admin-field full">
                    <label className="admin-field-hint" htmlFor="tenderEmdAmount">EMD amount (disclosed only — collected as a Bank Guarantee, not a payment)</label>
                    <input id="tenderEmdAmount" type="number" min="0" step="0.01" value={emdAmountRupees} onChange={(e) => setEmdAmountRupees(e.target.value)} required />
                  </div>

                  <h3>Ceremony dates</h3>
                  <p className="sub sub-tight">
                    Strictly ordered — bid submission closes first, then the technical envelope opens,
                    then the financial envelope. Custodians are emailed their ceremony link automatically
                    the moment each opening date arrives.
                  </p>
                  <div className="admin-field-grid">
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderBidDeadline">Bid submission deadline</label>
                      <input id="tenderBidDeadline" type="datetime-local" value={bidSubmissionDeadline} onChange={(e) => setBidSubmissionDeadline(e.target.value)} required />
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderTechnicalOpen">Technical envelope opens</label>
                      <input id="tenderTechnicalOpen" type="datetime-local" value={technicalBidOpenAt} onChange={(e) => setTechnicalBidOpenAt(e.target.value)} required />
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-hint" htmlFor="tenderFinancialOpen">Financial envelope opens</label>
                      <input id="tenderFinancialOpen" type="datetime-local" value={financialBidOpenAt} onChange={(e) => setFinancialBidOpenAt(e.target.value)} required />
                    </div>
                  </div>

                  <h3>Auction economics</h3>
                  <label className="checkbox">
                    <input type="checkbox" checked={useLandedRate} onChange={(e) => setUseLandedRate(e.target.checked)} /> Landed-rate auction
                  </label>
                  {useLandedRate ? (
                    <>
                      <p className="sub sub-tight">
                        Feeds the live auction's landed-rate formula: landed rate = rate − (returns% ×
                        equity value) / total units per year. A generator's landed rate, not their raw
                        rate, decides the leader once the auction is live.
                      </p>
                      <div className="admin-field-grid">
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="tenderEquityValue">Equity value</label>
                          <input id="tenderEquityValue" type="number" min="0" step="0.01" value={equityValue} onChange={(e) => setEquityValue(e.target.value)} required />
                        </div>
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="tenderCuf">CUF % (defaults to 21, tweak for this site)</label>
                          <input id="tenderCuf" type="number" min="1" max="100" step="0.1" value={cufPercent} onChange={(e) => setCufPercent(e.target.value)} />
                        </div>
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="tenderTotalUnitsPerYear">
                            Total units/year (auto: capacity × 8760h × CUF — editable)
                          </label>
                          <input id="tenderTotalUnitsPerYear" type="number" min="0" step="0.01" value={totalUnitsPerYear} onChange={(e) => setTotalUnitsPerYear(e.target.value)} required />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="sub sub-tight">
                      Off — this tender's eventual auction uses a single rate, lowest wins, exactly as before.
                    </p>
                  )}

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
                        <div key={f.key} className="checklist-row">
                          <label className="checklist-row-main">
                            <input type="checkbox" checked={checklistIncluded[f.key] ?? true} onChange={() => toggleChecklistItem(f.key)} />
                            <span>{f.label}</span>
                          </label>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={checklistRequired[f.key] ?? f.required}
                              disabled={!(checklistIncluded[f.key] ?? true)}
                              onChange={() => toggleChecklistRequired(f.key)}
                            />{' '}
                            Required
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={!(checklistIncluded[f.key] ?? true)}
                            onChange={(e) => setStandardTemplates((prev) => ({ ...prev, [f.key]: e.target.files?.[0] ?? null }))}
                          />
                        </div>
                      ))}
                    </div>

                    <span className="env-label">Financial envelope</span>
                    <div className="checklist-items">
                      {financialChecklist.map((f) => (
                        <div key={f.key} className="checklist-row">
                          <label className="checklist-row-main">
                            <input type="checkbox" checked={checklistIncluded[f.key] ?? true} onChange={() => toggleChecklistItem(f.key)} />
                            <span>{f.label}</span>
                          </label>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={checklistRequired[f.key] ?? f.required}
                              disabled={!(checklistIncluded[f.key] ?? true)}
                              onChange={() => toggleChecklistRequired(f.key)}
                            />{' '}
                            Required
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={!(checklistIncluded[f.key] ?? true)}
                            onChange={(e) => setStandardTemplates((prev) => ({ ...prev, [f.key]: e.target.files?.[0] ?? null }))}
                          />
                        </div>
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

                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {newExtraRows.map((row, i) => (
                      <div className="admin-field-row" key={i}>
                        <select value={row.envelope} onChange={(e) => updateExtraRow(i, { envelope: e.target.value as 'technical' | 'financial' })}>
                          <option value="technical">Technical</option>
                          <option value="financial">Financial</option>
                        </select>
                        <input type="text" placeholder="key (e.g. site_layout_plan)" value={row.key} onChange={(e) => updateExtraRow(i, { key: e.target.value })} />
                        <input type="text" placeholder="Label" value={row.label} onChange={(e) => updateExtraRow(i, { label: e.target.value })} />
                        <label className="checkbox">
                          <input type="checkbox" checked={row.required} onChange={(e) => updateExtraRow(i, { required: e.target.checked })} /> Required
                        </label>
                        <input type="file" accept="application/pdf" onChange={(e) => updateExtraRow(i, { template: e.target.files?.[0] ?? null })} />
                        {newExtraRows.length > 1 && (
                          <button type="button" className="link-btn danger" onClick={() => removeExtraRow(i)}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="admin-field-row">
                      <button type="button" className="btn btn-outline" onClick={addExtraRow}>
                        + Add another document field
                      </button>
                      <button type="button" className="btn btn-outline" onClick={commitExtraRows}>
                        Add extra document(s)
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-solar" style={{ marginTop: '1.25rem' }} disabled={submittingTender}>
                    {submittingTender ? 'Posting…' : selectedRequest ? 'Post tender (convert request)' : 'Post tender'}
                  </button>
                </form>
              </>
            )}

            {dashboardTab === 'existing' && (
              <>
                <div className="admin-card">
                  <h2>Existing tenders</h2>
                  <button type="button" className="btn btn-outline" onClick={loadAllTenders} disabled={loadingAllTenders}>
                    {loadingAllTenders ? 'Refreshing…' : 'Refresh'}
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
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => viewExistingTender(t.id)}
                            disabled={loadingTenderDetail && tenderRefInput === String(t.id)}
                          >
                            {loadingTenderDetail && tenderRefInput === String(t.id) ? 'Loading…' : 'View details'}
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
                    <select value={tenderRefInput} onChange={(e) => void selectTenderDetail(e.target.value)}>
                      <option value="">Select a tender…</option>
                      {allTenders?.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          #{t.id} — {t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="sub sub-tight">Matched generators and the document checklist load automatically once you pick a tender.</p>

                  <h3>Matched generators</h3>
                  <button type="button" className="btn btn-outline" onClick={() => loadMatches()} disabled={!tenderRefInput || loadingMatches}>
                    {loadingMatches ? 'Refreshing…' : 'Refresh matches'}
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

                  <h3>Ceremony schedule</h3>
                  <button type="button" className="btn btn-outline" onClick={() => loadCeremonySchedule()} disabled={!tenderRefInput || loadingSchedule}>
                    {loadingSchedule ? 'Refreshing…' : 'Refresh schedule'}
                  </button>
                  {ceremonySchedule && (
                    <>
                      <div className="admin-field-grid" style={{ marginTop: '0.85rem' }}>
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="editBidSubmissionDeadline">
                            Bid submission deadline
                            {ceremonySchedule.technicalCeremony.completed && ' — technical ceremony already completed, locked'}
                          </label>
                          <input
                            id="editBidSubmissionDeadline"
                            type="datetime-local"
                            value={editBidSubmissionDeadline}
                            onChange={(e) => setEditBidSubmissionDeadline(e.target.value)}
                            disabled={ceremonySchedule.technicalCeremony.completed}
                          />
                        </div>
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="editTechnicalBidOpenAt">
                            Technical envelope opens
                            {ceremonySchedule.technicalCeremony.completed && ' — ceremony already completed, locked'}
                          </label>
                          <input
                            id="editTechnicalBidOpenAt"
                            type="datetime-local"
                            value={editTechnicalBidOpenAt}
                            onChange={(e) => setEditTechnicalBidOpenAt(e.target.value)}
                            disabled={ceremonySchedule.technicalCeremony.completed}
                          />
                        </div>
                        <div className="admin-field">
                          <label className="admin-field-hint" htmlFor="editFinancialBidOpenAt">
                            Financial envelope opens
                            {ceremonySchedule.financialCeremony.completed && ' — ceremony already completed, locked'}
                          </label>
                          <input
                            id="editFinancialBidOpenAt"
                            type="datetime-local"
                            value={editFinancialBidOpenAt}
                            onChange={(e) => setEditFinancialBidOpenAt(e.target.value)}
                            disabled={ceremonySchedule.financialCeremony.completed}
                          />
                        </div>
                      </div>
                      <p className="sub sub-tight">
                        Technical: {ceremonySchedule.technicalCeremony.notifiedCount}/{ceremonySchedule.technicalCeremony.totalCustodians} custodians
                        notified{ceremonySchedule.technicalCeremony.completed ? ', ceremony completed' : ''}. Financial:{' '}
                        {ceremonySchedule.financialCeremony.notifiedCount}/{ceremonySchedule.financialCeremony.totalCustodians} custodians
                        notified{ceremonySchedule.financialCeremony.completed ? ', ceremony completed' : ''}. A date can't be changed once a custodian
                        has already started or completed that ceremony — the submission deadline locks along with the technical envelope, since
                        moving it later after that ceremony opens would let a new bid in after everyone else's were supposed to be final.
                      </p>
                      <button
                        type="button"
                        className="btn btn-solar"
                        onClick={() => void saveCeremonySchedule()}
                        disabled={savingSchedule || (ceremonySchedule.technicalCeremony.completed && ceremonySchedule.financialCeremony.completed)}
                      >
                        {savingSchedule ? 'Saving…' : 'Save schedule'}
                      </button>
                      {scheduleMessage && <p className="admin-alert">{scheduleMessage}</p>}
                    </>
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
                  <p className="sub sub-tight">The documents selected when this tender was created.</p>
                  <button type="button" className="btn btn-outline" onClick={() => loadFields()} disabled={!tenderRefInput || loadingFieldsList}>
                    {loadingFieldsList ? 'Refreshing…' : 'Refresh checklist'}
                  </button>
                  {fields && (
                    <ul className="admin-list">
                      {fields.map((f) => (
                        <li key={f.id} className="doc-field-row">
                          <div className="doc-field-row-top">
                            <span className="row-main">
                              [{f.envelope}] {f.label}
                              {f.templateUrl && (
                                <a href={f.templateUrl} target="_blank" rel="noreferrer" className="meta">
                                  view format
                                </a>
                              )}
                            </span>
                            <label className="checkbox">
                              <input
                                type="checkbox"
                                checked={f.required}
                                onChange={(e) => toggleFieldRequired(f.id, e.target.checked)}
                              />{' '}
                              Required
                            </label>
                          </div>
                          <div className="doc-field-row-bottom">
                            <div className="doc-field-upload">
                              <input
                                type="file"
                                accept="application/pdf"
                                disabled={uploadingTemplateFieldId === f.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadFieldTemplate(f.id, file);
                                }}
                              />
                              {uploadingTemplateFieldId === f.id && <span className="meta">Uploading…</span>}
                            </div>
                            <button type="button" className="link-btn danger" onClick={() => deleteField(f.id)} disabled={deletingFieldId === f.id}>
                              {deletingFieldId === f.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                      {fields.length === 0 && <li className="admin-list-empty">No document fields on this tender.</li>}
                    </ul>
                  )}

                  {fields && (() => {
                    const missingStandard = DEFAULT_DOCUMENT_CHECKLIST.filter((sf) => !fields.some((f) => f.key === sf.key));
                    if (missingStandard.length === 0) return null;
                    return (
                      <div className="admin-field-row" style={{ marginTop: '0.75rem' }}>
                        <select value={standardFieldToAdd} onChange={(e) => setStandardFieldToAdd(e.target.value)}>
                          <option value="">Re-add a removed standard document…</option>
                          {missingStandard.map((sf) => (
                            <option key={sf.key} value={sf.key}>
                              [{sf.envelope}] {sf.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-outline" disabled={!standardFieldToAdd || addingStandardField} onClick={addStandardField}>
                          {addingStandardField ? 'Adding…' : 'Add back'}
                        </button>
                      </div>
                    );
                  })()}

                  <form onSubmit={submitFieldRows} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {newFieldRows.map((row, i) => (
                      <div className="admin-field-row" key={i}>
                        <select value={row.envelope} onChange={(e) => updateFieldRow(i, { envelope: e.target.value as 'technical' | 'financial' })}>
                          <option value="technical">Technical</option>
                          <option value="financial">Financial</option>
                        </select>
                        <input type="text" placeholder="key (e.g. site_layout_plan)" value={row.key} onChange={(e) => updateFieldRow(i, { key: e.target.value })} />
                        <input type="text" placeholder="Label" value={row.label} onChange={(e) => updateFieldRow(i, { label: e.target.value })} />
                        <label className="checkbox">
                          <input type="checkbox" checked={row.required} onChange={(e) => updateFieldRow(i, { required: e.target.checked })} /> Required
                        </label>
                        <input type="file" accept="application/pdf" onChange={(e) => updateFieldRow(i, { template: e.target.files?.[0] ?? null })} />
                        {newFieldRows.length > 1 && (
                          <button type="button" className="link-btn danger" onClick={() => removeFieldRow(i)}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="admin-field-row">
                      <button type="button" className="btn btn-outline" onClick={addFieldRow}>
                        + Add another document field
                      </button>
                      <button type="submit" className="btn btn-solar" disabled={!tenderRefInput || submittingFieldRows}>
                        {submittingFieldRows ? 'Adding…' : 'Add field(s)'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {dashboardTab === 'history' && (
              <div className="admin-card">
                <h2>Tender history</h2>
                <p className="sub sub-tight">Every tender ever posted — its buyer, and once its auction has run, who won and at what price.</p>
                <button type="button" className="btn btn-outline" onClick={loadTenderHistory} disabled={loadingHistory}>
                  {loadingHistory ? 'Refreshing…' : 'Refresh'}
                </button>
                {tenderHistory && (
                  <ul className="admin-list">
                    {tenderHistory.map((t) => (
                      <li key={t.id} className="admin-list-row">
                        <span className="row-main">
                          #{t.id} — {t.title}
                          <span className="meta">{t.requiredCapacityMw} MW</span>
                          <span className={`status-pill ${t.status}`}>{t.status}</span>
                          <span className="meta">Buyer: {t.buyer?.name ?? 'unknown'}</span>
                        </span>
                        <span className="meta">
                          {!t.auction && 'Not yet promoted to auction'}
                          {t.auction && t.auction.status !== 'closed' && `Auction #${t.auction.id} — ${t.auction.status}`}
                          {t.auction && t.auction.status === 'closed' && t.auction.winner && (
                            <>
                              Won by {t.auction.winner.organizationName ?? t.auction.winner.alias} at ₹{t.auction.winningBid}/unit
                              {t.useLandedRate && t.auction.winner.rate !== null && t.auction.winner.returnPercent !== null && (
                                <> (raw rate ₹{t.auction.winner.rate}, returns {t.auction.winner.returnPercent}%)</>
                              )}
                            </>
                          )}
                          {t.auction && t.auction.status === 'closed' && !t.auction.winner && 'Closed — no winner'}
                        </span>
                      </li>
                    ))}
                    {tenderHistory.length === 0 && <li className="admin-list-empty">No tenders posted yet.</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
