import { Task } from "@/schema";
import { WebSocket, WebSocketServer } from "ws";

const clients = new Set<WebSocket>();

export function setupWebSocket(server: import("http").Server) {
    const wss = new WebSocketServer({ server, path: "/sync" });

    wss.on("connection", (socket) => {
        clients.add(socket);

        socket.on("close", () => {
            clients.delete(socket);
        });
    });
}

export function broadcastTask(task: Task) {
    const json = JSON.stringify(task);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    }
}
