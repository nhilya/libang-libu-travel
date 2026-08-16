"use client";

import { useCallback, useEffect, useState } from "react";
import { OperationsHeader } from "@/components/operations-header";
import { MonitoringChecklist } from "@/components/monitoring-checklist";
import { DemoBanner } from "@/components/demo-banner";
import { operationsApi, operationsDemoMode } from "@/lib/operations-api";
import { formatDateTime, formatTime, locationAge } from "@/lib/operations-format";
import type { LiveStatus, Trip } from "@/lib/operations-types";

export function TeacherDashboard() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyStop, setBusyStop] = useState("");
  const [error, setError] = useState("");
  const [, refreshClock] = useState(0);

  const loadTrip = useCallback(async () => {
    try {
      const trips = await operationsApi.getTrips("TEACHER");
      const current = trips[0] || null;
      setTrip(current);
      if (current) setLiveStatus(await operationsApi.getLiveStatus(current.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the school trip.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadTrip(), 0);
    const polling = window.setInterval(() => void loadTrip(), 20_000);
    const clock = window.setInterval(() => refreshClock((value) => value + 1), 10_000);
    const demoRefresh = () => void loadTrip();
    window.addEventListener("llt:demo-state", demoRefresh);
    window.addEventListener("storage", demoRefresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(polling);
      window.clearInterval(clock);
      window.removeEventListener("llt:demo-state", demoRefresh);
      window.removeEventListener("storage", demoRefresh);
    };
  }, [loadTrip]);

  async function acknowledge(stopId: string) {
    if (!trip) return;
    setBusyStop(stopId);
    setError("");
    try {
      setTrip(await operationsApi.acknowledgeStop(trip.id, stopId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to acknowledge the checkpoint.");
    } finally {
      setBusyStop("");
    }
  }

  const completed = trip?.itinerary.filter((stop) => stop.status === "COMPLETED").length || 0;

  return (
    <div className="operations-app teacher-app">
      <OperationsHeader active="teacher" />
      <main className="operations-main">
        {operationsDemoMode && <DemoBanner>Demo data · Guide updates from another tab appear here automatically</DemoBanner>}
        {loading ? <div className="operations-card operations-message">Loading school trip…</div> : !trip ? <div className="operations-card operations-message"><h2>No upcoming trip</h2></div> : <>
          <section className="operations-welcome">
            <div>
              <span className="eyebrow accent">Teacher trip view</span>
              <h1>Welcome, {trip.leadTeacher.name}.</h1>
              <p>{trip.schoolName} · {trip.students} students</p>
            </div>
            <span className={`status-badge status-${trip.status.toLowerCase()}`}>{trip.status.replace("_", " ")}</span>
          </section>

          {error && <div className="operations-alert" role="alert">{error}</div>}

          <section className="operations-grid operations-grid-primary teacher-overview">
            <article className="operations-card teacher-trip-card">
              <span className="eyebrow">Your expedition</span>
              <h2>{trip.title}</h2>
              <p>{formatDateTime(trip.scheduledStartAt)} — {formatTime(trip.scheduledEndAt)}</p>
              <div className="teacher-progress"><i style={{ width: `${Math.round((completed / trip.itinerary.length) * 100)}%` }} /></div>
              <strong>{completed} of {trip.itinerary.length} checkpoints completed</strong>
            </article>

            <article className={`operations-card live-guide-card tracking-${liveStatus?.trackingState === "LIVE" ? "live" : "idle"}`}>
              <div className="live-guide-heading"><span className="eyebrow">Tour guide</span><span className={`gps-dot ${liveStatus?.trackingState === "LIVE" ? "live" : ""}`} /></div>
              <h2>{trip.guide.name}</h2>
              <p>{trip.guide.phone}</p>
              <div className="location-reading">
                <strong>{trackingLabel(liveStatus?.trackingState)}</strong>
                <span>{locationAge(liveStatus?.latestLocation?.recordedAt)}</span>
                {liveStatus?.latestLocation && <small>{liveStatus.latestLocation.latitude.toFixed(5)}, {liveStatus.latestLocation.longitude.toFixed(5)} · ±{Math.round(liveStatus.latestLocation.accuracyM)}m</small>}
              </div>
              <a className="contact-guide" href={`tel:${trip.guide.phone}`}>Call guide</a>
            </article>
          </section>

          <section className="operations-section">
            <div className="operations-section-heading"><div><span className="eyebrow accent">Live itinerary</span><h2>Today&apos;s journey</h2></div><span>Updates every 20s</span></div>
            <ol className="checkpoint-list teacher-checkpoints">
              {trip.itinerary.map((stop) => (
                <li className={`checkpoint checkpoint-${stop.status.toLowerCase()}`} key={stop.id}>
                  <div className="checkpoint-marker"><span>{stop.sequence}</span><i /></div>
                  <div className="checkpoint-copy">
                    <span>{formatTime(stop.scheduledArrivalAt)}</span>
                    <h3>{stop.name}</h3>
                    <p>{stop.address}</p>
                    {stop.actualArrivalAt && <small>Guide arrived {formatTime(stop.actualArrivalAt)}</small>}
                  </div>
                  <div className="checkpoint-action">
                    {stop.teacherAcknowledgedAt ? <span>Acknowledged ✓</span> : stop.status !== "PENDING" ? <button disabled={busyStop === stop.id} onClick={() => acknowledge(stop.id)}>{busyStop === stop.id ? "Saving…" : "Acknowledge"}</button> : <span className="waiting-label">Waiting</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="operations-card emergency-card">
            <div><span className="eyebrow">Need help?</span><h2>Operations support is ready.</h2><p>For a safety incident, call the guide first and contact operations immediately.</p></div>
            <a href="tel:+6050000000">Call operations</a>
          </section>

          <MonitoringChecklist tripId={trip.id} role="TEACHER" />
        </>}
      </main>
    </div>
  );
}

function trackingLabel(state?: LiveStatus["trackingState"]) {
  return {
    NOT_STARTED: "Duty has not started",
    LIVE: "Guide location is live",
    STALE: "Location update delayed",
    ENDED: "Duty completed",
    UNAVAILABLE: "Waiting for guide GPS",
  }[state || "NOT_STARTED"];
}
