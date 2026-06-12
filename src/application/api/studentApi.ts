import type { GradeResult } from '@shared/student';
import { SERVER_URL } from '../../domain/serverConfig';

export async function submitAnswers(
  studentId: string,
  answers: Record<number, number>,
): Promise<GradeResult> {
  const res = await fetch(`${SERVER_URL}/api/students/${studentId}/submit-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  return res.json();
}

export async function addComment(
  studentId: string,
  { author, text }: { author: string; text: string },
): Promise<Response> {
  return fetch(`${SERVER_URL}/api/students/${studentId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });
}

export async function setVerdict(studentId: string, verdict: string): Promise<Response> {
  return fetch(`${SERVER_URL}/api/students/${studentId}/verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verdict }),
  });
}

export async function setScore(studentId: string, score: string | number): Promise<Response> {
  return fetch(`${SERVER_URL}/api/students/${studentId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
}
