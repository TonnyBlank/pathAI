import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import { ImageViewer } from "@/components/ImageViewer";
import { AIChat } from "@/components/AIChat";
import { LearningMode } from "@/components/LearningMode";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      )}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {isMobile && (
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-muted"
                  aria-label="Open navigation menu"
                >
                  <Menu size={18} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-[320px] border-sidebar-border bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Sidebar
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setMobileNavOpen(false);
                  }}
                  collapsed={false}
                  onToggle={() => setMobileNavOpen(false)}
                  mobile
                />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground">Caren musulia AI</p>
              <p className="truncate text-xs text-muted-foreground">
                {activeTab === "viewer" && "Image Viewer"}
                {activeTab === "chat" && "Caren musulia AI"}
                {activeTab === "learn" && "Learning Mode"}
                {activeTab === "cases" && "Case Manager"}
              </p>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-hidden min-w-0">
          {activeTab === "viewer" && <ImageViewer />}
          {activeTab === "chat" && <AIChat />}
          {activeTab === "learn" && <LearningMode />}
          {activeTab === "cases" && <CasesPlaceholder />}
        </main>
      </div>
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
