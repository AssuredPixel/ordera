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
  });

  return pusherClient;
};
