/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TaskStep {
  id: string;
  step: string;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  tip: string;
  completed: boolean;
  scheduleBlock?: ScheduleBlock | null;
}

export interface ScheduleBlock {
  timeSlot: string; // "09:00", "10:00", etc.
  date: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string or simple date
  createdAt: string;
  priority: "extreme_panic" | "high" | "medium" | "low";
  panicIndex: number; // 0 - 100
  percentageJustification: string;
  breakdown: TaskStep[];
  procrastinationBuster: string;
  firstStepAccelerator: string;
  estimatedTotalHours: number;
  completed: boolean;
}

export interface FocusSession {
  isActive: boolean;
  taskId: string | null;
  stepId: string | null;
  timeLeft: number;
  duration: number;
  isPaused: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
}

export interface ToastNotification {
  id: string;
  type: "scheduled_5min" | "scheduled_now" | "timer_5min" | "timer_ended";
  title: string;
  message: string;
  task?: Task;
  step?: TaskStep;
  createdAt: number;
}

