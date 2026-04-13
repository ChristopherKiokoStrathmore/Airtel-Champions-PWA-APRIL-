/**
 * HBB Order Tracker — Amazon-style delivery tracking
 * Shows the real-time stage of the customer's own installation order
 * Includes live installer location when status is on_way / arrived
 */
import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, User, Calendar, Wrench, Home, RefreshCw,
  Wifi, MapPin, Phone, ChevronRight, AlertCircle, Package, Navigation2, ExternalLink,
} from 'lucide-react';
import { getServiceRequests } from './hbb-api';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../utils/supabase/client';

const ACCENT = '#E60000';

// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGES = [
  {
    id: 'placed',
    label: 'Order Placed',
    sublabel: 'Your order has been received',
    icon: Package,
    color: '#10B981',
  },
  {
    id: 'verification',
    label: 'Awaiting Verification',
    sublabel: 'Our team is reviewing your order',
    icon: Clock,
    color: '#3B82F6',
  },
  {
    id: 'assigned',
    label: 'Installer Assigned',
    sublabel: 'A technician has been allocated to your order',
    icon: User,
    color: '#8B5CF6',
  },
  {
    id: 'scheduled',
    label: 'Installation Scheduled',
    sublabel: 'Your installation date is confirmed',
    icon: Calendar,
    color: '#F59E0B',
  },
  {
    id: 'enroute',
    label: 'Installer En Route',
    sublabel: 'The technician is on their way to you',
    icon: Wrench,
    color: '#EF4444',
  },
  {
    id: 'complete',
    label: 'Installation Complete',
    sublabel: 'Your Airtel 5G home broadband is live! 🎉',
    icon: Home,
    color: '#10B981',
  },
];

