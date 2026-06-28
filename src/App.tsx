/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ShieldAlert, Bot, BookOpen, Sparkles, Brain, Flame, CalendarRange, Heart, Menu, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, TaskStep } from "./types";
import { SAMPLE_TASKS } from "./data/sampleTasks";
import RescueDashboard from "./components/RescueDashboard";
import TaskRescuePane from "./components/TaskRescuePane";
import SprintFocusTimer from "./components/SprintFocusTimer";
import SmartCoachChat from "./components/SmartCoachChat";
import CalendarTimebox from "./components/CalendarTimebox";
import CognitiveBusters from "./components/CognitiveBusters";
import SidebarSettings from "./components/SidebarSettings";

export default function App() {
  // State for all tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Focus sprint active step state
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [activeFocusStep, setActiveFocusStep] = useState<TaskStep | null>(null);
  const [isFocusWidgetHidden, setIsFocusWidgetHidden] = useState(false);

  // Active view tab: "actions" or "cognitive"
  const [activeControlTab, setActiveControlTab] = useState<"plans" | "drills">("plans");

  // Dark mode state
  const [theme, setTheme] = useState<"light" | "dark" | "">(() => {
    const saved = themeFromCookieOrLocalStorage() || "light";
    return saved as "light" | "dark";
  });

  function themeFromCookieOrLocalStorage() {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("calm_velocity_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  useEffect(() => {
    if (!theme) return;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("calm_velocity_theme", theme);
  }, [theme]);

  // Track online status for AI Coach
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load from local storage
  useEffect(() => {
    let saved = localStorage.getItem("calm_velocity_tasks");
    if (!saved) {
      saved = localStorage.getItem("lifesaver_tasks");
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
        if (parsed.length > 0) {
          setSelectedTaskId(parsed[0].id);
        }
      } catch (err) {
        console.warn("Storage parse error, starting empty:", err);
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
  }, []);

  // Save to local storage on modification
  const saveTasksToStorage = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem("calm_velocity_tasks", JSON.stringify(updatedTasks));
  };

  const restoreSamplePreseeds = () => {
    saveTasksToStorage(SAMPLE_TASKS);
    if (SAMPLE_TASKS.length > 0) {
      setSelectedTaskId(SAMPLE_TASKS[0].id);
    }
  };

  // Add Task
  const handleAddTask = (newTask: Task) => {
    const updated = [newTask, ...tasks];
    saveTasksToStorage(updated);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasksToStorage(updated);
    
    // If the deleted task was the active focus task, reset focus state
    if (activeFocusTask?.id === taskId) {
      setActiveFocusTask(null);
      setActiveFocusStep(null);
    }
    
    // If we deleted the currently selected task, pick the first available or null
    if (selectedTaskId === taskId) {
      if (updated.length > 0) {
        setSelectedTaskId(updated[0].id);
      } else {
        setSelectedTaskId(null);
      }
    }
  };

  // Click task card selector
  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  // Add custom manual extra step to an existing task checklist
  const handleAddCustomStep = (
    taskId: string,
    stepTitle: string,
    duration: number,
    difficulty: "easy" | "medium" | "hard",
    tip: string
  ) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const newStep: TaskStep = {
        id: `custom-step-${Date.now()}`,
        step: stepTitle,
        durationMinutes: duration,
        difficulty,
        tip,
        completed: false,
      };
      
      const newBreakdown = [...t.breakdown, newStep];
      return {
        ...t,
        breakdown: newBreakdown,
        completed: false, // reset back to incomplete if step added
        estimatedTotalHours: Number((newBreakdown.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)),
      };
    });

    saveTasksToStorage(updated);
  };

  // Toggle checklist step completed state
  const handleToggleStep = (taskId: string, stepId: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;

      const newBreakdown = t.breakdown.map((s) => {
        if (s.id !== stepId) return s;
        return { ...s, completed: !s.completed };
      });

      // Check if all steps of this task are now completed
      const allCompleted = newBreakdown.every((s) => s.completed);

      return {
        ...t,
        breakdown: newBreakdown,
        completed: allCompleted,
      };
    });

    saveTasksToStorage(updated);

    // Sync current active focus refs if completed from checklist
    if (activeFocusStep?.id === stepId) {
      setActiveFocusStep(null);
      setActiveFocusTask(null);
    }
  };

  // Trigger Step complete directly inside Pomodoro Focus Timer Widget
  const handleFocusTimerStepComplete = (taskId: string, stepId: string) => {
    handleToggleStep(taskId, stepId);
    
    // Auto disconnect focus state
    setActiveFocusStep(null);
    setActiveFocusTask(null);
  };

  // Set selected task and step values to activate Pomodoro focus widget
  const handleInitiateFocus = (task: Task, step: TaskStep) => {
    setActiveFocusTask(task);
    setActiveFocusStep(step);
    setIsFocusWidgetHidden(false);
    
    // Smooth scroll focus container into view on mobile
    const elem = document.getElementById("active-focus-container");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Speak coach prompt text aloud
  const handleSpeakCoachText = async (phrase: string) => {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase.replace(/[*#_`]/g, ""));
      utter.rate = 1.02;
      window.speechSynthesis.speak(utter);
    } catch (_) {
      console.warn("Local speech synthesis failed.");
    }
  };

  // Map task step schedule commit time slot block
  const handleScheduleStep = (taskId: string, stepId: string, timeSlot: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const updatedBreakdown = t.breakdown.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          scheduleBlock: {
            timeSlot,
            date: new Date().toISOString().split("T")[0],
          }
        };
      });
      return {
        ...t,
        breakdown: updatedBreakdown,
      };
    });
    saveTasksToStorage(updated);
  };

  // Remove task step schedule block
  const handleClearSchedule = (taskId: string, stepId: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const updatedBreakdown = t.breakdown.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          scheduleBlock: null
        };
      });
      return {
        ...t,
        breakdown: updatedBreakdown,
      };
    });
    saveTasksToStorage(updated);
  };

  // Find currently selected task object
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans selection:bg-indigo-150 selection:text-indigo-900 pb-12 antialiased transition-colors duration-300">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 shadow-inner flex items-center justify-center gap-2 transition-all">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span>You are currently offline. AI Coach features are temporarily unavailable, but your local tasks, backup options, and focus sessions remain fully functional.</span>
        </div>
      )}

      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Sidebar toggle menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl transition-all cursor-pointer mr-1 flex items-center justify-center"
              title="Open Backup & Workspace Panel"
              id="open-sidebar-trigger"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-5.5 h-5.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase font-mono">
                  Calm Velocity
                </h1>
                <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full">
                  v1.2 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-0.5">
                Proactive AI Executive Function Companion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4.5">
            <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-full">
              <button
                onClick={() => setActiveControlTab("plans")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeControlTab === "plans" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Rescue Hub
              </button>
              <button
                onClick={() => setActiveControlTab("drills")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeControlTab === "drills" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Inertia Drills
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono uppercase">
                  {isOnline ? "COACH ONLINE" : "COACH OFFLINE"}
                </span>
              </div>

              {/* Dark mode toggle */}
              <button
                id="theme-toggle"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent dark:border-slate-800/80"
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-only visual tabs row */}
      <div className="sm:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-4 sticky top-[72px] z-20 justify-center transition-colors">
        <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-full w-full max-w-sm justify-between">
          <button
            onClick={() => setActiveControlTab("plans")}
            className={`flex-1 text-center py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeControlTab === "plans" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Rescue Plans
          </button>
          <button
            onClick={() => setActiveControlTab("drills")}
            className={`flex-1 text-center py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeControlTab === "drills" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Inertia Drills
          </button>
        </div>
      </div>

      {/* 2. Main Dual Panel Split Layout Console */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7-COLUMN PANEL: The Active planning workspace */}
          <div className="lg:col-span-7 space-y-6">
            
            <AnimatePresence mode="wait">
              {activeControlTab === "plans" ? (
                <motion.div
                  key="plans-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* The core workspace: Add AI task form + list of active tasks */}
                  <RescueDashboard
                    tasks={tasks}
                    onSelectTask={handleSelectTask}
                    selectedTaskId={selectedTaskId}
                    onAddTask={handleAddTask}
                    onPreseedRestore={restoreSamplePreseeds}
                    onDeleteTask={handleDeleteTask}
                  />

                  {/* Commitment Timeboxing hour-by-hour calendar schedule */}
                  <CalendarTimebox
                    tasks={tasks}
                    onScheduleStep={handleScheduleStep}
                    onClearSchedule={handleClearSchedule}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="drills-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Cognitive Bias Drills Panel */}
                  <CognitiveBusters />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT 5-COLUMN PANEL: Active Execution Center console */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* a) Active Focus Timer widget, displayed conditionally if active step focus triggers */}
            <AnimatePresence>
              {activeFocusStep && (
                <motion.div
                  id="active-focus-container"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="scroll-mt-24 space-y-4"
                >
                  {/* Replacer when hidden */}
                  {isFocusWidgetHidden && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-800 dark:text-slate-100 shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Focus active: <span className="font-mono text-indigo-600 dark:text-indigo-400">{activeFocusStep.step}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Timer is still counting down in the background
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsFocusWidgetHidden(false)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer border-none"
                          id="show-widget-btn"
                        >
                          Show Widget
                        </button>
                        <button
                          onClick={() => {
                            setIsFocusWidgetHidden(false);
                            setActiveFocusStep(null);
                            setActiveFocusTask(null);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer border-none"
                          id="hidden-stop-timer-btn"
                        >
                          Stop Timer
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Keep SprintFocusTimer mounted but hide with display: none to prevent state loss */}
                  <div className={isFocusWidgetHidden ? "hidden" : "block"}>
                    <SprintFocusTimer
                      task={activeFocusTask}
                      step={activeFocusStep}
                      onStepComplete={handleFocusTimerStepComplete}
                      onHide={() => setIsFocusWidgetHidden(true)}
                      onStop={() => {
                        setActiveFocusStep(null);
                        setActiveFocusTask(null);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* b) Selected Task Checklist analysis Details panel */}
            <div className="h-full">
              <TaskRescuePane
                task={selectedTask}
                onToggleStep={handleToggleStep}
                onInitiateFocus={handleInitiateFocus}
                onSpeakText={handleSpeakCoachText}
                onAddCustomStep={handleAddCustomStep}
              />
            </div>

            {/* c) Assistant chatbot coach for mental workarounds */}
            <div className="relative">
              <SmartCoachChat 
                currentTask={selectedTask}
              />
            </div>

          </div>

        </div>
      </main>

      {/* Settings / Backup Sidebar Drawer */}
      <SidebarSettings
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tasks={tasks}
        onRestoreTasks={(restoredTasks) => {
          saveTasksToStorage(restoredTasks);
          if (restoredTasks.length > 0) {
            setSelectedTaskId(restoredTasks[0].id);
          } else {
            setSelectedTaskId(null);
          }
        }}
        onRestorePreseeds={restoreSamplePreseeds}
      />
    </div>
  );
}
