const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error('API health check failed');
  }
  return response.json();
}
