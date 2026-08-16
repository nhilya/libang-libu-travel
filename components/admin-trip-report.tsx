"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { OperationsHeader } from "@/components/operations-header";
import { operationsApi, operationsDemoMode } from "@/lib/operations-api";
import { formatDateTime, locationAge } from "@/lib/operations-format";
import type { CommercialProgress, LiveStatus, MonitoringItem, Trip } from "@/lib/operations-types";

type ReportData = {
  trip: Trip;
  live: LiveStatus;
  commercial: CommercialProgress;
  monitoring: MonitoringItem[];
};

export function AdminTripReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const trips = await operationsApi.getTrips("ADMIN");
      const trip = trips[0];
      if (!trip) throw new Error("No trip is available for reporting.");
      const [live, commercial, monitoring] = await Promise.all([
        operationsApi.getLiveStatus(trip.id),
        operationsApi.getCommercialProgress(),
        operationsApi.getMonitoring(trip.id),
      ]);
      setData({ trip, live, commercial, monitoring });
      setGeneratedAt(new Date().toISOString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const counts = useMemo(() => {
    const items = data?.monitoring || [];
    return {
      approved: items.filter((item) => item.status === "APPROVED").length,
      submitted: items.filter((item) => item.status === "SUBMITTED").length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
      pending: items.filter((item) => item.status === "PENDING").length,
      readiness: items.length ? Math.round((items.filter((item) => item.status === "APPROVED").length / items.length) * 100) : 0,
    };
  }, [data]);

  function downloadCsv() {
    if (!data) return;
    const rows: Array<Array<string | number | undefined>> = [
      ["Section", "Category", "Item", "Status", "Owner", "Verifier", "Notes", "Evidence", "Timestamp"],
      ["Trip", "Summary", data.trip.title, data.trip.status, data.trip.guide.name, data.trip.leadTeacher.name, `${data.trip.schoolName}; ${data.trip.students} students`, "", data.trip.scheduledStartAt],
      ["Commercial", "Quotation", data.commercial.proposalNumber, data.commercial.status, data.commercial.signedBy, "", `Total ${money(data.commercial.quotationTotal)}; Deposit ${money(data.commercial.depositAmount)}`, data.commercial.paymentReference, data.commercial.paidAt || data.commercial.agreementSignedAt || data.commercial.acceptedAt],
      ["Tracking", "GPS", "Latest guide location", data.live.trackingState, data.trip.guide.name, "ADMIN", data.live.latestLocation ? `${data.live.latestLocation.latitude}, ${data.live.latestLocation.longitude}; accuracy ±${Math.round(data.live.latestLocation.accuracyM)}m` : "No location", "", data.live.latestLocation?.recordedAt],
      ...data.trip.itinerary.map((stop) => ["Itinerary", `Stop ${stop.sequence}`, stop.name, stop.status, data.trip.guide.name, data.trip.leadTeacher.name, stop.address, stop.teacherAcknowledgedAt ? "Teacher acknowledged" : "", stop.completedAt || stop.actualArrivalAt || stop.scheduledArrivalAt]),
      ...data.monitoring.map((item) => ["Monitoring", `${item.stage} / ${item.category}`, item.title, item.status, item.ownerRole, item.verifierRole, item.notes, item.evidence.map((evidence) => evidence.fileName).join("; "), item.reviewedAt || item.submittedAt]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.commercial.proposalNumber}-operational-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="operations-app admin-report-app">
      <OperationsHeader active="admin" />
      <main className="operations-main admin-report-main">
        {operationsDemoMode && <DemoBanner>Demo operational report · Values reflect current Guide, Teacher and Admin activity</DemoBanner>}
        <header className="report-page-heading">
          <div><span className="eyebrow accent">Admin reporting</span><h1>Operational report</h1><p>Printable management record covering commercial readiness and trip delivery.</p></div>
          <div className="report-actions"><a href="/admin/monitoring">Back to monitoring</a><button onClick={() => void load()}>Refresh</button><button onClick={downloadCsv} disabled={!data}>Download CSV</button><button className="button" onClick={() => window.print()} disabled={!data}>Print / Save PDF</button></div>
        </header>

        {error && <div className="operations-alert" role="alert">{error}</div>}
        {loading ? <div className="operations-card operations-message">Generating report…</div> : data && <>
          <section className="report-document operations-card">
            <div className="report-title-row">
              <div><span>Libang Libu Travel</span><h2>{data.trip.title}</h2><p>{data.trip.schoolName} · {data.trip.students} students</p></div>
              <div><strong>{data.commercial.proposalNumber}</strong><span>Generated {formatReportDate(generatedAt)}</span></div>
            </div>

            <div className="report-kpis">
              <div><span>Trip status</span><strong>{humanize(data.trip.status)}</strong></div>
              <div><span>Commercial</span><strong>{humanize(data.commercial.status)}</strong></div>
              <div><span>Readiness</span><strong>{counts.readiness}%</strong></div>
              <div><span>GPS</span><strong>{humanize(data.live.trackingState)}</strong></div>
            </div>

            <ReportSection title="Trip & commercial summary">
              <dl className="report-facts">
                <div><dt>Schedule</dt><dd>{formatDateTime(data.trip.scheduledStartAt)} – {formatDateTime(data.trip.scheduledEndAt)}</dd></div>
                <div><dt>Guide</dt><dd>{data.trip.guide.name}</dd></div>
                <div><dt>Lead teacher</dt><dd>{data.trip.leadTeacher.name}</dd></div>
                <div><dt>Meeting point</dt><dd>{data.trip.meetingPoint}</dd></div>
                <div><dt>Quotation</dt><dd>{money(data.commercial.quotationTotal)}</dd></div>
                <div><dt>Deposit</dt><dd>{data.commercial.paidAt ? `${money(data.commercial.depositAmount)} paid` : `${money(data.commercial.depositAmount)} due`}</dd></div>
                <div><dt>Agreement</dt><dd>{data.commercial.agreementSignedAt ? `Signed by ${data.commercial.signedBy}` : "Pending"}</dd></div>
                <div><dt>Payment reference</dt><dd>{data.commercial.paymentReference || "—"}</dd></div>
              </dl>
            </ReportSection>

            <ReportSection title="Live operations">
              <dl className="report-facts report-facts-compact">
                <div><dt>Tracking</dt><dd>{humanize(data.live.trackingState)}</dd></div>
                <div><dt>Last GPS</dt><dd>{locationAge(data.live.latestLocation?.recordedAt)}</dd></div>
                <div><dt>Latest coordinates</dt><dd>{data.live.latestLocation ? `${data.live.latestLocation.latitude.toFixed(5)}, ${data.live.latestLocation.longitude.toFixed(5)}` : "—"}</dd></div>
                <div><dt>Next checkpoint</dt><dd>{data.live.nextStop?.name || "—"}</dd></div>
              </dl>
              <div className="report-table-wrap"><table><thead><tr><th>#</th><th>Checkpoint</th><th>Scheduled</th><th>Status</th><th>Teacher</th></tr></thead><tbody>{data.trip.itinerary.map((stop) => <tr key={stop.id}><td>{stop.sequence}</td><td><strong>{stop.name}</strong><small>{stop.address}</small></td><td>{formatDateTime(stop.scheduledArrivalAt)}</td><td>{humanize(stop.status)}</td><td>{stop.teacherAcknowledgedAt ? "Acknowledged" : "Pending"}</td></tr>)}</tbody></table></div>
            </ReportSection>

            <ReportSection title="Compliance & service monitoring" summary={`${counts.approved} approved · ${counts.submitted} awaiting review · ${counts.pending} pending · ${counts.rejected} rejected`}>
              <div className="report-table-wrap"><table><thead><tr><th>Stage / category</th><th>Check</th><th>Owner</th><th>Status</th><th>Evidence</th></tr></thead><tbody>{data.monitoring.map((item) => <tr key={item.id}><td>{humanize(item.stage)}<small>{humanize(item.category)}</small></td><td><strong>{item.title}</strong>{item.notes && <small>{item.notes}</small>}</td><td>{humanize(item.ownerRole)}</td><td>{humanize(item.status)}</td><td>{item.evidence.length ? item.evidence.map((evidence) => evidence.fileName).join(", ") : "—"}</td></tr>)}</tbody></table></div>
            </ReportSection>

            <footer className="report-footer">Generated from current operational records · {formatReportDate(generatedAt)} · {operationsDemoMode ? "DEMO DATA" : "LIVE DATA"}</footer>
          </section>
        </>}
      </main>
    </div>
  );
}

function ReportSection({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) {
  return <section className="report-section"><header><h3>{title}</h3>{summary && <span>{summary}</span>}</header>{children}</section>;
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
}

function formatReportDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
