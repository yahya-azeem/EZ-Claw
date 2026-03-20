
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('[DUMMY WORKER] Connected to Bridge Relay');
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[DUMMY WORKER] 📥 Received:', msg.type);
    
    if (msg.type === 'STATE_SYNC_REQ' || msg.type === 'GET_CLAWS') {
        ws.send(JSON.stringify({
            type: 'STATE_UPDATED',
            payload: { claws: [{ id: 'test-claw-123', clawName: 'CLI TEST CLAW', status: 'running', model: 'gemini-flash', messages: [] }] }
        }));
    }

    if (msg.type === 'REMOTE_CHAT' || msg.type === 'RUN_TASK') {
        const { message } = msg.payload;
        console.log('[DUMMY WORKER] 💬 Chat message received:', message);
        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'MESSAGE_ADD',
                payload: { clawId: 'test-claw-123', message: { role: 'assistant', content: `Hello! I received your message: "${message}"` } }
            }));
        }, 1000);
    }
});
