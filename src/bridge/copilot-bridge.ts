/**
 * Copilot Bridge v1.0
 * 
 * Handles the exchange of a GitHub OAuth token for a short-lived 
 * GitHub Copilot Session Token.
 */

export interface CopilotSession {
    token: string;
    expires_at: number;
}

const COPILOT_TOKEN_URL = 'https://api.github.com/copilot_internal/v2/token';

export async function getCopilotSession(githubToken: string): Promise<CopilotSession> {
    const response = await fetch(COPILOT_TOKEN_URL, {
        method: 'GET',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/json',
            'User-Agent': 'GithubCopilot/1.155.0'
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Copilot token exchange failed: ${err}`);
    }

    const data = await response.json();
    return {
        token: data.token,
        expires_at: data.expires_at * 1000 // Convert to ms
    };
}
