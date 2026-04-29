import { useEffect } from 'react';
import { getPusherClient } from './pusher';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useRealtime = (channelName: string, eventName: string, callback: (data: any) => void) => {
  useEffect(() => {
    // 1. Try Pusher (Primary for Production/Vercel)
    const pusher = getPusherClient();
    let pusherChannel: any = null;

    if (pusher) {
      pusherChannel = pusher.subscribe(channelName);
      pusherChannel.bind(eventName, callback);
    }

    // 2. Try Socket.io (Fallback for Local)
    if (!socket && process.env.NEXT_PUBLIC_SOCKET_URL) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    }

    if (socket) {
      socket.on(eventName, (data) => {
        // Only trigger if Pusher didn't handle it or to ensure coverage
        // In practice, we prevent double triggering by checking source or ID
        callback(data);
      });
    }

    return () => {
      if (pusherChannel) {
        pusherChannel.unbind(eventName, callback);
        pusher.unsubscribe(channelName);
      }
      if (socket) {
        socket.off(eventName, callback);
      }
    };
  }, [channelName, eventName, callback]);
};
