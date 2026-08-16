import { demoOperations } from "@/lib/demo-operations";
import type { CommercialProgress, DutyResult, LiveStatus, LocationPoint, MonitoringItem, MonitoringReview, MonitoringUpdate, OperationsRole, StopAction, Trip } from "@/lib/operations-types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const operationsDemoMode = !API_URL || API_URL.includes("api.example.com");

export class OperationsApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "OperationsApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    throw new OperationsApiError(body?.error?.message || "The operations API request failed.", response.status, body?.error?.code);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function upload<T>(path: string, file: File): Promise<T> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Idempotency-Key": idempotencyKey(), Accept: "application/json" },
    body,
  });
  if (!response.ok) throw new OperationsApiError("Evidence upload failed.", response.status);
  return response.json() as Promise<T>;
}

function idempotencyKey() {
  return crypto.randomUUID();
}

export const operationsApi = {
  resetDemo(): void {
    if (operationsDemoMode) demoOperations.reset();
  },

  async getCommercialProgress(): Promise<CommercialProgress> {
    if (operationsDemoMode) return demoOperations.getCommercialProgress();
    return request("/proposals/LLT-2026-0184/commercial-progress");
  },

  async acceptQuotation(): Promise<CommercialProgress> {
    if (operationsDemoMode) return demoOperations.acceptQuotation();
    return request("/proposals/LLT-2026-0184/accept", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async signAgreement(signedBy: string): Promise<CommercialProgress> {
    if (operationsDemoMode) return demoOperations.signAgreement(signedBy);
    return request("/proposals/LLT-2026-0184/agreement/sign", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
      body: JSON.stringify({ signedBy }),
    });
  },

  async payDeposit(): Promise<CommercialProgress> {
    if (operationsDemoMode) return demoOperations.payDeposit();
    return request("/proposals/LLT-2026-0184/payments/deposit", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async getTrips(role: OperationsRole): Promise<Trip[]> {
    if (operationsDemoMode) return demoOperations.getTrips(role);
    return request(`/trips?scope=mine&role=${role.toLowerCase()}`);
  },

  async getTrip(tripId: string): Promise<Trip> {
    if (operationsDemoMode) return demoOperations.getTrip(tripId);
    return request(`/trips/${tripId}`);
  },

  async getLiveStatus(tripId: string): Promise<LiveStatus> {
    if (operationsDemoMode) return demoOperations.getLiveStatus(tripId);
    return request(`/trips/${tripId}/live-status`);
  },

  async startDuty(tripId: string): Promise<DutyResult> {
    if (operationsDemoMode) return demoOperations.startDuty(tripId);
    return request(`/trips/${tripId}/duty/start`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async endDuty(tripId: string): Promise<DutyResult> {
    if (operationsDemoMode) return demoOperations.endDuty(tripId);
    return request(`/trips/${tripId}/duty/end`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async updateStop(tripId: string, stopId: string, action: StopAction): Promise<Trip> {
    if (operationsDemoMode) return demoOperations.updateStop(tripId, stopId, action);
    return request(`/trips/${tripId}/stops/${stopId}/${action}`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async acknowledgeStop(tripId: string, stopId: string): Promise<Trip> {
    if (operationsDemoMode) return demoOperations.acknowledgeStop(tripId, stopId);
    return request(`/trips/${tripId}/stops/${stopId}/acknowledge`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
    });
  },

  async sendLocationPoints(tripId: string, points: LocationPoint[]): Promise<void> {
    if (operationsDemoMode) return demoOperations.sendLocationPoints(tripId, points);
    return request(`/trips/${tripId}/tracking/points:batch`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
      body: JSON.stringify({ points }),
    });
  },

  async getMonitoring(tripId: string): Promise<MonitoringItem[]> {
    if (operationsDemoMode) return demoOperations.getMonitoring(tripId);
    return request(`/trips/${tripId}/monitoring`);
  },

  async updateMonitoringItem(tripId: string, itemId: string, update: MonitoringUpdate): Promise<MonitoringItem> {
    if (operationsDemoMode) return demoOperations.updateMonitoringItem(tripId, itemId, update);
    return request(`/trips/${tripId}/monitoring/${itemId}`, {
      method: "PATCH",
      headers: { "Idempotency-Key": idempotencyKey() },
      body: JSON.stringify(update),
    });
  },

  async uploadMonitoringEvidence(tripId: string, itemId: string, file: File): Promise<MonitoringItem> {
    if (operationsDemoMode) return demoOperations.uploadMonitoringEvidence(tripId, itemId, file);
    return upload(`/trips/${tripId}/monitoring/${itemId}/evidence`, file);
  },

  async reviewMonitoringItem(tripId: string, itemId: string, review: MonitoringReview): Promise<MonitoringItem> {
    if (operationsDemoMode) return demoOperations.reviewMonitoringItem(tripId, itemId, review);
    return request(`/trips/${tripId}/monitoring/${itemId}/review`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey() },
      body: JSON.stringify(review),
    });
  },
};
