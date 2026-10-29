import type { Analysis } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error("Cannot reach the ResumeAI backend. Check that it is running and try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "The request could not be completed.");
  }
  return response.json() as Promise<T>;
}

export function extractFile(file: File): Promise<{ extracted_text: string; filename: string }> {
  const body = new FormData();
  body.append("file", file);
  return request("/api/resumes/upload", { method: "POST", body });
}

export function analyzeResume(input: {
  resume_text: string;
  career_goal: string;
  experience_level: string;
}): Promise<Analysis> {
  return request<Analysis>("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
