"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OperationsHeader } from "@/components/operations-header";
import { MonitoringChecklist } from "@/components/monitoring-checklist";
import { operationsApi, operationsDemoMode } from "@/lib/operations-api";
import { formatDateTime, formatTime } from "@/lib/operations-format";
import { getQueuedLocationBatches, queueLocationBatch, removeQueuedLocationBatch } from "@/lib/offline-location-queue";
import type { LiveStatus, LocationPoint, StopAction, Trip } from "@/lib/operations-types";

type GpsState = "idle" | "requesting" | "live" | "denied" | "unsupported" | "queued" | "error";

export function GuideDashboard() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const [latestPoint, setLatestPoint] = useState<LocationPoint | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const watchId = useRef<number | null>(null);
  const sequence = useRef(0);
  const pendingPoints = useRef<LocationPoint[]>([]);

  const loadTrip = useCallback(async () => {
    try {
      const trips = await operationsApi.getTrips("GUIDE");
      const current = trips[0] || null;
      setTrip(current);
      if (current) {
        const status = await operationsApi.getLiveStatus(current.id);
        setLiveStatus(status);
        setLatestPoint(status.latestLocation || null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the assigned trip.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadTrip(), 0);
    const refresh = () => void loadTrip();
    window.addEventListener("llt:demo-state", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("llt:demo-state", refresh);
    };
  }, [loadTrip]);

  const replayQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queued = await getQueuedLocationBatches().catch(() => []);
    setQueuedCount(queued.length);
    for (const batch of queued) {
      try {
        await operationsApi.sendLocationPoints(batch.tripId, batch.points);
        await removeQueuedLocationBatch(batch.id);
      } catch {
        break;
      }
    }
    const remaining = await getQueuedLocationBatches().catch(() => []);
    setQueuedCount(remaining.length);
    if (remaining.length === 0 && watchId.current !== null) setGpsState("live");
  }, []);

  const flushPoints = useCallback(async () => {
    if (!trip || pendingPoints.current.length === 0) {
      await replayQueue();
      return;
    }
    const points = pendingPoints.current.splice(0);
    try {
      await operationsApi.sendLocationPoints(trip.id, points);
      setGpsState("live");
      await replayQueue();
    } catch {
      await queueLocationBatch({
        id: crypto.randomUUID(),
        tripId: trip.id,
        points,
        queuedAt: new Date().toISOString(),
      });
      setQueuedCount((count) => count + 1);
      setGpsState("queued");
    }
  }, [replayQueue, trip]);

  useEffect(() => {
    const interval = window.setInterval(() => void flushPoints(), 30_000);
    const online = () => void replayQueue();
    window.addEventListener("online", online);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", online);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [flushPoints, replayQueue]);

  function startGps() {
    if (!("geolocation" in navigator)) {
      setGpsState("unsupported");
      return;
    }
    setGpsState("requesting");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        sequence.current += 1;
        const point: LocationPoint = {
          id: crypto.randomUUID(),
          recordedAt: new Date(position.timestamp).toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          altitudeM: position.coords.altitude,
          headingDeg: position.coords.heading,
          speedMps: position.coords.speed,
          sequence: sequence.current,
          source: "browser_geolocation",
        };
        pendingPoints.current.push(point);
        setLatestPoint(point);
        setGpsState(navigator.onLine ? "live" : "queued");
        if (pendingPoints.current.length >= 5) void flushPoints();
      },
      (gpsError) => {
        setGpsState(gpsError.code === gpsError.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
  }

  async function startDuty() {
    if (!trip) return;
    setBusy(true);
    setError("");
    try {
      const result = await operationsApi.startDuty(trip.id);
      setTrip(result.trip);
      setLiveStatus(result.liveStatus);
      startGps();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start duty.");
    } finally {
      setBusy(false);
    }
  }

  async function endDuty() {
    if (!trip) return;
    setBusy(true);
    setError("");
    try {
      await flushPoints();
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      const result = await operationsApi.endDuty(trip.id);
      setTrip(result.trip);
      setLiveStatus(result.liveStatus);
      setGpsState("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to end duty.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStop(stopId: string, action: StopAction) {
    if (!trip) return;
    setBusy(true);
    setError("");
    try {
      const updated = await operationsApi.updateStop(trip.id, stopId, action);
      setTrip(updated);
      setLiveStatus(await operationsApi.getLiveStatus(trip.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the checkpoint.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="operations-app">
      <OperationsHeader active="guide" />
      <main className="operations-main">
        {operationsDemoMode && <div className="demo-banner">Demo data · Connect the monolith URL to use live operations</div>}
        {loading ? <LoadingCard /> : !trip ? <EmptyCard /> : <>
          <section className="operations-welcome">
            <div>
              <span className="eyebrow accent">Guide duty console</span>
              <h1>Assalamualaikum, {trip.guide.name.split(" ")[0]}.</h1>
              <p>{formatDateTime(trip.scheduledStartAt)} · {trip.students} students</p>
            </div>
            <StatusBadge status={trip.status} />
          </section>

          {error && <div className="operations-alert" role="alert">{error}</div>}

          <section className="operations-grid operations-grid-primary">
            <article className="operations-card duty-card">
              <div className="operations-card-heading">
                <div><span className="eyebrow">Today&apos;s expedition</span><h2>{trip.title}</h2></div>
                <span className={`gps-dot ${gpsState === "live" ? "live" : ""}`} />
              </div>
              <dl className="trip-facts">
                <div><dt>Meeting</dt><dd>{trip.meetingPoint}</dd></div>
                <div><dt>Lead teacher</dt><dd>{trip.leadTeacher.name}</dd></div>
                <div><dt>Ends</dt><dd>{formatTime(trip.scheduledEndAt)}</dd></div>
              </dl>
              <div className={`tracking-panel tracking-${gpsState}`}>
                <div><strong>{gpsLabel(gpsState)}</strong><span>{latestPoint ? `Accuracy ±${Math.round(latestPoint.accuracyM)}m` : "Location starts only after consent"}</span></div>
                {queuedCount > 0 && <b>{queuedCount} queued batch{queuedCount === 1 ? "" : "es"}</b>}
              </div>
              {trip.status === "READY" && <button className="button operations-primary-action" disabled={busy} onClick={startDuty}>{busy ? "Starting…" : "Start duty & share GPS"}</button>}
              {trip.status === "IN_PROGRESS" && <button className="button button-danger operations-primary-action" disabled={busy} onClick={endDuty}>{busy ? "Saving…" : "End duty"}</button>}
              {trip.status === "COMPLETED" && <p className="duty-complete">Duty completed. Location sharing has stopped.</p>}
              <p className="privacy-note">GPS is shared only for this assigned trip. Keep this PWA open for reliable live tracking.</p>
            </article>

            <article className="operations-card next-stop-card">
              <span className="eyebrow">Next checkpoint</span>
              {liveStatus?.nextStop ? <>
                <span className="stop-number">{String(liveStatus.nextStop.sequence).padStart(2, "0")}</span>
                <h2>{liveStatus.nextStop.name}</h2>
                <p>{liveStatus.nextStop.address}</p>
                <time>{formatTime(liveStatus.nextStop.scheduledArrivalAt)}</time>
              </> : <p className="empty-copy">All checkpoints completed.</p>}
            </article>
          </section>

          <section className="operations-section">
            <div className="operations-section-heading"><div><span className="eyebrow accent">Run sheet</span><h2>Trip checkpoints</h2></div><span>{trip.itinerary.filter((stop) => stop.status === "COMPLETED").length}/{trip.itinerary.length} complete</span></div>
            <ol className="checkpoint-list">
              {trip.itinerary.map((stop) => (
                <li className={`checkpoint checkpoint-${stop.status.toLowerCase()}`} key={stop.id}>
                  <div className="checkpoint-marker"><span>{stop.sequence}</span><i /></div>
                  <div className="checkpoint-copy">
                    <span>{formatTime(stop.scheduledArrivalAt)}</span>
                    <h3>{stop.name}</h3>
                    <p>{stop.address}</p>
                    {stop.actualArrivalAt && <small>Arrived {formatTime(stop.actualArrivalAt)}</small>}
                  </div>
                  <div className="checkpoint-action">
                    {stop.status === "PENDING" && <button disabled={busy || trip.status !== "IN_PROGRESS"} onClick={() => updateStop(stop.id, "arrive")}>Mark arrived</button>}
                    {stop.status === "ARRIVED" && <button disabled={busy} onClick={() => updateStop(stop.id, "complete")}>Complete stop</button>}
                    {stop.status === "COMPLETED" && <span>Completed ✓</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <MonitoringChecklist tripId={trip.id} role="GUIDE" />
        </>}
      </main>
    </div>
  );
}

function gpsLabel(state: GpsState) {
  return {
    idle: "GPS not started",
    requesting: "Waiting for GPS permission…",
    live: "Live location active",
    denied: "Location permission denied",
    unsupported: "GPS unavailable on this device",
    queued: "Offline — points safely queued",
    error: "Unable to read location",
  }[state];
}

function StatusBadge({ status }: { status: Trip["status"] }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status.replace("_", " ")}</span>;
}

function LoadingCard() {
  return <div className="operations-card operations-message">Loading assigned trip…</div>;
}

function EmptyCard() {
  return <div className="operations-card operations-message"><h2>No assigned trip</h2><p>Your confirmed expeditions will appear here.</p></div>;
}
