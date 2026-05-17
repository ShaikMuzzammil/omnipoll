import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/lib/api";
import type { Poll, PollResults } from "@/lib/types";
import { useApp } from "@/context/AppContext";

export interface PollSocketPayload {
  poll: Poll;
  results: PollResults;
}

export function useSocket(
  pollId?: string,
  onPollUpdate?: (payload: PollSocketPayload) => void,
  code?: string,
) {
  const { state, dispatch } = useApp();

  const socket = useMemo(
    () =>
      io(API_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      }),
    [],
  );

  useEffect(() => {
    const handleConnect = () => dispatch({ type: "SET_SOCKET_CONNECTED", payload: true });
    const handleDisconnect = () => dispatch({ type: "SET_SOCKET_CONNECTED", payload: false });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.disconnect();
    };
  }, [dispatch, socket]);

  useEffect(() => {
    if (!pollId && !code) return;
    socket.emit("joinPoll", { pollId, code });

    const update = (payload: PollSocketPayload) => {
      dispatch({ type: "UPDATE_POLL", payload: payload.poll });
      onPollUpdate?.(payload);
    };

    socket.on("pollUpdated", update);
    socket.on("voteUpdate", update);
    socket.on("wordCloudUpdate", update);
    socket.on("qaUpdate", update);
    socket.on("leaderboardUpdate", update);
    socket.on("statusUpdate", update);

    return () => {
      socket.emit("leavePoll", { pollId });
      socket.off("pollUpdated", update);
      socket.off("voteUpdate", update);
      socket.off("wordCloudUpdate", update);
      socket.off("qaUpdate", update);
      socket.off("leaderboardUpdate", update);
      socket.off("statusUpdate", update);
    };
  }, [code, dispatch, onPollUpdate, pollId, socket]);

  return { connected: state.socketConnected, socket };
}
