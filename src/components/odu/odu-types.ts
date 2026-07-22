// ODU Retrieval — shared types + status maps
// Backing tables/RPCs: supabase/migrations/20260713_odu_retrieval_infrastructure.sql

export type OduRequestStatus =
  | 'new' | 'contacting' | 'confirmed' | 'allocated' | 'accepted' | 'collected'
  | 'delivered' | 'flagged' | 'payable' | 'paid' | 'not_paid' | 'not_recovered';

export type NotRecoveredReason =
  | 'no_funds' | 'network' | 'seasonal' | 'faulty_odu' | 'switched_isp'
  | 'customer_declined' | 'door_refusal' | 'unreachable' | 'other';

export type CallOutcome =
  | 'no_answer' | 'callback_later' | 'confirmed' | 'declined' | 'wrong_number';

export type DeviceMatchStatus = 'pending' | 'matched' | 'mismatch' | 'duplicate';

export interface OduBatch {
  id: string;
  filename: string;
  status: 'staged' | 'live' | 'rolled_back';
  total_records: number;
  warnings_count: number;
  uploaded_by: string | null;
  uploaded_at: string;
  went_live_at: string | null;
  rolled_back_at: string | null;
  rolled_back_reason: string | null;
}

export interface OduCustomer {
  id: string;
  batch_id: string | null;
  msisdn: string;
  customer_name: string;
  account_number: string | null;
  town: string | null;
  estate: string | null;
  lat: number | null;
  lng: number | null;
  expected_units: number;
  original_imei: string | null;
}

export interface OduRequest {
  id: string;
  customer_id: string;
  status: OduRequestStatus;
  not_recovered_reason: NotRecoveredReason | null;
  cx_phone: string | null;
  consent_given_at: string | null;
  capture_estate: string | null;
  capture_house: string | null;
  capture_notes: string | null;
  retrieval_date: string | null;
  customer_lat: number | null;
  customer_lng: number | null;
  installer_id: number | null;
  installer_name: string | null;
  allocated_at: string | null;
  accept_deadline: string | null;
  accepted_at: string | null;
  rejected_by: number[];
  rejection_count: number;
  collected_at: string | null;
  consent_doc_url: string | null;
  collection_lat: number | null;
  collection_lng: number | null;
  warehouse_id: string | null;
  delivered_at: string | null;
  payable_amount: number | null;
  payment_batch_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined convenience fields (from odu_inactive_customers)
  customer?: OduCustomer;
}

export interface OduDevice {
  id: string;
  request_id: string;
  imei: string | null;
  mac: string | null;
  capture_method: 'scan' | 'manual' | null;
  label_photo_url: string | null;
  captured_by: string | null;
  captured_at: string | null;
  wh_imei: string | null;
  wh_mac: string | null;
  wh_capture_method: 'scan' | 'manual' | null;
  wh_captured_by: string | null;
  wh_captured_at: string | null;
  match_status: DeviceMatchStatus;
  flag_notes: string | null;
}

export interface OduWarehouse {
  id: string;
  name: string;
  town: string;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
}

export interface OduPaymentBatch {
  id: string;
  month_year: string;
  status: 'draft' | 'exported' | 'paid';
  total_units: number;
  total_amount: number;
  generated_by: string | null;
  generated_at: string;
  exported_at: string | null;
  paid_at: string | null;
}

// ─── Display maps ────────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<OduRequestStatus, string> = {
  new: 'New', contacting: 'Contacting', confirmed: 'Confirmed', allocated: 'Allocated',
  accepted: 'Accepted', collected: 'Collected', delivered: 'Delivered', flagged: 'Flagged',
  payable: 'Payable', paid: 'Paid', not_paid: 'Not Paid', not_recovered: 'Not Recovered',
};

// Tailwind-ish colour tokens (hex) for badges — matches the workflow SVG palette
export const STATUS_COLOR: Record<OduRequestStatus, { bg: string; fg: string }> = {
  new:           { bg: '#F4F1F2', fg: '#5F5E5A' },
  contacting:    { bg: '#FAEEDA', fg: '#5A3A06' },
  confirmed:     { bg: '#E1F5EE', fg: '#04342C' },
  allocated:     { bg: '#FBEFD0', fg: '#5A3A06' },
  accepted:      { bg: '#E1F5EE', fg: '#04342C' },
  collected:     { bg: '#E8F0FE', fg: '#1A3E8C' },
  delivered:     { bg: '#E1F5EE', fg: '#04342C' },
  flagged:       { bg: '#FCEBEB', fg: '#501313' },
  payable:       { bg: '#EAF3DE', fg: '#173404' },
  paid:          { bg: '#DCFCE7', fg: '#14532D' },
  not_paid:      { bg: '#FCEBEB', fg: '#501313' },
  not_recovered: { bg: '#FCEBEB', fg: '#501313' },
};

export const NOT_RECOVERED_REASONS: { value: NotRecoveredReason; label: string }[] = [
  { value: 'no_funds',          label: 'No funds' },
  { value: 'network',           label: 'Network issue' },
  { value: 'seasonal',          label: 'Seasonal / travelling' },
  { value: 'faulty_odu',        label: 'Faulty ODU' },
  { value: 'switched_isp',      label: 'Switched ISP' },
  { value: 'customer_declined', label: 'Customer declined' },
  { value: 'door_refusal',      label: 'Refused at door' },
  { value: 'unreachable',       label: 'Unreachable' },
  { value: 'other',             label: 'Other' },
];

/** The pipeline stages in funnel order, for HQ analytics. */
export const FUNNEL_ORDER: OduRequestStatus[] = [
  'new', 'contacting', 'confirmed', 'allocated', 'accepted',
  'collected', 'delivered', 'payable', 'paid',
];
