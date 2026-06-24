/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Brain, Sparkles, Zap, ShieldAlert, ArrowRight, Hourglass, Play, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BiasDetail {
  id: string;
  name: string;
  problem: string;
  cure: string;
  drillTitle: string;
  drillDescription: string;
}

const COGNITIVE_BIASES: BiasDetail[] = [
  {
    id: "present-bias",
    name: "Present Bias (Myopic Focus)",
    problem: "The brain values immediate comfort (avoiding dry steps) over the future reward of completion.",
    cure: "Make the barrier of starting so absurdly low that avoiding it feels silly. Break it into 60-second chunks.",
    drillTitle: "The 2-Minute Draft Smasher",
    drillDescription: "Open the closest document and write literally ANY nonsense lines for 120 seconds. Make it intentionally bad just to break the blank page freeze."
  },
  {
    id: "planning-fallacy",
    name: "Planning Fallacy Exception",
    problem: "We assume starting 'later' is better because we optimism-bias that future self has limitless energy and focus.",
    cure: "Assume your future self is 50% slower and twice as tired. Schedule blocks of work with 2x time safety values.",
    drillTitle: "Future Self Contract Commitment",
    drillDescription: "Pick one step. Double its estimated duration in your mind. Write it down. Close other tabs and commit to just doing 1 line right now."
  },
  {
    id: "perfectionism",
    name: "Perfectionism Overwhelms",
    problem: "Fear of doing a mediocre job makes you avoid starting entirely. If you don't start, you can't fail.",
    cure: "Permit yourself to write 'Crap Drafts'. Your first iteration exists purely to be refined, not to be gold.",
    drillTitle: "The intentionally awful first draft ",
    drillDescription: "Spend 2 minutes outline a template that look ridiculous. Write jokes, placeholder text (e.g., 'put cool stuff here') to cross the starting line."
  },
  {
    id: "task-paralysis",
    name: "Hyper-Focus / Task Paralysis",
    problem: "When there are 10 things due, the brain panics, locks down with cortisol, and plays video games instead.",
    cure: "Aggressively hide 9 tasks. Flip a physical coin or choose the smallest one. Act as if the others don't exist.",
    drillTitle: "The 1-Task Blindfold Run",
    drillDescription: "Pick the absolute top step from the Rescue Pane. Block out everything else. Focus purely on completing that 1 step. Start now!"
  }
];

export default function CognitiveBusters() {
  const [selectedBias, setSelectedBias] = useState<BiasDetail | null>(null);
  const [drillActive, setDrillActive] = useState<boolean>(false);
  const [drillTimeLeft, setDrillTimeLeft] = useState<number>(120);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (drillActive && drillTimeLeft > 0) {
      interval = setInterval(() => {
        setDrillTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (drillTimeLeft === 0 && drillActive) {
      setDrillActive(false);
      // Play a small sound effects
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        }
      } catch (_) {}
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [drillActive, drillTimeLeft]);

  const handleStartDrill = (bias: BiasDetail) => {
    setSelectedBias(bias);
    setDrillTimeLeft(120);
    setDrillActive(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
      
      {/* Decorative brain glow */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-3xl opacity-60" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Brain className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Procrastination Busters</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Deconstruct why you are avoiding the task</p>
          </div>
        </div>
        <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
        We procrastinate due to <strong>emotional friction</strong>, not laziness. Tap the bias you are experiencing right now to initiate a specialized speed-commitment warmup drill:
      </p>

      {/* Grid of cognitive biases cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COGNITIVE_BIASES.map((bias) => (
          <div
            key={bias.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-extrabold text-sm mb-1.5">
                {bias.id === "present-bias" && <Hourglass className="w-4 h-4 text-indigo-500 shrink-0" />}
                {bias.id === "planning-fallacy" && <Zap className="w-4 h-4 text-indigo-500 shrink-0" />}
                {bias.id === "perfectionism" && <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />}
                {bias.id === "task-paralysis" && <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />}
                <span>{bias.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mb-1.5">
                <strong>The Trap:</strong> {bias.problem}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-xl border border-emerald-100/50 dark:border-emerald-900/40 leading-relaxed mb-4">
                <strong>The Cure:</strong> {bias.cure}
              </p>
            </div>

            <button
              onClick={() => handleStartDrill(bias)}
              className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm dark:shadow-none shadow-indigo-100"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Initiate Warmup Drill</span>
            </button>
          </div>
        ))}
      </div>

      {/* Full-Screen micro drill overlay */}
      <AnimatePresence>
        {drillActive && selectedBias && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 z-20 p-6 flex flex-col justify-center items-center text-center"
          >
            <div className="max-w-md space-y-4">
              <div className="w-14 h-14 bg-indigo-900 rounded-full flex items-center justify-center text-indigo-400 mx-auto border border-indigo-700 animate-bounce">
                <Hourglass className="w-6 h-6 animate-spin" />
              </div>
              
              <div className="text-amber-400 tracking-wider text-[11px] font-black uppercase flex items-center gap-1 justify-center">
                <Sparkles className="w-3.5 h-3.5" /> High Energy Momentum Drill
              </div>
              
              <h4 className="text-white font-black text-xl tracking-tight">
                {selectedBias.drillTitle}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-slate-900 p-4 border border-slate-800 rounded-2xl">
                {selectedBias.drillDescription}
              </p>

              {/* Timer display */}
              <div className="text-slate-400 font-black font-mono text-4xl tracking-tight my-4">
                {Math.floor(drillTimeLeft / 60)}:{(drillTimeLeft % 60).toString().padStart(2, "0")}
              </div>

              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest animate-pulse">
                DO NOT switch browser tabs. Just begin typing random notes immediately!
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setDrillActive(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Terminate Drill
                </button>
                <button
                  onClick={() => setDrillTimeLeft(120)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restart
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
