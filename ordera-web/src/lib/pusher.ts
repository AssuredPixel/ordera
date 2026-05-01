import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export const getPusherClient = () => {
  if (pusherClient) return pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('Pusher credentials missing. Real-time features may be disabled.');
    return null;
  }

  pusherClient = new Pusher(key, {
    cluster,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
  });

  pusherClient.connection.bind('error', (err: any) => {
    if (err?.error?.data?.code === 4004 || err?.data?.code === 4004) {
      console.warn('Pusher connection limit reached or invalid credentials.');
    } else if (err?.error?.data?.code === 4200 || err?.data?.code === 4200) {
      console.warn('Pusher 4200: Reconnecting gracefully...');
    } else {
      console.error('Pusher connection error:', err);
    }
  });

  // Silence Pusher internal logging to reduce console noise
  Pusher.logToConsole = false;

  return pusherClient;
};
