import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Upload, ZoomIn, ZoomOut, RotateCcw, Maximize2, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, Activity, Microscope,
  Info, ChevronRight, FlaskConical, FileText, Brain,
} from "lucide-react";
import { analyzeImage, type AnalysisResult } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const CONFIDENCE_COLOR = (v: number) =>
  v >= 80 ? "text-clinical-success" : v >= 60 ? "text-clinical-warning" : "text-clinical-danger";

const MALIGNANCY_COLOR = (s: string) => {
  if (s?.toLowerCase().includes("malignant") && !s.toLowerCase().includes("pre")) return "text-clinical-danger";
  if (s?.toLowerCase().includes("pre") || s?.toLowerCase().includes("dysplastic")) return "text-clinical-warning";
  if (s?.toLowerCase().includes("benign")) return "text-clinical-success";
  return "text-muted-foreground";
};

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 80 ? "bg-clinical-success" : value >= 60 ? "bg-clinical-warning" : "bg-clinical-danger";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={CONFIDENCE_COLOR(value)}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export function ImageViewer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>("diagnosis");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setAnalysis(null);
      // Extract base64
      const b64 = dataUrl.split(",")[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAnalysis(null);

    // Fake progress
    const interval = setInterval(() => {
      setAnalyzeProgress((p) => Math.min(p + Math.random() * 8, 88));
    }, 400);

    try {
      const result = await analyzeImage(imageBase64, imageMime);
      clearInterval(interval);
      setAnalyzeProgress(100);
      setTimeout(() => {
        setAnalysis(result);
        setIsAnalyzing(false);
        setAnalyzeProgress(0);
      }, 400);
    } catch (err: unknown) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    }
  };

  const toggleSection = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 overflow-hidden">
      {/* Image Panel */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
          <Microscope size={16} className="text-primary" />
          <span className="text-sm font-medium font-display">Image Viewer</span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              <Upload size={13} />
              Upload
            </button>
            {imageBase64 && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
              >
                <Brain size={13} />
                Analyze with AI
              </button>
            )}
          </div>
        </div>

        {/* Viewer */}
        <div
          className="flex-1 relative overflow-hidden bg-black flex items-center justify-center"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {imageUrl ? (
            <TransformWrapper
              initialScale={1}
              minScale={0.1}
              maxScale={20}
              limitToBounds={false}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                    {[
                      { icon: <ZoomIn size={14} />, fn: () => zoomIn(), tip: "Zoom In" },
                      { icon: <ZoomOut size={14} />, fn: () => zoomOut(), tip: "Zoom Out" },
                      { icon: <RotateCcw size={14} />, fn: () => resetTransform(), tip: "Reset" },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.fn}
                        title={btn.tip}
                        className="w-8 h-8 rounded-lg bg-black/70 border border-white/10 text-white flex items-center justify-center hover:bg-black/90 transition-colors backdrop-blur-sm"
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full"
                  >
                    <img
                      src={imageUrl}
                      alt="Histopathology slide"
                      className="max-w-full max-h-full object-contain select-none"
                      draggable={false}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          ) : (
            <AnimatePresence>
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                  ${isDragging ? "border-primary bg-teal-muted/30 scale-[1.02]" : "border-border bg-card/30 hover:border-primary/50"}
                `}
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: "var(--gradient-primary)", opacity: 0.85 }}>
                  <Microscope size={28} className="text-primary-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-foreground mb-1">
                    {isDragging ? "Drop your slide here" : "Upload Histopathology Image"}
                  </p>
                  <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, TIFF, NDPI, SVS up to 20MB</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["H&E", "PAS", "IHC", "Trichrome", "Cytology", "GMS"].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Analyzing overlay */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20"
              >
                <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <div className="text-center">
                  <p className="font-display font-semibold text-foreground mb-1">Analysis in Progress</p>
                  <p className="text-sm text-muted-foreground">pathAI is reviewing slide morphology...</p>
                </div>
                <div className="w-64 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    animate={{ width: `${analyzeProgress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="text-xs text-primary mono">{Math.round(analyzeProgress)}%</p>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ""; }}
          />
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="w-full lg:w-[420px] flex flex-col bg-card border-l border-border overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Activity size={16} className="text-primary" />
          <span className="text-sm font-medium font-display">AI Analysis Report</span>
          {analysis && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-clinical-success/15 text-clinical-success border border-clinical-success/20">
              Complete
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {!analysis && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <FlaskConical size={24} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-display font-medium text-foreground mb-1">No Analysis Yet</p>
                <p className="text-sm text-muted-foreground">Upload a slide and click "Analyze with AI" for a comprehensive pathology report</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Tissue & stain identification</p>
                <p>✓ Diagnosis with confidence scores</p>
                <p>✓ Differential diagnoses</p>
                <p>✓ IHC panel recommendations</p>
                <p>✓ Morphological description</p>
              </div>
            </div>
          )}

          {analysis && (() => {
            const isNonPathology =
              analysis.pathologyCategory?.toLowerCase().includes("non-patholog") ||
              analysis.pathologyCategory?.toLowerCase().includes("botanical") ||
              analysis.pathologyCategory?.toLowerCase().includes("non-human") ||
              analysis.tissueType?.toLowerCase().includes("non-human") ||
              (analysis.diagnosisConfidence === 100 && analysis.pathologyCategory?.toLowerCase().includes("non-path"));

            return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Not-a-pathology banner */}
              {isNonPathology && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl border border-clinical-warning/40 bg-clinical-warning/10 flex gap-3"
                >
                  <AlertCircle size={20} className="text-clinical-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-clinical-warning mb-1">⚠️ Not a Histopathology Image</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This image does not appear to be a histopathology or cytopathology slide.
                      The AI identified it as: <span className="font-medium text-foreground">{analysis.primaryDiagnosis}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please upload a microscopy slide (H&E, IHC, cytology, etc.) for accurate pathological analysis.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Overview cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Tissue Type</p>
                  <p className="text-sm font-medium text-foreground">{analysis.tissueType || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Stain</p>
                  <p className="text-sm font-medium text-foreground">{analysis.stainType || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium text-foreground">{analysis.pathologyCategory || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Grade</p>
                  <p className="text-sm font-medium text-foreground">{analysis.grade || "N/A"}</p>
                </div>
              </div>

              {/* Primary Diagnosis */}
              <AnalysisSection
                id="diagnosis"
                title="Primary Diagnosis"
                icon={<CheckCircle2 size={14} />}
                expanded={expandedSection === "diagnosis"}
                onToggle={() => toggleSection("diagnosis")}
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                    <p className="font-display font-semibold text-foreground text-sm">{analysis.primaryDiagnosis}</p>
                  </div>
                  <div className="p-2 rounded-lg border border-border">
                    <p className={`text-sm font-medium ${MALIGNANCY_COLOR(analysis.malignancyStatus || "")}`}>
                      {analysis.malignancyStatus || "—"}
                    </p>
                  </div>
                  <ConfidenceBar value={analysis.diagnosisConfidence || 0} label="Diagnosis Confidence" />
                  <ConfidenceBar value={analysis.malignancyConfidence || 0} label="Malignancy Confidence" />
                </div>
              </AnalysisSection>

              {/* Morphological Description */}
              <AnalysisSection
                id="morph"
                title="Morphological Description"
                icon={<Microscope size={14} />}
                expanded={expandedSection === "morph"}
                onToggle={() => toggleSection("morph")}
              >
                <p className="text-sm text-foreground leading-relaxed">{analysis.morphologicalDescription}</p>
              </AnalysisSection>

              {/* Key Features */}
              {analysis.keyFeatures && analysis.keyFeatures.length > 0 && (
                <AnalysisSection
                  id="features"
                  title={`Key Microscopic Features (${analysis.keyFeatures.length})`}
                  icon={<Activity size={14} />}
                  expanded={expandedSection === "features"}
                  onToggle={() => toggleSection("features")}
                >
                  <ul className="space-y-1.5">
                    {analysis.keyFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-md bg-primary/15 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </AnalysisSection>
              )}

              {/* Differentials */}
              {analysis.differentialDiagnoses && analysis.differentialDiagnoses.length > 0 && (
                <AnalysisSection
                  id="diff"
                  title="Differential Diagnoses"
                  icon={<Brain size={14} />}
                  expanded={expandedSection === "diff"}
                  onToggle={() => toggleSection("diff")}
                >
                  <div className="space-y-2">
                    {analysis.differentialDiagnoses.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary border border-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-foreground">{d.diagnosis}</p>
                          <span className={`text-xs font-mono ${CONFIDENCE_COLOR(d.confidence)}`}>{d.confidence}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${d.confidence}%` }}
                          />
                        </div>
                        {d.supportingFeatures && (
                          <p className="text-xs text-clinical-success mb-0.5">✓ {d.supportingFeatures}</p>
                        )}
                        {d.excludingFeatures && (
                          <p className="text-xs text-clinical-danger">✗ {d.excludingFeatures}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Recommended Studies */}
              {analysis.recommendedStudies && analysis.recommendedStudies.length > 0 && (
                <AnalysisSection
                  id="studies"
                  title="Recommended Ancillary Studies"
                  icon={<FlaskConical size={14} />}
                  expanded={expandedSection === "studies"}
                  onToggle={() => toggleSection("studies")}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.recommendedStudies.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg text-xs bg-teal-muted text-primary border border-teal/20 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Prognostic Indicators */}
              {analysis.prognosticIndicators && analysis.prognosticIndicators.length > 0 && (
                <AnalysisSection
                  id="prognosis"
                  title="Prognostic Indicators"
                  icon={<Activity size={14} />}
                  expanded={expandedSection === "prognosis"}
                  onToggle={() => toggleSection("prognosis")}
                >
                  <ul className="space-y-1">
                    {analysis.prognosticIndicators.map((p, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-clinical-warning mt-0.5">◆</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </AnalysisSection>
              )}

              {/* Clinical Correlation */}
              {analysis.clinicalCorrelation && (
                <AnalysisSection
                  id="clinical"
                  title="Clinical Correlation"
                  icon={<FileText size={14} />}
                  expanded={expandedSection === "clinical"}
                  onToggle={() => toggleSection("clinical")}
                >
                  <p className="text-sm text-foreground leading-relaxed">{analysis.clinicalCorrelation}</p>
                </AnalysisSection>
              )}

              {/* Limitations */}
              {analysis.limitations && (
                <div className="p-3 rounded-xl bg-clinical-warning/8 border border-clinical-warning/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={13} className="text-clinical-warning" />
                    <span className="text-xs font-medium text-clinical-warning">Limitations</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{analysis.limitations}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-secondary border border-border text-xs text-muted-foreground">
                ⚕️ This AI analysis is for educational & decision-support purposes only. Always correlate with clinical findings and refer to a qualified pathologist for definitive diagnosis.
              </div>
            </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({
  id, title, icon, expanded, onToggle, children,
}: {
  id: string; title: string; icon: React.ReactNode;
  expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
