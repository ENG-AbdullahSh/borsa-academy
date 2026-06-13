import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

let echo;

if (pusherKey && pusherKey !== 'dummy-key') {
    echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
        wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
        wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('borsa_auth_token')}`,
            },
        },
    });
} else {
    // Mock Echo to prevent crashes when Pusher is not configured
    console.warn("Pusher App Key is missing. Real-time features are disabled.");
    echo = {
        isMock: true,
        private: () => ({
            listen: () => ({}),
        }),
        channel: () => ({
            listen: () => ({}),
        }),
        leaveChannel: () => {},
    };
}

export default echo;
