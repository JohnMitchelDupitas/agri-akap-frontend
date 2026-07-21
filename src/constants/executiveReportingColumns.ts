export type ExecutiveReportCategory =
  | 'crop_production'
  | 'masterlists'
  | 'pest_surveillance'
  | 'damage_calamity';

export interface ReportColumn {
  key: string;
  label: string;
  center?: boolean;
}

export const REPORT_CATEGORY_LABELS: Record<ExecutiveReportCategory, string> = {
  crop_production: 'Crop Production & Status',
  masterlists: 'Masterlists & Beneficiary Data',
  pest_surveillance: 'Pest & Disease Surveillance',
  damage_calamity: 'Damage & Calamity Assessment',
};

export const REPORT_PRINT_TITLES: Record<ExecutiveReportCategory, string> = {
  crop_production: 'CROP PRODUCTION & STATUS REPORT',
  masterlists: 'MASTERLIST OF FARMERS & BENEFICIARIES',
  pest_surveillance: 'PEST & DISEASE SURVEILLANCE REPORT',
  damage_calamity: 'DAMAGE & CALAMITY ASSESSMENT REPORT',
};

export function columnsForCategory(category: ExecutiveReportCategory): ReportColumn[] {
  switch (category) {
    case 'crop_production':
      return [
        { key: 'no', label: 'NO', center: true },
        { key: 'rsbsa_no', label: 'RSBSA NO.' },
        { key: 'last_name', label: 'LAST NAME' },
        { key: 'first_name', label: 'FIRST NAME' },
        { key: 'middle_name', label: 'MIDDLE NAME' },
        { key: 'ext_name', label: 'EXT NAME' },
        { key: 'birthday', label: 'BIRTHDAY' },
        { key: 'farmer_address', label: 'FARMER ADDRESS' },
        { key: 'farm_location', label: 'FARM LOCATION' },
        { key: 'area_planted', label: 'AREA PLANTED', center: true },
        { key: 'date_of_planting', label: 'DATE OF PLANTING' },
      ];
    case 'masterlists':
      return [
        { key: 'no', label: 'NO', center: true },
        { key: 'rsbsa_no', label: 'RSBSA NO.' },
        { key: 'last_name', label: 'LAST NAME' },
        { key: 'first_name', label: 'FIRST NAME' },
        { key: 'middle_name', label: 'MIDDLE NAME' },
        { key: 'ext_name', label: 'EXT NAME' },
        { key: 'birthday', label: 'BIRTHDAY' },
        { key: 'farmer_address', label: 'FARMER ADDRESS' },
        { key: 'farm_location', label: 'FARM LOCATION' },
        { key: 'area_planted', label: 'AREA PLANTED', center: true },
        { key: 'source_of_water', label: 'SOURCE OF WATER' },
        { key: 'remarks', label: 'REMARKS' },
      ];
    case 'pest_surveillance':
      return [
        { key: 'no', label: 'NO', center: true },
        { key: 'rsbsa_no', label: 'RSBSA NO.' },
        { key: 'last_name', label: 'LAST NAME' },
        { key: 'first_name', label: 'FIRST NAME' },
        { key: 'middle_name', label: 'MIDDLE NAME' },
        { key: 'ext_name', label: 'EXT NAME' },
        { key: 'birthday', label: 'B-DAY' },
        { key: 'farmer_address', label: 'FARMER ADDRESS' },
        { key: 'farm_location', label: 'FARM LOCATION' },
        { key: 'area_planted', label: 'AREA PLANTED', center: true },
        { key: 'days_after_planting', label: 'DAYS AFTER PLANTING', center: true },
        { key: 'variety', label: 'VARIETY' },
        { key: 'area_damage_pct', label: 'AREA DAMAGE (%)', center: true },
        { key: 'damage_by_pest', label: 'DAMAGE BY PEST/DISEASE' },
      ];
    case 'damage_calamity':
      return [
        { key: 'no', label: 'NO', center: true },
        { key: 'rsbsa_no', label: 'RSBSA NO.' },
        { key: 'last_name', label: 'LAST NAME' },
        { key: 'first_name', label: 'FIRST NAME' },
        { key: 'middle_name', label: 'MIDDLE NAME' },
        { key: 'ext_name', label: 'EXT NAME' },
        { key: 'farm_location', label: 'FARM LOCATION' },
        { key: 'crop_type', label: 'CROP TYPE' },
        { key: 'stage_of_crop', label: 'STAGE OF CROP' },
        { key: 'area_planted', label: 'AREA PLANTED (ha)', center: true },
        { key: 'area_damaged', label: 'AREA DAMAGED (ha)', center: true },
        { key: 'est_yield_loss_pct', label: 'EST. YIELD LOSS (%)', center: true },
      ];
    default:
      return [];
  }
}
