/**
 * Application — HTTP API for recording operations.
 */

import { SERVER_URL } from '../../domain/serverConfig';

export async function startRecording(studentId) {
  const res = await fetch(`${SERVER_URL}/api/recording/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return res.json();
}

export async function sendChunk(studentId, type, arrayBuffer) {
  return fetch(`${SERVER_URL}/api/recording/chunk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'video/webm',
      'x-student-id': studentId,
      'x-recording-type': type,
    },
    body: arrayBuffer,
  });
}

export async function stopRecording(studentId) {
  const res = await fetch(`${SERVER_URL}/api/recording/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function listRecordings() {
  const res = await fetch(`${SERVER_URL}/api/recordings`);
  return res.json();
}
