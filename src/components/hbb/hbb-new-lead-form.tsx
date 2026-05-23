/**
 * HBB Home Delivery — New Lead Form
 * Plan → Who is it for? → Inline fields for both self & other
 */
import { useState, useEffect } from 'react';
import {
  Send, MapPin, User, CheckCircle, ChevronDown, Wifi, Mail,
  Home, Clock, Star, Check, X, Calendar, UserCheck, Users, Sparkles, ShoppingCart,
} from 'lucide-react';
import { createServiceRequest, autoAllocateLead, getTowns } from './hbb-api';
import { getEstatesForTown } from './hbb-data';

// ─── Geocoding (Nominatim + Photon fallback) ──────────────────────────────────
// Both APIs are free, require no API key, and are OSM-based.
// Nominatim ToS: must include a descriptive User-Agent header.
async function geocodeEstateAddress(
  estate: string,
  town:   string,
): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${estate}, ${town}, Kenya`);

  // Primary: Nominatim (OpenStreetMap)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ke`,
      {
        headers: { 'User-Agent': 'AirtelChampionsApp/1.0 (contact@airtelchampions.co.ke)' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    }
  } catch { /* fall through to Photon */ }

  // Fallback: Photon (komoot) — faster, no rate limits stated
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${query}&limit=1&lang=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0];
      if (feat) {
        const [lng, lat] = feat.geometry.coordinates as [number, number];
        return { lat, lng };
      }
    }
  } catch { /* silently give up — coords are optional */ }

  return null;
}
import { toast } from 'sonner@2.0.3';
import airtelSmartConnectImg from '../../assets/5cefe3bd8a968e47f850ff725f15f7c1e5cc74bb.png';

const ACCENT = '#E60000';
const ACCENT_DARK = '#E60000';
const CONNECTION_FEE = 1000;

const SMART_CONNECT_PLANS = [
  {
    id: 'sc-15', speed: '15 Mbps', price: 1999, label: 'KES 1,999',
    tag: 'Starter', tagColor: '#E60000', border: '#E60000', bg: '#FFF1F1', highlight: '#E60000',
    description: 'Perfect for browsing, social media & video calls.',
  },
  {
    id: 'sc-30', speed: '30 Mbps', price: 2999, label: 'KES 2,999',
    tag: 'Popular', tagColor: '#E60000', border: '#E60000', bg: '#FFF1F1', highlight: '#E60000',
    description: 'Ideal for streaming, gaming & working from home.',
  },
  {
    id: 'sc-60', speed: '60 Mbps', price: 3999, label: 'KES 3,999',
    tag: 'Superfast', tagColor: '#E60000', border: '#E60000', bg: '#FFF1F1', highlight: '#E60000',
    description: 'Great for families, 4K streaming, and smart homes.',
  },
  {
    id: 'sc-100', speed: '100 Mbps', price: 4999, label: 'KES 4,999',
    tag: 'Ultimate', tagColor: '#E60000', border: '#E60000', bg: '#FFF1F1', highlight: '#E60000',
    description: 'For power users, offices, and heavy downloads.',
  },
];

const SMART_CONNECT_FEATURES = [
  { icon: '🏠', label: 'Weather-Resistant Design — built for all conditions' },
  { icon: '📡', label: 'High-Gain Antenna — strong indoor coverage' },
  { icon: '⚡', label: 'Signal Amplification — stable, uninterrupted connectivity' },
  { icon: '🔩', label: 'Flexible Mounting — walls, poles, or rooftops' },
];

const TIME_SLOTS = [
  'Morning: 8:00 AM – 12:00 PM',
  'Afternoon: 12:00 PM – 4:00 PM',
  'Evening: 4:00 PM – 7:00 PM',
];

const REGIONS = [
  'Nairobi', 'Central', 'Coast', 'Eastern', 'North Eastern',
  'Nyanza', 'Rift Valley', 'Western',
];

// ─── Tiny field helpers ───────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
      {children}
    </label>
  );
}

