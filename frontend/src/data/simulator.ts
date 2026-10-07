const API_URL = import.meta.env.VITE_API_URL || "/api";

export interface SimulatorResponse {
  success: boolean;
  ticketId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  complaint: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extracted: any;
  scenarioUsed?: string;
}

export interface SimulatorTurnResponse {
  callId: string;
  currentStep: string;
  nextStep: string;
  botPrompt: string;
  sessionData: {
    name?: string;
    address?: string;
    ward?: string;
    issue?: string;
    category?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractedData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registeredComplaint?: any;
}

export async function runSimulatorScenario(
  scenarioKey: string,
  customTranscript?: string
): Promise<SimulatorResponse> {
  const res = await fetch(`${API_URL}/simulator/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioKey, customTranscript }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function runSimulatorTurn(
  callId: string,
  step: string,
  input: string,
  phone?: string
): Promise<SimulatorTurnResponse> {
  const res = await fetch(`${API_URL}/simulator/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callId, step, input, phone }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