// Map API status → stage index (0-based, -1 = unknown)
function statusToStageIndex(sr: any): number {
  const status = (sr?.status || 'open').toLowerCase();
  switch (status) {
    case 'open':
    case 'new':
    case 'unreachable':
    case 'not_ready':
      return 1; // awaiting verification
    case 'assigned':
      return 2; // installer assigned
    case 'rescheduled':
      return 3; // installation scheduled
    case 'on_way':
    case 'in_progress':
      return 4; // en route
    case 'arrived':
      return 4; // still "en route" stage but use arrived sublabel
    case 'completed':
    case 'done':
      return 5; // complete
    default:
      return 1;
  }
}

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Live Installer Location Section ─────────────────────────────────────────
function LiveInstallerLocation({ jobId, isArrived }: { jobId: number | string; isArrived: boolean }) {
  const [location, setLocation] = useState<{ lat: number; lng: number; recorded_at: string } | null>(null);
  const [customerLoc, setCustomerLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState('');

  // Fetch latest installer position
  const fetchLocation = useCallback(async () => {
    const { data } = await supabase
      .from('location_tracking')
      .select('lat, lng, recorded_at')
      .eq('job_id', String(jobId))
      .order('recorded_at', { ascending: false })
      .limit(1);
    if (data?.[0]) setLocation(data[0]);
  }, [jobId]);

  useEffect(() => {
    fetchLocation();
    // Subscribe to realtime updates
    const ch = supabase
      .channel(`track-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'location_tracking',
        filter: `job_id=eq.${jobId}`,
      }, payload => {
        const row = payload.new as any;
        if (row?.lat) setLocation({ lat: row.lat, lng: row.lng, recorded_at: row.recorded_at });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [jobId, fetchLocation]);

  // Try to get customer's location for distance calc
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setCustomerLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError('Enable location for distance estimate'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const distance = location && customerLoc
    ? haversine(customerLoc.lat, customerLoc.lng, location.lat, location.lng)
    : null;

  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  const lastUpdate = location?.recorded_at
    ? new Date(location.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (isArrived) {
    return (
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden border-2 border-green-200">
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#ECFDF5' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-700">Installer Has Arrived</span>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-sm text-gray-600">Your Airtel technician is at your location. Please let them in.</p>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <MapPin className="w-3.5 h-3.5" />
              View on map <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden border-2" style={{ borderColor: '#BFDBFE' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-blue-700">Installer En Route</span>
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-blue-500">Updated {lastUpdate}</span>
        )}
      </div>
      <div className="bg-white px-4 py-3 space-y-2">
        {!location ? (
          <div className="flex items-center gap-2 py-1">
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Waiting for installer location…</p>
          </div>
        ) : (
          <>
            {distance !== null && (
              <div className="flex items-center gap-2">
                <Navigation2 className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-bold text-gray-900">
                  {distance < 1
                    ? `${Math.round(distance * 1000)} m away`
                    : `${distance.toFixed(1)} km away`}
                </p>
                <span className="text-xs text-gray-400">
                  {distance < 0.5 ? '• Arriving soon' : distance < 3 ? '• Nearby' : '• On the way'}
                </span>
              </div>
            )}
            {locError && !customerLoc && (
              <p className="text-xs text-gray-400">{locError}</p>
            )}
            <p className="text-xs text-gray-400">
              Last position: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPhone(phone: string) {
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 9) return `+254 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 10) return `+254 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return phone;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  agentPhone: string;
  agentName: string;
  /** Specific SR id to track (from localStorage after signup) */
  srId?: number | null;
  onNewOrder?: () => void;
}

export function HBBOrderTracker({ agentPhone, agentName, srId, onNewOrder }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const normalizePhone = (p: string) => String(p).replace(/\D/g, '').slice(-9);
  const agentDigits = normalizePhone(agentPhone);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await getServiceRequests({ agent_phone: agentPhone, limit: 50 });
      const srs: any[] = result?.data || [];

      let selfOrder: any = null;

      // Priority 1: by specific SR id stored after signup
      if (srId) {
        selfOrder = srs.find(sr => sr.id === srId);
      }
      // Priority 2: SR where customer phone matches agent phone (self-order)
      if (!selfOrder) {
        selfOrder = srs.find(sr => {
          const custDigits = normalizePhone(sr.customer_phone || '');
          return custDigits === agentDigits;
        });
      }
      // Priority 3: most recent SR by the agent (they are the customer too)
      if (!selfOrder && srs.length > 0) {
        selfOrder = srs[0];
      }

      setOrder(selfOrder || null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[HBB Tracker] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentPhone, srId, agentDigits]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchOrder(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const currentStageIndex = order ? statusToStageIndex(order) : 1;
  const isComplete = currentStageIndex >= 5;
  const hasFailed = ['failed', 'cancelled'].includes((order?.status || '').toLowerCase());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-10 h-10 border-3 border-red-200 border-t-red-500 rounded-full animate-spin mb-4"
          style={{ borderWidth: 3 }} />
        <p className="text-sm text-gray-400">Loading your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-base font-bold text-gray-700 mb-1">No Order Found</h3>
        <p className="text-sm text-gray-400 mb-6">You haven't placed an order for yourself yet.</p>
        {onNewOrder && (
          <button onClick={onNewOrder}
            className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #B30000)` }}>
            Place an Order
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header card ────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden shadow-lg"
        style={{ background: isComplete ? 'linear-gradient(135deg, #10B981, #059669)' : `linear-gradient(135deg, ${ACCENT}, #B30000)` }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                {isComplete ? 'Installation Complete' : 'Order In Progress'}
              </p>
              <h2 className="text-white text-xl font-black leading-tight">
                {isComplete ? '🎉 You\'re all set!' : STAGES[currentStageIndex].label}
              </h2>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* SR Number */}
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            <Package className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white text-xs font-mono font-bold">{order.sr_number || `SR-${order.id}`}</span>
            <span className="text-white/50 text-xs">•</span>
            <span className="text-white/70 text-xs">{order.package || '5G Smart Connect'}</span>
          </div>

          {/* Last refresh */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-white/60 text-[10px]">
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
            <button onClick={() => fetchOrder(true)} disabled={refreshing}
              className="flex items-center gap-1 text-white/70 text-[10px] font-medium active:text-white transition-colors">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <div className="mx-4 mt-3 mb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Progress</span>
          <span className="text-[10px] font-bold" style={{ color: ACCENT }}>
            {Math.round((currentStageIndex / (STAGES.length - 1)) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: isComplete ? '#10B981' : `linear-gradient(90deg, ${ACCENT}, #FF4444)` }}
          />
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 space-y-0">
        {STAGES.map((stage, i) => {
          const isDone = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const isPending = i > currentStageIndex;
          const Icon = stage.icon;

          return (
            <motion.div key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3">
              {/* Line + dot column */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  isDone ? 'border-transparent' :
                  isCurrent ? 'border-transparent shadow-lg' :
                  'border-gray-200 bg-white'
                }`}
                  style={{
                    background: isDone ? stage.color : isCurrent ? stage.color : 'transparent',
                    boxShadow: isCurrent ? `0 0 0 4px ${stage.color}22` : 'none',
                  }}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </motion.div>
                  ) : (
                    <Icon className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                {/* Connector line */}
                {i < STAGES.length - 1 && (
                  <div className="w-0.5 flex-1 my-1 rounded-full"
                    style={{ background: isDone ? stage.color : '#E5E7EB', minHeight: 20 }} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-5 ${i === STAGES.length - 1 ? 'pb-2' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 border transition-all ${
                  isCurrent ? 'border-transparent shadow-md' :
                  isDone ? 'border-transparent bg-gray-50' :
                  'border-gray-100 bg-white'
                }`}
                  style={isCurrent ? { background: `${stage.color}10`, borderColor: `${stage.color}30`, border: `1.5px solid ${stage.color}30` } : {}}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-bold leading-tight ${isPending ? 'text-gray-300' : 'text-gray-900'}`}>
                        {stage.label}
                        {isCurrent && (
                          <span className="ml-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white inline-block align-middle"
                            style={{ background: stage.color }}>Now</span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 leading-snug ${isPending ? 'text-gray-200' : isDone ? 'text-gray-400' : 'text-gray-500'}`}>
                        {stage.sublabel}
                      </p>
                      {/* Extra info for current stage */}
                      {isCurrent && stage.id === 'scheduled' && order.preferred_date && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Calendar className="w-3 h-3" style={{ color: stage.color }} />
                          <span className="text-xs font-semibold" style={{ color: stage.color }}>
                            {formatDate(order.preferred_date)}
                          </span>
                        </div>
                      )}
                      {isCurrent && stage.id === 'scheduled' && order.preferred_time && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" style={{ color: stage.color }} />
                          <span className="text-xs font-medium text-gray-500">{order.preferred_time}</span>
                        </div>
                      )}
                    </div>
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: stage.color }} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Order details card ──────────────────────────────────────────────── */}
      <div className="mx-4 mt-2 mb-6 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Details</p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {order.customer_name && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-500">Customer</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{order.customer_name}</span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-500">Phone</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{formatPhone(order.customer_phone)}</span>
            </div>
          )}
          {order.package && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-500">Plan</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{order.package}</span>
            </div>
          )}
          {(order.estate || order.town_name) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-500">Location</span>
              </div>
              <span className="text-xs font-semibold text-gray-800 text-right">
                {[order.estate, order.town_name].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {order.preferred_date && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-500">Install Date</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{formatDate(order.preferred_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Live installer location (en route / arrived) ────────────────────── */}
      {(['on_way', 'arrived', 'in_progress'].includes((order?.status || '').toLowerCase())) && order?.id && (
        <LiveInstallerLocation
          jobId={order.id}
          isArrived={(order?.status || '').toLowerCase() === 'arrived'}
        />
      )}

      {/* ── Issue / failed alert ────────────────────────────────────────────── */}
      {hasFailed && (
        <div className="mx-4 mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Issue with your order</p>
            <p className="text-xs text-red-500 mt-0.5">Our team will contact you shortly to resolve this. You can also call Airtel customer care.</p>
          </div>
        </div>
      )}

      {/* ── Help note ──────────────────────────────────────────────────────── */}
      <div className="mx-4 mb-8 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-xs text-blue-600 leading-relaxed text-center">
          📞 Need help? Call{' '}
          <a href="tel:0800724000" className="font-bold underline decoration-dotted">
            0800 724 000
          </a>{' '}
          (toll-free) and quote your SR number.
        </p>
      </div>
    </div>
  );
}
