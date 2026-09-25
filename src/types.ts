/**
 * Halo Grid Simulator (MVP)
 * Shared TypeScript Types & Models
 */

export type StatusType = 'Fugitive' | 'Missing Person' | 'Active Arrest Warrant' | 'Urgent Locate';

export interface FaceWatchlistRecord {
  watchlist_id: string;
  candidate_name: string;
  case_id: string;
  status_type: StatusType;
  reference_face_image: string;
  age_range: string;
  gender: string;
  last_seen_location: string;
  last_seen_date: string;
  risk_priority: 'Low' | 'Medium' | 'High';
  alert_threshold: number;
  notes: string;
}

export type VehicleStatusType = 
  | 'Stolen Vehicle' 
  | 'Missing Vehicle' 
  | 'Wanted Vehicle' 
  | 'Vehicle of Interest' 
  | 'Suspected Getaway Vehicle';

export interface VehicleWatchlistRecord {
  vehicle_watchlist_id: string;
  plate_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_year: number;
  case_id: string;
  vehicle_status_type: VehicleStatusType;
  reference_vehicle_image: string;
  reported_last_seen_location: string;
  reported_last_seen_date: string;
  risk_priority: 'Low' | 'Medium' | 'High';
  notes: string;
}

export type AlertType = 'Face Alert' | 'Vehicle Alert';
export type AlertStatus = 'Pending Review' | 'Dismissed' | 'Under Investigation' | 'Escalated';

export interface AlertRecord {
  alert_id: string;
  alert_type: AlertType;
  timestamp: string;
  spotted_location: string;
  source_camera: string;
  matched_entity_name: string; // Candidate name or Plate number
  watchlist_id: string; // matching watchlist ID
  case_id: string;
  similarity_score_or_plate_confidence: number;
  quality_score: number;
  blur_score: number;
  threshold: number;
  status: AlertStatus;
  thumbnail_image: string;
  notes: string;
  reviewer_notes?: string;
  risk_priority: 'Low' | 'Medium' | 'High';
}

export interface SystemSettings {
  faceThreshold: number;
  faceQualityMin: number;
  faceBlurMax: number;
  plateQualityMin: number;
  plateBlurMax: number;
  plateConfidenceMin: number;
  logBelowThreshold: boolean;
  keepDismissedInAnalytics: boolean;
}

export interface ScanOutcome {
  accepted: boolean;
  reason?: string;
  qualityScore: number;
  blurScore: number;
  detectedText?: string; // e.g. license plate for vehicle scan
  matchFound: boolean;
  similarityScore?: number;
  matchedFace?: FaceWatchlistRecord;
  matchedVehicle?: VehicleWatchlistRecord;
  occupantFaceDetected?: boolean;
  occupantQualityScore?: number;
  occupantMatchCriminalId?: string | null;
  occupantMatchSimilarity?: number;
  occupantMatchedFace?: FaceWatchlistRecord;
  occupantAssessment?: string | null;
}

export type UserRole = 'Operator' | 'Reviewer' | 'Admin';

export interface UserSession {
  username: string;
  role: UserRole;
  fullName: string;
}
