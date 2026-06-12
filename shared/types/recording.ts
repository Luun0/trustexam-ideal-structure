export type RecordingType = 'screen' | 'face';

export interface RecordingListItem {
  hash: string;
  screenUrl: string;
  faceUrl: string | null;
  screenSize: number;
  faceSize: number;
  created: Date;
  studentName: string;
  studentId: string | null;
}

export interface StopRecordingResult {
  hash: string;
  screenUrl: string;
  faceUrl: string;
  screenSize: number;
  faceSize: number;
  duration: number;
}

export interface ChunkWriteResult {
  screenChunks: number;
  faceChunks: number;
}
