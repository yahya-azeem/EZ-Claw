import { Command } from 'commander';
import WebSocket from 'ws';

/**
 * EZ-Claw Developer CLI v1.0
 */

const program = new Command();
const wsUrl = 'ws://localhost:8080';

program
  .name('ezclaw')
  .description('Developer CLI for EZ-Claw AI Agents')
  .version('0.1.0');

// Helper to connect and send a command
async function sendCommand(type: string, payload: any) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', () => {
            ws.send(JSON.stringify({ type, payload }));
            // Most commands are fire-and-forget or wait for a specific response
            if (type === 'STATE_SYNC_REQ') {
                // Wait for response...
            } else {
                setTimeout(() => {
                    ws.close();
                    resolve(true);
                }, 500);
            }
        });

        ws.on('error', (err) => {
            console.error('[CLI] Connection error:', err.message);
            console.log('Is the bridge-relay running? (npm run bridge)');
            reject(err);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'STATE_SYNC') {
                    resolve(msg.payload);
                    ws.close();
                }
            } catch {}
        });
    });
}

program
  .command('ls')
  .description('List all active Claws in the browser')
  .action(async () => {
    try {
        console.log('Fetching claws...');
        const state: any = await sendCommand('STATE_SYNC_REQ', {});
        if (state && state.claws) {
            console.table(state.claws.map((c: any) => ({
                ID: c.id.slice(0, 8),
                Name: c.clawName,
                Status: c.status,
                Model: c.model,
                Messages: c.messages.length
            })));
        } else {
            console.log('No claws found or browser not connected.');
        }
    } catch {}
  });

program
  .command('chat <id> <message>')
  .description('Send a message to a Claw')
  .action(async (id, message) => {
    console.log(`Sending message to ${id}...`);
    await sendCommand('REMOTE_CHAT', { id, message });
    console.log('Message dispatched. Check browser or logs for response.');
  });

program
  .command('panic')
  .description('Freeze all active Claws')
  .action(async () => {
    console.log('Sending PANIC signal...');
    await sendCommand('REMOTE_PANIC', {});
    console.log('Done.');
  });

program.parse();
