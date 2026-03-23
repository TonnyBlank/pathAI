import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface AnalysisResult {
  tissueType?: string;
  stainType?: string;
  primaryDiagnosis?: string;
  diagnosisConfidence?: number;
  malignancyStatus?: string;
  malignancyConfidence?: number;
  grade?: string;
  morphologicalDescription?: string;
  keyFeatures?: string[];
  differentialDiagnoses?: {
    diagnosis: string;
    confidence: number;
    supportingFeatures: string;
    excludingFeatures: string;
  }[];
  prognosticIndicators?: string[];
  recommendedStudies?: string[];
  clinicalCorrelation?: string;
  limitations?: string;
  pathologyCategory?: string;
  rawResponse?: string;
}

export async function analyzeImage(imageBase64: string, mimeType: string): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-image", {
    body: { imageBase64, mimeType },
  });
  if (error) throw new Error(error.message || "Analysis failed");
  if (data?.error) throw new Error(data.error);
  return data?.analysis || {};
}

export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  onDelta: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const resp = await fetch(
    `${SUPABASE_URL}/functions/v1/pathology-chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    }
  );

  if (!resp.ok || !resp.body) {
    const errData = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errData.error || `HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw || raw.startsWith(":")) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
