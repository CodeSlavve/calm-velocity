/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Bell, Clock, X, Play, CheckCircle, Sparkles, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ToastNotification, Task, TaskStep } from "../types";

export function playNotificationSound(type: "reminder" | "success" | "ended") {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    
    if (type === "reminder") {
      // Elegant soft double chime (A5 then C#6)
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(880, 0, 0.4); 
      playTone(1109.73, 0.12, 0.5); 
    } else if (type === "ended") {
      // Warning double beat
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
      playTone(523.25, 0, 0.5); 
      playTone(523.25, 0.15, 0.5); 
    } else if (type === "success") {
      // Major triad ascending chord
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(523.25, 0, 1.0); 
      playTone(659.25, 0.12, 1.0); 
      playTone(783.99, 0.24, 1.2); 
    }
  } catch (e) {
    console.warn("Audio synthesis failed:", e);
  }
}

interface NotificationToastProps {
  key?: React.Key;
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  onStartFocus?: (task: Task, step: TaskStep) => void;
}

export function NotificationToast({
  notification,
  onDismiss,
  onStartFocus,
}: NotificationToastProps) {
  const { id, type, title, message, task, step } = notification;

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 15000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const getStyle = () => {
    switch (type) {
      case "scheduled_5min":
        return {
          border: "border-indigo-200 dark:border-indigo-900/60",
          bg: "bg-white dark:bg-slate-900",
          glow: "shadow-indigo-100 dark:shadow-none",
          icon: <Clock className="w-5 h-5 text-indigo-500" />,
          accent: "indigo",
        };
      case "scheduled_now":
        return {
          border: "border-amber-300 dark:border-amber-900/60",
          bg: "bg-white dark:bg-slate-900",
          glow: "shadow-amber-100 dark:shadow-none",
          icon: <Bell className="w-5 h-5 text-amber-500 animate-bounce" />,
          accent: "amber",
        };
      case "timer_5min":
        return {
          border: "border-indigo-200 dark:border-indigo-900/60",
          bg: "bg-white dark:bg-slate-900",
          glow: "shadow-indigo-100 dark:shadow-none",
          icon: <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />,
          accent: "indigo",
        };
      case "timer_ended":
        return {
          border: "border-rose-300 dark:border-rose-900/60",
          bg: "bg-rose-50/90 dark:bg-slate-900",
          glow: "shadow-rose-100 dark:shadow-none",
          icon: <CheckCircle className="w-5 h-5 text-rose-500 animate-ping" />,
          accent: "rose",
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`w-full max-w-sm rounded-2xl border ${style.border} ${style.bg} p-4 shadow-xl ${style.glow} flex gap-3 relative.overflow-hidden pointer-events-auto`}
      id={`toast-notification-${id}`}
    >
      {/* Visual Accent Side bar indicator */}
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl ${
        style.accent === "indigo" ? "bg-indigo-500" : 
        style.accent === "amber" ? "bg-amber-500" : "bg-rose-500"
      }`} />

      {/* Icon */}
      <div className="shrink-0 pt-0.5 ml-1.5">
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">
          {message}
        </p>

        {/* Dynamic task attachments */}
        {task && step && (
          <div className="mt-2.5 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[10px] space-y-0.5">
            <div className="font-extrabold text-slate-700 dark:text-slate-300 truncate">
              Task: {task.title}
            </div>
            <div className="font-bold text-slate-400 dark:text-slate-500 truncate">
              Step: {step.step} ({step.durationMinutes}m)
            </div>
          </div>
        )}

        {/* Action Button Row */}
        <div className="mt-3 flex items-center gap-2">
          {task && step && onStartFocus && (
            <button
              onClick={() => {
                onStartFocus(task, step);
                onDismiss(id);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 border-none"
              id={`toast-action-focus-${id}`}
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Start Sprint Now</span>
            </button>
          )}

          <button
            onClick={() => onDismiss(id)}
            className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-[10px] rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            id={`toast-action-dismiss-${id}`}
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Close cross top right */}
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
        id={`toast-close-btn-${id}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onStartFocus?: (task: Task, step: TaskStep) => void;
  permissionStatus: NotificationPermission;
  onRequestPermission: () => void;
}

export function ToastContainer({
  notifications,
  onDismiss,
  onStartFocus,
  permissionStatus,
  onRequestPermission,
}: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
      
      {/* Toast List */}
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onDismiss={onDismiss}
            onStartFocus={onStartFocus}
          />
        ))}
      </AnimatePresence>

      {/* Permission helper block if not granted */}
      {permissionStatus === "default" && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-lg pointer-events-auto flex items-center justify-between gap-3 text-[10px] font-bold"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Enable standard Desktop Notifications?</span>
          </div>
          <button
            onClick={onRequestPermission}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] rounded transition-all cursor-pointer border-none"
            id="toast-request-permission-btn"
          >
            Allow
          </button>
        </motion.div>
      )}
    </div>
  );
}
