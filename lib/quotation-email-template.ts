export type QuotationEmailData = {
  baseUrl: string;
  teacherName: string;
  schoolName: string;
  proposalNumber: string;
  tripTitle: string;
  tripDate: string;
  students: number;
  teachers: number;
  duration: string;
  pricePerStudent: number;
  meetingDate: string;
  meetingUrl: string;
  proposalUrl: string;
  whatsappUrl: string;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
}

export function renderQuotationEmail(data: QuotationEmailData) {
  const total = data.students * data.pricePerStudent;
  const e = escapeHtml;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Ipoh school expedition proposal</title>
</head>
<body style="margin:0;padding:0;background:#f4eef7;color:#30233a;font-family:Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your AI-generated itinerary and indicative quotation are ready for review.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4eef7;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(87,46,126,.12);">
        <tr>
          <td style="padding:22px 32px;border-bottom:5px solid #eec445;background:#ffffff;">
            <img src="${e(data.baseUrl)}/libang-libu-logo.png" width="132" alt="Libang Libu Travel" style="display:block;width:132px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td style="padding:42px 40px 36px;background:#572e7e;">
            <p style="margin:0 0 12px;color:#eec445;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">AI-generated initial proposal</p>
            <h1 style="margin:0;color:#ffffff;font-size:38px;line-height:1.08;">Ipoh is ready to become your classroom.</h1>
            <p style="margin:18px 0 0;color:#e9ddf0;font-size:16px;line-height:1.6;">Assalamualaikum ${e(data.teacherName)}, your initial itinerary and quotation for ${e(data.schoolName)} are ready.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 40px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr><td style="padding:0 0 8px;color:#ce307d;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;">${e(data.proposalNumber)}</td></tr>
              <tr><td style="padding:0 0 8px;color:#572e7e;font-size:25px;font-weight:bold;">${e(data.tripTitle)}</td></tr>
              <tr><td style="padding:0 0 24px;color:#706578;font-size:14px;line-height:1.55;">${e(data.tripDate)} · ${e(data.duration)} · ${e(data.students)} students · ${e(data.teachers)} teachers</td></tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e7dced;border-radius:16px;overflow:hidden;">
              <tr><td colspan="2" style="padding:15px 18px;background:#fff5d4;color:#572e7e;font-size:13px;font-weight:bold;">Proposed learning itinerary</td></tr>
              <tr><td width="74" valign="top" style="padding:16px 12px 16px 18px;border-bottom:1px solid #eee6f1;color:#ce307d;font-size:12px;font-weight:bold;">DAY 01</td><td style="padding:16px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:13px;line-height:1.55;">Gua Tempurung geology field study, lunch and Ipoh Old Town heritage trail.</td></tr>
              <tr><td width="74" valign="top" style="padding:16px 12px 16px 18px;color:#4898d1;font-size:12px;font-weight:bold;">DAY 02</td><td style="padding:16px 18px;color:#30233a;font-size:13px;line-height:1.55;">Tin-mining history module, ecology activity and guided student reflection.</td></tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;border:1px solid #e7dced;border-radius:16px;overflow:hidden;">
              <tr><td style="padding:15px 18px;background:#f7effb;color:#572e7e;font-size:13px;font-weight:bold;">Indicative quotation</td><td align="right" style="padding:15px 18px;background:#f7effb;color:#572e7e;font-size:13px;font-weight:bold;">Amount</td></tr>
              <tr><td style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#706578;font-size:12px;">Coach transportation</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:12px;">RM 4,800</td></tr>
              <tr><td style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#706578;font-size:12px;">Licensed guides & learning modules</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:12px;">RM 4,000</td></tr>
              <tr><td style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#706578;font-size:12px;">Halal meals & refreshments</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:12px;">RM 3,200</td></tr>
              <tr><td style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#706578;font-size:12px;">Student accommodation</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:12px;">RM 6,400</td></tr>
              <tr><td style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#706578;font-size:12px;">Insurance & administration</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eee6f1;color:#30233a;font-size:12px;">RM 1,200</td></tr>
              <tr><td style="padding:16px 18px;color:#572e7e;font-size:14px;font-weight:bold;">Estimated total<br><span style="color:#706578;font-size:10px;font-weight:normal;">${e(money(data.pricePerStudent))} per student · teachers travel free within ratio</span></td><td align="right" style="padding:16px 18px;color:#ce307d;font-size:22px;font-weight:bold;">${e(money(total))}</td></tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;border-radius:16px;background:#eaf5fb;">
              <tr><td style="padding:18px;">
                <p style="margin:0;color:#2673a9;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Proposal review meeting</p>
                <p style="margin:7px 0 0;color:#30233a;font-size:14px;font-weight:bold;">${e(data.meetingDate)}</p>
                <p style="margin:5px 0 0;color:#706578;font-size:12px;line-height:1.45;">Invite additional teachers to join. We will explain the itinerary, quotation, safety process and answer FAQs.</p>
              </td></tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
              <tr>
                <td style="padding:0 8px 8px 0;"><a href="${e(data.proposalUrl)}" target="_blank" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ce307d;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;">Review & confirm quotation</a></td>
                <td style="padding:0 8px 8px 0;"><a href="${e(data.meetingUrl)}" style="display:inline-block;padding:13px 21px;border:1px solid #572e7e;border-radius:999px;background:#ffffff;color:#572e7e;font-size:12px;font-weight:bold;text-decoration:none;">Confirm meeting</a></td>
              </tr>
            </table>
            <p style="margin:4px 0 0;color:#706578;font-size:11px;"><a href="${e(data.whatsappUrl)}" style="color:#572e7e;">Questions? Discuss on WhatsApp</a></p>
            <p style="margin:18px 0 0;color:#918698;font-size:10px;line-height:1.5;">This is an initial AI-assisted proposal and remains subject to availability, final requirements and written approval. No booking is made until quotation acceptance, agreement and payment.</p>
          </td>
        </tr>
        <tr><td style="padding:24px 40px;background:#572e7e;color:#e9ddf0;font-size:11px;line-height:1.6;">Libang Libu Travel · Ipoh, Perak<br>schools@libanglibu.travel · +60 5 000 0000</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
