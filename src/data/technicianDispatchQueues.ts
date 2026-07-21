export type QueueStatus = 'pending' | 'validated';

export interface PendingPestReport {
  id: string;
  reportId: string;
  barangay: string;
  farmerName: string;
  rsbsaNo: string;
  crop: string;
  reportedPest: string;
  encodedAt: string;
  status: QueueStatus;
}

export interface PendingCalamityReport {
  id: string;
  reportId: string;
  calamityEvent: string;
  barangay: string;
  farmerName: string;
  rsbsaNo: string;
  farmerId: string;
  cropType: string;
  variety: string;
  cropStage: string;
  areaPlanted: number;
  areaDamagedReported: number;
  encodedAt: string;
  status: QueueStatus;
}

export const MOCK_PEST_QUEUE: PendingPestReport[] = [
  {
    id: 'pest-001',
    reportId: 'BRGY-PEST-2026-0042',
    barangay: 'San Fabian',
    farmerName: 'Reyes, Maria Lopez',
    rsbsaNo: '01-28-03-005-000034',
    crop: 'Rice',
    reportedPest: 'Brown Planthopper',
    encodedAt: '2026-07-18T08:30:00',
    status: 'pending',
  },
  {
    id: 'pest-002',
    reportId: 'BRGY-PEST-2026-0048',
    barangay: 'Soyung (Poblacion)',
    farmerName: 'Mendoza, Carlos R.',
    rsbsaNo: '01-28-03-005-000102',
    crop: 'Corn',
    reportedPest: 'Fall Armyworm',
    encodedAt: '2026-07-19T14:15:00',
    status: 'pending',
  },
  {
    id: 'pest-003',
    reportId: 'BRGY-PEST-2026-0051',
    barangay: 'Annafunan',
    farmerName: 'Torres, Ricardo P.',
    rsbsaNo: '01-28-03-005-000055',
    crop: 'Rice',
    reportedPest: 'Rice Black Bug',
    encodedAt: '2026-07-20T09:00:00',
    status: 'pending',
  },
];

export const MOCK_CALAMITY_QUEUE: PendingCalamityReport[] = [
  {
    id: 'cal-001',
    reportId: 'BRGY-CAL-2026-0012',
    calamityEvent: 'Typhoon Kristine',
    barangay: 'San Fabian',
    farmerName: 'Aquino, Liza D.',
    rsbsaNo: '01-28-03-005-000067',
    farmerId: 'farmer-mock-067',
    cropType: 'Corn',
    variety: 'Hybrid Yellow',
    cropStage: 'Vegetative',
    areaPlanted: 0.8,
    areaDamagedReported: 0.25,
    encodedAt: '2026-07-19T11:20:00',
    status: 'pending',
  },
  {
    id: 'cal-002',
    reportId: 'BRGY-CAL-2026-0015',
    calamityEvent: 'Typhoon Kristine',
    barangay: 'Annafunan',
    farmerName: 'Torres, Ricardo P.',
    rsbsaNo: '01-28-03-005-000055',
    farmerId: 'farmer-mock-055',
    cropType: 'Rice',
    variety: 'NSIC Rc 222',
    cropStage: 'Vegetative',
    areaPlanted: 1.5,
    areaDamagedReported: 0.6,
    encodedAt: '2026-07-19T16:45:00',
    status: 'pending',
  },
  {
    id: 'cal-003',
    reportId: 'BRGY-CAL-2026-0018',
    calamityEvent: 'Flash Flood Event',
    barangay: 'Soyung (Poblacion)',
    farmerName: 'Flores, Benjamin T. Sr.',
    rsbsaNo: '01-28-03-005-000088',
    farmerId: 'farmer-mock-088',
    cropType: 'High-Value',
    variety: 'Tomato Hybrid',
    cropStage: 'Reproductive',
    areaPlanted: 0.4,
    areaDamagedReported: 0.15,
    encodedAt: '2026-07-20T07:30:00',
    status: 'pending',
  },
];

export function getPestReportById(id: string): PendingPestReport | undefined {
  return MOCK_PEST_QUEUE.find((r) => r.id === id);
}

export function getCalamityReportById(id: string): PendingCalamityReport | undefined {
  return MOCK_CALAMITY_QUEUE.find((r) => r.id === id);
}

export function formatQueueDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
