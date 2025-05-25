import { taskStore } from "@/stores/taskStore";
import { Task } from "@/types";

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

const WS_URL = `ws://localhost:3000/sync`;
const RECONNECT_DELAY: number = 2000;

export function connectWebSocket() {
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;

    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("[syncSocket]: WebSocket connected");
    }

    socket.onmessage = (event) => {
        try {
            const task: Task = JSON.parse(event.data);
            taskStore.applyRemote(task);
        } catch (error) {
            console.error("[syncSocket]: WebSocket message parse error", error);
        }
    }

    socket.onclose = () => {
        console.warn(`[syncSocket]: WebSocket closed, retrying in ${RECONNECT_DELAY}ms`)
        scheduleReconnect();
    }

    socket.onerror = (err) => {
        console.error("[syncSocket]: WebSocket error", err);
        socket?.close();
    }
}

function scheduleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => connectWebSocket(), RECONNECT_DELAY);
}