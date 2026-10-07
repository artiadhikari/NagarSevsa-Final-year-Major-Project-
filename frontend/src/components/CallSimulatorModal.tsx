import { useState } from "react";
import { runSimulatorScenario, runSimulatorTurn } from "../data/simulator";
import type { SimulatorResponse, SimulatorTurnResponse } from "../data/simulator";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplaintCreated: () => void;
}

const PRESET_SCENARIOS = [
  {
    key: "streetlight",
    title: "⚡ Street Light & Exposed Wires",
    lang: "Gujarati + English",
    badge: "P1_critical",
    transcript:
      "Maru naam Chetan Parmar che, akota ma tube well pole 42 pase street light flickering kare che ane wires sparking thay che. Very dangerous.",
  },
  {
    key: "water",
    title: "🚰 Pipeline Burst & Murky Water",
    lang: "Hindi + English",
    badge: "P2_high",
    transcript:
      "Tandalja water tank ke paas pipeline burst ho gayi hai aur morning supply me murky foul-smelling water aa raha hai 2 din se.",
  },
  {
    key: "drainage",
    title: "🕳️ Sewer Blockage & Open Manhole",
    lang: "Gujarati + English",
    badge: "P1_critical",
    transcript:
      "Karelibaug Ambica nagar lane 2 ma drainage line blocked che ane manhole cover tuti gayo che, pani rasta par overflow kare che.",
  },
  {
    key: "garbage",
    title: "🗑️ Overflowing Garbage Bin",
    lang: "Gujarati + Hindi",
    badge: "P3_medium",
    transcript:
      "Manjalpur primary school pase kachro overflow thai gayo che, 4 divas thi garbage collection truck aavi nathi.",
  },
];

export default function CallSimulatorModal({ isOpen, onClose, onComplaintCreated }: Props) {
  const [activeTab, setActiveTab] = useState<"preset" | "turn">("preset");

  // Preset scenario state
  const [selectedScenario, setSelectedScenario] = useState("streetlight");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulatorResponse | null>(null);

  // Turn-by-turn state
  const [callId, setCallId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<string>("name");
  const [userInput, setUserInput] = useState<string>("");
  const [dialogHistory, setDialogHistory] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Welcome to the automated grievance redressal system. Please state your full name." },
  ]);
  const [turnResult, setTurnResult] = useState<SimulatorTurnResponse | null>(null);

  if (!isOpen) return null;

  const handleRunPreset = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await runSimulatorScenario(selectedScenario, customText || undefined);
      setResult(res);
      onComplaintCreated();
    } catch (err) {
      console.error("Simulation failed:", err);
      alert("Simulation failed. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    const currentInput = userInput;
    setUserInput("");
    setLoading(true);

    const updatedHistory = [...dialogHistory, { role: "user" as const, text: currentInput }];
    setDialogHistory(updatedHistory);

    try {
      const activeCallId = callId || `sim-${Date.now()}`;
      if (!callId) setCallId(activeCallId);

      const res = await runSimulatorTurn(activeCallId, currentStep, currentInput);
      setTurnResult(res);
      setCurrentStep(res.nextStep);

      setDialogHistory([...updatedHistory, { role: "bot" as const, text: res.botPrompt }]);

      if (res.nextStep === "completed" && res.registeredComplaint) {
        onComplaintCreated();
      }
    } catch (err) {
      console.error("Turn failed:", err);
      setDialogHistory([
        ...updatedHistory,
        { role: "bot", text: "Error connecting to AI service. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetInteractive = () => {
    setCallId("");
    setCurrentStep("name");
    setDialogHistory([
      { role: "bot", text: "Welcome to the automated grievance redressal system. Please state your full name." },
    ]);
    setTurnResult(null);
    setUserInput("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0a1e3d] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white">
              AI Voice Call Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("preset")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preset"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Preset Scenarios (1-Click)
          </button>
          <button
            onClick={() => setActiveTab("turn")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "turn"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Interactive Turn-by-Turn IVR
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "preset" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Select a simulated citizen phone call scenario to test speech extraction and automatic complaint registration:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_SCENARIOS.map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => {
                      setSelectedScenario(sc.key);
                      setCustomText("");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedScenario === sc.key
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-gray-900">{sc.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {sc.lang}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed italic">"{sc.transcript}"</p>
                  </button>
                ))}
              </div>

              {/* Custom Speech transcript override */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Or Test Custom Caller Speech:
                </label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. Gotri ma pani no pipeline leak thay che, jaldi aavo..."
                  className="w-full text-sm text-gray-900 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none placeholder:text-gray-400 bg-white"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleRunPreset}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Registering Complaint...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Register Complaint
                  </>
                )}
              </button>

              {/* Extracted Output Preview Card */}
              {result && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3 animate-slide-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Complaint Registered Successfully!
                    </span>
                    <span className="text-xs font-mono font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-md">
                      Case #{result.ticketId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs text-gray-500 block font-medium">Category</span>
                      <span className="text-sm font-bold text-gray-900 uppercase">{result.extracted?.category || "Other"}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs text-gray-500 block font-medium">Ward & Zone</span>
                      <span className="text-sm font-bold text-gray-900">
                        Ward {result.extracted?.ward || "—"} ({result.extracted?.zone || "—"})
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs text-gray-500 block font-medium">Priority</span>
                      <span className="text-sm font-bold text-red-600">{result.extracted?.priority || "P3_medium"}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs text-gray-500 block font-medium">Caller Name</span>
                      <span className="text-sm font-bold text-gray-900">{result.extracted?.name || "Citizen"}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-emerald-200">
                    <span className="font-semibold text-gray-600 block text-xs uppercase mb-1">Issue Description:</span>
                    "{result.extracted?.issue}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Turn-by-turn conversational simulation replicating phone IVR voice prompts:
                </p>
                <button
                  type="button"
                  onClick={resetInteractive}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Restart Call
                </button>
              </div>

              {/* Dialog speech bubble box */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 min-h-[220px] max-h-[300px] overflow-y-auto">
                {dialogHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        msg.role === "bot" ? "bg-primary text-white" : "bg-gray-700 text-white"
                      }`}
                    >
                      {msg.role === "bot" ? "IVR" : "You"}
                    </div>
                    <div
                      className={`rounded-xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                        msg.role === "bot"
                          ? "bg-white border border-gray-200 text-gray-900 shadow-xs"
                          : "bg-primary text-white font-medium"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    AI IVR processing speech response...
                  </div>
                )}
              </div>

              {/* Input for interactive turn */}
              {currentStep !== "completed" ? (
                <form onSubmit={handleSendTurn} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      currentStep === "confirm"
                        ? 'Type "1" to confirm or "2" to retry...'
                        : "Type your simulated speech response..."
                    }
                    className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={loading || !userInput.trim()}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
                  >
                    Speak / Reply
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-sm flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold block text-emerald-900">🎉 Call completed & grievance registered!</span>
                    {turnResult?.registeredComplaint?.ticketId && (
                      <span className="text-xs font-mono text-emerald-800 mt-1 block">
                        Assigned Case ID: <strong>{turnResult.registeredComplaint.ticketId}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetInteractive}
                    className="font-semibold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs"
                  >
                    New Simulated Call
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
