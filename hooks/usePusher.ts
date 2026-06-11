'use client';

import { useEffect, useRef, useCallback } from 'react';
import type PusherType from 'pusher-js';

type Handler = (data: unknown) => void;

export function usePusher(pollId: string | null, handlers: Record<string, Handler>) {
  const pusherRef = useRef<PusherType | null>(null);
  const channelRef = useRef<ReturnType<PusherType['subscribe']> | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref up to date
  useEffect(() => { handlersRef.current = handlers; }, [handlers]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current?.unsubscribe(`poll-${pollId}`);
      channelRef.current = null;
    }
  }, [pollId]);

  useEffect(() => {
    if (!pollId) return;
    if (typeof window === 'undefined') return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    if (!key) {
      console.warn('[Pusher] NEXT_PUBLIC_PUSHER_KEY not set — real-time disabled');
      return;
    }

    let pusher: PusherType;
    let channel: ReturnType<PusherType['subscribe']>;

    async function connect() {
      const PusherLib = (await import('pusher-js')).default;
      pusher = new PusherLib(key!, { cluster, forceTLS: true });
      pusherRef.current = pusher;

      channel = pusher.subscribe(`poll-${pollId}`);
      channelRef.current = channel;

      channel.bind('results-update', (data: unknown) => handlersRef.current['results-update']?.(data));
      channel.bind('status-changed', (data: unknown) => handlersRef.current['status-changed']?.(data));
      channel.bind('qa-update',      (data: unknown) => handlersRef.current['qa-update']?.(data));
      channel.bind('participant-joined', (data: unknown) => handlersRef.current['participant-joined']?.(data));
    }

    connect().catch(console.error);

    return () => {
      channel?.unbind_all();
      pusher?.unsubscribe(`poll-${pollId}`);
      pusher?.disconnect();
    };
  }, [pollId]);

  return { disconnect };
}
