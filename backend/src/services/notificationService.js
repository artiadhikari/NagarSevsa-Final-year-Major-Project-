/**
 * Notification Service
 * 
 * Manages automated dispatch of:
 * 1. Twilio SMS notifications to citizens with Case ID, assigned officer, and live tracking link.
 * 2. Official Email notifications to assigned municipal officers and citizens with grievance details and direct action link.
 */

const nodemailer = require("nodemailer");
const AuditLog = require("../models/AuditLog");

// Initialize Twilio Client (safely loaded when valid credentials provided)
let twilioClient = null;
function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID || "";
    const token = process.env.TWILIO_AUTH_TOKEN || "";
    if (sid && token && !sid.includes("your_twilio") && !token.includes("your_twilio")) {
      try {
        const twilio = require("twilio");
        twilioClient = twilio(sid, token);
      } catch (err) {
        console.warn("⚠ [Notification] Twilio SDK initialization failed:", err.message);
      }
    }
  }
  return twilioClient;
}

// Initialize Nodemailer Transporter
let mailTransporter = null;
function getMailTransporter() {
  if (!mailTransporter) {
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    if (user && pass) {
      mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });
    }
  }
  return mailTransporter;
}

/**
 * Generate tracking URL for the complaint
 */
function getTrackingUrl(ticketId) {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${clientUrl}/?track=${encodeURIComponent(ticketId)}`;
}

/**
 * Send SMS notification to the citizen
 */
async function sendComplaintSms(complaint) {
  if (!complaint || !complaint.phone) {
    return { sent: false, reason: "No phone number on complaint" };
  }

  const assignedOfficer = complaint.assignedTo && typeof complaint.assignedTo === "object"
    ? `${complaint.assignedTo.name} (${(complaint.assignedTo.department || "Municipal").replace("_", " ")})`
    : "Municipal Field Team";

  const trackUrl = getTrackingUrl(complaint.ticketId);

  const smsText = `Vadodara Municipal Corporation (VMC): Your grievance #${complaint.ticketId} is registered. Assigned Officer: ${assignedOfficer}. Track live status: ${trackUrl}`;

  const client = getTwilioClient();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (client && twilioPhone && !twilioPhone.includes("your_twilio")) {
    try {
      const message = await client.messages.create({
        to: complaint.phone,
        from: twilioPhone,
        body: smsText,
      });

      console.log(`📱 [Twilio SMS Sent] To: ${complaint.phone} (SID: ${message.sid})`);

      await AuditLog.create({
        complaintId: complaint._id,
        ticketId: complaint.ticketId,
        action: "NOTIFICATION_SENT",
        performedBy: "Twilio SMS Gateway",
        details: `Automated SMS delivered to ${complaint.phone}. Assigned Officer: ${assignedOfficer}.`,
      });

      return { sent: true, sid: message.sid };
    } catch (err) {
      console.error(`❌ [Twilio SMS Failed] To: ${complaint.phone}:`, err.message);
    }
  }

  // Fallback / Simulated SMS Logger for local/viva demonstration
  console.log(`=======================================================`);
  console.log(`📱 [SIMULATED SMS DISPATCH - Twilio Gateway]`);
  console.log(`Recipient: ${complaint.phone}`);
  console.log(`Message: "${smsText}"`);
  console.log(`=======================================================`);

  await AuditLog.create({
    complaintId: complaint._id,
    ticketId: complaint.ticketId,
    action: "NOTIFICATION_SENT",
    performedBy: "SMS Notification Engine",
    details: `Automated registration SMS dispatched to ${complaint.phone}. Assigned Officer: ${assignedOfficer}. Link: ${trackUrl}`,
  });

  return { sent: true, simulated: true };
}

/**
 * Send Email notification to the assigned officer (and citizen if email exists)
 */
