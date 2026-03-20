import { Command } from 'commander';
import WebSocket from 'ws';
import { CopilotClient } from '@github/copilot-sdk';
import { EVENTS } from '../bridge/constants';

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
async function sendCommand(type: string, payload: any, waitForResponse = false) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let timeout: NodeJS.Timeout;
        const totalTimeout = setTimeout(() => {
            ws.close();
            reject(new Error('Command timed out after 60s. The browser or worker might be unresponsive.'));
        }, 60000);

        ws.on('open', () => {
            ws.send(JSON.stringify({ type, payload }));
            
            if (!waitForResponse && type !== 'STATE_SYNC_REQ') {
                timeout = setTimeout(() => {
                    ws.close();
                    resolve(true);
                }, 500);
            }
        });

        ws.on('error', (err) => {
            console.error('[CLI] Connection error:', err.message);
            reject(err);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                console.log(`[CLI DEBUG] 📥 Received Type: ${msg.type}`);
                
                const isStateSync = msg.type === 'STATE_SYNC' || msg.type === 'STATE_UPDATED' || msg.type === EVENTS.INIT_SUCCESS;

                if (type === 'STATE_SYNC_REQ' && isStateSync) {
                    console.log('[CLI DEBUG] ✅ State sync successful.');
                    clearTimeout(timeout);
                    resolve(msg.payload);
                    if (!waitForResponse) ws.close(); 
                }

                if (msg.type === EVENTS.MESSAGE_ADD || (waitForResponse && msg.type === 'MESSAGE_ADD')) {
                    const { clawId, message } = msg.payload;
                    const roleLabel = message.role === 'assistant' ? 'Assistant' : message.role === 'tool' ? 'Tool' : 'User';
                    console.log(`\n[${roleLabel}] ${message.content || '(Tool Call)'}`);
                    
                    if (waitForResponse && message.role === 'assistant') {
                        clearTimeout(timeout);
                        clearTimeout(totalTimeout);
                        // ws.close(); // Don't close, keep following
                        resolve(msg.payload);
                    }
                }

                if (msg.type === 'COPILOT_SDK_CHAT') {
                    // This is a request from the browser worker to use the local SDK
                    (async () => {
                        let client: CopilotClient | null = null;
                        try {
                            client = new CopilotClient();
                            await client.start();
                            
                            const { messages } = msg.payload;
                            const lastMsg = messages[messages.length - 1];
                            const prompt = lastMsg?.content || '';

                            const session = await client.createSession({
                                onPermissionRequest: async () => ({ kind: 'approved' })
                            });
                            const response = await session.sendAndWait({ prompt });
                            
                            ws.send(JSON.stringify({
                                type: 'RESPONSE_FROM_RELAY',
                                payload: { content: response?.data?.content || '' },
                                requestId: msg.requestId
                            }));
                            
                            await session.disconnect();
                        } catch (err: any) {
                            ws.send(JSON.stringify({
                                type: 'RESPONSE_FROM_RELAY',
                                payload: { error: err.message },
                                requestId: msg.requestId
                            }));
                        } finally {
                            if (client) await client.stop();
                        }
                    })();
                }

                if (msg.type === 'ERROR') {
                    clearTimeout(timeout);
                    clearTimeout(totalTimeout);
                    ws.close();
                    reject(new Error(`[Worker Error] ${JSON.stringify(msg.payload)}`));
                }
                
                if (waitForResponse && msg.type === 'TASK_STATUS') {
                    process.stdout.write(`\r[Status] ${msg.payload.status}...`);
                }
            } catch {}
        });
    });
}

// Note: Deprecated manual auth removed. 
// SDK handles auth via GitHub CLI or internal device flow.

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
    } catch (err: any) {
        console.error('Error fetching claws:', err.message);
    }
  });

program
  .command('chat <id> <message>')
  .description('Send a message to a Claw and wait for response')
  .action(async (id, message) => {
    console.log(`\nSending message to ${id}...`);
    await sendCommand('REMOTE_CHAT', { id, message }, true);
  });

program
  .command('login-hint')
  .description('Instructions for GitHub Copilot authentication')
  .action(() => {
    console.log('GitHub Copilot SDK uses the "gh" CLI for authentication.');
    console.log('Please run: gh auth login');
    console.log('Or the SDK will prompt for device flow on first request.');
  });

program
  .command('create <name>')
  .description('Create a new Claw in the browser')
  .option('-p, --provider <id>', 'LLM Provider', 'github-copilot-sdk')
  .option('-m, --model <id>', 'Model ID', 'claude-3-haiku')
  .action(async (name, options) => {
    try {
        const id = crypto.randomUUID();
        await sendCommand('CREATE_CLAW', { 
            id,
            name, 
            model: options.model, 
            provider: options.provider 
        });
        console.log(`Claw created (ID: ${id.slice(0,8)}). Check browser UI.`);
    } catch (err: any) {
        console.error('Error creating claw:', err.message);
    }
  });

program
  .command('clear')
  .description('Delete ALL Claws from the browser and persistence')
  .action(async () => {
    console.log('Clearing all claws...');
    await sendCommand('CLEAR_CLAWS', {});
    console.log('State cleared.');
  });

program.parse();
