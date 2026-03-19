import { CopilotClient, CopilotSession, approveAll } from '@github/copilot-sdk';

/**
 * GitHub Copilot SDK Service v1.0
 * 
 * Manages the lifecycle of the GitHub Copilot CLI agent via the official SDK.
 * This service runs on the Node.js server (bridge-relay).
 */

let client: CopilotClient | null = null;
let session: CopilotSession | null = null;

export async function getCopilotClient() {
    if (!client) {
        console.log('[Copilot Service] Starting Copilot Client...');
        client = new CopilotClient();
        await client.start();
        
        const auth = await client.getAuthStatus();
        if (!auth.isAuthenticated) {
            console.log('[Copilot Service] Client not authenticated. Use "gh auth login".');
        } else {
            console.log(`[Copilot Service] Authenticated as ${auth.login}`);
        }
    }
    return client;
}

export async function getCopilotSession() {
    if (!session) {
        const c = await getCopilotClient();
        console.log('[Copilot Service] Creating new session...');
        session = await c.createSession({
            model: 'claude-3-haiku', // Default model
            onPermissionRequest: approveAll
        });
    }
    return session;
}

/**
 * Process a chat request via the SDK.
 */
export async function processCopilotChat(messages: any[]) {
    const s = await getCopilotSession();
    
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) throw new Error('No user message found');

    console.log(`[Copilot Service] Sending message: ${lastUserMsg.content}`);
    
    // sendAndWait returns AssistantMessageEvent | undefined
    const response = await s.sendAndWait({ 
        prompt: lastUserMsg.content 
    });
    
    if (!response) {
        throw new Error('No response from Copilot SDK');
    }

    return response.data.content;
}
