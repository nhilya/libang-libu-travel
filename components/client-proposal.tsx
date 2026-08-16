"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { DemoBanner } from "@/components/demo-banner";
import { operationsApi, operationsDemoMode } from "@/lib/operations-api";
import type { CommercialProgress, CommercialStatus } from "@/lib/operations-types";

const steps: { status: CommercialStatus; label: string }[] = [
  { status: "AWAITING_CONFIRMATION", label: "Review" },
  { status: "QUOTATION_ACCEPTED", label: "Confirm" },
  { status: "AGREEMENT_SIGNED", label: "Agreement" },
  { status: "DEPOSIT_PAID", label: "Payment" },
];

export function ClientProposal() {
  const [progress, setProgress] = useState<CommercialProgress | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signedBy, setSignedBy] = useState("Cikgu Aminah");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void operationsApi.getCommercialProgress().then(setProgress).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load proposal."));
  }, []);

  async function run(action: () => Promise<CommercialProgress>) {
    setBusy(true);
    setError("");
    try {
      setProgress(await action());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }

  if (!progress) return <div className="client-proposal-page"><main><div className="operations-card operations-message">{error || "Loading proposal…"}</div></main></div>;

  const currentIndex = steps.findIndex((step) => step.status === progress.status);
  const money = (value: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="client-proposal-page">
      <header className="client-proposal-header"><BrandLogo /><span>Secure client review</span></header>
      <main>
        {operationsDemoMode && <DemoBanner>Demo checkout · No real agreement or payment will be created</DemoBanner>}
        <section className="client-proposal-intro">
          <span className="eyebrow accent">Proposal {progress.proposalNumber}</span>
          <h1>Ipoh Karst & Heritage Expedition</h1>
          <p>Prepared for Cikgu Aminah · SMK Raja Perempuan</p>
        </section>

        <ol className="commercial-progress">
          {steps.map((step, index) => <li className={index <= currentIndex ? "active" : ""} key={step.status}><i>{index < currentIndex ? "✓" : index + 1}</i><span>{step.label}</span></li>)}
        </ol>

        {error && <div className="operations-alert" role="alert">{error}</div>}

        <div className="client-proposal-grid">
          <section className="operations-card client-quote-card">
            <div><span className="eyebrow">Final quotation</span><strong>{money(progress.quotationTotal)}</strong><small>RM245 × 80 students · 2D1N</small></div>
            <ul>
              <li><span>Coach transportation</span><b>RM4,800</b></li>
              <li><span>Licensed guides & modules</span><b>RM4,000</b></li>
              <li><span>Halal meals & refreshments</span><b>RM3,200</b></li>
              <li><span>Student accommodation</span><b>RM6,400</b></li>
              <li><span>Insurance & administration</span><b>RM1,200</b></li>
            </ul>
          </section>

          <section className="operations-card client-action-card">
            {progress.status === "AWAITING_CONFIRMATION" && <>
              <span className="eyebrow accent">Client confirmation</span><h2>Confirm final quotation</h2>
              <p>I have reviewed the final itinerary, inclusions and total quotation.</p>
              <label className="client-check"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><span>I confirm this quotation on behalf of the school.</span></label>
              <button className="button" disabled={!acceptedTerms || busy} onClick={() => void run(() => operationsApi.acceptQuotation())}>{busy ? "Saving…" : "Accept quotation"}</button>
            </>}

            {progress.status === "QUOTATION_ACCEPTED" && <>
              <span className="eyebrow accent">Agreement</span><h2>Authorise the trip</h2>
              <p>Accepting creates a mock digital signature and audit timestamp for this demo.</p>
              <label className="client-field"><span>Authorised representative</span><input value={signedBy} onChange={(event) => setSignedBy(event.target.value)} /></label>
              <label className="client-check"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I agree to the booking terms and cancellation policy.</span></label>
              <button className="button" disabled={!agreed || !signedBy.trim() || busy} onClick={() => void run(() => operationsApi.signAgreement(signedBy.trim()))}>{busy ? "Signing…" : "Sign agreement"}</button>
            </>}

            {progress.status === "AGREEMENT_SIGNED" && <>
              <span className="eyebrow accent">Secure payment</span><h2>Pay 30% deposit</h2>
              <div className="deposit-amount"><span>Deposit due</span><strong>{money(progress.depositAmount)}</strong></div>
              <p>Demo simulates a successful FPX transaction. No bank page opens and no money is charged.</p>
              <button className="button payment-button" disabled={busy} onClick={() => void run(() => operationsApi.payDeposit())}>{busy ? "Processing…" : `Pay ${money(progress.depositAmount)} · Demo FPX`}</button>
            </>}

            {progress.status === "DEPOSIT_PAID" && <div className="payment-success">
              <i>✓</i><span className="eyebrow">Payment received</span><h2>Booking work can begin.</h2>
              <p>Admin has been notified. Reference: <strong>{progress.paymentReference}</strong></p>
              <a className="button" href="/admin/monitoring">View Admin status</a>
            </div>}
          </section>
        </div>
      </main>
    </div>
  );
}