function FInput({
  value, onChange, placeholder, type = 'text', inputMode, prefix, icon: Icon,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  prefix?: string; icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && !prefix && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-gray-300" />
        </div>
      )}
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <span className="text-sm font-medium text-gray-500 border-r border-gray-200 pr-2.5">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-3.5 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
        style={{ paddingLeft: prefix ? '5.5rem' : Icon ? '2.5rem' : '1rem', color: '#111827' }}
      />
    </div>
  );
}

function FSelect({
  value, onChange, placeholder, children, icon: Icon,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  children: React.ReactNode; icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Icon className="w-4 h-4 text-gray-300" />
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full py-3.5 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none"
        style={{ paddingLeft: Icon ? '2.5rem' : '1rem', color: value ? '#111827' : '#9CA3AF' }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Pricing Summary ──────────────────────────────────────────────────────────
function PricingSummary({ plan, accentColor }: { plan: typeof SMART_CONNECT_PLANS[0]; accentColor: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pricing Summary</p>
      </div>
      <div className="px-4 py-3 bg-white space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Plan Price</span>
          <span className="text-sm font-semibold text-gray-900">{plan.label}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Connection Fee</span>
          <span className="text-sm font-semibold text-gray-900">+ KES 1,000</span>
        </div>
        <div className="border-t border-dashed border-gray-200 pt-2.5 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Total Amount</span>
          <span className="text-lg font-black" style={{ color: accentColor }}>
            KES {(plan.price + CONNECTION_FEE).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  agentName: string;
  agentPhone: string;
  agentRegion?: string;
  onSuccess: () => void;
  // NEW: Source tracking for DSE/Agent leads
  sourceType?: 'dse' | 'public' | 'agent';
  sourceId?: number;
  sourceName?: string;
}

export function HBBNewLeadForm({ 
  agentName, 
  agentPhone, 
  agentRegion, 
  onSuccess,
  sourceType = 'agent',
  sourceId,
  sourceName
}: Props) {
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAllocating, setAutoAllocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCustomer, setSubmittedCustomer] = useState('');
  const [submittedSR, setSubmittedSR] = useState('');
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showTownDropdown, setShowTownDropdown] = useState(false);
  const [showEstateDropdown, setShowEstateDropdown] = useState(false);
  const [estates, setEstates] = useState<string[]>([]);

  // Shopping cart state for multi-item checkout
  interface CartItem {
    id: string;
    plan: typeof SMART_CONNECT_PLANS[0];
    quantity: number;
    customerDetails: {
      fullName: string;
      phone: string;
      altPhone: string;
      date: string;
      time: string;
      building: string;
      street: string;
      town: string;
      estate: string;
      landmark: string;
      email: string;
    };
  }

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof SMART_CONNECT_PLANS[0] | null>(null);
  const [forWhom, setForWhom] = useState<'self' | 'other' | null>(null);

  // Other person details - simplified state like LoginPage
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [town, setTown] = useState('');
  const [estate, setEstate] = useState('');
  const [landmark, setLandmark] = useState('');
  const [email, setEmail] = useState('');
  const [townSearch, setTownSearch] = useState('');
  const [estateSearch, setEstateSearch] = useState('');

  useEffect(() => {
    getTowns().then(data => setTowns(Array.isArray(data) ? data : [])).catch(() => {});
    try {
      const pending = localStorage.getItem('hbb_pending_plan');
      if (pending) {
        const plan = JSON.parse(pending);
        const match = SMART_CONNECT_PLANS.find(p => p.id === plan.id);
        if (match) setSelectedPlan(match);
        localStorage.removeItem('hbb_pending_plan');
      }
    } catch { /* ignore */ }
    
    // For DSE, always use 'other' (for another) and reset form state only once
    if (sourceType === 'dse') {
      setForWhom('other');
      // Reset simplified form state only if already empty
      if (fullName === '' && phone === '' && town === '') {
        setFullName('');
        setPhone('');
        setAltPhone('');
        setDate('');
        setTime('');
        setBuilding('');
        setStreet('');
        setTown('');
        setEstate('');
        setLandmark('');
        setEmail('');
      }
    }
  }, []); // Empty dependency array - run once on mount

  // Load estates when town is selected
  useEffect(() => {
    if (town) {
      const estatesList = getEstatesForTown(town);
      setEstates(estatesList);
      setEstate(''); // Reset estate when town changes
    } else {
      setEstates([]);
      setEstate('');
    }
  }, [town]);

  // Switch between self/other resets the form content for the previous choice
  const handleForWhomChange = (choice: 'self' | 'other') => {
    setForWhom(choice);
  };

  // Generate dynamic time slots from 8am to 6pm
  const generateTimeSlots = (selectedDate: string) => {
    const slots = [];
    const now = new Date();
    const dateObj = selectedDate ? new Date(selectedDate) : null;
    const isToday = dateObj && dateObj.toDateString() === now.toDateString();
    
    for (let hour = 8; hour <= 17; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const slotLabel = `${slotStart} - ${slotEnd}`;
      
      // Check if this slot has passed (only disable for today)
      const slotHour = hour;
      const isPast = isToday && (now.getHours() >= slotHour);
      
      slots.push({
        value: slotLabel,
        label: slotLabel,
        disabled: isPast
      });
    }
    
    return slots;
  };

  const availableTimeSlots = generateTimeSlots(date);

  // Cart management functions
  const addToCart = () => {
    if (!selectedPlan || !fullName.trim() || !phone || !town) {
      toast.error('Please fill all required fields');
      return;
    }

    const cartItem: CartItem = {
      id: Date.now().toString(),
      plan: selectedPlan,
      quantity: 1,
      customerDetails: {
        fullName: fullName.trim(),
        phone: phone,
        altPhone: altPhone,
        date: date,
        time: time,
        building: building,
        street: street,
        town: town,
        estate: estate,
        landmark: landmark,
        email: email,
      },
    };

    setCart(prev => [...prev, cartItem]);
    toast.success('Added to cart!');
    
    // Steve Jobs: Show cart immediately, don't make user lose context
    setShowCart(true);
    
    // Reset form for next item but keep cart visible
    setFullName('');
    setPhone('');
    setAltPhone('');
    setDate('');
    setTime('');
    setBuilding('');
    setStreet('');
    setTown('');
    setEstate('');
    setLandmark('');
    setEmail('');
    setTownSearch('');
    setEstateSearch('');
    setSelectedPlan(null);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.plan.price * item.quantity), 0);
  };

  const checkoutCart = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const promises = cart.map(async (item) => {
        const townId = getRegionTownId(item.customerDetails.town);
        const remarks = [
          item.customerDetails.altPhone && `Alt Phone: +254${item.customerDetails.altPhone}`,
          item.customerDetails.street && `Street: ${item.customerDetails.street}`,
          item.customerDetails.landmark && `Landmark: ${item.customerDetails.landmark}`,
          item.customerDetails.email && `Email: ${item.customerDetails.email}`,
          `Plan: ${item.plan.speed} @ ${item.plan.label}/mo`,
          item.quantity > 1 && `Quantity: ${item.quantity}`,
        ].filter(Boolean).join(' | ');

        // Geocode non-blocking before insert
        const estateForGeo = item.customerDetails.building.trim() || item.customerDetails.estate || item.customerDetails.town;
        const coords = await geocodeEstateAddress(estateForGeo, item.customerDetails.town);

        return await createServiceRequest({
          customer_name:  item.customerDetails.fullName,
          customer_phone: '0' + item.customerDetails.phone,
          town_id:        townId,
          town:           item.customerDetails.town,
          estate:         item.customerDetails.building.trim() || undefined,
          package:        `5G Smart Connect ${item.plan.speed}`,
          preferred_date: item.customerDetails.date || undefined,
          preferred_time: item.customerDetails.time || undefined,
          agent_name:     agentName,
          agent_phone:    agentPhone,
          remarks:        remarks || undefined,
          source_type:    sourceType,
          source_id:      sourceId,
          source_name:    sourceName || agentName,
          customer_lat:   coords?.lat,
          customer_lng:   coords?.lng,
        });
      });

      const results = await Promise.all(promises);
      const srNumbers = results.map(sr => sr.id ? `Job #${String(sr.id).slice(0, 8)}` : 'Lead Created').join(', ');
      
      toast.success(`${cart.length} lead(s) created! ${srNumbers}`);
      setCart([]);
      setShowCart(false);
      setSubmitted(true);
      setSubmittedCustomer('Multiple Customers');
      setSubmittedSR(srNumbers);
    } catch (err: any) {
      console.error('[HBB] Cart checkout error:', err);
      toast.error(err.message || 'Failed to submit some leads');
    } finally {
      setLoading(false);
    }
  };

  const getRegionTownId = (reg: string): number => {
    if (!towns.length) return 1;
    const match = towns.find(t =>
      (t.name || '').toLowerCase().includes(reg.toLowerCase()) ||
      reg.toLowerCase().includes((t.name || '').toLowerCase())
    );
    // Ensure we return a valid number, not NaN
    const fallbackId = towns[0]?.id;
    return match?.id || (fallbackId && !isNaN(fallbackId) ? fallbackId : 1);
  };

  const handleOtherSubmit = async () => {
    if (!selectedPlan || fullName.trim().length < 2 || phone.length < 9 || !town) return;
    setLoading(true);
    try {
      const townId = getRegionTownId(town);
      const remarks = [
        altPhone && `Alt Phone: +254${altPhone}`,
        street && `Street: ${street}`,
        landmark && `Landmark: ${landmark}`,
        email && `Email: ${email}`,
        `Plan: ${selectedPlan.speed} @ ${selectedPlan.label}/mo`,
      ].filter(Boolean).join(' | ');

      // Geocode the estate/town to get coords for radius-based installer matching.
      // Non-blocking: if geocoding fails we still submit the lead (coords are optional).
      const estateForGeo = building.trim() || estate || town;
      const coords = await geocodeEstateAddress(estateForGeo, town);

      const sr = await createServiceRequest({
        customer_name:  fullName.trim(),
        customer_phone: '0' + phone,
        town_id:        townId,
        town:           town,
        estate:         building.trim() || undefined,
        package:        `5G Smart Connect ${selectedPlan.speed}`,
        preferred_date: date || undefined,
        preferred_time: time || undefined,
        agent_name:     agentName,
        agent_phone:    agentPhone,
        remarks:        remarks || undefined,
        source_type:    sourceType,
        source_id:      sourceId,
        source_name:    sourceName || agentName,
        customer_lat:   coords?.lat,
        customer_lng:   coords?.lng,
      });

      toast.success(`Lead created for ${fullName}!`);

      // Auto-allocate in background (no error messages to user)
      console.log('[HBB] Starting auto-allocate with sr.id:', sr.id, 'sr:', sr);
      setAutoAllocating(true);
      try {
        const res = await autoAllocateLead(sr.id);
        console.log('[HBB] Auto-allocate response:', res);
        if (res.allocated) toast.success(`Assigned to ${res.installer_name}`);
      } catch (err: any) {
        console.error('[HBB] Auto-allocate failed (background):', err);
        // Silent background retry - no user notification
      } finally { setAutoAllocating(false); }

      setSubmittedCustomer(fullName.trim());
      setSubmittedSR(sr.id ? `Job #${String(sr.id).slice(0, 8)}` : 'Lead Created');
      setSubmitted(true);
    } catch (err: any) {
      console.error('[HBB] Other submit error:', err);
      toast.error(err.message || 'Failed to submit lead');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPlan(null);
    setForWhom(null);
    setCart([]);
    // Reset simplified state
    setFullName('');
    setPhone('');
    setAltPhone('');
    setDate('');
    setTime('');
    setBuilding('');
    setStreet('');
    setTown('');
    setEstate('');
    setLandmark('');
    setEmail('');
    setSubmitted(false);
    setSubmittedCustomer('');
    setSubmittedSR('');
  };

  const otherIsValid = fullName.trim().length >= 2 && phone.length >= 9 && town.length > 0;

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#ECFDF5' }}>
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {forWhom === 'self' ? 'Order Submitted!' : 'Lead Submitted!'}
        </h2>
        <p className="text-gray-500 text-sm mb-2">{submittedSR} • {submittedCustomer}</p>
        {selectedPlan && (
          <p className="text-xs font-medium mb-6 px-3 py-1.5 rounded-full"
            style={{ background: selectedPlan.bg, color: selectedPlan.highlight }}>
            {selectedPlan.speed} — {selectedPlan.label}/mo + KES 1,000 = KES {(selectedPlan.price + CONNECTION_FEE).toLocaleString()} total
          </p>
        )}
        <div className="flex gap-3 w-full">
          <button onClick={handleReset}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: ACCENT }}>
            {forWhom === 'self' ? 'New Lead' : 'Another Lead'}
          </button>
          <button onClick={onSuccess}
            className="flex-1 py-3 rounded-2xl border-2 font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ borderColor: ACCENT, color: ACCENT }}>
            View Leads
          </button>
        </div>
      </div>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto" style={{ paddingBottom: selectedPlan ? 140 : 40 }}>

        {/* ── Full-width image ──────────────────────────────────────────────── */}
        <div className="w-full bg-white" style={{ height: 220 }}>
          <img
            src={airtelSmartConnectImg}
            alt="Airtel Smart Connect"
            className="w-full h-full object-contain"
          />
        </div>

        {/* ── Product header ────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
              5G Smart Connect — Outdoor Unit
            </span>
          </div>
          <h1 className="text-[22px] font-black text-gray-900 leading-tight">Home Delivery</h1>
          <p className="text-sm text-gray-500 mt-1">Select a plan and fill in the details below.</p>
        </div>

        {/* ── Feature card ─────────────────────────────────────────────────── */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #E60000, #E60000)' }}>
              <p className="text-xs font-bold text-white">5G Smart Connect – Outdoor Unit Features</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {SMART_CONNECT_FEATURES.map(f => (
                <div key={f.label} className="flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5">{f.icon}</span>
                  <p className="text-xs text-gray-600 leading-snug">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Plan selector ────────────────────────────────────────────────── */}
        <div className="px-4 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Select a Plan <span style={{ color: ACCENT }}>*</span>
          </p>
          <button
            type="button"
            onClick={() => setShowPlanPicker(true)}
            className="w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-left flex items-center justify-between transition-all"
            style={{ borderColor: selectedPlan ? selectedPlan.border : '#E5E7EB' }}
          >
            {selectedPlan ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: selectedPlan.tagColor }}>
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">5G Smart Connect — {selectedPlan.speed}</p>
                  <p className="text-xs text-gray-500">
                    {selectedPlan.label}/mo + KES 1,000 = <strong>KES {(selectedPlan.price + CONNECTION_FEE).toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <Wifi className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">Select a plan…</span>
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>

        {/* ── Customer Details (For Another) ─────────────────────────────────── */}
        {selectedPlan && (
          <div className="px-4 mt-6">
            <SectionDivider label="Customer Details" />

            {/* Customer form fields */}
            <div className="space-y-4 mt-3 mb-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input
                  data-testid="customer-name"
                  key="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter customer's full name"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  maxLength={100}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    +254
                  </div>
                  <input
                    data-testid="customer-phone"
                    key="phone"
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setPhone(v);
                    }}
                    placeholder="712345678"
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Alternative Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Alternative Phone</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    +254
                  </div>
                  <input
                    key="altPhone"
                    type="tel"
                    value={altPhone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setAltPhone(v);
                    }}
                    placeholder="712345678"
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Preferred Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Preferred Date</label>
                  <input
                    data-testid="customer-date"
                    key="date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Preferred Time</label>
                  <select
                    data-testid="customer-time"
                    key="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select time</option>
                    {availableTimeSlots.map(slot => (
                      <option 
                        key={slot.value} 
                        value={slot.value}
                        disabled={slot.disabled}
                        style={{ color: slot.disabled ? '#9CA3AF' : '#111827' }}
                      >
                        {slot.label}
                        {slot.disabled && ' (Past)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Building Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Building Name</label>
                <input
                  key="building"
                  type="text"
                  value={building}
                  onChange={e => setBuilding(e.target.value)}
                  placeholder="e.g., KCB Tower, UAP Towers"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  maxLength={100}
                />
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Street Address</label>
                <input
                  key="street"
                  type="text"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="e.g., Mombasa Road, Kaunda Street"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  maxLength={150}
                />
              </div>

              {/* Town */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Town *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowTownDropdown(!showTownDropdown); setTownSearch(''); }}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-600 flex items-center justify-between"
                    style={{ borderColor: showTownDropdown ? '#E60000' : undefined }}
                  >
                    <span className={town ? 'text-gray-900' : 'text-gray-400'}>
                      {town || 'Select town'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showTownDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showTownDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTownDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        {/* Search input */}
                        <div className="p-2 border-b border-gray-100">
                          <input
                            autoFocus
                            type="text"
                            value={townSearch}
                            onChange={e => setTownSearch(e.target.value)}
                            placeholder="Search town..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                          />
                        </div>
                        <div className="max-h-44 overflow-y-auto">
                          {towns.length === 0 ? (
                            <div className="px-3 py-2.5 text-sm text-gray-500">Loading towns...</div>
                          ) : (() => {
                            const filtered = towns.filter(t =>
                              (t.name || '').toLowerCase().includes(townSearch.toLowerCase())
                            );
                            return filtered.length === 0 ? (
                              <div className="px-3 py-2.5 text-sm text-gray-400">No towns match "{townSearch}"</div>
                            ) : filtered.map(t => (
                              <button
                                key={t.name}
                                type="button"
                                onClick={() => { setTown(t.name); setShowTownDropdown(false); setTownSearch(''); }}
                                className="w-full px-3 py-2.5 text-sm text-left hover:bg-red-50 active:bg-red-100 transition-colors flex items-center gap-2"
                                style={{ color: town === t.name ? '#E60000' : '#111827' }}
                              >
                                {town === t.name && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E60000' }} />}
                                <span className={town === t.name ? 'font-semibold' : ''}>{t.name}</span>
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Estate */}
              {town && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estate</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowEstateDropdown(!showEstateDropdown); setEstateSearch(''); }}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-600 flex items-center justify-between"
                      style={{ borderColor: showEstateDropdown ? '#E60000' : undefined }}
                    >
                      <span className={estate ? 'text-gray-900' : 'text-gray-400'}>
                        {estate || 'Select estate'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showEstateDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showEstateDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEstateDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                          {/* Search input */}
                          <div className="p-2 border-b border-gray-100">
                            <input
                              autoFocus
                              type="text"
                              value={estateSearch}
                              onChange={e => setEstateSearch(e.target.value)}
                              placeholder="Search estate..."
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                            />
                          </div>
                          <div className="max-h-44 overflow-y-auto">
                            {estates.length === 0 ? (
                              <div className="px-3 py-2.5 text-sm text-gray-500">No estates available</div>
                            ) : (() => {
                              const filtered = estates.filter(e =>
                                e.toLowerCase().includes(estateSearch.toLowerCase())
                              );
                              return filtered.length === 0 ? (
                                <div className="px-3 py-2.5 text-sm text-gray-400">No estates match "{estateSearch}"</div>
                              ) : filtered.map(estateName => (
                                <button
                                  key={estateName}
                                  type="button"
                                  onClick={() => { setEstate(estateName); setShowEstateDropdown(false); setEstateSearch(''); }}
                                  className="w-full px-3 py-2.5 text-sm text-left hover:bg-red-50 active:bg-red-100 transition-colors flex items-center gap-2"
                                  style={{ color: estate === estateName ? '#E60000' : '#111827' }}
                                >
                                  {estate === estateName && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E60000' }} />}
                                  <span className={estate === estateName ? 'font-semibold' : ''}>{estateName}</span>
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Nearest Landmark */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nearest Landmark</label>
                <input
                  key="landmark"
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g., Near Nairobi Hospital, Next to Kenyatta Avenue"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  maxLength={150}
                />
              </div>
            </div>
          </div>
        )}

    </div>

      {/* ── Sticky action footer — always visible ─────────────────────────────── */}
      {selectedPlan && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 pt-3 pb-4 safe-bottom"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}>
          {/* Cart badge */}
          {cart.length > 0 && (
            <button
              onClick={() => setShowCart(!showCart)}
              className="w-full mb-2.5 py-2.5 rounded-xl border-2 border-purple-200 bg-purple-50 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ color: '#7C3AED' }}
            >
              <ShoppingCart className="w-4 h-4" />
              View Cart ({cart.length} items) · KES {getTotalPrice().toLocaleString()}
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={addToCart}
              disabled={!otherIsValid || loading}
              className="flex-1 py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all shadow-md"
              style={{ background: otherIsValid && !loading ? 'linear-gradient(135deg, #10B981, #059669)' : '#D1D5DB' }}
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              data-testid="submit-lead"
              onClick={handleOtherSubmit}
              disabled={!otherIsValid || loading || autoAllocating}
              className="flex-1 py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all shadow-md"
              style={{ background: otherIsValid && !loading ? 'linear-gradient(135deg, #E60000, #E60000)' : '#D1D5DB' }}
            >
              {loading || autoAllocating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {autoAllocating ? 'Assigning…' : 'Submitting…'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Lead
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Steve Jobs' Persistent Cart Sidebar ───────────────────────────────── */}
      {showCart && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex">
          {/* Cart Sidebar */}
          <div className="w-full max-w-sm bg-white shadow-2xl"
               style={{ animation: 'slideInRight 0.3s ease-out' }}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Cart</h3>
                  <p className="text-sm text-gray-500">{cart.length} items</p>
                </div>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="p-4 space-y-3">
                {cart.map((item, index) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.plan.speed}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="font-medium">{item.customerDetails.fullName}</div>
                          <div>0{item.customerDetails.phone}</div>
                          <div>{item.customerDetails.town}</div>
                          {item.customerDetails.estate && <div>{item.customerDetails.estate}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Qty:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-purple-600">
                        KES {(item.plan.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bottom Actions */}
            <div className="border-t-2 border-gray-100 bg-white px-4 pt-3 pb-4" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-xl font-black text-purple-600">KES {getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm active:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add More
                </button>
                <button
                  onClick={checkoutCart}
                  disabled={loading || cart.length === 0}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.97] shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: !loading && cart.length > 0 ? 'linear-gradient(135deg, #E60000, #E60000)' : '#D1D5DB' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit {cart.length} Lead{cart.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Steve Jobs: Dark overlay for focus */}
          <div 
            className="flex-1"
            onClick={() => setShowCart(false)}
          />
        </div>
      )}

      {/* ── Plan picker modal (centered) ─────────────────────────────────────────── */}
      {showPlanPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" style={{ pointerEvents: 'auto', touchAction: 'none' }}>
          <div className="bg-white rounded-3xl w-11/12 max-w-sm flex flex-col overflow-hidden" 
            style={{ animation: 'fadeIn 0.3s ease-out', touchAction: 'none', pointerEvents: 'auto' }}>
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Select Plan</h3>
                <p className="text-xs text-gray-400">5G Smart Connect – Outdoor Unit</p>
              </div>
              <button onClick={() => setShowPlanPicker(false)}
                className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[calc(90vh-120px)] overflow-y-auto" style={{ touchAction: 'manipulation' }}>
              {SMART_CONNECT_PLANS.map(plan => {
                const isSel = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan); setShowPlanPicker(false); }}
                    className="w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.98]"
                    style={{ borderColor: isSel ? plan.border : '#E5E7EB', background: isSel ? plan.bg : '#FFFFFF' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                          style={{ background: plan.tagColor }}>{plan.tag}</span>
                        <span className="text-sm font-bold text-gray-900">{plan.speed}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: isSel ? plan.border : '#D1D5DB', background: isSel ? plan.border : 'transparent' }}>
                        {isSel && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-xl font-black" style={{ color: plan.highlight }}>
                      {plan.label}<span className="text-xs font-normal text-gray-400"> /month</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.label} + KES 1,000 = <strong>KES {(plan.price + CONNECTION_FEE).toLocaleString()} total</strong>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  );
}