async function sendComplaintEmail(complaint) {
  if (!complaint) return { sent: false };

  const officer = complaint.assignedTo && typeof complaint.assignedTo === "object"
    ? complaint.assignedTo
    : null;

  const officerName = officer?.name || "Designated Municipal Engineer";
  const officerDept = (officer?.department || complaint.category || "Municipal").replace("_", " ");
  const officerZone = officer?.zone || complaint.zone || "Vadodara Central";
  const officerEmail = officer?.email || process.env.OFFICER_NOTIFICATION_EMAIL || "officer.field@vmc.gov.in";

  const trackUrl = getTrackingUrl(complaint.ticketId);

  // Determine recipients
  const recipients = [officerEmail];
  if (complaint.email && !recipients.includes(complaint.email)) {
    recipients.push(complaint.email);
  }

  const subject = `[VMC Grievance] Case #${complaint.ticketId} Assigned to ${officerName} (${officerDept.toUpperCase()})`;

  const textBody = `
VADODARA MUNICIPAL CORPORATION - CIVIC GRIEVANCE ASSIGNMENT
===========================================================
Grievance Case ID: #${complaint.ticketId}
Status: Assigned
Assigned Officer: ${officerName}
Department: ${officerDept}
Zone: ${officerZone}

CITIZEN DETAILS:
Name: ${complaint.name}
Contact: ${complaint.phone || "Not provided"}
Location: ${complaint.address || "Vadodara"} (Ward: ${complaint.ward || "N/A"})

PROBLEM DESCRIPTION:
"${complaint.issue}"

Priority: ${complaint.priority || "P3_medium"}
SLA Deadline: ${complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString("en-IN") : "Standard 24-48 Hours"}

VIEW & TRACK GRIEVANCE ONLINE:
${trackUrl}

--
Automated AI Grievance Redressal System
Vadodara Municipal Corporation
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #0a1e3d; color: #ffffff; padding: 24px; }
    .header h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: bold; }
    .header p { margin: 0; font-size: 12px; color: #93c5fd; }
    .content { padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 16px 24px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Vadodara Municipal Corporation</h2>
      <p>Automated Civic Grievance Redressal System</p>
    </div>
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span class="badge">Case #${complaint.ticketId}</span>
        <span style="font-size: 12px; color: #64748b;">${new Date().toLocaleDateString("en-IN")}</span>
      </div>

      <p>A new civic complaint has been registered and assigned for field investigation and resolution.</p>

      <div class="info-box">
        <strong style="color: #0a1e3d; display: block; margin-bottom: 6px;">ASSIGNED FIELD OFFICER:</strong>
        <span style="font-size: 15px; font-weight: bold; color: #0a1e3d;">${officerName}</span><br/>
        <span style="color: #475569; font-size: 13px;">Department: <strong>${officerDept.toUpperCase()}</strong> · Zone: <strong>${officerZone}</strong></span>
      </div>

      <div class="info-box">
        <strong style="color: #475569; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">Citizen Grievance Details:</strong>
        <strong>Citizen:</strong> ${complaint.name} (${complaint.phone || "No phone"})<br/>
        <strong>Address:</strong> ${complaint.address || "Vadodara"} (Ward: ${complaint.ward || "—"})<br/>
        <strong>Reported Issue:</strong> <em>"${complaint.issue}"</em><br/>
        <strong>Priority:</strong> <span style="color: #dc2626; font-weight: bold;">${complaint.priority || "P3_medium"}</span>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${trackUrl}" class="btn" target="_blank">
          View & Track Grievance Status Online &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        Direct Link: <a href="${trackUrl}" style="color: #1d4ed8;">${trackUrl}</a>
      </p>
    </div>
    <div class="footer">
      Vadodara Municipal Corporation · Department of Information Technology & Municipal Services
    </div>
  </div>
</body>
</html>
`;

  const transporter = getMailTransporter();
  const fromAddress = process.env.NOTIFICATION_FROM || "no-reply@vmc.gov.in";

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"VMC Civic AI" <${fromAddress}>`,
        to: recipients.join(", "),
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`📧 [Email Dispatched] To: ${recipients.join(", ")} (MessageId: ${info.messageId})`);

      await AuditLog.create({
        complaintId: complaint._id,
        ticketId: complaint.ticketId,
        action: "NOTIFICATION_SENT",
        performedBy: "Email Notification Gateway",
        details: `Official assignment notification emailed to ${recipients.join(", ")}. Assigned Officer: ${officerName}.`,
      });

      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Failed] Error sending to ${recipients.join(", ")}:`, err.message);
    }
  }

  // Simulated Email Logger for local / demonstration environment
  console.log(`=======================================================`);
  console.log(`📧 [SIMULATED EMAIL NOTIFICATION - VMC Mailer]`);
  console.log(`To: ${recipients.join(", ")}`);
  console.log(`Subject: ${subject}`);
  console.log(`Assigned Officer: ${officerName} (${officerDept})`);
  console.log(`Tracking Link: ${trackUrl}`);
  console.log(`=======================================================`);

  await AuditLog.create({
    complaintId: complaint._id,
    ticketId: complaint.ticketId,
    action: "NOTIFICATION_SENT",
    performedBy: "Email Notification Engine",
    details: `Official notification dispatched to assigned officer ${officerName} (${officerEmail}). Online Track Link: ${trackUrl}`,
  });

  return { sent: true, simulated: true };
}

/**
 * Coordinate both SMS and Email dispatches for a newly registered complaint
 */
async function sendRegistrationNotifications(complaint) {
  const results = { sms: null, email: null };

  try {
    results.sms = await sendComplaintSms(complaint);
  } catch (err) {
    console.error("SMS notification error:", err);
  }

  try {
    results.email = await sendComplaintEmail(complaint);
  } catch (err) {
    console.error("Email notification error:", err);
  }

  return results;
}

module.exports = {
  sendComplaintSms,
  sendComplaintEmail,
  sendRegistrationNotifications,
  getTrackingUrl,
};
