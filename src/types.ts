export interface TenderDetails {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string;
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsData {
  tender: TenderDetails;
  requirements: Requirement[];
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  isDuplicate: boolean;
  contentHash: string; // for duplicate detection
  error?: string;
}

export interface DocumentMatch {
  requirementId: string;
  fileId: string;
  expiryDate?: string;
}

export type StatusType = 'Missing' | 'Expiry date needed' | 'Expired' | 'Not provided' | 'OK';
