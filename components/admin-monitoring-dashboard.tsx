"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OperationsHeader } from "@/components/operations-header";
import { DemoBanner } from "@/components/demo-banner";
import { operationsApi, operationsDemoMode } from "@/lib/operations-api";
import { formatDateTime, locationAge } from "@/lib/operations-format";
import type { CommercialProgress, LiveStatus, MonitoringCategory, MonitoringItem, MonitoringStage, Trip } from "@/lib/operations-types";

const categories: MonitoringCategory[] = ["BUS", "DRIVER", "TOUR_GUIDE", "FOOD"];
const stages: MonitoringStage[] = ["PRE_TOUR", "DURING_TOUR", "AFTER_TOUR"];

export function AdminMonitoringDashboard() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [commercial, setCommercial] = useState<CommercialProgress | null>(null);
  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [stage, setStage] = useState<MonitoringStage>("PRE_TOUR");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const trips = await operationsApi.getTrips("ADMIN");
      const current = trips[0] || null;
      setTrip(current);
      if (current) {
        const [monitoring, status, commercialProgress] = await Promise.all([
          operationsApi.getMonitoring(current.id),
          operationsApi.getLiveStatus(current.id),
          operationsApi.getCommercialProgress(),
        ]);
        setItems(monitoring);
        setLiveStatus(status);
        setCommercial(commercialProgress);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load operations monitoring.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const polling = window.setInterval(() => void load(), 20_000);
    const demoRefresh = () => void load();
    window.addEventListener("llt:demo-state", demoRefresh);
    window.addEventListener("storage", demoRefresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(polling);
      window.removeEventListener("llt:demo-state", demoRefresh);
      window.removeEventListener("storage", demoRefresh);
    };
  }, [load]);

  const totals = useMemo(() => ({
    approved: items.filter((item) => item.status === "APPROVED").length,
    submitted: items.filter((item) => item.status === "SUBMITTED").length,
    rejected: items.filter((item) => item.status === "REJECTED").length,
    pending: items.filter((item) => item.status === "PENDING").length,
  }), [items]);
  const readiness = items.length ? Math.round((totals.approved / items.length) * 100) : 0;

  function replaceItem(updated: MonitoringItem) {
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function uploadEvidence(item: MonitoringItem, file?: File) {
    if (!trip || !file) return;
    setBusy(item.id);
    setError("");
    try {
      replaceItem(await operationsApi.uploadMonitoringEvidence(trip.id, item.id, file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function submit(item: MonitoringItem) {
    if (!trip) return;
    if (item.requiredEvidence && item.evidence.length === 0) {
      setError(`Evidence is required for “${item.title}”.`);
      return;
    }
    setBusy(item.id);
    setError("");
    try {
      replaceItem(await operationsApi.updateMonitoringItem(trip.id, item.id, {
        status: "SUBMITTED",
        notes: notes[item.id] || item.notes,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the monitoring item.");
    } finally {
      setBusy("");
    }
  }

  async function review(item: MonitoringItem, decision: "APPROVED" | "REJECTED") {
    if (!trip) return;
    setBusy(item.id);
    setError("");
    try {
      replaceItem(await operationsApi.reviewMonitoringItem(trip.id, item.id, {
        decision,
        notes: notes[item.id],
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review the monitoring item.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="operations-app admin-app">
      <OperationsHeader active="admin" />
      <main className="operations-main admin-monitoring-main">
        {operationsDemoMode && <DemoBanner>Admin monitoring prototype · Changes sync with Guide and Teacher tabs</DemoBanner>}
        {loading ? <div className="operations-card operations-message">Loading monitoring dashboard…</div> : !trip ? <div className="operations-card operations-message"><h2>No active trip</h2></div> : <>
          <section className="operations-welcome admin-welcome">
            <div><span className="eyebrow accent">Operations control</span><h1>Trip monitoring</h1><p>{trip.title} · {trip.schoolName} · {formatDateTime(trip.scheduledStartAt)}</p></div>
            <div className="admin-heading-actions"><span className={`status-badge status-${trip.status.toLowerCase()}`}>{trip.status.replace("_", " ")}</span><Link className="button button-small" href="/admin/reports">Generate report</Link></div>
          </section>

          {error && <div className="operations-alert" role="alert">{error}</div>}

          <section className="admin-summary-grid">
            <article className="operations-card readiness-card"><span>Overall readiness</span><strong>{readiness}%</strong><div><i style={{ width: `${readiness}%` }} /></div></article>
            <article className="operations-card summary-stat stat-approved"><span>Approved</span><strong>{totals.approved}</strong></article>
            <article className="operations-card summary-stat stat-review"><span>Awaiting review</span><strong>{totals.submitted}</strong></article>
            <article className="operations-card summary-stat stat-pending"><span>Pending</span><strong>{totals.pending}</strong></article>
            <article className="operations-card summary-stat stat-rejected"><span>Rejected</span><strong>{totals.rejected}</strong></article>
          </section>

          {commercial && <section className={`operations-card admin-commercial admin-commercial-${commercial.status.toLowerCase()}`}>
            <div><span className="eyebrow accent">Client confirmation & payment</span><h2>{commercialLabel(commercial.status)}</h2><p>Proposal {commercial.proposalNumber} · Total {formatMoney(commercial.quotationTotal)}</p></div>
            <div className="admin-commercial-facts">
              <span><small>Quotation</small><strong>{commercial.acceptedAt ? "Accepted ✓" : "Waiting"}</strong></span>
              <span><small>Agreement</small><strong>{commercial.agreementSignedAt ? `Signed by ${commercial.signedBy}` : "Pending"}</strong></span>
              <span><small>Deposit</small><strong>{commercial.paidAt ? `${formatMoney(commercial.depositAmount)} paid` : `${formatMoney(commercial.depositAmount)} due`}</strong></span>
            </div>
            <a href="/client/proposal">Open client view</a>
          </section>}

          <section className="operations-card admin-live-strip">
            <div><span className={`gps-dot ${liveStatus?.trackingState === "LIVE" ? "live" : ""}`} /><div><strong>{trip.guide.name}</strong><small>{liveStatus?.trackingState.replace("_", " ") || "NOT STARTED"}</small></div></div>
            <p>Last GPS: <strong>{locationAge(liveStatus?.latestLocation?.recordedAt)}</strong></p>
            <p>Next stop: <strong>{liveStatus?.nextStop?.name || "—"}</strong></p>
            <a href="/guide">Open guide view</a>
          </section>

          <section className="operations-section admin-monitoring-board">
            <div className="operations-section-heading"><div><span className="eyebrow accent">Monitoring mechanism</span><h2>Compliance & service checks</h2></div><span>Auto-refreshes every 20s</span></div>
            <div className="monitoring-stage-tabs admin-stage-tabs">
              {stages.map((itemStage) => <button className={stage === itemStage ? "active" : ""} onClick={() => setStage(itemStage)} key={itemStage}>{itemStage.replaceAll("_", " ")}</button>)}
            </div>

            <div className="admin-category-grid">
              {categories.map((category) => {
                const categoryItems = items.filter((item) => item.stage === stage && item.category === category);
                return (
                  <section className={`admin-category category-panel-${category.toLowerCase()}`} key={category}>
                    <header><span className={`category-tag category-${category.toLowerCase()}`}>{category.replace("_", " ")}</span><strong>{categoryItems.filter((item) => item.status === "APPROVED").length}/{categoryItems.length}</strong></header>
                    <div>
                      {categoryItems.length === 0 ? <p className="admin-no-task">No checks defined.</p> : categoryItems.map((item) => (
                        <article className={`admin-monitoring-item task-${item.status.toLowerCase()}`} key={item.id}>
                          <div><h3>{item.title}</h3><span className={`monitoring-status monitoring-status-${item.status.toLowerCase()}`}>{item.status.replace("_", " ")}</span></div>
                          <p>{item.description}</p>
                          <small>Owner: {item.ownerRole.replace("_", " ")} · Verifier: {item.verifierRole}</small>
                          {item.evidence.length > 0 && <ul className="evidence-list">{item.evidence.map((evidence) => <li key={evidence.id}><span>✓</span>{evidence.fileName}</li>)}</ul>}
                          <textarea value={notes[item.id] ?? item.notes ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Admin note or rejection reason…" />
                          <div className="admin-item-actions">
                            {item.ownerRole === "ADMIN" && item.status !== "SUBMITTED" && <>
                              {item.requiredEvidence && <label className="upload-control"><input type="file" accept="image/*,video/*,.pdf" disabled={busy === item.id} onChange={(event) => void uploadEvidence(item, event.target.files?.[0])} /><span>+ Evidence</span></label>}
                              <button disabled={busy === item.id} onClick={() => void submit(item)}>Submit</button>
                            </>}
                            {item.status === "SUBMITTED" && item.verifierRole === "ADMIN" && <><button className="reject-action" disabled={busy === item.id} onClick={() => void review(item, "REJECTED")}>Reject</button><button disabled={busy === item.id} onClick={() => void review(item, "APPROVED")}>Approve</button></>}
                            {item.status === "SUBMITTED" && item.verifierRole === "TEACHER" && <span className="review-waiting">Awaiting teacher review</span>}
                            {item.status === "APPROVED" && <span className="review-approved">Verified ✓</span>}
                            {item.ownerRole !== "ADMIN" && item.status === "PENDING" && <span className="review-waiting">Waiting for {item.ownerRole.toLowerCase()}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </>}
      </main>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
}

function commercialLabel(status: CommercialProgress["status"]) {
  return {
    AWAITING_CONFIRMATION: "Waiting for client confirmation",
    QUOTATION_ACCEPTED: "Quotation accepted",
    AGREEMENT_SIGNED: "Agreement signed · Deposit pending",
    DEPOSIT_PAID: "Deposit paid · Booking unlocked",
  }[status];
}
