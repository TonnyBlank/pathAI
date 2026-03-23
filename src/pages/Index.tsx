import { useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import { ImageViewer } from "@/components/ImageViewer";
import { AIChat } from "@/components/AIChat";
import { LearningMode } from "@/components/LearningMode";
import { Toaster } from "@/components/ui/toaster";

type Tab = "viewer" | "chat" | "learn" | "cases";

function CasesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <span className="text-2xl">📁</span>
      </div>
      <div>
        <p className="font-display font-semibold text-foreground mb-1">Case Manager</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload, analyze, and organize your histopathology cases. Coming in the next update.
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("viewer");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <main className="flex-1 overflow-hidden min-w-0">
        {activeTab === "viewer" && <ImageViewer />}
        {activeTab === "chat" && <AIChat />}
        {activeTab === "learn" && <LearningMode />}
        {activeTab === "cases" && <CasesPlaceholder />}
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <ThemeProvider>
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}
