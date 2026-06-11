/**
 * Application — HTTP API for student operations.
 */

import { SERVER_URL } from '../../domain/serverConfig';

export async function submitAnswers(studentId, answers) {
  return fetch(`${SERVER_URL}/api/students/${studentId}/submit-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
}

export async function addComment(studentId, { author, text }) {
  return fetch(`${SERVER_URL}/api/students/${studentId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });
}

export async function setVerdict(studentId, verdict) {
  return fetch(`${SERVER_URL}/api/students/${studentId}/verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verdict }),
  });
}

export async function setScore(studentId, score) {
  return fetch(`${SERVER_URL}/api/students/${studentId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
}
