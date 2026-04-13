/**
 * HBB Lead Agent Sign Up — Steve Jobs-inspired
 * Steps: 1=Phone, 2=About Yourself, 3=Home Delivery (plan + for self OR other inline), 4=Welcome
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowLeft, User, MapPin, CheckCircle2, Sparkles,
  Shield, Wifi, Search, ChevronDown, Check, Calendar, Clock,
  Home, Mail, Star, Users, UserCheck, ChevronRight, Zap, Navigation,
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { createServiceRequest, getTowns, get14Towns, getEstatesForTownFromDB } from './hbb/hbb-api';
import { getEstatesForTown } from './hbb/hbb-data';
import { TrackingScreen } from './TrackingScreen';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';
import airtelChampionsLogo from 'figma:asset/278c018c02387a7b630c9971b1a9e2245143943d.png';
import airtelSmartConnectImg from 'figma:asset/5cefe3bd8a968e47f850ff725f15f7c1e5cc74bb.png';

const ACCENT = '#E60000';
const ACCENT_DARK = '#B30000';
const CONNECTION_FEE = 1000;

// ─── Data ─────────────────────────────────────────────────────────────────────
const REGIONS = [
  'Nairobi', 'Central', 'Coast', 'Eastern', 'North Eastern',
  'Nyanza', 'Rift Valley', 'Western',
];

const TOWNS_BY_REGION: Record<string, string[]> = {
  'Nairobi': [
    'Nairobi CBD', 'Westlands', 'Karen', 'Langata', 'Embakasi', 'Kasarani',
    'Ruaraka', 'Dagoretti', 'Starehe', 'Roysambu', 'Makadara', 'Kibra',
    'Ruiru', 'Thika', 'Kiambu', 'Kikuyu', 'Limuru', 'Githunguri',
    'Spring Valley', 'Kilimani', 'Lavington', 'Runda', 'Muthaiga',
    'South B', 'South C', 'Eastleigh', 'Pangani', 'Huruma', 'Mathare',
  ],
  'Central': [
    'Nyeri', 'Muranga', 'Thika', 'Ruiru', 'Kiambu', 'Kikuyu', 'Limuru',
    'Kirinyaga', 'Kerugoya', 'Karatina', 'Nanyuki', 'Nyahururu', 'Ol Kalou',
    'Githunguri', 'Othaya', 'Maragua', 'Kenol', 'Kabati', 'Wangige',
  ],
  'Coast': [
    'Mombasa CBD', 'Nyali', 'Diani', 'Kilifi', 'Malindi', 'Watamu',
    'Kwale', 'Voi', 'Lamu', 'Mariakani', 'Ukunda', 'Shanzu', 'Bamburi',
    'Changamwe', 'Likoni', 'Mtongwe', 'Msambweni',
  ],
  'Eastern': [
    'Machakos', 'Kitui', 'Meru', 'Embu', 'Isiolo', 'Chuka', 'Nkubu',
    'Meru Town', 'Wote', 'Mutomo', 'Marsabit', 'Tharaka', 'Mwingi',
    'Athi River', 'Kangundo', 'Matuu', 'Makueni',
  ],
  'North Eastern': ['Garissa', 'Wajir', 'Mandera', 'Moyale', 'Dadaab', 'Liboi', 'Rhamu', 'Elwak'],
  'Nyanza': [
    'Kisumu', 'Kisii', 'Homa Bay', 'Migori', 'Siaya', 'Nyamira',
    'Kendu Bay', 'Rongo', 'Oyugis', 'Awendo', 'Bondo', 'Ugunja',
    'Ahero', 'Muhoroni', 'Maseno', 'Kombewa',
  ],
  'Rift Valley': [
    'Nakuru', 'Eldoret', 'Kericho', 'Bomet', 'Naivasha', 'Narok',
    'Kitale', 'Eldama Ravine', 'Iten', 'Kabarnet', 'Kapenguria',
    'Lodwar', 'Maralal', 'Rumuruti', 'Sotik', 'Litein', 'Molo',
    'Njoro', 'Gilgil', 'Mai Mahiu', 'Burnt Forest', 'Turbo',
  ],
  'Western': [
    'Kakamega', 'Bungoma', 'Busia', 'Vihiga', 'Mumias', 'Webuye',
    'Malaba', 'Lugari', 'Butali', 'Chwele', 'Nambale', 'Luanda', 'Mbale',
  ],
};

// Flatten all towns from all regions for use in 'For Another' section
const ALL_TOWNS = Object.values(TOWNS_BY_REGION).flat().sort();

const SMART_CONNECT_PLANS = [
  {
    id: 'sc-15', speed: '15 Mbps', price: 1999, label: 'KES 1,999',
    tag: 'Starter', tagColor: '#3B82F6', border: '#3B82F6', bg: '#EFF6FF', highlight: '#1D4ED8',
    description: 'Perfect for browsing, social media & video calls.',
  },
  {
    id: 'sc-30', speed: '30 Mbps', price: 2999, label: 'KES 2,999',
    tag: 'Most Popular', tagColor: '#E60000', border: '#E60000', bg: '#FFF1F1', highlight: '#B30000',
    description: 'Ideal for streaming, gaming & working from home.',
  },
];

const SMART_CONNECT_FEATURES = [
  { icon: '🏠', title: 'Weather-Resistant', desc: 'Performs in all conditions.' },
  { icon: '📡', title: 'High-Gain Antenna', desc: 'Strong indoor coverage.' },
  { icon: '⚡', title: 'Signal Amplification', desc: 'Stable & uninterrupted.' },
  { icon: '🔩', title: 'Flexible Mounting', desc: 'Walls, poles or rooftops.' },
];

const TIME_SLOTS = [
  { label: '08:00 – 09:00', value: '08:00' },
  { label: '09:00 – 10:00', value: '09:00' },
  { label: '10:00 – 11:00', value: '10:00' },
  { label: '11:00 – 12:00', value: '11:00' },
  { label: '12:00 – 13:00', value: '12:00' },
  { label: '13:00 – 14:00', value: '13:00' },
  { label: '14:00 – 15:00', value: '14:00' },
  { label: '15:00 – 16:00', value: '15:00' },
  { label: '16:00 – 17:00', value: '16:00' },
  { label: '17:00 – 18:00', value: '17:00' },
];

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Towns covered by the in-house installer dispatch system
const HBB_INSTALL_TOWNS = [
  'Bungoma', 'Eldoret', 'Garissa', 'Kakamega', 'Kilifi', 'Kisii',
  'Kisumu', 'Kitale', 'Machakos', 'Meru', 'Migori', 'Mombasa', 'Nairobi', 'Nakuru', 'Thika',
];

// ─── Helpers ───────────────────────────���─────────────────────────────────────
const normalizePhone = (ph: string): string => {
  let n = ph.trim().replace(/[\s\-\(\)]/g, '');
  if (n.startsWith('+254')) n = n.substring(4);
  else if (n.startsWith('254')) n = n.substring(3);
  else if (n.startsWith('0')) n = n.substring(1);
  return n;
};
const formatPhoneDisplay = (val: string) => {
  const d = val.replace(/\D/g, '');
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 10)}`;
};

// ─── Searchable Dropdown ──────────────────────────────────────────────────────
function SearchableDropdown({
  label, value, options, onSelect, placeholder, icon: Icon, disabled = false,
}: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
  placeholder: string; icon: React.ElementType; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <button
          type="button" disabled={disabled}
          onClick={() => { setOpen(!open); setSearch(''); }}
          className={`w-full pl-10 pr-9 py-3.5 text-sm font-medium text-left bg-white border-2 rounded-xl focus:outline-none transition-all disabled:opacity-40 ${open ? 'border-red-500 ring-4 ring-red-50' : 'border-gray-200'}`}
          style={{ color: value ? '#111827' : '#9CA3AF' }}
        >
          {value || placeholder}
        </button>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 placeholder-gray-300 text-gray-900"
                    style={{ color: '#111827' }} />
                </div>
              </div>
              <div className="overflow-y-auto max-h-44">
                {filtered.length === 0
                  ? <p className="text-xs text-gray-400 text-center py-4">No results</p>
                  : filtered.map(opt => (
                    <button key={opt} onClick={() => { onSelect(opt); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${value === opt ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >{opt}</button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Tiny field helpers ───────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{children}</label>;
}
function FInput({ value, onChange, placeholder, type = 'text', inputMode, prefix, icon: Icon }: {
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
      <input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-3.5 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
        style={{ paddingLeft: prefix ? '5.5rem' : Icon ? '2.5rem' : '1rem', color: '#111827' }} />
    </div>
  );
}
function FSelect({ value, onChange, placeholder, children, icon: Icon }: {
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
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full py-3.5 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none"
        style={{ paddingLeft: Icon ? '2.5rem' : '1rem', color: value ? '#111827' : '#9CA3AF' }}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SignupScreenProps {
  onBackToLogin: () => void;
  onBackToHome?: () => void;
  onSignupSuccess?: (user: any) => void;
  isFromClientHome?: boolean;
}

export function SignupScreen({ onBackToLogin, onBackToHome, onSignupSuccess, isFromClientHome }: SignupScreenProps) {
  // 3 steps only now
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [towns, setTowns] = useState<any[]>([]);
  const [displayPin, setDisplayPin] = useState('');
  const [selfOrderSRNumber, setSelfOrderSRNumber] = useState('');

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState<any>(null);

  // Step 1 — phone + email
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Step 2 — installation town + estate
  const [installTown, setInstallTown] = useState('');
  const [installEstate, setInstallEstate] = useState('');
  const [estates, setEstates] = useState<string[]>([]);
  const [estatesLoading, setEstatesLoading] = useState(false);
  // Step 2 — GPS auto-detect
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  // Step 3 — address
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  // Step 4 — plan
  const [selectedPlan, setSelectedPlan] = useState<typeof SMART_CONNECT_PLANS[0] | null>(null);
  // Step 5 — who + timing
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [town, setTown] = useState('');
  const [installTiming, setInstallTiming] = useState<'immediate' | 'schedule' | null>(null);
  const [forWhom, setForWhom] = useState<'self' | 'other' | null>(null);
  const [installerSearching, setInstallerSearching] = useState(false);
  const [noInstallerMsg, setNoInstallerMsg] = useState('');
  const [installerJobId, setInstallerJobId] = useState<string | null>(null);

  // Self extra
  const [self, setSelfState] = useState({ altPhone: '', date: '', time: '', building: '', street: '', landmark: '', email: '' });
  const setSelf = (f: Partial<typeof self>) => setSelfState(p => ({ ...p, ...f }));

  // Other person
  const [other, setOtherState] = useState({ fullName: '', phone: '', altPhone: '', date: '', time: '', building: '', street: '', region: '', landmark: '', email: '', town: '', estate: '' });
  const setOther = (f: Partial<typeof other>) => setOtherState(p => ({ ...p, ...f }));

  // Database towns (from DSE_14TOWNS) and estates for "For Another" section
  const [dbTowns14, setDbTowns14] = useState<string[]>([]);
  const [dbEstatesForOther, setDbEstatesForOther] = useState<string[]>([]);
  const [loadingOtherEstates, setLoadingOtherEstates] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 1) phoneRef.current?.focus();
      else if (step === 2) nameRef.current?.focus();
    }, 400);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => { setTown(''); }, [region]);

  // Fetch towns using Supabase directly to avoid CORS
  useEffect(() => {
    async function loadTowns() {
      try {
        const { data, error } = await supabase
          .from('DSE_14TOWNS')
          .select('Town')
          .not('Town', 'is', null);
        
        if (error) {
          console.error('[loadTowns] Error:', error);
          setTowns([]);
          return;
        }
        
        const uniqueTowns = [...new Set((data || []).map((r: any) => r.Town).filter(Boolean))].sort();
        console.log('[loadTowns] Loaded towns:', uniqueTowns.length);
        setTowns(uniqueTowns.length > 0 ? uniqueTowns : []);
      } catch (e) {
        console.error('[loadTowns] Exception:', e);
        setTowns([]);
      }
    }
    loadTowns();
  }, []);

  // Fetch 14 towns from DSE_14TOWNS table for "For Another" section (using Supabase directly to avoid CORS)
  useEffect(() => {
    async function load14Towns() {
      try {
        const { data, error } = await supabase
          .from('DSE_14TOWNS')
          .select('Town')
          .not('Town', 'is', null);
        
        if (error) {
          console.error('[load14Towns] Error:', error);
          setDbTowns14(ALL_TOWNS as string[]);
          return;
        }
        
        const uniqueTowns = [...new Set((data || []).map((r: any) => r.Town).filter(Boolean))].sort() as string[];
        console.log('[load14Towns] Loaded towns:', uniqueTowns.length);
        setDbTowns14(uniqueTowns.length > 0 ? uniqueTowns : ALL_TOWNS as string[]);
      } catch (e) {
        console.error('[load14Towns] Exception:', e);
        setDbTowns14(ALL_TOWNS as string[]);
      }
    }
    load14Towns();
  }, []);

  // Fetch estates from database when town is selected for "For Another" (using Supabase directly)
  useEffect(() => {
    async function loadEstatesForOther() {
      if (!other.town) {
        setDbEstatesForOther([]);
        return;
      }
      setLoadingOtherEstates(true);
      try {
        const { data, error } = await supabase
          .from('DSE_14TOWNS')
          .select('"Estate Name"')
          .ilike('Town', other.town)
          .not('"Estate Name"', 'is', null);
        
        if (error) {
          console.error('[loadEstatesForOther] Error:', error);
          setDbEstatesForOther([]);
          return;
        }
        
        const uniqueEstates = [...new Set((data || []).map((r: any) => r['Estate Name']).filter(Boolean))].sort() as string[];
        console.log('[loadEstatesForOther] Loaded estates:', uniqueEstates.length);
        setDbEstatesForOther(uniqueEstates);
      } catch (e) {
        console.error('[loadEstatesForOther] Exception:', e);
        setDbEstatesForOther([]);
      } finally {
        setLoadingOtherEstates(false);
      }
    }
    loadEstatesForOther();
  }, [other.town]);

  const getRegionTownId = (reg: string): number => {
    if (!towns.length) return 1;
    const match = towns.find((t: any) =>
      (t.name || '').toLowerCase().includes(reg.toLowerCase()) ||
      reg.toLowerCase().includes((t.name || '').toLowerCase())
    );
    return match?.id || towns[0]?.id || 1;
  };

  const townOptions = region ? (TOWNS_BY_REGION[region] || []) : [];
  const otherIsValid = other.fullName.trim().length >= 2 && other.phone.length >= 9 && other.region.length > 0;

  // Fetch distinct estate names from the installer table for the selected town
  const fetchEstates = async (zoneName: string) => {
    setEstatesLoading(true);
    setEstates([]);
    setInstallEstate('');
    console.log('[fetchEstates] querying Zone =', zoneName);
    try {
      // First, let's check what zones exist in the table
      const { data: zonesData } = await supabase
        .from('DSE_14TOWNS')
        .select('Town')
        .not('Town', 'is', null);
      const uniqueZones = [...new Set((zonesData || []).map((r: any) => r.Town).filter(Boolean))];
      console.log('[fetchEstates] Available zones in database:', uniqueZones);
      
      const { data, error } = await supabase
        .from('DSE_14TOWNS')
        .select('"Estate Name"')
        .ilike('Town', zoneName); // Case-insensitive search
      console.log('[fetchEstates] rows:', data?.length, 'error:', error?.message);
      const unique = [...new Set(
        (data || []).map((r: any) => r['Estate Name']).filter(Boolean)
      )].sort() as string[];
      console.log('[fetchEstates] estates:', unique);
      setEstates(unique);
    } catch (e: any) {
      console.error('[fetchEstates] exception:', e);
      if (e.message?.includes('Failed to fetch') || e.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setGpsError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setGpsError('Could not load estates. Please try again.');
      }
    } finally {
      setEstatesLoading(false);
    }
  };

  // Geocode a text address → {lat, lng}
  const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ke`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) { console.warn('[geocodeAddress]', e); }
    return null;
  };

  // GPS auto-detect estate — never shows "no match" error, just leaves estate blank
  const handleGpsLocation = async () => {
    console.log('[HBB GPS] 🚀 GPS button clicked! gpsLoading:', gpsLoading);
    try {
      setGpsLoading(true); setGpsError('');
      console.log('[HBB GPS] 📡 Starting GPS detection...');
      
      // Use Capacitor Geolocation for high accuracy (same as programs side)
      try {
        // 1. Request permission from the user
        const permissions = await Geolocation.requestPermissions();
        
        if (permissions.location === 'granted' || permissions.location === 'prompt') {
          // 2. Get the actual coordinates with high accuracy
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
          
          const { latitude, longitude } = position.coords;
          
          // Store coordinates immediately for later use
          setCustomerLat(latitude); setCustomerLng(longitude);
          
          console.log('[HBB GPS] ✅ HIGH ACCURACY GPS captured:', {
            latitude,
            longitude,
            accuracy: `±${position.coords.accuracy.toFixed(0)}m`
          });

          // Reverse geocode to get address
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geo = await geoResponse.json();
          const addr = geo.address || {};
          console.log('[HBB GPS] 📍 Nominatim address:', addr);
          console.log('[HBB GPS] 🔍 Available address components:', {
            city: addr.city,
            town: addr.town,
            county: addr.county,
            state_district: addr.state_district,
            suburb: addr.suburb,
            village: addr.village
          });

          // Auto-select town (always update when GPS detects location)
          let detectedTown = null;
          const addressComponents = [addr.city, addr.town, addr.county, addr.state_district].filter(Boolean) as string[];
          console.log('[HBB GPS] 🏙️ Searching for town in components:', addressComponents);
          console.log('[HBB GPS] 📋 Available towns to match:', HBB_INSTALL_TOWNS);
          
          for (const c of addressComponents) {
            const match = HBB_INSTALL_TOWNS.find(t =>
              t.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.toLowerCase())
            );
            if (match) { 
              detectedTown = match; 
              console.log('[HBB GPS] 🎯 Detected town:', match, 'from address component:', c);
              break; 
            }
          }
          
          // Always update the town selection when GPS detects a location
          if (detectedTown) {
            setInstallTown(detectedTown);
            console.log('[HBB GPS] ✅ Auto-selected town in dropdown:', detectedTown);
          } else {
            console.log('[HBB GPS] ⚠️ No matching town found for address components:', addressComponents);
          }

          // Load estates for detected town then try to match
          let estateList = estates;
          if (detectedTown && estateList.length === 0) {
            const { data } = await supabase
              .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
              .select('"Estate Name"').eq('Zone', detectedTown);
            estateList = [...new Set((data || []).map((r: any) => r['Estate Name']).filter(Boolean))].sort() as string[];
            setEstates(estateList);
          }

          // Try to match estate — silently skip if no match
          for (const c of [addr.suburb, addr.neighbourhood, addr.quarter, addr.residential, addr.village, addr.city_district].filter(Boolean) as string[]) {
            const match = estateList.find(e =>
              e.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(e.toLowerCase())
            );
            if (match) { setInstallEstate(match); break; }
          }
        } else {
          throw new Error('Location permission denied');
        }
      } catch (capacitorError: any) {
        console.log('[HBB GPS] Capacitor error, falling back to browser API:', capacitorError.message);
        
        // Fallback to browser geolocation (same as original)
        if (!navigator.geolocation) { 
          throw new Error('Geolocation not supported on this device'); 
        }
        
        console.log('[HBB GPS] 🌐 Using browser geolocation API...');
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('[HBB GPS] ✅ Browser GPS success!', pos);
            const { latitude, longitude } = pos.coords;
            
            // Only accept if accuracy is reasonable (less than 1000 meters)
            if (pos.coords.accuracy && pos.coords.accuracy > 1000) {
              console.log('[HBB GPS] ⚠️ Low accuracy detected:', pos.coords.accuracy, 'skipping location update');
              setGpsLoading(false);
              return;
            }
            
            setCustomerLat(latitude); setCustomerLng(longitude);

            console.log('[HBB GPS] 🌍 Fetching reverse geocoding for:', latitude, longitude);
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
              .then(res => res.json())
              .then(data => {
                console.log('[HBB GPS] 📋 Raw Nominatim response:', data);
                const addr = data.address || {};
                console.log('[HBB GPS] 📍 Nominatim address (fallback):', addr);
                
                // Auto-select town from GPS address
                let detectedTown = null;
                const addressComponents = [addr.city, addr.town, addr.county, addr.state_district, addr.state, addr.region, addr.village, addr.suburb].filter(Boolean) as string[];
                console.log('[HBB GPS] 🏙️ Searching for town in components (fallback):', addressComponents);
                
                for (const c of addressComponents) {
                  const match = HBB_INSTALL_TOWNS.find(t =>
                    t.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.toLowerCase())
                  );
                  if (match) { 
                    detectedTown = match; 
                    console.log('[HBB GPS] 🎯 Detected town (fallback):', match, 'from address component:', c);
                    break; 
                  }
                }
                
                if (detectedTown) {
                  setInstallTown(detectedTown);
                  console.log('[HBB GPS] ✅ Auto-selected town in dropdown (fallback):', detectedTown);
                } else {
                  console.log('[HBB GPS] ⚠️ No matching town found for address components (fallback):', addressComponents);
                }
              })
              .catch((err) => {
                console.log('[HBB GPS] ❌ Browser GPS error:', err);
                setGpsError('Failed to get location');
              })
              .finally(() => {
                setGpsLoading(false);
              });
          },
          (err) => {
            console.log('[HBB GPS] ❌ Browser GPS error:', err);
            setGpsError('Failed to get location');
            setGpsLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    } catch (e: any) {
      console.error('[HBB GPS] Error:', e);
      setGpsError(e.message || 'Could not get location');
    } finally {
      setGpsLoading(false);
    }
  };

  // Immediate installer matching
  const handleImmediateBooking = async () => {
    setInstallerSearching(true);
    setNoInstallerMsg('');
    setError('');
    const normalizedPhone = normalizePhone(phone);
    try {
      // Geocode if we don't have coords yet
      let lat = customerLat;
      let lng = customerLng;
      if (!lat && (street || installEstate || installTown)) {
        const coords = await geocodeAddress(`${building} ${street} ${installEstate} ${installTown} Kenya`);
        if (coords) { lat = coords.lat; lng = coords.lng; setCustomerLat(lat); setCustomerLng(lng); }
      }

      // 1. Candidate installers: same estate first, then same zone
      let candidates: any[] = [];
      const { data: byEstate } = await supabase
        .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
        .select('*')
        .eq('"Estate Name"', installEstate)
        .eq('is_available', true)
        .is('current_job_id', null);
      candidates = byEstate || [];

      if (candidates.length === 0) {
        const { data: byZone } = await supabase
          .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
          .select('*')
          .eq('Zone', installTown)
          .eq('is_available', true)
          .is('current_job_id', null);
        candidates = byZone || [];
      }

      if (candidates.length === 0) {
        setNoInstallerMsg('No installers available right now. Please try again shortly or schedule.');
        setInstallerSearching(false);
        return;
      }

      // 2. Pick nearest by GPS if available, else first
      let installer = candidates[0];
      if (lat && lng) {
        let best = Infinity;
        for (const c of candidates) {
          if (c.last_known_lat && c.last_known_lng) {
            const d = haversineKm(lat, lng, c.last_known_lat, c.last_known_lng);
            if (d < best) { best = d; installer = c; }
          }
        }
      }

      // 3. Create job record
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          installer_id: String(installer.id ?? installer['Installer contact']),
          customer_phone: normalizedPhone,
          town: installTown,
          estate_name: installEstate || 'Not specified',
          package: selectedPlan ? `5G Smart Connect ${selectedPlan.speed}` : null,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          customer_lat: lat,
          customer_lng: lng,
          building: building || null,
          street_address: street || null,
          landmark: landmark || null,
        })
        .select()
        .single();

      if (jobErr || !job) throw new Error(jobErr?.message || 'Failed to create job');

      // 4. Mark installer busy
      await supabase
        .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
        .update({ is_available: false, current_job_id: job.id })
        .eq('id', installer.id);

      setInstallerJobId(String(job.id));
    } catch (err: any) {
      setError(err.message || 'Failed to book an installer. Please try again.');
    } finally {
      setInstallerSearching(false);
    }
  };

  // Scheduled booking — creates job without assigning installer
  const handleScheduledBooking = async () => {
    setInstallerSearching(true);
    setError('');
    const normalizedPhone = normalizePhone(phone);
    const isForOther = forWhom === 'other';
    const schedDate = isForOther ? other.date : self.date;
    const schedTime = isForOther ? other.time : self.time;
    const custPhone = isForOther ? other.phone : normalizedPhone;
    try {
      // Geocode
      let lat = customerLat; let lng = customerLng;
      if (!lat) {
        const coords = await geocodeAddress(`${building} ${street} ${installEstate} ${installTown} Kenya`);
        if (coords) { lat = coords.lat; lng = coords.lng; }
      }

      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          customer_phone: custPhone || normalizedPhone,
          town: installTown,
          estate_name: installEstate || 'Not specified',
          package: selectedPlan ? `5G Smart Connect ${selectedPlan.speed}` : null,
          status: 'scheduled',
          scheduled_date: schedDate || null,
          scheduled_time: schedTime || null,
          customer_lat: lat, customer_lng: lng,
          building: building || null,
          street_address: street || null,
          landmark: landmark || null,
        })
        .select().single();
      if (jobErr || !job) throw new Error(jobErr?.message || 'Failed to schedule job');

      // Save job ID for order tracking
      try { localStorage.setItem('hbb_self_sr_id', String(job.id)); } catch (e) { console.warn('[HBB] Failed to save SR ID:', e); }

      // Create HBB agent account (silent)
      try { await createAccount(); } catch (e) { console.warn('[HBB] account creation skipped:', e); }

      toast.success('Installation scheduled! We will assign an installer soon.');
      if (onSignupSuccess) {
        // Pass client data for customer tracking
        const customerName = forWhom === 'self' ? fullName.trim() : other.fullName.trim();
        const customerPhone = forWhom === 'self' ? phone : other.phone;
        onSignupSuccess({ 
          ...job, 
          role: 'hbb_client',
          jobId: String(job.id),
          customer_name: customerName,
          customer_phone: customerPhone
        });
      }
      else onBackToLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule. Please try again.');
    } finally {
      setInstallerSearching(false);
    }
  };

  const canProceed = (): boolean => {
    if (step === 1) return phone.replace(/\D/g, '').length === 9 && email.length > 0 && email.includes('@');
    if (step === 2) return installTown.length > 0 && installEstate.length > 0;
    if (step === 3) return true; // address is optional
    if (step === 4) return selectedPlan !== null;
    if (step === 5) {
      if (!forWhom) return false;
      if (forWhom === 'other') {
        return other.fullName.trim().length >= 2 && 
               other.phone.length >= 9 && 
               other.town.length > 0 && 
               other.estate.length > 0 &&
               other.date.length > 0 && 
               other.time.length > 0 &&
               other.email.length > 0 &&
               other.email.includes('@');
      }
      // self: must have date+time (schedule is now mandatory)
      return !!(self.date && self.time);
    }
    return false;
  };

  const createAccount = async (): Promise<any | null> => {
    const normalizedPhone = normalizePhone(phone);
    const { data: existingHBB } = await supabase.from('app_users').select('employee_id').like('employee_id', 'HBB%').order('employee_id', { ascending: false }).limit(1);
    let nextId = 'HBB001';
    if (existingHBB && existingHBB.length > 0) {
      const lastNum = parseInt(existingHBB[0].employee_id.substring(3)) || 0;
      nextId = 'HBB' + String(lastNum + 1).padStart(3, '0');
    }
    const { data: rankData } = await supabase.from('app_users').select('rank').order('rank', { ascending: false }).limit(1);
    const nextRank = rankData && rankData.length > 0 ? rankData[0].rank + 1 : 1;
    const autoPin = normalizedPhone.slice(-4).padStart(4, '0');
    setDisplayPin(autoPin);
    const { data: newUser, error: insertError } = await supabase.from('app_users').insert({
      employee_id: nextId, full_name: fullName.trim(), phone_number: normalizedPhone,
      role: 'hbb_agent', region: region || 'Nairobi', zone: town || 'Unassigned',
      rank: nextRank, total_points: 0, pin: autoPin,
      email: email || null,
    }).select().single();
    if (insertError) { setError('Account creation failed: ' + insertError.message); return null; }
    return newUser;
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    let sr: any = null;
    try {
      const newUser = await createAccount();
      if (!newUser) { setIsLoading(false); return; }

      const normalizedPhone = normalizePhone(phone);
      try {
        if (forWhom === 'self') {
          const townId = getRegionTownId(region);
          const remarks = [
            self.altPhone && `Alt Phone: +254${self.altPhone}`,
            self.street && `Street: ${self.street}`,
            self.landmark && `Landmark: ${self.landmark}`,
            email && `Email: ${email}`,
            selectedPlan && `Plan: ${selectedPlan.speed} @ ${selectedPlan.label}/mo`,
          ].filter(Boolean).join(' | ');
          sr = await createServiceRequest({
            customer_name: fullName.trim(), customer_phone: '0' + normalizedPhone,
            town_id: townId, estate: self.building.trim() || undefined,
            package: selectedPlan ? `5G Smart Connect ${selectedPlan.speed}` : undefined,
            preferred_date: self.date || undefined, preferred_time: self.time || undefined,
            agent_name: fullName.trim(), agent_phone: '0' + normalizedPhone,
            remarks: remarks || undefined,
          });
          if (sr?.id) {
            setSelfOrderSRNumber(sr.sr_number || `SR-${sr.id}`);
            localStorage.setItem('hbb_self_sr_id', String(sr.id));
          }
        } else if (forWhom === 'other') {
          const townId = getRegionTownId(other.region || region);
          const remarks = [
            other.altPhone && `Alt Phone: +254${other.altPhone}`,
            other.street && `Street: ${other.street}`,
            other.landmark && `Landmark: ${other.landmark}`,
            other.email && `Email: ${other.email}`,
            selectedPlan && `Plan: ${selectedPlan.speed} @ ${selectedPlan.label}/mo`,
          ].filter(Boolean).join(' | ');
          sr = await createServiceRequest({
            customer_name: other.fullName.trim(), customer_phone: '0' + other.phone,
            town_id: townId, estate: other.building.trim() || undefined,
            package: selectedPlan ? `5G Smart Connect ${selectedPlan.speed}` : undefined,
            preferred_date: other.date || undefined, preferred_time: other.time || undefined,
            agent_name: fullName.trim(), agent_phone: '0' + normalizedPhone,
            remarks: remarks || undefined,
          });
        }
      } catch (srErr) { console.warn('[HBB] SR creation failed, proceeding with account:', srErr); }

      const safeUser = { ...newUser };
      delete safeUser.pin;
      localStorage.setItem('tai_user', JSON.stringify(safeUser));
      setSuccessOrderData({
        srNumber: sr?.sr_number || selfOrderSRNumber || 'Order Submitted',
        customerName: forWhom === 'self' ? fullName.trim() : other.fullName.trim(),
        isSelf: forWhom === 'self',
        plan: selectedPlan,
        date: forWhom === 'self' ? self.date : other.date,
        time: forWhom === 'self' ? self.time : other.time,
      });
      setShowSuccessPopup(true);
      
      // Delay showing the welcome screen to let user see the success popup
      setTimeout(() => {
        setShowSuccessPopup(false);
        setCreatedUser(newUser);
        setStep(6);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 5) {
      if (forWhom === 'other') { handleScheduledBooking(); return; }
      // For self, always do scheduled booking (no immediate option anymore)
      handleScheduledBooking();
      return;
    }
    setStep(step + 1);
  };

  // ─── Immediate booking: show TrackingScreen ────────────────────────────────
  if (installerJobId) {
    return (
      <TrackingScreen
        jobId={installerJobId}
        onBack={() => {
          setInstallerJobId(null);
          setInstallType(null);
          setStep(3);
        }}
      />
    );
  }

  // ─── Success Popup after submission ────────────────────────────────
  if (showSuccessPopup && successOrderData) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            {successOrderData.isSelf ? 'Order Submitted!' : 'Lead Submitted!'}
          </h2>
          <p className="text-sm text-center text-gray-500 mb-4">
            {successOrderData.isSelf 
              ? `Thank you ${successOrderData.customerName}! Your order has been received.` 
              : `Lead for ${successOrderData.customerName} has been created.`}
          </p>

          {/* Order Details Card */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Order Number</span>
              <span className="text-sm font-bold text-gray-900">{successOrderData.srNumber}</span>
            </div>
            {successOrderData.plan && (
              <>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Plan</span>
                  <span className="text-sm font-semibold text-gray-900">{successOrderData.plan.speed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Monthly</span>
                  <span className="text-sm font-semibold" style={{ color: ACCENT }}>{successOrderData.plan.label}</span>
                </div>
              </>
            )}
            <div className="h-px bg-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Installation</span>
              <span className="text-sm font-semibold text-gray-900">
                {successOrderData.date} at {TIME_SLOTS.find(t => t.value === successOrderData.time)?.label || successOrderData.time}
              </span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-400">Redirecting to order tracker...</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DARK})` }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── STEP 6: Welcome — compact, fits one screen ────────────────────────────
  if (step === 6) {
    const firstName = createdUser?.full_name?.split(' ')[0] || 'Champion';
    const np = normalizePhone(phone);
    const formattedPhone = `+254 ${np.slice(0, 3)} ${np.slice(3, 6)} ${np.slice(6)}`;
    const isSelfOrder = forWhom === 'self';

    return (
      <div className="flex-1 flex flex-col min-h-screen"
        style={{ background: 'linear-gradient(165deg, #FAFAFA 0%, #F5F5F5 50%, #FFF5F5 100%)' }}>
        <div className="flex flex-col items-center px-5 pt-6 pb-6 max-w-sm mx-auto w-full flex-1 justify-between">

          {/* Top: icon + title */}
          <div className="flex flex-col items-center w-full">
            {/* Icon row */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.45, delay: 0.05 }}
              className="relative w-14 h-14 mb-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}>
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <motion.div initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1.6, opacity: 0 }}
                transition={{ delay: 0.5, duration: 1.1, repeat: Infinity, repeatDelay: 2.5 }}
                className="absolute inset-0 rounded-full border-2" style={{ borderColor: ACCENT }} />
            </motion.div>

            {/* Title */}
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-center mb-1">
              <p className="text-sm text-gray-500">You are now an <strong className="text-gray-700">Airtel Champion!</strong></p>
              <h1 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                Welcome, <span style={{ color: ACCENT }}>{firstName}!</span>
              </h1>
              {isSelfOrder && (
                <p className="text-xs text-gray-400 mt-1">Your HBB 5G router order has been placed.</p>
              )}
            </motion.div>

            {/* Plan strip */}
            {selectedPlan && (
              <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}
                className="w-full mt-3 px-3 py-2.5 rounded-xl border flex items-center justify-between"
                style={{ background: selectedPlan.bg, borderColor: `${selectedPlan.border}30` }}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: selectedPlan.tagColor }}>
                    {isSelfOrder ? `Your Plan — ${selfOrderSRNumber || 'Order Submitted'}` : 'Lead Submitted'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">5G Smart Connect · {selectedPlan.speed}</p>
                  <p className="text-[11px] text-gray-400">{selectedPlan.label}/mo + KES 1,000 connection fee</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center ml-2 flex-shrink-0"
                  style={{ background: selectedPlan.tagColor }}>
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}

            {/* Login details card */}
            <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="w-full mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="px-4 py-2" style={{ background: 'linear-gradient(90deg, #1F2937, #374151)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">Your Login Details</p>
              </div>
              <div className="px-4 py-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Phone</span>
                  <span className="text-sm font-bold text-gray-900 font-mono tracking-wide">{formattedPhone}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">PIN</span>
                  <div className="flex items-center gap-1">
                    {(displayPin || '0000').split('').map((d, i) => (
                      <div key={i} className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
                        <span className="text-white font-mono font-bold text-sm">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
                <p className="text-[10px] text-amber-700 font-medium text-center">
                  📝 PIN = last 4 digits of your phone number
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom: CTAs */}
          <div className="w-full mt-4 space-y-2">
            <motion.button initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.38 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (onSignupSuccess && createdUser) {
                  const safeUser = { ...createdUser };
                  delete safeUser.pin;
                  const tab = isSelfOrder ? 'hbb-my-order' : 'hbb-new-lead';
                  window.history.replaceState({}, '', `/?tab=${tab}`);
                  onSignupSuccess(safeUser);
                } else { onBackToLogin(); }
              }}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-base shadow-lg flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}>
              {isSelfOrder
                ? <><span>Track My Order</span><ChevronRight className="w-5 h-5" /></>
                : <><Sparkles className="w-4 h-4" /><span>Start Submitting Leads</span></>
              }
            </motion.button>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              onClick={onBackToLogin}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
              Sign in later instead
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEPS 1–3 ───────────────────────────────��───────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ background: 'linear-gradient(165deg, #FAFAFA 0%, #F5F5F5 50%, #FFF5F5 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
        <button onClick={step === 1 ? (isFromClientHome && onBackToHome ? onBackToHome : onBackToLogin) : () => { setError(''); setStep(step - 1); }}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors py-1">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{step === 1 ? (isFromClientHome ? 'Back' : 'Sign Up') : 'Back'}</span>
        </button>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <motion.div key={s}
              animate={{ width: s === step ? 24 : 8, backgroundColor: s === step ? ACCENT : s < step ? ACCENT : '#D1D5DB', opacity: s <= step ? 1 : 0.4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="h-2 rounded-full" />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-400">{step}/5</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ─── STEP 1: Phone ─── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col px-6 pt-4 pb-6 min-h-[calc(100vh-80px)]">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={airtelChampionsLogo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
                    <Wifi className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span className="text-xs font-semibold" style={{ color: ACCENT }}>HBB Leads</span>
                  </div>
                </div>
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-2">
                  Join Airtel<br /><span style={{ color: ACCENT }}>Champions</span>
                </h1>
                <p className="text-base text-gray-500 leading-relaxed">
                  Enjoy the HBB experience. It takes less than a minute.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-gray-500">+254</span>
                      <div className="w-px h-5 bg-gray-300" />
                    </div>
                  </div>
                  <input ref={phoneRef} type="tel" inputMode="numeric"
                    value={formatPhoneDisplay(phone)}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="712 345 678"
                    className="w-full pl-[5.5rem] pr-4 py-5 text-lg font-medium bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all placeholder-gray-300"
                    style={{ color: '#111827' }} maxLength={11} />
                  {phone.replace(/\D/g, '').length >= 9 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-4 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-gray-400 pl-1">Your Safaricom, Airtel, or Telkom number</p>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">E-Mail <span className="text-red-400">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-4 text-base font-medium bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all placeholder-gray-300"
                    style={{ color: '#111827' }} />
                </div>
                <p className="text-xs text-gray-400 pl-1">Required for order confirmations and updates</p>
              </div>
              <div className="mt-6">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:shadow-none transition-all"
                  style={{ background: canProceed() && !isLoading ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#D1D5DB' }}>
                  <span>Continue</span><ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Town + Estate selection ─── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col px-6 pt-4 pb-6">
              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-2">
                  Where are<br /><span style={{ color: ACCENT }}>you located?</span>
                </h1>
                <p className="text-base text-gray-500">We'll find an installer near you.</p>
              </div>

              {/* GPS detect button */}
              {!customerLat && !customerLng ? (
                <button
                  type="button"
                  onClick={handleGpsLocation}
                  disabled={gpsLoading}
                  className="w-full mb-4 py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: '#FFF5F5' }}
                >
                  {gpsLoading
                    ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2">Scanning location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Use my current location</span>
                      </>
                    )}
                </button>
              ) : (
                /* Location detected - show coordinates and actions */
                <div className="mb-4 p-4 rounded-2xl border-2 border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Location detected!</p>
                      <p className="text-xs text-green-600">Your coordinates:</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-3 mb-3 border border-green-100">
                    <div className="font-mono text-xs text-gray-700">
                      <div>Latitude: {customerLat.toFixed(6)}</div>
                      <div>Longitude: {customerLng.toFixed(6)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps?q=${customerLat},${customerLng}`, '_blank')}
                      className="py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      View on Maps
                    </button>
                    <button
                      type="button"
                      onClick={handleGpsLocation}
                      disabled={gpsLoading}
                      className="py-2 px-3 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      {gpsLoading ? (
                        <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Rescanning…</>
                      ) : (
                        <><Navigation className="w-3 h-3" />Rescan</>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {gpsError && <p className="text-xs text-amber-600 mb-3 text-center">{gpsError}</p>}

              <div className="space-y-4">
                {/* Town input - dropdown if GPS detected town in list, otherwise text input */}
                {installTown && HBB_INSTALL_TOWNS.includes(installTown) ? (
                  <SearchableDropdown
                    label="Your Town"
                    value={installTown}
                    options={HBB_INSTALL_TOWNS}
                    onSelect={(v) => { setInstallTown(v); fetchEstates(v); }}
                    placeholder="Select your town"
                    icon={MapPin}
                  />
                ) : installTown ? (
                  /* GPS detected town but it's not in our list - show text input */
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Your Town <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        <MapPin className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={installTown}
                        onChange={e => setInstallTown(e.target.value)}
                        placeholder="Enter your town name"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                        style={{ color: installTown ? '#111827' : '#9CA3AF' }}
                      />
                    </div>
                    {installTown && (
                      <button
                        type="button"
                        onClick={() => fetchEstates(installTown)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Load estates for this town →
                      </button>
                    )}
                  </div>
                ) : (
                  /* No town selected yet - show dropdown */
                  <SearchableDropdown
                    label="Your Town"
                    value={installTown}
                    options={HBB_INSTALL_TOWNS}
                    onSelect={(v) => { setInstallTown(v); fetchEstates(v); }}
                    placeholder="Select your town"
                    icon={MapPin}
                  />
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Your Estate {!installTown && <span className="text-gray-300">(select town first)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                      <Navigation className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      disabled={!installTown || estatesLoading}
                      value={installEstate}
                      onChange={e => setInstallEstate(e.target.value)}
                      className="w-full pl-10 pr-8 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none disabled:opacity-40"
                      style={{ color: installEstate ? '#111827' : '#9CA3AF' }}
                    >
                      <option value="">
                        {estatesLoading ? 'Loading estates…' : installTown ? 'Select your estate' : 'Select town first'}
                      </option>
                      {estates.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {installTown && !estatesLoading && estates.length === 0 && (
                    <p className="text-xs text-amber-600 pl-1">No estates listed for this town — type yours below.</p>
                  )}
                  {installTown && !estatesLoading && estates.length === 0 && (
                    <input
                      type="text"
                      value={installEstate}
                      onChange={e => setInstallEstate(e.target.value)}
                      placeholder="Type your estate name"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                      style={{ color: '#111827' }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Address ─── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col px-6 pt-4 pb-6">
              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-2">
                  Your<br /><span style={{ color: ACCENT }}>address</span>
                </h1>
                <p className="text-base text-gray-500">Where should the installer come? (optional — helps speed up dispatch)</p>
              </div>
              <div className="space-y-4">
                <div><FL>Building / House Number</FL>
                  <FInput value={building} onChange={setBuilding} placeholder="e.g. Greenwood Apts, House 4B" icon={Home} />
                </div>
                <div><FL>Street Address</FL>
                  <FInput value={street} onChange={setStreet} placeholder="e.g. Mombasa Road" icon={MapPin} />
                </div>
                <div><FL>Nearest Landmark</FL>
                  <FInput value={landmark} onChange={setLandmark} placeholder="e.g. Near Total petrol station" icon={Star} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Plan selection ─── */}
          {step === 4 && (
            <motion.div key="step4"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col">
              <div className="w-full bg-white" style={{ height: 220 }}>
                <img src={airtelSmartConnectImg} alt="Airtel Smart Connect" className="w-full h-full object-contain" />
              </div>
              <div className="px-5 pb-8">
                <div className="pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wifi className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>5G Smart Connect — Outdoor Unit</span>
                  </div>
                  <h1 className="text-[24px] font-black text-gray-900 leading-tight">Choose a Plan</h1>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">Free CPE router included with every connection.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {SMART_CONNECT_FEATURES.map(f => (
                    <div key={f.title} className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-base leading-none mt-0.5">{f.icon}</span>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">{f.title}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Select a Plan <span style={{ color: ACCENT }}>*</span></p>
                <div className="space-y-3">
                  {SMART_CONNECT_PLANS.map((plan, i) => {
                    const isSel = selectedPlan?.id === plan.id;
                    return (
                      <motion.button key={plan.id}
                        initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 28 }}
                        whileTap={{ scale: 0.98 }} onClick={() => setSelectedPlan(plan)}
                        className="w-full text-left rounded-2xl border-2 overflow-hidden transition-all"
                        style={{ borderColor: isSel ? plan.border : '#E5E7EB', background: isSel ? plan.bg : '#FFFFFF', boxShadow: isSel ? `0 0 0 3px ${plan.border}18` : 'none' }}>
                        <div className="px-4 py-3.5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white inline-block mb-1.5" style={{ background: plan.tagColor }}>{plan.tag}</span>
                              <p className="text-base font-bold text-gray-900">5G Smart Connect</p>
                              <p className="text-sm font-medium text-gray-500">{plan.speed}</p>
                              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{plan.description}</p>
                            </div>
                            <div className="ml-3 flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-lg font-black" style={{ color: plan.highlight }}>{plan.label}</p>
                                <p className="text-[10px] text-gray-400">/month</p>
                              </div>
                              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                                style={{ borderColor: isSel ? plan.border : '#D1D5DB', background: isSel ? plan.border : 'transparent' }}>
                                {isSel && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-t text-[11px] font-medium"
                          style={{ borderColor: isSel ? `${plan.border}25` : '#F3F4F6', color: isSel ? plan.highlight : '#9CA3AF', background: isSel ? `${plan.border}08` : '#F9FAFB' }}>
                          {plan.label} + KES 1,000 connection fee = <strong>KES {(plan.price + CONNECTION_FEE).toLocaleString()} total</strong>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 5: Who + timing + details ─── */}
          {step === 5 && (
            <motion.div key="step5"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col px-6 pt-4 pb-8">

              <div className="mb-5">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-2">
                  Almost<br /><span style={{ color: ACCENT }}>done!</span>
                </h1>
                <p className="text-base text-gray-500">Tell us who this is for and when to install.</p>
              </div>

              {/* Who is this for? */}
              <SectionDivider label="Who is this for?" />
              <div className="grid grid-cols-2 gap-3 mt-3 mb-4">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setForWhom('self')}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all"
                  style={{ borderColor: forWhom === 'self' ? ACCENT : '#E5E7EB', background: forWhom === 'self' ? '#FFF1F1' : '#FFFFFF', boxShadow: forWhom === 'self' ? `0 0 0 3px ${ACCENT}18` : 'none' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: forWhom === 'self' ? ACCENT : '#F3F4F6' }}>
                    <UserCheck className="w-5 h-5" style={{ color: forWhom === 'self' ? '#fff' : '#9CA3AF' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: forWhom === 'self' ? ACCENT : '#374151' }}>For Myself</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Use my details</p>
                  </div>
                  {forWhom === 'self' && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACCENT }}><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>}
                </motion.button>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setForWhom('other')}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all"
                  style={{ borderColor: forWhom === 'other' ? '#8B5CF6' : '#E5E7EB', background: forWhom === 'other' ? '#F5F3FF' : '#FFFFFF', boxShadow: forWhom === 'other' ? '0 0 0 3px #8B5CF618' : 'none' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: forWhom === 'other' ? '#8B5CF6' : '#F3F4F6' }}>
                    <Users className="w-5 h-5" style={{ color: forWhom === 'other' ? '#fff' : '#9CA3AF' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: forWhom === 'other' ? '#7C3AED' : '#374151' }}>For Another</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Enter their details</p>
                  </div>
                  {forWhom === 'other' && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#8B5CF6' }}><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>}
                </motion.button>
              </div>

              {/* FOR MYSELF */}
              <AnimatePresence>
                {forWhom === 'self' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
                    <SectionDivider label="Your Details" />
                    <div><FL>Alternative Phone</FL>
                      <FInput value={self.altPhone} onChange={v => setSelf({ altPhone: v.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="Alternative number" type="tel" inputMode="numeric" prefix="+254" />
                    </div>
                    <SectionDivider label="Schedule Installation" />
                    <div><FL>Preferred Date <span className="text-red-400">*</span></FL>
                      <FInput value={self.date} onChange={v => setSelf({ date: v })} placeholder="dd/mm/yyyy" type="date" icon={Calendar} />
                    </div>
                    <div><FL>Time Slot <span className="text-red-400">*</span></FL>
                      <FSelect value={self.time} onChange={v => setSelf({ time: v })} placeholder="Select a time slot" icon={Clock}>
                        {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </FSelect>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FOR ANOTHER */}
              <AnimatePresence>
                {forWhom === 'other' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
                    <SectionDivider label="Customer Details" />
                    <div><FL>Full Name <span className="text-red-400">*</span></FL>
                      <FInput value={other.fullName} onChange={v => setOther({ fullName: v })} placeholder="Customer name" icon={User} />
                    </div>
                    <div><FL>Phone Number <span className="text-red-400">*</span></FL>
                      <FInput value={other.phone} onChange={v => setOther({ phone: v.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="Phone number" type="tel" inputMode="numeric" prefix="+254" />
                    </div>
                    <div><FL>Alternative Phone</FL>
                      <FInput value={other.altPhone} onChange={v => setOther({ altPhone: v.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="Alternative number" type="tel" inputMode="numeric" prefix="+254" />
                    </div>
                    <div><FL>E-Mail <span className="text-red-400">*</span></FL>
                      <FInput value={other.email} onChange={v => setOther({ email: v })} placeholder="Email address" type="email" icon={Mail} />
                    </div>
                    <SectionDivider label="Location Details" />
                    <div><FL>Town <span className="text-red-400">*</span></FL>
                      <div className="flex gap-2">
                        <SearchableDropdown
                          label="Town"
                          value={other.town}
                          options={dbTowns14.length > 0 ? dbTowns14 : ALL_TOWNS}
                          onSelect={(v) => { setOther({ town: v }); setOther({ estate: '' }); }}
                          placeholder={dbTowns14.length > 0 ? "Select Town" : "Loading towns..."}
                          icon={MapPin}
                          disabled={dbTowns14.length === 0}
                        />
                        {other.town && (
                          <button
                            type="button"
                            onClick={() => { setOther({ town: '' }); setOther({ estate: '' }); }}
                            className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <div><FL>Estate <span className="text-red-400">*</span></FL>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                            <Navigation className="w-4 h-4 text-gray-400" />
                          </div>
                          <select
                            disabled={!other.town || loadingOtherEstates}
                            value={other.estate}
                            onChange={e => setOther({ estate: e.target.value })}
                            className="w-full pl-10 pr-8 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none disabled:opacity-40"
                            style={{ color: other.estate ? '#111827' : '#9CA3AF' }}
                          >
                            <option value="">
                              {loadingOtherEstates ? 'Loading estates...' : 
                               other.town ? '— Select Estate —' : 'Select Town first'}
                            </option>
                            {dbEstatesForOther.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {other.estate && (
                          <button
                            type="button"
                            onClick={() => setOther({ estate: '' })}
                            className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <div><FL>Estate Name <span className="text-red-400">*</span></FL>
                      <FInput value={other.building} onChange={v => setOther({ building: v })} placeholder="e.g. Garden Estate, Milimani Estate" icon={Home} />
                    </div>
                    <div><FL>House/Door Number <span className="text-red-400">*</span></FL>
                      <FInput value={other.street} onChange={v => setOther({ street: v })} placeholder="e.g. House 4B, Door 12, Apartment 3C" icon={Home} />
                    </div>
                    <div><FL>Nearest Landmark <span className="text-red-400">*</span></FL>
                      <FInput value={other.landmark} onChange={v => setOther({ landmark: v })} placeholder="e.g. Near Total petrol station, Next to Safaricom shop" icon={Star} />
                    </div>
                    <SectionDivider label="Schedule Installation" />
                    <div><FL>Preferred Date <span className="text-red-400">*</span></FL>
                      <FInput value={other.date} onChange={v => setOther({ date: v })} placeholder="dd/mm/yyyy" type="date" icon={Calendar} />
                    </div>
                    <div><FL>Time Slot <span className="text-red-400">*</span></FL>
                      <FSelect value={other.time} onChange={v => setOther({ time: v })} placeholder="Select a time slot" icon={Clock}>
                        {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </FSelect>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <div className="mt-6">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
                  disabled={!canProceed() || installerSearching}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:shadow-none transition-all"
                  style={{ background: canProceed() && !installerSearching ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#D1D5DB' }}>
                  {installerSearching ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Finding installer…</span></>
                  ) : forWhom === 'other' ? (
                    <><Sparkles className="w-4 h-4" /><span>Submit Lead</span></>
                  ) : (
                    <><Calendar className="w-4 h-4" /><span>Schedule Installation</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA for steps 2–4 only (step 1 has inline button) */}
        {step >= 2 && step < 5 && (
          <div className="px-6 pb-8">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:shadow-none transition-all"
              style={{ background: canProceed() && !isLoading ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#D1D5DB' }}>
              <span>Continue</span><ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}