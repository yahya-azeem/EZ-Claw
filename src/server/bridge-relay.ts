import { WebSocketServer, WebSocket } from 'ws';

/**
 * EZ-Claw WebSocket Bridge Relay v1.0
 * 
 * A simple message broker that allows the Browser UI and the Node CLI 
 * to share state and commands.
 */

const port = 8080;
const wss = new WebSocketServer({ port });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[Bridge Relay] Client connected. Total: ${clients.size}`);

    ws.on('message', async (data) => {
        const messageStr = data.toString();
        try {
            JSON.parse(messageStr);
        } catch {}

        // Broadcast to everyone else
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[Bridge Relay] Client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
        console.error('[Bridge Relay] Error:', err);
    });
});

console.log(`[Bridge Relay] WebSocket server running on ws://localhost:${port}`);
