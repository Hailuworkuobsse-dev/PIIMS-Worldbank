export interface BeneficiaryMarkerDTO {
  beneficiaryId: string;
  uniqueId: string;
  fullName: string;
  lat: number;
  lon: number;
  status: string;
  woreda?: string;
  region?: string;
}

export interface InterventionMarkerDTO {
  deliveryId: string;
  productName: string;
  serialNo?: string;
  lat: number;
  lon: number;
  installDate?: string;
  supplierName?: string;
  projectCode?: string;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface GeoVerifyResponseDTO {
  match: boolean;
  distanceMeters: number;
  verifiedAt: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}