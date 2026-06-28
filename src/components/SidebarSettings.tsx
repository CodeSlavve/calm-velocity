import { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Download, Upload, Copy, Check, FileJson, 
  Database, AlertTriangle, User, Globe, Mail, 
  Sparkles, CheckCircle2, RefreshCw, Github, Key, ExternalLink,
  Eye, EyeOff
} from "lucide-react";
import { Task } from "../types";

interface SidebarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onRestoreTasks: (tasks: Task[]) => void;
  onRestorePreseeds: () => void;
}

export default function SidebarSettings({
  isOpen,
  onClose,
  tasks,
  onRestoreTasks,
  onRestorePreseeds,
}: SidebarSettingsProps) {
  const [copied, setCopied] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export backup as JSON file
  const handleExportFile = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", `CalmVelocity_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      dlAnchorElem.click();
      showFeedback("success", "Backup file downloaded successfully!");
    } catch (err) {
      showFeedback("error", "Failed to generate backup file.");
    }
  };

  // 2. Copy raw backup string to clipboard
  const handleCopyBackup = () => {
    try {
      const dataStr = JSON.stringify(tasks);
      navigator.clipboard.writeText(dataStr);
      setCopied(true);
      showFeedback("success", "Backup copied to clipboard! You can share it anywhere.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showFeedback("error", "Could not copy to clipboard.");
    }
  };

  // Helper for status feedback
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 3. Restore backup from selected file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        validateAndApplyBackup(parsed);
      } catch (err) {
        showFeedback("error", "Invalid file format. Please upload a valid Calm Velocity JSON backup.");
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 4. Restore backup from pasted string
  const handlePasteRestore = () => {
    if (!pasteValue.trim()) {
      showFeedback("error", "Please paste your backup text first.");
      return;
    }
    try {
      const parsed = JSON.parse(pasteValue.trim());
      validateAndApplyBackup(parsed);
      setPasteValue("");
    } catch (err) {
      showFeedback("error", "The text you pasted is not valid JSON. Check your copied content.");
    }
  };

  // Validate tasks array
  const validateAndApplyBackup = (data: any) => {
    if (!Array.isArray(data)) {
      showFeedback("error", "Backup data must be a task list array.");
      return;
    }
    
    // Quick structural check
    const isValid = data.every((item: any) => {
      return item && typeof item === "object" && "id" in item && "title" in item && "breakdown" in item;
    });

    if (!isValid) {
      showFeedback("error", "Invalid backup structure. The file lacks required task fields.");
      return;
    }

    onRestoreTasks(data);
    showFeedback("success", `Success! Restored ${data.length} tasks successfully.`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40 cursor-pointer"
            id="sidebar-backdrop"
          />

          {/* Sliding sidebar container */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-full max-w-[380px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 flex flex-col shadow-2xl transition-colors duration-300"
            id="sidebar-container"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase font-mono">
                    Workspace Panel
                  </h3>
                  <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wide">
                    Portable Backup & Sync
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                id="close-sidebar-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Info alert banner */}
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 p-3.5 rounded-2xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block mb-0.5">Local Storage Architecture</span>
                    Calm Velocity saves your data in your browser's offline storage. Before switching browsers, using other devices, generate a backup below!
                  </div>
                </div>
              </div>

              {/* Success / Error Toast notification inside Sidebar */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-xl border flex gap-2 items-start text-xs font-medium ${
                      feedback.type === "success" 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${feedback.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
                    <span>{feedback.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 1. BACKUP SECTION */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  1. Create Backup
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* File Download button */}
                  <button
                    onClick={handleExportFile}
                    className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-indigo-200 dark:hover:border-indigo-900/40 text-slate-700 dark:text-slate-200 transition-all text-center group cursor-pointer"
                    id="download-backup-btn"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950 transition-colors">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold block">Download File</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">CalmVelocity.json</span>
                  </button>

                  {/* Clipboard copy button */}
                  <button
                    onClick={handleCopyBackup}
                    className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-indigo-200 dark:hover:border-indigo-900/40 text-slate-700 dark:text-slate-200 transition-all text-center group cursor-pointer"
                    id="copy-backup-btn"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-1.5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </div>
                    <span className="text-[11px] font-bold block">{copied ? "Copied!" : "Copy Clipboard"}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Quick copy share</span>
                  </button>
                </div>
              </div>

              {/* 2. RESTORE SECTION */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  2. Restore Workspace
                </h4>

                <div className="space-y-3">
                  {/* Option A: Upload backup file */}
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900/40 rounded-2xl p-4 text-center transition-colors bg-slate-50/30 dark:bg-slate-950/10">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                      id="backup-file-picker"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                      id="trigger-file-picker-btn"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select Backup File</span>
                    </button>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2">
                      Upload any previously saved .json backup file
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest font-mono">
                    <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <span>OR PASTE TEXT</span>
                    <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </div>

                  {/* Option B: Paste Clipboard string */}
                  <div className="space-y-2">
                    <textarea
                      value={pasteValue}
                      onChange={(e) => setPasteValue(e.target.value)}
                      placeholder='Paste backup content here... (e.g. [{"id": "...", "title": "..."}])'
                      className="w-full h-18 text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-600 dark:text-slate-350 placeholder-slate-400 dark:placeholder-slate-600 resize-none"
                      id="backup-paste-textarea"
                    />
                    <button
                      onClick={handlePasteRestore}
                      className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      id="apply-paste-backup-btn"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>Apply Copied Backup</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. HARD RESET / RESTORE SAMPLE */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  3. Emergency Reset
                </h4>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to restore default sample tasks? This will replace your current workflow tasks.")) {
                      onRestorePreseeds();
                      showFeedback("success", "Restored default sample task boards.");
                    }
                  }}
                  className="w-full py-2 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  id="reset-preseeds-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Restore Default Sample Boards</span>
                </button>
              </div>
            </div>

            {/* About Me Section - Locked at the bottom */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-900/40">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight uppercase">
                      About the Developer
                    </h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      Calm Velocity Architect
                    </p>
                  </div>
                </div>

                {/* Developer link representations */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="https://github.com/CodeSlavve"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all"
                    title="GitHub Profile"
                    id="developer-github-link"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="mailto:yash06763@gmail.com"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all"
                    title="Send Email"
                    id="developer-email-link"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <div className="ml-auto text-[9px] text-indigo-600/80 dark:text-indigo-400/80 font-black font-mono">
                    BUILD v1.2
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
