/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Plus, CheckCircle, Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, TaskStep } from "../types";

interface SprintFocusTimerProps {
  task: Task | null;
  step: TaskStep | null;
  onStepComplete: (taskId: string, stepId: string) => void;
  onHide?: () => void;
  onStop?: () => void;
  onTimerNotification?: (type: "5_mins_remaining" | "ended", taskTitle: string, stepTitle: string) => void;
}

export default function SprintFocusTimer({
  task,
  step,
  onStepComplete,
  onHide,
  onStop,
  onTimerNotification,
}: SprintFocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // Default 25m
  const [duration, setDuration] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientActive, setAmbientActive] = useState<boolean>(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [hasFiredFiveMinEnd, setHasFiredFiveMinEnd] = useState<boolean>(false);

  // Audio nodes refs for binaural alpha waves
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);
  const pannerLRef = useRef<StereoPannerNode | null>(null);
  const pannerRRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Sync state if step changes
  useEffect(() => {
    if (step) {
      const initialMinutes = step.durationMinutes || 25;
      const initialSeconds = initialMinutes * 60;
      setTimeLeft(initialSeconds);
      setDuration(initialSeconds);
      setIsRunning(false);
      setHasFiredFiveMinEnd(false);
    }
  }, [step]);

  // Main countdown hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          // Trigger 5-minute remaining timer notification
          if (next === 300 && !hasFiredFiveMinEnd) {
            setHasFiredFiveMinEnd(true);
            onTimerNotification?.("5_mins_remaining", task?.title || "", step?.step || "");
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      triggerSuccessAlarm();
      onTimerNotification?.("ended", task?.title || "", step?.step || "");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, hasFiredFiveMinEnd, task, step, onTimerNotification]);

  // Handle ambient Binaural beats synthesis (Alpha Waves at 10Hz difference)
  useEffect(() => {
    if (ambientActive) {
      startAmbientAudio();
    } else {
      stopAmbientAudio();
    }
    return () => {
      stopAmbientAudio();
    };
  }, [ambientActive]);

  // Start sound generator
  const startAmbientAudio = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        setSoundError("Web Audio API not supported in this frame.");
        return;
      }

      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      // Master Gain for safe, soft volume
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.06, audioCtx.currentTime); // very quiet hum
      masterGain.connect(audioCtx.destination);
      gainNodeRef.current = masterGain;

      // Left Channel - 150 Hz
      const oscL = audioCtx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.setValueAtTime(150, audioCtx.currentTime);
      
      const pannerL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      if (pannerL) {
        pannerL.pan.setValueAtTime(-1, audioCtx.currentTime);
        oscL.connect(pannerL);
        pannerL.connect(masterGain);
        pannerLRef.current = pannerL;
      } else {
        oscL.connect(masterGain);
      }
      oscLRef.current = oscL;

      // Right Channel - 160 Hz (Creating a 10 Hz Alpha beat)
      const oscR = audioCtx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(160, audioCtx.currentTime);

      const pannerR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      if (pannerR) {
        pannerR.pan.setValueAtTime(1, audioCtx.currentTime);
        oscR.connect(pannerR);
        pannerR.connect(masterGain);
        pannerRRef.current = pannerR;
      } else {
        oscR.connect(masterGain);
      }
      oscRRef.current = oscR;

      // Start oscillators
      oscL.start();
      oscR.start();
      
      setSoundError(null);
    } catch (e: any) {
      console.error("Audio Synthesis error", e);
      setSoundError("Could not initialize audio synth.");
      setAmbientActive(false);
    }
  };

  const stopAmbientAudio = () => {
    try {
      if (oscLRef.current) { oscLRef.current.stop(); oscLRef.current.disconnect(); oscLRef.current = null; }
      if (oscRRef.current) { oscRRef.current.stop(); oscRRef.current.disconnect(); oscRRef.current = null; }
      if (pannerLRef.current) { pannerLRef.current.disconnect(); pannerLRef.current = null; }
      if (pannerRRef.current) { pannerRRef.current.disconnect(); pannerRRef.current = null; }
      if (gainNodeRef.current) { gainNodeRef.current.disconnect(); gainNodeRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    } catch (e) {
      console.warn("Audio cleanup error", e);
    }
  };

  // Play a beautiful celestial chime on completion
  const triggerSuccessAlarm = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play major triad chord arpeggio
      playTone(523.25, 0, 1.2); // C5
      playTone(659.25, 0.15, 1.2); // E5
      playTone(783.99, 0.3, 1.5); // G5
      playTone(1046.5, 0.45, 2.0); // C6

      // Show particles
      generateSuccessParticles();
    } catch (e) {
      console.warn(e);
    }
  };

  const generateSuccessParticles = () => {
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  // Helper displays
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  
  // Progress calculations
  const progressRatio = timeLeft / duration;
  const circum = 2 * Math.PI * 90; // r=90

  const handleAdd5 = () => {
    setTimeLeft((prev) => prev + 5 * 60);
    setDuration((prev) => prev + 5 * 60);
  };

  const handleStepCompleteClick = () => {
    if (task && step) {
      triggerSuccessAlarm();
      onStepComplete(task.id, step.id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center">
      
      {/* Background radial soft light */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 dark:opacity-30" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-3xl opacity-60 dark:opacity-30" />

      {/* Hide Widget Button (MUST be button:nth-of-type(1) inside card) */}
      {onHide && (
        <button 
          onClick={onHide} 
          className="absolute top-4 right-4 text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-750"
          id="hide-widget-btn"
        >
          Hide Widget
        </button>
      )}

      {/* Stop Timer Button */}
      {onStop && (
        <button
          onClick={onStop}
          className="absolute top-4 left-4 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-350 transition-colors cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100/50 dark:border-rose-900/20"
          id="stop-timer-btn"
        >
          Stop Timer
        </button>
      )}

      <div className="text-center mt-2 max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2 animate-pulse">
          <Sparkles className="w-3 h-3" /> Focus Sprint Active
        </div>
        <h3 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight truncate max-w-[280px]">
          {step ? step.step : "General Focus Session"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
          {task ? task.title : "Calm Velocity"}
        </p>
      </div>

      {/* Circular Timer Visual Wrapper */}
      <div className="relative my-8 flex items-center justify-center">
        
        {/* Particle Canvas */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-md"
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.5, x: p.x, y: p.y }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </div>

        <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
            strokeWidth="11"
          />
          {/* Active progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            className="stroke-emerald-500 fill-none"
            strokeWidth="11"
            strokeDasharray={circum}
            animate={{ strokeDashoffset: circum * (1 - progressRatio) }}
            transition={{ duration: 0.5, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Time Text Center overlay */}
        <div className="absolute flex flex-col items-center">
          <motion.span 
            className="text-4xl font-black font-mono tracking-tighter text-slate-800 dark:text-white"
            key={formattedTime}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            {formattedTime}
          </motion.span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mt-1">
            {isRunning ? "DO NOT STOP" : "READY TO START"}
          </span>
        </div>
      </div>

      {/* Synthesizer & Control panel */}
      <div className="w-full flex flex-col items-center gap-4">
        
        {/* Toggle ambient sounds */}
        <div className="flex flex-col items-center w-full px-4">
          <button
            onClick={() => setAmbientActive(!ambientActive)}
            className={`w-full max-w-xs flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all border-none ${
              ambientActive
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {ambientActive ? (
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                </div>
              ) : (
                <VolumeX className="w-4 h-4 text-slate-450 dark:text-slate-400" />
              )}
              <span>Binaural Alpha-Waves 10Hz</span>
            </div>
            {ambientActive ? (
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-450" />
            ) : (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450">OFF</span>
            )}
          </button>
          {soundError && (
            <div className="flex items-center gap-1 text-[10px] text-rose-500 mt-1">
              <AlertCircle className="w-3 h-3" /> {soundError}
            </div>
          )}
        </div>

        {/* Action Controls Button Row */}
        <div className="flex items-center justify-center gap-3">
          {/* Pause/Play */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRunning(!isRunning)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md cursor-pointer text-white font-bold transition-all border-none ${
              isRunning 
                ? "bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600" 
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none"
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </motion.button>

          {/* Add 5m */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd5}
            title="Add 5 Minutes"
            className="w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
          >
            <Plus className="w-5 h-5" />
          </motion.button>

          {/* Reset */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(duration);
              setHasFiredFiveMinEnd(false);
            }}
            title="Reset Timer"
            className="w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Immediate completion trigger */}
        {step && (
          <button
            onClick={handleStepCompleteClick}
            className="w-full max-w-xs mt-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold cursor-pointer transition-all hover:shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2 border-none"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Mark Step Complete</span>
          </button>
        )}
      </div>
    </div>
  );
}
