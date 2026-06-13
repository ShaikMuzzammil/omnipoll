/// <reference types="vite/client" />
import { useEffect, useRef } from 'react';

type Handler = (data: unknown) => void;

export function usePusher(pollId: string | null, handlers: Record<string, Handler>) {
  const handlersRef = useRef(handlers);
  useEffect(() => { handlersRef.current = handlers; }, [handlers]);

  useEffect(() => {
    if (!pollId) return;
    const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
    const cluster = (import.meta.env.VITE_PUSHER_CLUSTER as string | undefined) || 'ap2';
    if (!key) { console.warn('[Pusher] VITE_PUSHER_KEY not set — real-time disabled'); return; }

    let pusher: import('pusher-js').default;
    let channel: ReturnType<import('pusher-js').default['subscribe']>;

    (async () => {
      const PusherLib = (await import('pusher-js')).default;
      pusher = new PusherLib(key, { cluster, forceTLS: true });
      channel = pusher.subscribe(`poll-${pollId}`);
      ['results-update','status-changed','qa-update','participant-joined'].forEach(ev => {
        channel.bind(ev, (data: unknown) => handlersRef.current[ev]?.(data));
      });
    })();

    return () => {
      channel?.unbind_all();
      pusher?.unsubscribe(`poll-${pollId}`);
      pusher?.disconnect();
    };
  }, [pollId]);
}
