/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { Sparkles, Calendar, AlertTriangle, ArrowRight, Loader2, Play, Flame, CheckCircle, Plus, Info, Database, Download, Trash2, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, TaskStep } from "../types";

interface RescueDashboardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  selectedTaskId: string | null;
  onAddTask: (task: Task) => void;
  onPreseedRestore: () => void;
  onDeleteTask: (taskId: string) => void;
}

const MOTIVATIONAL_PHRASES = [
  "Slicing dry goals into low-friction steps...",
  "Calibrating your amygdala for focus...",
  "Neutralizing present bias. Preparing momentum...",
  "Rejecting perfectionism. Setting up a 'crap draft' environment...",
  "Tuning binaural beats. Just breathe, we've got you..."
];

export default function RescueDashboard({
  tasks,
  onSelectTask,
  selectedTaskId,
  onAddTask,
  onPreseedRestore,
  onDeleteTask,
}: RescueDashboardProps) {
  // AI Smasher state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [focusStyle, setFocusStyle] = useState<"balanced" | "structured-blocks" | "baby-steps" | "panic-sprints">("balanced");
  const [isLoading, setIsLoading] = useState(false);
  const [loaderText, setLoaderText] = useState(MOTIVATIONAL_PHRASES[0]);

  // Filters state
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<"panic" | "deadline" | "newest">("panic");

  // Rotating loader text
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isLoading) {
      let index = 0;
      t = setInterval(() => {
        index = (index + 1) % MOTIVATIONAL_PHRASES.length;
        setLoaderText(MOTIVATIONAL_PHRASES[index]);
      }, 3000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isLoading]);

  // Handle AI Breakdown Submission
  const handleAISmashSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze-task", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          deadline: taskDeadline,
          focusPreference: focusStyle,
        }),
      });

      if (!response.ok) throw new Error("Decompose request issue");
      const data = await response.json();

      // Transform raw breakdown to include step IDs and completed key
      const formattedBreakdown: TaskStep[] = data.breakdown.map((item: any, i: number) => ({
        id: `step-${Date.now()}-${i}`,
        step: item.step,
        durationMinutes: Number(item.durationMinutes) || 20,
        difficulty: item.difficulty || "medium",
        tip: item.tip || "Focus on this micro step.",
        completed: false,
      }));

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        description: taskDesc,
        deadline: taskDeadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        priority: data.priority || "medium",
        panicIndex: Number(data.panicIndex) || 50,
        percentageJustification: data.percentageJustification || "Custom priority calculated by AI.",
        firstStepAccelerator: data.firstStepAccelerator || "Just open a blank sheet and name it.",
        procrastinationBuster: data.procrastinationBuster || "Start for just 2 minutes and see how it goes.",
        estimatedTotalHours: Number(data.estimatedTotalHours) || 2.0,
        breakdown: formattedBreakdown,
        completed: false,
      };

      onAddTask(newTask);
      onSelectTask(newTask);

      // Reset fields
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  
  const avgPanic = activeTasks.length > 0 
    ? Math.round(activeTasks.reduce((sum, t) => sum + t.panicIndex, 0) / activeTasks.length)
    : 0;

  // Render color based on panic index
  const getPanicMeterColor = (val: number) => {
    if (val >= 80) return "bg-rose-500 shadow-rose-200";
    if (val >= 50) return "bg-amber-500 shadow-amber-200";
    return "bg-emerald-500 shadow-emerald-200";
  };

  // Process sorting & filtering
  const processedTasks = tasks
    .filter((t) => showCompleted || !t.completed)
    .sort((a, b) => {
      if (sortBy === "panic") return b.panicIndex - a.panicIndex;
      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Export current list configuration as backup json
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `CalmVelocity_Backup_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6">
      
      {/* AI Smasher Decomposition Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-2 right-2 text-indigo-100 dark:text-indigo-950/20">
          <Sparkles className="w-16 h-16 animate-pulse" />
        </div>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5.5 h-5.5 fill-indigo-100 dark:fill-indigo-950/30" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">The AI Plan Smasher</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">Enter an overwhelming deadline to convert it into a step-by-step checklist</p>
          </div>
        </div>

        <form onSubmit={handleAISmashSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Title input */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                What are you postponing or avoiding? *
              </label>
              <input
                id="task-title-input"
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Pitch deck, tax returns, presentation"
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Deadline selection */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                When is it Critical due?
              </label>
              <input
                type="datetime-local"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 align-top">
            {/* Description textarea */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                Provide brief context or instructions (Optional)
              </label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={2}
                placeholder="e.g. Needs a 5-minute slide deck with a system map."
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
              />
            </div>

            {/* Focus Style */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                How should AI build the checklist?
              </label>
              <select
                value={focusStyle}
                onChange={(e) => setFocusStyle(e.target.value as any)}
                className="w-full text-xs font-bold text-slate-600 dark:text-slate-300 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all cursor-pointer focus:bg-white dark:focus:bg-slate-900"
              >
                <option value="balanced" className="dark:bg-slate-900">Standard Balanced (3-5 core steps)</option>
                <option value="baby-steps" className="dark:bg-slate-900">Micro Baby Steps (Low mental threshold)</option>
                <option value="panic-sprints" className="dark:bg-slate-900">Panic Sprints (Short high-intensity blocks)</option>
                <option value="structured-blocks" className="dark:bg-slate-900">Time-Efficient Blocks (For tight schedules)</option>
              </select>
            </div>
          </div>

          {/* Submit action panel */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span className="text-xs">{loaderText}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs">Decompose & Prioritize Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Task List Kanban Grid Panel */}
      <div className="space-y-4">
        
        {/* Filter controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSortBy("panic")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sortBy === "panic"
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md dark:shadow-none"
                  : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              }`}
            >
              Sort by Panic
            </button>
            <button
              onClick={() => setSortBy("deadline")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sortBy === "deadline"
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md dark:shadow-none"
                  : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              }`}
            >
              Sort by Deadline
            </button>
            <button
              onClick={() => setSortBy("newest")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sortBy === "newest"
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md dark:shadow-none"
                  : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              }`}
            >
              Newest Added
            </button>
          </div>

          <div className="flex items-center gap-3.5 justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
              <span>Include Completed Tasks</span>
            </label>

            {/* Seed Restore Button and Export */}
            <div className="flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-3">
              <button
                onClick={handleExportJSON}
                title="Download local JSON backup"
                className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onPreseedRestore}
                title="Restore default sample tasks"
                className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Task cards columns */}
        {processedTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl h-64 flex flex-col items-center justify-center shadow-sm">
            <h4 className="text-slate-700 dark:text-slate-200 font-extrabold text-sm">No Task Found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              Add or analyze a custom overwhelming deadline, or click the database recovery button in the filter rail to restore default sample tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {processedTasks.map((t) => {
              const isSelected = selectedTaskId === t.id;
              const pendingStepsCount = t.breakdown.filter((s) => !s.completed).length;
              
              // Handle relative displays for deadline text
              const dlDate = new Date(t.deadline);
              const now = new Date();
              const hoursLeft = Math.round((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              let relativeText = "";
              if (hoursLeft < 0) {
                relativeText = "Deadline passed";
              } else if (hoursLeft === 0) {
                relativeText = "Due in under an hour!";
              } else if (hoursLeft < 24) {
                relativeText = `Due in ${hoursLeft} hours`;
              } else {
                relativeText = `Due in ${Math.round(hoursLeft / 24)} days`;
              }

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                    isSelected
                      ? "bg-slate-50 dark:bg-slate-950 border-slate-900 dark:border-slate-100 shadow-md ring-1 ring-slate-900 dark:ring-slate-100"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        t.completed ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40"
                      }`}>
                        {t.completed ? "Smashed Complete" : "Rescue Active"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                        Est: {t.estimatedTotalHours}h
                      </span>
                      {t.breakdown.some(s => s.scheduleBlock) && (
                        <span className="text-[9px] bg-slate-900 dark:bg-slate-800 text-slate-200 dark:text-slate-100 border border-slate-800 dark:border-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                          Scheduled: {t.breakdown.filter(s => s.scheduleBlock).map(s => s.scheduleBlock?.timeSlot).join(", ")}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-extrabold leading-snug truncate ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}>
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-semibold mt-1">
                      {t.description || "No context provided."}
                    </p>
                  </div>

                  {/* Right hand gauges */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap justify-between border-t md:border-t-0 border-slate-50 dark:border-slate-800 pt-2.5 md:pt-0">
                    <div className="text-left md:text-right shrink-0">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 block">Relative Time</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{relativeText}</span>
                    </div>

                    {/* Pending checklists */}
                    <div className="shrink-0 flex flex-col justify-center text-left md:text-right">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 block">Pending steps</span>
                      <span className={`text-xs font-black font-mono ${pendingStepsCount > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {pendingStepsCount} steps left
                      </span>
                    </div>

                    {/* Panic indexes Indicator */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getPanicMeterColor(t.panicIndex)}`}
                          style={{ width: `${t.panicIndex}%` }}
                        />
                      </div>
                      <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-200 w-8">
                        {t.panicIndex}%
                      </span>
                    </div>

                    {/* Delete Task Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${t.title}"?`)) {
                          onDeleteTask(t.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer ml-1 shrink-0 flex items-center justify-center"
                      title="Delete Task"
                      id={`delete-task-${t.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
