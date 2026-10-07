const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const CallSession = require("../models/CallSession");
const { extractComplaintData } = require("../services/aiService");
const { processAndCreateComplaint } = require("../services/complaintWorkflowService");

const DEMO_SCENARIOS = {
  streetlight: {
    name: "Chetan Parmar",
    phone: "+919876543210",
    address: "Akota, near tube well pole 42",
    ward: "12",
    issue: "Street light flickering and pole exposed wires sparking since yesterday night",
    rawTranscript: "maru naam Chetan Parmar che, akota ma tube well pole 42 pase street light flickering kare che ane wires sparking thay che",
  },
  water: {
    name: "Farida Mansuri",
    phone: "+919876543211",
    address: "Tandalja, Block D, near water tank",
    ward: "7",
    issue: "Severe pipeline burst and murky dirty water supply coming into homes since 2 days",
    rawTranscript: "Tandalja water tank pase pipeline burst thai gayi che ane drinking water ma foul smell and dirty water aave che",
  },
  drainage: {
    name: "Ketan Trivedi",
    phone: "+919876543212",
    address: "Karelibaug, Ambica Nagar, Lane 2",
    ward: "6",
    issue: "Main sewer line blocked causing dirty water logging on the road and open manhole",
    rawTranscript: "Karelibaug Ambica nagar ma sewer line completely blocked che ane rasta par open manhole ma thi water overflow thay che",
  },
  garbage: {
    name: "Sunita Rathod",
    phone: "+919876543213",
    address: "Manjalpur, GIDC road, near school",
    ward: "4",
    issue: "Garbage bin overflowing for past 4 days, stray cattle scattering waste near school gate",
    rawTranscript: "Manjalpur school pase kachro overflow thai gayo che ane 4 divas thi garbage van aavi nathi",
  },
};

// POST /api/simulator/scenario
exports.runDemoScenario = async (req, res, next) => {
  try {
    const { scenarioKey = "streetlight", customTranscript, customPhone } = req.body;
    const scenario = DEMO_SCENARIOS[scenarioKey] || DEMO_SCENARIOS.streetlight;

    const transcript = customTranscript || scenario.rawTranscript;
    const phone = customPhone || scenario.phone;

    console.log(`🤖 [Simulator] Running scenario: ${scenarioKey} with transcript: "${transcript}"`);

    const extracted = await extractComplaintData(transcript);

    const complaint = await processAndCreateComplaint(
      {
        name: extracted.name || scenario.name,
        phone,
        address: extracted.address || scenario.address,
        ward: extracted.ward || scenario.ward,
        issue: extracted.issue || scenario.issue,
        category: extracted.category || "street_light",
        zone: extracted.zone || "West",
        priority: extracted.priority || "P2_high",
        source: "call_simulator",
      },
      `Viva Call Simulator (${phone})`
    );

    res.status(201).json({
      success: true,
      ticketId: complaint.ticketId,
      complaint,
      extracted,
      scenarioUsed: scenarioKey,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/simulator/turn
exports.runInteractiveTurn = async (req, res, next) => {
  try {
    const { callId, step = "init", input = "", phone = "+919876543210" } = req.body;
    const sid = callId || `sim-${Date.now()}`;

    let session = await CallSession.findOne({ callSid: sid });
    if (!session) {
      session = new CallSession({ callSid: sid, phone, step: "init" });
    }

    let nextPrompt = "";
    let nextStep = "";
    let extractedData = null;
    let registeredComplaint = null;

    switch (step) {
      case "init":
        nextStep = "name";
        nextPrompt = "Welcome to VMC automated redressal system. Please state your full name.";
        session.step = "name";
        break;

      case "name":
        session.name = input;
        session.step = "address";
        nextStep = "address";
        nextPrompt = `Thank you ${input}. Please state your street address and area in Vadodara.`;
        break;

      case "address":
        session.address = input;
        session.step = "ward";
        nextStep = "ward";
        nextPrompt = "Please state your municipal ward number (1 to 20), or say skip if not known.";
        break;

      case "ward": {
        const match = input.match(/\d+/);
        session.ward = match ? match[0] : input;
        session.step = "issue";
        nextStep = "issue";
        nextPrompt = "Please describe the civic or municipal problem you are facing in detail.";
        break;
      }

      case "issue": {
        session.issue = input;
        const fullPrompt = `
Caller: ${session.name}
Address: ${session.address}
Ward: ${session.ward}
Complaint: ${input}
`;
        extractedData = await extractComplaintData(fullPrompt);
        session.extractedData = extractedData;
        session.category = extractedData.category;
        session.zone = extractedData.zone;
        session.step = "confirm";
        nextStep = "confirm";
        nextPrompt = `Please confirm your details. Name: ${extractedData.name || session.name}. Address: ${extractedData.address || session.address}. Category: ${extractedData.category}. Issue: ${extractedData.issue || input}. Reply with "1" to confirm or "2" to retry.`;
        break;
      }

      case "confirm":
        if (input.trim() === "1" || input.toLowerCase().includes("yes") || input.toLowerCase().includes("confirm")) {
          registeredComplaint = await processAndCreateComplaint(
            {
              name: session.name || "Anonymous Citizen",
              phone: session.phone || phone,
              address: session.address || "Vadodara",
              ward: session.ward || "",
              issue: session.issue || "Municipal Issue",
              category: session.category || "other",
              zone: session.zone || "",
              priority: session.extractedData?.priority || "P3_medium",
              source: "call_simulator",
            },
            `Interactive Call Simulator (${phone})`
          );

          await CallSession.deleteOne({ callSid: sid });
          nextStep = "completed";
          nextPrompt = `Your grievance has been successfully registered under Case ID ${registeredComplaint.ticketId}. Our field engineer team has been notified. Thank you for contacting Vadodara Municipal Corporation.`;
        } else {
          session.step = "init";
          nextStep = "init";
          nextPrompt = "Let us start over. Please say your name.";
        }
        break;

      default:
        nextStep = "init";
        nextPrompt = "Welcome to VMC complaint system. Please say your name.";
    }

    if (nextStep !== "completed") {
      await session.save();
    }

    res.json({
      callId: sid,
      currentStep: step,
      nextStep,
      botPrompt: nextPrompt,
      sessionData: {
        name: session.name,
        address: session.address,
        ward: session.ward,
        issue: session.issue,
        category: session.category,
      },
      extractedData,
      registeredComplaint,
    });
  } catch (err) {
    next(err);
  }
};
