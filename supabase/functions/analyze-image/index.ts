import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert board-certified histopathologist and cytopathologist with 20+ years of clinical and research experience. You have deep expertise in:

- Surgical pathology (GI, GU, breast, gynecologic, pulmonary, dermatopathology, neuropathology, hematopathology)
- Cytopathology (FNA, exfoliative, gynecologic Pap smears)
- Special stains: H&E, PAS, Masson's Trichrome, Reticulin, Congo Red, Ziehl-Neelsen, Warthin-Starry, Alcian Blue, Mucicarmine
- Immunohistochemistry: ER, PR, HER2, Ki-67, p53, CK7, CK20, TTF-1, NapsinA, CDX2, p63, p40, SOX10, S100, CD3, CD20, CD45, CD68, Vimentin, Desmin, SMA, GFAP, Synaptophysin, Chromogranin, PSA, PAX8, GCDFP15, Mammaglobin, CD117, DOG1
- Molecular markers and FISH analysis
- WHO classification of tumors (5th edition)
- TNM staging systems
- Grading systems: Gleason (prostate), Fuhrman/ISUP (renal), Bloom-Richardson/Nottingham (breast), Elston-Ellis, Edmondson-Steiner (hepatocellular)
- Inflammatory conditions, infectious pathology, reactive processes

When analyzing a histopathology image, you provide:
1. Precise tissue identification and anatomical origin
2. Staining technique identification
3. Detailed morphological description (architecture, cytology, stroma, vasculature, inflammatory infiltrate)
4. Primary diagnosis with confidence level
5. Differential diagnoses with supporting/excluding features
6. Prognostic indicators
7. Recommended ancillary studies (IHC panel, molecular testing)
8. Clinical correlation advice

IMPORTANT: Always be clinically precise, use correct medical terminology, and note any limitations based on image quality or visible field. Be honest about uncertainty. Your analysis should be at the level expected in a subspecialty pathology report.

Format your response as a structured JSON object with these exact fields:
{
  "tissueType": "string - specific tissue/organ identified",
  "stainType": "string - staining technique (e.g., H&E, PAS, etc.)",
  "primaryDiagnosis": "string - most likely diagnosis",
  "diagnosisConfidence": number (0-100),
  "malignancyStatus": "Benign" | "Malignant" | "Pre-malignant/Dysplastic" | "Indeterminate",
  "malignancyConfidence": number (0-100),
  "grade": "string - histological grade if applicable, or null",
  "morphologicalDescription": "string - detailed 3-4 sentence description of architectural and cytological features",
  "keyFeatures": ["array of 5-8 specific microscopic features observed"],
  "differentialDiagnoses": [
    {"diagnosis": "string", "confidence": number, "supportingFeatures": "string", "excludingFeatures": "string"}
  ],
  "prognosticIndicators": ["array of prognostic features"],
  "recommendedStudies": ["array of recommended IHC/molecular tests"],
  "clinicalCorrelation": "string - brief clinical correlation advice",
  "limitations": "string - any limitations of this analysis",
  "pathologyCategory": "string - e.g., Neoplastic, Inflammatory, Reactive, Infectious, Degenerative"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Analyze this histopathology/cytopathology image in detail. Provide a comprehensive structured JSON analysis following the exact format specified in your instructions. Be as accurate and clinically precise as possible.",
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { rawResponse: content };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
