/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { CheckCircle2, Circle, AlertTriangle, Play, Sparkles, Volume2, HelpCircle, Flame, Plus, Check } from "lucide-react";
import { Task, TaskStep } from "../types";

interface TaskRescuePaneProps {
  task: Task | null;
  onToggleStep: (taskId: string, stepId: string) => void;
  onInitiateFocus: (task: Task, step: TaskStep) => void;
  onSpeakText: (text: string) => void;
  onAddCustomStep: (taskId: string, stepTitle: string, duration: number, difficulty: "easy" | "medium" | "hard", tip: string) => void;
}

export default function TaskRescuePane({
  task,
  onToggleStep,
  onInitiateFocus,
  onSpeakText,
  onAddCustomStep,
}: TaskRescuePaneProps) {
  const [showAddStep, setShowAddStep] = useState<boolean>(false);
  const [newStepTitle, setNewStepTitle] = useState<string>("");
  const [newStepDuration, setNewStepDuration] = useState<number>(20);
  const [newStepDifficulty, setNewStepDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [newStepTip, setNewStepTip] = useState<string>("");

  if (!task) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800/80 shadow-xl flex flex-col justify-center items-center text-center h-[540px]">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4 animate-pulse">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-slate-700 dark:text-slate-200 font-extrabold text-base tracking-tight">No Task Selected</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium max-w-xs mt-1">
          Select an active rescue target from the list, or generate a brand new one using the AI Smasher to create a step-by-step rescue plan.
        </p>
      </div>
    );
  }

  // Calculate completed steps percentage
  const total = task.breakdown.length;
  const completed = task.breakdown.filter((s) => s.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Determine stress dial colors
  const getStressDetails = (p: number) => {
    if (p >= 85) return { color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40", label: "EXTREME CRITICAL PANIC" };
    if (p >= 70) return { color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40", label: "HIGH CRISIS MODE" };
    if (p >= 40) return { color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40", label: "MODERATE PRESSURE" };
    return { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40", label: "MANAGEABLE CALM" };
  };

  const stress = getStressDetails(task.panicIndex);

  const handleCreateStep = (e: FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    onAddCustomStep(task.id, newStepTitle, newStepDuration, newStepDifficulty, newStepTip || "Break it down and focus!");
    setNewStepTitle("");
    setNewStepTip("");
    setShowAddStep(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-colors duration-300">
      
      {/* Scrollable details container */}
      <div className="space-y-6 overflow-y-auto pr-1 scrollbar-thin flex-1 max-h-[1050px]">
        {/* Header section with Panic Gauge */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${stress.color} uppercase tracking-wider mb-2`}>
                <span>{stress.label}</span>
              </span>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                {task.title}
              </h3>
            </div>

            {/* Simulated Stress Dial Circular Gauge */}
            <div className="shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="21" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="21"
                    className={`fill-none ${
                      task.panicIndex >= 70 ? "stroke-rose-500" : task.panicIndex >= 40 ? "stroke-amber-500" : "stroke-emerald-500"
                    }`}
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 21}
                    strokeDashoffset={2 * Math.PI * 21 * (1 - task.panicIndex / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                  {task.panicIndex}%
                </span>
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Panic Gauge</span>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Deadline stress index</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl mt-4">
            <strong>Coach Note:</strong> {task.percentageJustification}
          </p>
        </div>

        {/* 1. Procrastination Accelerator */}
        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 dark:from-indigo-950/20 dark:to-indigo-950/10 border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-indigo-500/20 dark:text-indigo-500/10">
            <Sparkles className="w-20 h-20" />
          </div>

          <div className="flex items-center gap-2 mb-2 text-indigo-800 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 fill-indigo-100 dark:fill-indigo-950/30" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider">The First-Step Accelerator</h4>
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed">
            {task.firstStepAccelerator}
          </p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mt-2.5 flex items-center gap-1">
            CRUSH COGNITIVE FRICTION IN UNDER 120 SECONDS
          </p>
        </div>

        {/* 2. Motivational Procrastination Buster Block */}
        <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4.5 bg-slate-50 dark:bg-slate-950 relative">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            Cognitive Procrastination Buster
          </h4>
          <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
            {task.procrastinationBuster}
          </p>
          <button
            onClick={() => onSpeakText(task.procrastinationBuster)}
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-indigo-100/40 dark:border-indigo-900/40"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Speak Audio Inspiration</span>
          </button>
        </div>

        {/* 3. Breakdown Steps list */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Steps Checklist Breakdown
            </h4>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {completed} of {total} micro-steps done
            </span>
          </div>

          {/* Progress bar inside pane */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-3 mt-4">
            {task.breakdown.map((s, index) => (
              <div
                key={s.id}
                className={`flex gap-3.5 p-4 rounded-2xl border transition-all ${
                  s.completed
                    ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 opacity-60"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm"
                }`}
              >
                {/* Custom list tick wrapper */}
                <button
                  onClick={() => onToggleStep(task.id, s.id)}
                  className="shrink-0 mt-0.5 cursor-pointer text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {s.completed ? (
                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5.5 h-5.5 text-slate-300 dark:text-slate-700 hover:text-indigo-500" />
                  )}
                </button>

                {/* Step content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-bold leading-normal truncate ${s.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}>
                      {index + 1}. {s.step}
                    </span>
                    <span className="shrink-0 text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold font-mono">
                      {s.durationMinutes}m
                    </span>
                    <span
                      className={`shrink-0 text-[8px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded-full border ${
                        s.difficulty === "easy"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                          : s.difficulty === "medium"
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
                          : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                      }`}
                    >
                      {s.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-1">
                    <strong>Tip:</strong> {s.tip}
                  </p>
                </div>

                {/* Focus trigger icon */}
                {!s.completed && (
                  <button
                    onClick={() => onInitiateFocus(task, s)}
                    title="Initiate Focus Sprint"
                    className="shrink-0 self-center p-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all cursor-pointer shadow-sm dark:shadow-none"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Inline Add Step Panel */}
          {showAddStep ? (
            <form onSubmit={handleCreateStep} className="mt-4 p-4 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-100/30 dark:border-indigo-900/20">
                <span className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300">Add Custom Micro Step</span>
                <button
                  type="button"
                  onClick={() => setShowAddStep(false)}
                  className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Step Action</label>
                <input
                  type="text"
                  required
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="e.g. Brainstorm titles"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Time (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newStepDuration}
                    onChange={(e) => setNewStepDuration(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Difficulty</label>
                  <select
                    value={newStepDifficulty}
                    onChange={(e) => setNewStepDifficulty(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
                  >
                    <option value="easy" className="dark:bg-slate-900">Easy</option>
                    <option value="medium" className="dark:bg-slate-900">Medium</option>
                    <option value="hard" className="dark:bg-slate-900">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Action Tip</label>
                <input
                  type="text"
                  value={newStepTip}
                  onChange={(e) => setNewStepTip(e.target.value)}
                  placeholder="e.g. Open Slides, click template."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Add Step to Checklist
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddStep(true)}
              className="mt-4 w-full py-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert New Custom Checklist Step</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
