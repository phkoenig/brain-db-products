export interface Capture {
  id: number;
  url: string;
  datetime?: string;
  screenshot_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface CaptureFormData {
  capture_id?: number;
  url?: string;
  screenshot_url?: string;
  thumbnail_url?: string;
  created_at?: string;
}