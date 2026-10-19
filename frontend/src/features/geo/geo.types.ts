export interface GeoPoint {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface BeneficiaryMarker {
  beneficiaryId: string;
  uniqueId: string;
  fullName: string;
  lat: number;
  lon: number;
  status: string;
  woreda?: string;
  region?: string;
}

export interface InterventionMarker {
  deliveryId: string;
  productName: string;
  serialNo?: string;
  lat: number;
  lon: number;
  installDate?: string;
  supplierName?: string;
  projectCode?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoFilters {
  layer: "beneficiaries" | "interventions" | "heatmap";
  bounds?: MapBounds | undefined;
  region?: string | undefined;
  woreda?: string | undefined;
  projectId?: string | undefined;
  status?: string[] | undefined;
}

export interface GeoVerifyRequest {
  entityType: "BENEFICIARY" | "SERVICE_DELIVERY";
  entityId: string;
  claimedLocation: GeoPoint;
  toleranceMeters: number;
}

export interface GeoVerifyResponse {
  match: boolean;
  distanceMeters: number;
  verifiedAt: string;
}