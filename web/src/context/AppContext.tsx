import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { clearSession, readSession } from "@/lib/api";
import type { Poll, User } from "@/lib/types";

export interface ModerationItem {
  id: string;
  responseId: string;
  pollId: string;
  text: string;
  toxicityScore: number;
  status: "pending" | "approved" | "rejected";
}

export interface Theme {
  label: string;
  count: number;
  examples: string[];
}

interface AppState {
  user: User | null;
  polls: Poll[];
  currentPoll: Poll | null;
  moderationQueue: ModerationItem[];
  isAuthenticated: boolean;
  socketConnected: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  read: boolean;
}

type Action =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_POLLS"; payload: Poll[] }
  | { type: "SET_CURRENT_POLL"; payload: Poll | null }
  | { type: "ADD_POLL"; payload: Poll }
  | { type: "UPDATE_POLL"; payload: Poll }
  | { type: "DELETE_POLL"; payload: string }
  | { type: "SET_MODERATION"; payload: ModerationItem[] }
  | { type: "UPDATE_MODERATION_ITEM"; payload: ModerationItem }
  | { type: "SET_SOCKET_CONNECTED"; payload: boolean }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "LOGOUT" };

const sessionUser = readSession();

const initialState: AppState = {
  user: sessionUser,
  polls: [],
  currentPoll: null,
  moderationQueue: [],
  isAuthenticated: !!sessionUser,
  socketConnected: false,
  notifications: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case "SET_POLLS":
      return { ...state, polls: action.payload };
    case "SET_CURRENT_POLL":
      return { ...state, currentPoll: action.payload };
    case "ADD_POLL":
      return { ...state, polls: [action.payload, ...state.polls] };
    case "UPDATE_POLL":
      return {
        ...state,
        polls: state.polls.map((p) => (p.id === action.payload.id ? action.payload : p)),
        currentPoll: state.currentPoll?.id === action.payload.id ? action.payload : state.currentPoll,
      };
    case "DELETE_POLL":
      return {
        ...state,
        polls: state.polls.filter((poll) => poll.id !== action.payload),
        currentPoll: state.currentPoll?.id === action.payload ? null : state.currentPoll,
      };
    case "SET_MODERATION":
      return { ...state, moderationQueue: action.payload };
    case "UPDATE_MODERATION_ITEM":
      return {
        ...state,
        moderationQueue: state.moderationQueue.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case "SET_SOCKET_CONNECTED":
      return { ...state, socketConnected: action.payload };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case "LOGOUT":
      clearSession();
      return { ...initialState, user: null, polls: [], currentPoll: null, isAuthenticated: false };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
