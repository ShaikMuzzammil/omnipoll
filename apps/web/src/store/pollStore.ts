import { create } from "zustand";
import type { Poll, PollResults } from "../types";

interface PollState {
  polls: Poll[];
  activePoll: Poll | null;
  activeResults: PollResults | null;
  liveParticipants: number;
  setPolls: (polls: Poll[]) => void;
  setActivePoll: (poll: Poll | null) => void;
  setActiveResults: (results: PollResults | null) => void;
  setLiveParticipants: (count: number) => void;
  updatePoll: (pollId: string, update: Partial<Poll>) => void;
}

export const usePollStore = create<PollState>((set) => ({
  polls: [],
  activePoll: null,
  activeResults: null,
  liveParticipants: 0,
  setPolls: (polls) => set({ polls }),
  setActivePoll: (activePoll) => set({ activePoll }),
  setActiveResults: (activeResults) => set({ activeResults }),
  setLiveParticipants: (liveParticipants) => set({ liveParticipants }),
  updatePoll: (pollId, update) =>
    set((state) => ({
      polls: state.polls.map((p) => (p.id === pollId ? { ...p, ...update } : p)),
      activePoll: state.activePoll?.id === pollId ? { ...state.activePoll, ...update } : state.activePoll,
    })),
}));
