import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.FROM_EMAIL || "procurement@itsasecret.com";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email skipped — no API key] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: `IAS Procurement <${from}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export function orderSubmittedEmail(orderNumber: string, requester: string, vendor: string, amount: number) {
  return {
    subject: `New Purchase Order ${orderNumber} — Needs Approval`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <h2 style="color: #323232;">New Purchase Order</h2>
        <p><strong>${requester}</strong> submitted <strong>${orderNumber}</strong> for approval.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #666;">Vendor</td><td style="padding: 4px 0; font-weight: 600;">${vendor}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Amount</td><td style="padding: 4px 0; font-weight: 600;">$${amount.toLocaleString()}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Log in to the procurement portal to review and approve.</p>
      </div>
    `,
  };
}

export function orderApprovedEmail(orderNumber: string, vendor: string, amount: number) {
  return {
    subject: `Purchase Order ${orderNumber} — Approved`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">Order Approved ✓</h2>
        <p>Your purchase order <strong>${orderNumber}</strong> has been approved.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #666;">Vendor</td><td style="padding: 4px 0; font-weight: 600;">${vendor}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Amount</td><td style="padding: 4px 0; font-weight: 600;">$${amount.toLocaleString()}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">The purchasing team will now place the order with the vendor.</p>
      </div>
    `,
  };
}

export function orderRejectedEmail(orderNumber: string, reason: string) {
  return {
    subject: `Purchase Order ${orderNumber} — Rejected`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <h2 style="color: #dc2626;">Order Rejected</h2>
        <p>Your purchase order <strong>${orderNumber}</strong> was rejected.</p>
        ${reason ? `<p style="background: #fef2f2; padding: 12px; border-radius: 8px; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>` : ""}
        <p style="color: #666; font-size: 14px;">You can modify and resubmit from the procurement portal.</p>
      </div>
    `,
  };
}
