const VoiceResponse = require("twilio").twiml.VoiceResponse;
const CallSession = require("../models/CallSession");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { extractComplaintData } = require("../services/aiService");
const { processAndCreateComplaint } = require("../services/complaintWorkflowService");

const getBaseUrl = (req) => {
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}`;
    }
  }
  if (process.env.BASE_URL && !process.env.BASE_URL.includes("localhost")) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (host) return `${proto}://${host}`;
  }
  return process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, "") : `http://localhost:${process.env.PORT || 3000}`;
};

// Speech Synthesis (TTS) & Speech Recognition (STT) Settings
const TTS_VOICE = process.env.TWILIO_TTS_VOICE || "Polly.Raveena";
const TTS_LANGUAGE = process.env.TWILIO_TTS_LANGUAGE || "en-IN";
const STT_LANGUAGE = process.env.TWILIO_STT_LANGUAGE || "en-IN";

/**
 * Helper to produce consistent Indian English Polly.Raveena speech
 */
function sayPrompt(twimlOrGather, message) {
  twimlOrGather.say({ voice: TTS_VOICE, language: TTS_LANGUAGE }, message);
}

// ================= POST /voice =================
exports.handleIncomingCall = async (req, res) => {
  const callSid = req.body.CallSid;
  const callerPhone = req.body.From || "";
  const BASE_URL = getBaseUrl(req);

  console.log(`📞 [IVR] Incoming call from: ${callerPhone} (CallSid: ${callSid})`);

  try {
    await CallSession.findOneAndUpdate(
      { callSid },
      { phone: callerPhone, step: "init" },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error creating call session:", err.message);
  }

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/api/voice/get-name`,
    method: "POST",
    language: STT_LANGUAGE,
    speechModel: "phone_call",
    speechTimeout: "auto",
    timeout: 5,
  });

  sayPrompt(gather, "Welcome to VMC complaint redressal system. Please say your full name.");

  // Fallback if no speech detected
  sayPrompt(twiml, "Sorry, I didn't hear anything.");
  twiml.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml").send(twiml.toString());
};

// ================= POST /get-name =================
exports.handleGetName = async (req, res) => {
  const callSid = req.body.CallSid;
  const name = req.body.SpeechResult || "";
  const BASE_URL = getBaseUrl(req);

  console.log(`➡️ [IVR] Name captured: "${name}" (CallSid: ${callSid})`);

  try {
    await CallSession.findOneAndUpdate(
      { callSid },
      { name, step: "name" },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error updating session name:", err.message);
  }

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/api/voice/get-address`,
    method: "POST",
    language: STT_LANGUAGE,
    speechModel: "phone_call",
    hints: "Akota, Alkapuri, Gotri, Karelibaug, Manjalpur, Tandalja, Sayajigunj, Fatehgunj, Makarpura, Subhanpura, Waghodia",
    speechTimeout: "auto",
    timeout: 5,
  });

  sayPrompt(gather, "Please say your street address and area in Vadodara.");

  sayPrompt(twiml, "I didn't catch that.");
  twiml.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml").send(twiml.toString());
};

// ================= POST /get-address =================
exports.handleGetAddress = async (req, res) => {
  const callSid = req.body.CallSid;
  const address = req.body.SpeechResult || "";
  const BASE_URL = getBaseUrl(req);

  console.log(`➡️ [IVR] Address captured: "${address}" (CallSid: ${callSid})`);

  try {
    await CallSession.findOneAndUpdate(
      { callSid },
      { address, step: "address" },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error updating session address:", err.message);
  }

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/api/voice/get-ward`,
    method: "POST",
    language: STT_LANGUAGE,
    speechModel: "phone_call",
    speechTimeout: "auto",
    timeout: 5,
  });

  sayPrompt(gather, "Please say your ward number, or say skip if unknown.");

  sayPrompt(twiml, "I didn't catch that.");
  twiml.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml").send(twiml.toString());
};

// ================= POST /get-ward =================
exports.handleGetWard = async (req, res) => {
  const callSid = req.body.CallSid;
  const rawWard = req.body.SpeechResult || "";
  const BASE_URL = getBaseUrl(req);

  const wardMatch = rawWard.match(/\d+/);
  const ward = wardMatch ? wardMatch[0] : rawWard;

  console.log(`➡️ [IVR] Ward captured: "${ward}" (CallSid: ${callSid})`);

  try {
    await CallSession.findOneAndUpdate(
      { callSid },
      { ward, step: "ward" },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error updating session ward:", err.message);
  }

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/api/voice/get-issue`,
    method: "POST",
    language: STT_LANGUAGE,
    speechModel: "phone_call",
    hints: "street light, drainage, garbage, water supply, pipeline, pothole, road, pole, wire, sparking, leakage, overflow, manhole",
    speechTimeout: "auto",
    timeout: 6,
  });

  sayPrompt(gather, "Please describe the municipal problem you are facing in detail.");

  sayPrompt(twiml, "I didn't catch that.");
  twiml.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml").send(twiml.toString());
};

