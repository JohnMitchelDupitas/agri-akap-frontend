export interface SupportLineItem {
  farmer_name: string;
  barangay: string;
  crop_type: string;
  area_destroyed_ha: number;
  damage_percentage: number;
  date_approved: string;
}

export interface SupportAllocation {
  support_type: string;
  quantity: number;
  unit: string;
}

/**
 * Echague MAO demo support allocation by destroyed hectare.
 * Rice: 2 bags certified seeds/ha; Corn: 1 bag hybrid seeds/ha; Other: 1 bag fertilizer/ha.
 */
export function supportAllocation(cropType: string, areaHa: number): SupportAllocation {
  const area = Number(areaHa) || 0;
  const crop = (cropType || '').toLowerCase();

  if (crop.includes('rice') || crop.includes('palay')) {
    return {
      support_type: 'Certified Seeds',
      quantity: Math.round(area * 2 * 100) / 100,
      unit: 'bags',
    };
  }
  if (crop.includes('corn')) {
    return {
      support_type: 'Hybrid Seeds',
      quantity: Math.round(area * 1 * 100) / 100,
      unit: 'bags',
    };
  }
  return {
    support_type: 'Fertilizer',
    quantity: Math.round(area * 1 * 100) / 100,
    unit: 'bags',
  };
}
