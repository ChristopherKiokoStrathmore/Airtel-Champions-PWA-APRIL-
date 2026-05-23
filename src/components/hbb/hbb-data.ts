// HBB Static Data — Packages, Estates per Town, Pricing

// ─── PACKAGES ───────────────────────────────────────────────────────────────
export interface HBBPackage {
  id: string;
  name: string;
  speed: string;
  price: number;
  priceLabel: string;
  data: string;
  router: string;
  installation: string;
  features: string[];
  color: string;
  popular?: boolean;
}

export const HBB_PACKAGES: HBBPackage[] = [
  {
    id: 'hbb_starter',
    name: 'HBB Starter',
    speed: '5 Mbps',
    price: 2500,
    priceLabel: 'KES 2,500/mo',
    data: 'Unlimited (FUP 40GB)',
    router: 'Basic 4G Router',
    installation: 'FREE',
    features: ['Basic Browsing', 'Email & Social Media', 'Standard Support'],
    color: '#3B82F6',
  },
  {
    id: 'hbb_basic',
    name: 'HBB Basic',
    speed: '10 Mbps',
    price: 3500,
    priceLabel: 'KES 3,500/mo',
    data: 'Unlimited (FUP 80GB)',
    router: '4G LTE Router',
    installation: 'FREE',
    features: ['HD Streaming', 'Video Calls', 'Up to 5 Devices', 'Standard Support'],
    color: '#10B981',
  },
  {
    id: 'hbb_plus',
    name: 'HBB Plus',
    speed: '20 Mbps',
    price: 5000,
    priceLabel: 'KES 5,000/mo',
    data: 'Unlimited (FUP 150GB)',
    router: '4G+ LTE-A Router',
    installation: 'FREE',
    features: ['Full HD Streaming', 'Gaming', 'Up to 10 Devices', 'Priority Support'],
    color: '#F59E0B',
    popular: true,
  },
  {
    id: 'hbb_premium',
    name: 'HBB Premium',
    speed: '40 Mbps',
    price: 7500,
    priceLabel: 'KES 7,500/mo',
    data: 'Unlimited (FUP 300GB)',
    router: '5G CPE Router',
    installation: 'FREE',
    features: ['4K Streaming', 'Low Latency Gaming', 'Up to 20 Devices', 'Premium Support', 'Static IP Option'],
    color: '#8B5CF6',
  },
  {
    id: 'hbb_ultra',
    name: 'HBB Ultra',
    speed: '100 Mbps',
    price: 12000,
    priceLabel: 'KES 12,000/mo',
    data: 'Truly Unlimited',
    router: '5G Pro Router',
    installation: 'FREE',
    features: ['8K Ready', 'Ultra-Low Latency', 'Unlimited Devices', 'Dedicated Support', 'Static IP Included', 'Business Ready'],
    color: '#EF4444',
  },
];

export function getPackageById(id: string): HBBPackage | undefined {
  return HBB_PACKAGES.find(p => p.id === id || p.name === id);
}

