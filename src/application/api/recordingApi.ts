import type { RecordingListItem, StopRecordingResult } from '@shared/recording';
import { SERVER_URL } from '../../domain/serverConfig';

export async function startRecording(studentId: string): Promise<{ hash: string }> {
  const res = await fetch(`${SERVER_URL}/api/recording/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return res.json();
}

export async function sendChunk(studentId: string, type: string, arrayBuffer: ArrayBuffer): Promise<Response> {
  // Encode studentId to avoid non-ISO-8859-1 characters in headers
  const safeId = encodeURIComponent(studentId);
  return fetch(`${SERVER_URL}/api/recording/chunk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'video/webm',
      'x-student-id': safeId,
      'x-recording-type': type,
    },
    body: arrayBuffer,
  });
}

export async function stopRecording(studentId: string): Promise<StopRecordingResult | null> {
  const res = await fetch(`${SERVER_URL}/api/recording/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function listRecordings(): Promise<RecordingListItem[]> {
  const res = await fetch(`${SERVER_URL}/api/recordings`);
  return res.json();
}