// ================= POST /get-issue =================
exports.handleGetIssue = async (req, res) => {
  const callSid = req.body.CallSid;
  const issue = req.body.SpeechResult || "";
  const BASE_URL = getBaseUrl(req);

  console.log(`➡️ [IVR] Issue captured: "${issue}" (CallSid: ${callSid})`);

  let session = await CallSession.findOne({ callSid });
  if (!session) {
    session = new CallSession({ callSid, issue });
  }

  const fullPrompt = `
Caller Name: ${session.name || "Unknown"}
Address: ${session.address || "Vadodara"}
Ward: ${session.ward || "Unknown"}
Complaint Transcript: ${issue}
`;

  // AI extraction
  const extracted = await extractComplaintData(fullPrompt);

  const finalName = extracted.name || session.name || "Anonymous Citizen";
  const finalAddress = extracted.address || session.address || "Vadodara";
  const finalWard = extracted.ward || session.ward || "";
  const finalIssue = extracted.issue || issue;
  const finalCategory = extracted.category || "other";
  const finalZone = extracted.zone || "";
  const finalPriority = extracted.priority || "P3_medium";

  // Persist structured state
  session.step = "confirm";
  session.name = finalName;
  session.address = finalAddress;
  session.ward = finalWard;
  session.issue = finalIssue;
  session.category = finalCategory;
  session.zone = finalZone;
  session.extractedData = extracted;
  await session.save();

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "dtmf",
    numDigits: 1,
    timeout: 6,
    action: `${BASE_URL}/api/voice/confirm`,
    method: "POST",
  });

  sayPrompt(
    gather,
    `Please confirm your details. Name ${finalName}. Address ${finalAddress}. Issue: ${finalIssue}. Press 1 to register this complaint. Press 2 to re-record.`
  );

  sayPrompt(twiml, "No input received.");
  twiml.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml").send(twiml.toString());
};

// ================= POST /confirm =================
exports.handleConfirm = async (req, res) => {
  const callSid = req.body.CallSid;
  const digit = req.body.Digits;
  const BASE_URL = getBaseUrl(req);

  console.log(`➡️ [IVR] Confirm digit: ${digit} (CallSid: ${callSid})`);

  const twiml = new VoiceResponse();

  if (digit === "1") {
    const session = await CallSession.findOne({ callSid });

    if (!session) {
      sayPrompt(twiml, "Session expired. Please call back to register your complaint.");
      twiml.hangup();
      return res.type("text/xml").send(twiml.toString());
    }

    try {
      const complaint = await processAndCreateComplaint(
        {
          name: session.name || "Anonymous Citizen",
          phone: session.phone || "",
          address: session.address || "Vadodara",
          ward: session.ward || "",
          issue: session.issue || "Municipal Issue",
          category: session.category || "other",
          zone: session.zone || "",
          priority: session.extractedData?.priority,
          source: "ivr_phone",
        },
        `IVR Call (${session.phone || "Citizen"})`
      );

      // Clear session
      await CallSession.deleteOne({ callSid });

      console.log(`✅ [IVR] Complaint successfully processed: ${complaint.ticketId} (isDuplicate: ${complaint.isDuplicate})`);

      sayPrompt(
        twiml,
        `Your complaint has been successfully registered. Your Case ID is ${complaint.ticketId}. Our municipal field team has been notified. Thank you for calling Vadodara Municipal Corporation.`
      );
      twiml.hangup();
    } catch (err) {
      console.error("Error saving complaint from IVR:", err);
      sayPrompt(twiml, "There was an error saving your grievance. Please try again later.");
      twiml.hangup();
    }
  } else {
    sayPrompt(twiml, "Let us try again from the beginning.");
    twiml.redirect(`${BASE_URL}/api/voice`);
  }

  res.type("text/xml").send(twiml.toString());
};
