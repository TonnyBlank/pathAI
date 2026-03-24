import { motion } from "framer-motion";
import {
  Microscope, MessageSquare, BookOpen, FolderOpen, Sun, Moon, ChevronLeft, ChevronRight,
  Activity, Upload, Brain, FlaskConical,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type Tab = "viewer" | "chat" | "learn" | "cases";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const NAV_ITEMS: { id: Tab; icon: React.ReactNode; label: string; desc: string }[] = [
  { id: "viewer", icon: <Microscope size={20} />, label: "Image Viewer", desc: "Upload & analyze slides" },
  { id: "chat", icon: <MessageSquare size={20} />, label: "Caren musulia AI", desc: "Expert pathology Q&A" },
  { id: "learn", icon: <BookOpen size={20} />, label: "Learning Mode", desc: "Quiz & study tools" },
  { id: "cases", icon: <FolderOpen size={20} />, label: "Case Manager", desc: "Manage your cases" },
];

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle, mobile = false }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const isCollapsed = mobile ? false : collapsed;

  return (
    <motion.aside
      initial={false}
      animate={mobile ? undefined : { width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar ${mobile ? "w-full" : "flex-shrink-0"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[72px]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: "var(--gradient-primary)" }}>
          <FlaskConical size={18} className="text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="font-display font-700 text-sm text-sidebar-foreground leading-tight">Caren musulia AI</p>
            <p className="text-xs text-muted-foreground">Digital Pathology Platform</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-teal-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left overflow-hidden"
                >
                  <p className="text-sm font-medium leading-tight">{item.label}</p>
                  <p className="text-xs opacity-60 leading-tight">{item.desc}</p>
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mb-3 p-3 rounded-lg bg-teal-muted border border-teal/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-teal" />
            <span className="text-xs font-medium text-primary">AI Online</span>
          </div>
          <p className="text-xs text-muted-foreground">Pathology review mode active</p>
        </motion.div>
      )}

      {/* Footer controls */}
      <div className="border-t border-sidebar-border p-2 flex flex-col gap-1">
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </motion.span>
          )}
        </button>

        {!mobile && (
          <button
            onClick={onToggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                Collapse
              </motion.span>
            )}
          </button>
        )}
      </div>

      {/* Medical disclaimer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pb-3"
        >
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            ⚠️ For educational & research use only. Not a substitute for clinical diagnosis.
          </p>
        </motion.div>
      )}
    </motion.aside>
  );
}
