/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from "../types";

export const SAMPLE_TASKS: Task[] = [
  {
    id: "seed-1",
    title: "Finalize Pitch Deck for Hackathon Demo",
    description: "Prepare a 5-minute presentation deck representing our team's Calm Velocity prototype, clearly outlining business problem, core solution, and tech architecture.",
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    createdAt: new Date().toISOString(),
    priority: "extreme_panic",
    panicIndex: 94,
    percentageJustification: "The pitch is in under 6 hours and there is no structured deck, creating heavy present bias friction.",
    firstStepAccelerator: "Open Google Slides, name the presentation 'Final Pitch Deck', and share it with your team members.",
    procrastinationBuster: "Confront the 'Perfectionism Trap'. Your first draft doesn't need to win. It just needs to exist. Give yourself permission to make a highly flawed 10-slide outline in the next 15 minutes.",
    estimatedTotalHours: 2.2,
    completed: false,
    breakdown: [
      {
        id: "step-1-1",
        step: "Write 1-sentence titles for each of the 10 slides",
        durationMinutes: 15,
        difficulty: "easy",
        tip: "Keep slides simple: Problem, Solution, Market, Product, Technology, Business Model, Team, Timeline, Call to Action.",
        completed: false,
        scheduleBlock: {
          timeSlot: "09:00",
          date: new Date().toISOString().split("T")[0]
        }
      },
      {
        id: "step-1-2",
        step: "Hammer out 3 core bullet points explaining the problem statement",
        durationMinutes: 20,
        difficulty: "medium",
        tip: "Focus on task paralysis: Why do people ignore standard calendar alerts? Focus on the active friction.",
        completed: false
      },
      {
        id: "step-1-3",
        step: "Design standard system architecture block diagram layout",
        durationMinutes: 35,
        difficulty: "hard",
        tip: "Keep it simple. Express server with Vite frontend, running on port 3000, calling Google Gemini. Text format first.",
        completed: false
      },
      {
        id: "step-1-4",
        step: "Structure the active demo and script voice narration",
        durationMinutes: 30,
        difficulty: "medium",
        tip: "Avoid tech-jargon. Frame the script purely around real user benefits of solving anxiety.",
        completed: false
      },
      {
        id: "step-1-5",
        step: "Review slide flow and style with cohesive dark theme",
        durationMinutes: 30,
        difficulty: "easy",
        tip: "Restrict to solid charcoal background, bold typography, and bright neon accents.",
        completed: false
      }
    ]
  },
  {
    id: "seed-2",
    title: "Review System Architecture for Technical Interview",
    description: "Re-read high-level distributed systems concepts, microservices patterns, load balancing, databases, and caching rules for the upcoming Senior Software Engineer interview.",
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
    createdAt: new Date().toISOString(),
    priority: "medium",
    panicIndex: 52,
    percentageJustification: "Deadline is 2 days out. Scope is vast, but you have foundational concepts ready.",
    firstStepAccelerator: "Write down the names of 3 caching eviction strategies (LRU, LFU, FIFO) on a piece of paper.",
    procrastinationBuster: "This is a classic 'Planning Fallacy' hazard. Do not commit to studying for 10 hours straight. Commit to reviewing cache consistency structures for exactly 20 minutes.",
    estimatedTotalHours: 3.5,
    completed: false,
    breakdown: [
      {
        id: "step-2-1",
        step: "Summarize Cache Invalidation Protocols (Write-Through vs Write-Back)",
        durationMinutes: 30,
        difficulty: "easy",
        tip: "Write a 3-bullet comparison. Write-through is consistent but slow on writes; write-back is fast but risky.",
        completed: false,
        scheduleBlock: {
          timeSlot: "11:00",
          date: new Date().toISOString().split("T")[0]
        }
      },
      {
        id: "step-2-2",
        step: "Compare SQL database shard rules vs NoSQL Document structures",
        durationMinutes: 45,
        difficulty: "medium",
        tip: "Review horizontal partitioning, replication vs clustering, and Brewer's CAP Theorem tradeoffs.",
        completed: false
      },
      {
        id: "step-2-3",
        step: "Map OAuth client authorization state workflows",
        durationMinutes: 30,
        difficulty: "medium",
        tip: "Understand authorization code grant format, PKCE protection, token renewal, and TLS security rules.",
        completed: false
      },
      {
        id: "step-2-4",
        step: "Solve 1 whiteboard scale design scenario (e.g., Shorten URL)",
        durationMinutes: 60,
        difficulty: "hard",
        tip: "Break down into API definition, database schema, scaling, and bottleneck resolution.",
        completed: false
      }
    ]
  },
  {
    id: "seed-3",
    title: "Renew Health Insurance & Urgent Bill Payments",
    description: "Critical state healthcare renewal application form must be submitted to prevent immediate coverage lapse plus internet and server monthly subscription bills.",
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    createdAt: new Date().toISOString(),
    priority: "high",
    panicIndex: 81,
    percentageJustification: "Deadline is tomorrow. Missing renewal causes immediate coverage cancellation and heavy financial penalty.",
    firstStepAccelerator: "Open the Health Account Login portal, type in your username and password, and log in.",
    procrastinationBuster: "Task paralysis is high here because governmental documents are dry and frustrating. Reward yourself with a massive dopamine treat (coffee, a break, favorite snack) immediately after logging in.",
    estimatedTotalHours: 1.5,
    completed: false,
    breakdown: [
      {
        id: "step-3-1",
        step: "Log in and find the 'Renew My Plan' button on the state website",
        durationMinutes: 15,
        difficulty: "easy",
        tip: "If you forgot your login, DO NOT procrastinate. Click 'forgot password' right away.",
        completed: false,
        scheduleBlock: {
          timeSlot: "14:00",
          date: new Date().toISOString().split("T")[0]
        }
      },
      {
        id: "step-3-2",
        step: "Verify current mailing address and tax file attachments",
        durationMinutes: 35,
        difficulty: "medium",
        tip: "Grab your tax invoice of last year. Take a photo with your phone for immediate upload.",
        completed: false
      },
      {
        id: "step-3-3",
        step: "Confirm cover plan selection and click final submit",
        durationMinutes: 20,
        difficulty: "easy",
        tip: "Pick the standard default plan. Don't waste 3 hours trying to optimize 2% coverage difference.",
        completed: false
      },
      {
        id: "step-3-4",
        step: "Process broadband internet and hosting payments",
        durationMinutes: 20,
        difficulty: "easy",
        tip: "Save card data to digital wallet to clear this friction indefinitely with auto-pay.",
        completed: false
      }
    ]
  }
];
