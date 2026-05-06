import { useEffect, useRef } from 'react';
import { getPusherClient } from './pusher';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useRealtime = (channelName: string, eventName: string, callback: (data: any) => void) => {
  const callbackRef = useRef(callback);

  // Update the ref whenever the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channelName || !eventName) return;

    // 1. Try Pusher
    const pusher = getPusherClient();
    let pusherChannel: any = null;

    const handler = (data: any) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    if (pusher) {
      pusherChannel = pusher.subscribe(channelName);
      pusherChannel.bind(eventName, handler);
    }

    // 2. Try Socket.io
    if (!socket && process.env.NEXT_PUBLIC_SOCKET_URL) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    }

    if (socket) {
      socket.on(eventName, handler);
    }

    return () => {
      if (pusherChannel) {
        pusherChannel.unbind(eventName, handler);
        pusher?.unsubscribe(channelName);
      }
      if (socket) {
        socket.off(eventName, handler);
      }
    };
  }, [channelName, eventName]); // Removed callback from dependencies
};
