/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Plus, CalendarRange, Heart } from "lucide-react";
import { Task, TaskStep, ScheduleBlock } from "../types";

interface CalendarTimeboxProps {
  tasks: Task[];
  onScheduleStep: (taskId: string, stepId: string, timeSlot: string) => void;
  onClearSchedule: (taskId: string, stepId: string) => void;
}

const TIME_SLOTS = [
  { slot: "08:00", label: "8:00 AM", type: "buildup", desc: "Mornin' Setup: Low Energy Steps" },
  { slot: "09:00", label: "9:00 AM", type: "peak", desc: "Peak Focus: Tackle Hardest Steps" },
  { slot: "10:00", label: "10:00 AM", type: "peak", desc: "Peak Focus: High Brainpower Block" },
  { slot: "11:00", label: "11:00 AM", type: "peak", desc: "Peak Focus: Complete Key Drafts" },
  { slot: "12:00", label: "12:00 PM", type: "rest", desc: "Mid-day Recharge Buffer" },
  { slot: "13:00", label: "1:00 PM", type: "slump", desc: "Post-Lunch Slump: Keep Steps Short/Easy" },
  { slot: "14:00", label: "2:00 PM", type: "slump", desc: "Dopamine Dip: Administrative, Quick Tasks" },
  { slot: "15:00", label: "3:00 PM", type: "buildup", desc: "Second Wind: Execution & Action" },
  { slot: "16:00", label: "4:00 PM", type: "buildup", desc: "Review & Adjust Blocks" },
  { slot: "17:00", label: "5:00 PM", type: "rest", desc: "Evening Transition & Closeout" },
];

export default function CalendarTimebox({
  tasks,
  onScheduleStep,
  onClearSchedule,
}: CalendarTimeboxProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Construct flat list of uncompleted, unscheduled steps from active tasks
  const unscheduledSteps = tasks.flatMap((t) => {
    if (t.completed) return [];
    return t.breakdown
      .filter((step) => !step.completed && !step.scheduleBlock)
      .map((step) => ({
        taskId: t.id,
        taskTitle: t.title,
        stepId: step.id,
        stepTitle: step.step,
        difficulty: step.difficulty,
        panicIndex: t.panicIndex,
      }));
  });

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(selectedSlot === slot ? null : slot);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl" id="calendar-timebox-section">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarRange className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Commitment Timeboxing</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Auto-align breakdowns with cognitive peaks</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
          Today's Agenda
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
        Standard reminder notifications are easy to dismiss. Placing task steps directly onto an hour block 
        makes a psychological commitment. Select an hour slot to bind a rescue plan step:
      </p>

      {/* Hour Grid Timeline */}
      <div className="space-y-3.5">
        {TIME_SLOTS.map((t) => {
          // Find if any active step of an uncompleted task is scheduled in this slot
          let scheduledInfo = null;
          for (const task of tasks) {
            if (task.completed) continue;
            const step = task.breakdown.find(
              (s) => !s.completed && s.scheduleBlock?.timeSlot === t.slot
            );
            if (step) {
              scheduledInfo = {
                taskId: task.id,
                taskTitle: task.title,
                stepId: step.id,
                stepTitle: step.step,
                durationMinutes: step.durationMinutes,
                difficulty: step.difficulty,
              };
              break;
            }
          }

          return (
            <div key={t.slot} className="relative">
              <div
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  scheduledInfo
                    ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800"
                    : selectedSlot === t.slot
                    ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 ring-4 ring-indigo-50 dark:ring-indigo-950/20"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm"
                }`}
              >
                {/* Time slot and Energy Flag */}
                <div className="w-20 shrink-0 flex flex-col justify-center">
                  <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">{t.label}</span>
                  
                  {/* Energy recommendations badge */}
                  {t.type === "peak" && (
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/40 w-fit">
                      Peak
                    </span>
                  )}
                  {t.type === "slump" && (
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40 w-fit">
                      Dip
                    </span>
                  )}
                  {t.type === "buildup" && (
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40 w-fit">
                      Focus
                    </span>
                  )}
                </div>

                {/* Main schedule description */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  {scheduledInfo ? (
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded">
                          {scheduledInfo.taskTitle}
                        </span>
                        <span className="shrink-0 text-[9px] bg-slate-900 dark:bg-slate-950 text-slate-200 dark:text-slate-350 font-bold px-1.5 py-0.5 rounded">
                          {scheduledInfo.durationMinutes}m
                        </span>
                        <span className="shrink-0 text-[9px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase">
                          {scheduledInfo.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                        Step: {scheduledInfo.stepTitle}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 truncate">No commitment set</p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 font-semibold truncate mt-0.5">{t.desc}</p>
                    </div>
                  )}

                  {/* Actions buttons */}
                  {scheduledInfo ? (
                    <button
                      onClick={() => onClearSchedule(scheduledInfo.taskId, scheduledInfo.stepId)}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-100 dark:hover:border-rose-900/40 px-2.5 py-1 rounded-xl transition-all shrink-0 cursor-pointer"
                      id={`clear-schedule-${scheduledInfo.stepId}`}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSlotClick(t.slot)}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                        selectedSlot === t.slot
                          ? "bg-indigo-600 text-white border-indigo-600 font-extrabold"
                          : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                      id={`schedule-slot-btn-${t.slot}`}
                    >
                      <span>{selectedSlot === t.slot ? "Cancel" : "Commit"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed Schedule Dialog under current Slot */}
              {selectedSlot === t.slot && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-10 bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2 text-white">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Commit Step to {t.label} Box:
                    </span>
                    <span className="text-[11px] text-indigo-400 font-semibold">
                      {t.type === "peak" ? "Brain power highest now" : "Good for low friction"}
                    </span>
                  </div>

                  {unscheduledSteps.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center font-medium">
                      No unscheduled steps found. Create a new task breakdown or complete existing ones!
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-1.5 scrollbar-thin py-1">
                      {unscheduledSteps.map((us) => (
                        <button
                          key={`${us.taskId}-${us.stepId}`}
                          onClick={() => {
                            onScheduleStep(us.taskId, us.stepId, t.slot);
                            setSelectedSlot(null);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs flex flex-col gap-1 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-350 truncate max-w-[210px]">
                              {us.taskTitle}
                            </span>
                            <span className="text-[9px] border border-indigo-900/60 bg-indigo-950/40 px-1.5 py-0.5 rounded text-indigo-300 shrink-0 font-bold uppercase">
                              {us.difficulty}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-100 group-hover:text-white line-clamp-2">
                            {us.stepTitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