// ─── ESTATES PER TOWN ───────────────────────────────────────────────────────
// Map of town name (uppercase) → list of estates/areas
export const ESTATES_BY_TOWN: Record<string, string[]> = {
  'NAIROBI': [
    'Kilimani', 'Westlands', 'Lavington', 'Karen', 'Langata', 'South B', 'South C',
    'Eastleigh', 'Parklands', 'Spring Valley', 'Kileleshwa', 'Hurlingham', 'Upperhill',
    'CBD', 'Industrial Area', 'Embakasi', 'Donholm', 'Umoja', 'Buruburu', 'Kahawa',
    'Kasarani', 'Roysambu', 'Zimmerman', 'Githurai', 'Ruaka', 'Kitisuru', 'Runda',
    'Muthaiga', 'Garden Estate', 'Ridgeways', 'Thome', 'Maringo', 'Jericho',
    'Makadara', 'Kayole', 'Utawala', 'Syokimau', 'Athi River', 'Mlolongo',
    'Rongai', 'Ngong', 'Kikuyu', 'Kinoo', 'Thindigua', 'Banana Hill',
  ],
  'MOMBASA': [
    'Nyali', 'Bamburi', 'Shanzu', 'Kisauni', 'Likoni', 'Tudor', 'Ganjoni',
    'Kizingo', 'Old Town', 'Mkomani', 'Changamwe', 'Mikindani', 'Miritini',
    'Port Reitz', 'Jomvu', 'Kongowea', 'Bombolulu', 'Mtwapa', 'Kilifi Road',
    'Diani Beach', 'Ukunda', 'Voi',
  ],
  'KISUMU': [
    'Milimani', 'Tom Mboya', 'Kondele', 'Nyalenda', 'Manyatta', 'Mamboleo',
    'Migosi', 'Lolwe', 'Obunga', 'Nyamasaria', 'Kibos', 'Riat', 'Kisian',
    'Otonglo', 'Dunga', 'Ogango', 'CBD',
  ],
  'NAKURU': [
    'Milimani', 'Section 58', 'London', 'Freehold', 'Whitehouse', 'Kiamunyi',
    'Lanet', 'Naka', 'Shabab', 'Bondeni', 'Kaloleni', 'Pangani', 'Barnabas',
    'Pipeline', 'Naivasha Road', 'CBD',
  ],
  'ELDORET': [
    'Elgon View', 'Pioneer', 'Langas', 'Huruma', 'Kapseret', 'Kimumu',
    'Annex', 'West Indies', 'Kipkaren', 'Outspan', 'Referral', 'CBD',
    'Hawaii', 'Maili Nne', 'Chepkoilel',
  ],
  'THIKA': [
    'Makongeni', 'Ngoingwa', 'Section 9', 'Biashara', 'Starehe', 'Jamhuri',
    'Landless', 'Kiandutu', 'Kiganjo', 'Gatuanyaga', 'Juja', 'Ruiru',
  ],
  'MACHAKOS': [
    'Town Centre', 'Muthurwa', 'Kola', 'Katoloni', 'Muvuti', 'Kalama',
    'Mavoko', 'Athi River', 'Syokimau', 'Mlolongo', 'Matuu',
  ],
  'NYERI': [
    'Town Centre', 'Ruring\'u', 'Majengo', 'Kamakwa', 'Kiganjo', 'Karatina',
    'Naro Moru', 'Othaya', 'Mukurwe-ini',
  ],
  'NANYUKI': [
    'Town Centre', 'Likii', 'Sweetwaters', 'Nturukuma', 'Timau', 'Doldol',
  ],
  'KISII': [
    'Town Centre', 'Daraja Mbili', 'Mwembe', 'Jogoo', 'Nyanchwa', 'Keumbu',
    'Keroka', 'Suneka',
  ],
  'MERU': [
    'Town Centre', 'Makutano', 'Kinoru', 'Gakoromone', 'Nchiru', 'Nkubu',
    'Timau', 'Maua',
  ],
  'MALINDI': [
    'Town Centre', 'Shella', 'Casuarina', 'Silversands', 'Watamu',
    'Gede', 'Mambrui',
  ],
  'NAIVASHA': [
    'Town Centre', 'Karagita', 'Kongoni', 'Maiella', 'South Lake',
    'Kinungi', 'Gilgil',
  ],
  'KITALE': [
    'Town Centre', 'Milimani', 'Bondeni', 'Grassland', 'Kipsongo',
    'Matisi', 'Endebess',
  ],
};

export function getEstatesForTown(townName: string): string[] {
  const key = townName?.toUpperCase().trim();
  return ESTATES_BY_TOWN[key] || [];
}

// ─── TIME SLOTS ─────────────────────────────────────────────────────────────
export const TIME_SLOTS = [
  { id: '08:00', label: '8:00 AM', hour: 8 },
  { id: '09:00', label: '9:00 AM', hour: 9 },
  { id: '10:00', label: '10:00 AM', hour: 10 },
  { id: '11:00', label: '11:00 AM', hour: 11 },
  { id: '12:00', label: '12:00 PM', hour: 12 },
  { id: '13:00', label: '1:00 PM', hour: 13 },
  { id: '14:00', label: '2:00 PM', hour: 14 },
  { id: '15:00', label: '3:00 PM', hour: 15 },
  { id: '16:00', label: '4:00 PM', hour: 16 },
  { id: '17:00', label: '5:00 PM', hour: 17 },
];

// Each installation takes ~2 hours, so a slot blocks 2 hours
export const SLOT_DURATION_HOURS = 2;
