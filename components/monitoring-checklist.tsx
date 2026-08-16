"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { operationsApi } from "@/lib/operations-api";
import type { MonitoringItem, MonitoringStage, OperationsRole } from "@/lib/operations-types";

const stageLabels: Record<MonitoringStage, string> = {
  PRE_TOUR: "Pre-tour",
  DURING_TOUR: "During tour",
  AFTER_TOUR: "After tour",
};

export function MonitoringChecklist({ tripId, role }: { tripId: string; role: Extract<OperationsRole, "GUIDE" | "TEACHER"> }) {
  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [activeStage, setActiveStage] = useState<MonitoringStage>(role === "GUIDE" ? "DURING_TOUR" : "DURING_TOUR");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await operationsApi.getMonitoring(tripId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load monitoring tasks.");
    }
  }, [tripId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("llt:demo-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("llt:demo-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [load]);

  const visibleItems = useMemo(() => items.filter((item) => (
    item.stage === activeStage && (item.ownerRole === role || item.verifierRole === role)
  )), [activeStage, items, role]);

  const counts = useMemo(() => ({
    pending: visibleItems.filter((item) => item.status === "PENDING").length,
    submitted: visibleItems.filter((item) => item.status === "SUBMITTED").length,
    approved: visibleItems.filter((item) => item.status === "APPROVED").length,
  }), [visibleItems]);

  async function uploadEvidence(item: MonitoringItem, file?: File) {
    if (!file) return;
    setBusy(item.id);
    setError("");
    try {
      const updated = await operationsApi.uploadMonitoringEvidence(tripId, item.id, file);
      setItems((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function submit(item: MonitoringItem) {
    if (item.requiredEvidence && item.evidence.length === 0) {
      setError(`Add evidence for “${item.title}” before submitting.`);
      return;
    }
    setBusy(item.id);
    setError("");
    try {
      const updated = await operationsApi.updateMonitoringItem(tripId, item.id, {
        status: "SUBMITTED",
        notes: notes[item.id] || item.notes,
        score: scores[item.id] || item.score,
      });
      setItems((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit this check.");
    } finally {
      setBusy("");
    }
  }

  async function review(item: MonitoringItem, decision: "APPROVED" | "REJECTED") {
    setBusy(item.id);
    setError("");
    try {
      const updated = await operationsApi.reviewMonitoringItem(tripId, item.id, {
        decision,
        notes: notes[item.id],
      });
      setItems((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review this check.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="operations-section monitoring-section">
      <div className="operations-section-heading">
        <div><span className="eyebrow accent">Monitoring mechanism</span><h2>{role === "GUIDE" ? "Operational checks" : "Review trip evidence"}</h2></div>
        <span>{counts.approved} approved · {counts.submitted} awaiting review · {counts.pending} pending</span>
      </div>

      <div className="monitoring-stage-tabs" role="tablist" aria-label="Monitoring stage">
        {(Object.keys(stageLabels) as MonitoringStage[]).map((stage) => (
          <button className={activeStage === stage ? "active" : ""} onClick={() => setActiveStage(stage)} role="tab" aria-selected={activeStage === stage} key={stage}>{stageLabels[stage]}</button>
        ))}
      </div>

      {error && <div className="operations-alert" role="alert">{error}</div>}

      <div className="monitoring-task-grid">
        {visibleItems.length === 0 ? <div className="operations-card operations-message compact-message">No checks assigned for this stage.</div> : visibleItems.map((item) => {
          const isOwner = item.ownerRole === role;
          return (
            <article className={`operations-card monitoring-task task-${item.status.toLowerCase()}`} key={item.id}>
              <div className="monitoring-task-head">
                <span className={`category-tag category-${item.category.toLowerCase()}`}>{item.category.replace("_", " ")}</span>
                <span className={`monitoring-status monitoring-status-${item.status.toLowerCase()}`}>{item.status.replace("_", " ")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>

              {item.evidence.length > 0 && <ul className="evidence-list">{item.evidence.map((evidence) => <li key={evidence.id}><span>✓</span>{evidence.fileName}</li>)}</ul>}

              {(isOwner || item.status === "SUBMITTED") && <textarea value={notes[item.id] ?? item.notes ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={isOwner ? "Add observation or exception…" : "Add review note (optional)…"} />}

              {isOwner && item.category !== "BUS" && <label className="score-field"><span>Score</span><select value={scores[item.id] || item.score || ""} onChange={(event) => setScores((current) => ({ ...current, [item.id]: Number(event.target.value) }))}><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((score) => <option value={score} key={score}>{score} / 5</option>)}</select></label>}

              <div className="monitoring-task-actions">
                {isOwner && <>
                  {item.requiredEvidence && <label className="upload-control"><input type="file" accept="image/*,video/*,.pdf" disabled={busy === item.id} onChange={(event) => void uploadEvidence(item, event.target.files?.[0])} /><span>{busy === item.id ? "Uploading…" : "+ Add evidence"}</span></label>}
                  <button disabled={busy === item.id} onClick={() => void submit(item)}>{item.status === "REJECTED" ? "Resubmit" : item.status === "APPROVED" ? "Update check" : "Submit check"}</button>
                </>}
                {!isOwner && item.status === "SUBMITTED" && <>
                  <button className="reject-action" disabled={busy === item.id} onClick={() => void review(item, "REJECTED")}>Reject</button>
                  <button disabled={busy === item.id} onClick={() => void review(item, "APPROVED")}>Approve</button>
                </>}
                {!isOwner && item.status === "PENDING" && <span className="review-waiting">Waiting for submission</span>}
                {!isOwner && item.status === "APPROVED" && <span className="review-approved">Verified ✓</span>}
                {!isOwner && item.status === "REJECTED" && <span className="review-rejected">Returned to submitter</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
