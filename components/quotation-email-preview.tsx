"use client";

import { useState } from "react";

export function QuotationEmailPreview() {
  const [mobile, setMobile] = useState(false);

  return (
    <div className="email-preview-tool">
      <div className="email-preview-toolbar">
        <div><span>Subject</span><strong>Your Ipoh school expedition proposal is ready</strong></div>
        <div className="email-preview-actions">
          <button className={!mobile ? "active" : ""} onClick={() => setMobile(false)}>Desktop</button>
          <button className={mobile ? "active" : ""} onClick={() => setMobile(true)}>Mobile</button>
          <a href="/api/demo/quotation-email" target="_blank" rel="noreferrer">Open email HTML ↗</a>
        </div>
      </div>
      <div className="email-preview-stage">
        <iframe className={mobile ? "mobile" : ""} src="/api/demo/quotation-email" title="Quotation email preview" />
      </div>
    </div>
  );
}
