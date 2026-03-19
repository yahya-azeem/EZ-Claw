/**
 * GitHub Copilot Device Authentication v1.0
 * 
 * Implements the GitHub OAuth Device Flow to obtain an access token 
 * without requiring the user to manually copy-paste long tokens.
 */

const CLIENT_ID = '01738fb9f16177579610'; // GitHub CLI Client ID (standard for community tools)
const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
// Note: Copilot token exchange is usually: https://api.github.com/copilot_internal/v2/token

export async function startDeviceFlow() {
    console.log('[Copilot Auth] Starting GitHub Device Flow...');
    
    const response = await fetch(GITHUB_DEVICE_CODE_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            scope: 'read:user,repo,user:email,gist,read:org,workflow'
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to start device flow: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('\n! ACTION REQUIRED !');
    console.log(`Open: ${data.verification_uri}`);
    console.log(`Code: ${data.user_code}`);
    console.log('\nWaiting for authentication...\n');

    return {
        device_code: data.device_code,
        interval: data.interval,
        expires_in: data.expires_in
    };
}

export async function pollForToken(device_code: string, intervalSeconds: number) {
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes approx

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                reject(new Error('Authentication timed out.'));
                return;
            }

            const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    device_code: device_code,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                })
            });

            const data = await response.json();

            if (data.access_token) {
                clearInterval(interval);
                resolve(data.access_token);
            } else if (data.error === 'authorization_pending') {
                // Keep polling
            } else {
                clearInterval(interval);
                reject(new Error(`OAuth Error: ${data.error_description || data.error}`));
            }
        }, intervalSeconds * 1000);
    });
}
