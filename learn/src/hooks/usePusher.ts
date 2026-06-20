import { useEffect, useRef } from 'react';
import type { Channel } from 'pusher-js';
import { useApp } from '@/context/AppContext';

type EventMap = Record<string, (data: unknown) => void>;

export function usePollChannel(pollId: string | undefined, events: EventMap) {
  const { pusher } = useApp();
  const chRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!pusher || !pollId) return;

    const ch = pusher.subscribe(`poll-${pollId}`);
    chRef.current = ch;

    Object.entries(events).forEach(([ev, cb]) => ch.bind(ev, cb));

    return () => {
      Object.keys(events).forEach(ev => ch.unbind(ev));
      pusher.unsubscribe(`poll-${pollId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pusher, pollId]);

  return chRef.current;
}

export function usePresenceChannel(pollId: string | undefined, events: EventMap) {
  const { pusher } = useApp();

  useEffect(() => {
    if (!pusher || !pollId) return;

    const ch = pusher.subscribe(`presence-poll-${pollId}`);
    Object.entries(events).forEach(([ev, cb]) => ch.bind(ev, cb));

    return () => {
      Object.keys(events).forEach(ev => ch.unbind(ev));
      pusher.unsubscribe(`presence-poll-${pollId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pusher, pollId]);
}
