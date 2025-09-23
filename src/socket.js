import { io } from "socket.io-client";

export const initSocket = async () => {
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ["websocket", "polling"],
    };
    const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const url = process.env.REACT_APP_BACKEND_URL || `http://${defaultHost}:5000`;
    return io(url, options);
};

