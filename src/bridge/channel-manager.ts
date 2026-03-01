/**
 * Channel Manager — Messaging channel transport bridge.
 *
 * Handles the actual network transport for messaging channels:
 * - Telegram: Bot API HTTP long polling
 * - Discord: Bot Gateway WebSocket
 * - Slack: Socket Mode WebSocket
 *
 * All 100% client-side. Messages are normalized via WASM channels module
 * before being sent to the agent.
 */

export interface ChannelConnection {
    type: 'telegram' | 'discord' | 'slack';
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    botName?: string;
    error?: string;
    messageCount: number;
}

export interface ChannelMessageEvent {
    channelType: string;
    rawMessage: any;
    normalizedJson?: string;
}

type MessageHandler = (event: ChannelMessageEvent) => void;

// ── Telegram Bot API ──────────────────────────────────────────────

export class TelegramChannel {
    private token: string;
    private offset: number = 0;
    private polling: boolean = false;
    private pollTimer: number | null = null;
    private onMessage: MessageHandler;
    public connection: ChannelConnection;

    constructor(token: string, onMessage: MessageHandler) {
        this.token = token;
        this.onMessage = onMessage;
        this.connection = {
            type: 'telegram',
            status: 'disconnected',
            messageCount: 0,
        };
    }

    async connect(): Promise<void> {
        this.connection.status = 'connecting';

        try {
            // Verify token by calling getMe
            const res = await fetch(`https://api.telegram.org/bot${this.token}/getMe`);
            const data = await res.json();

            if (!data.ok) {
                throw new Error(data.description || 'Invalid bot token');
            }

            this.connection.botName = data.result.username;
            this.connection.status = 'connected';
            this.polling = true;
            this.poll();
        } catch (err: any) {
            this.connection.status = 'error';
            this.connection.error = err.message;
            throw err;
        }
    }

    disconnect(): void {
        this.polling = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        this.connection.status = 'disconnected';
    }

    private async poll(): Promise<void> {
        if (!this.polling) return;

        try {
            const res = await fetch(
                `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.offset}&timeout=30&allowed_updates=["message"]`,
                { signal: AbortSignal.timeout(35000) }
            );

            const data = await res.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    this.offset = update.update_id + 1;
                    if (update.message) {
                        this.connection.messageCount++;
                        this.onMessage({
                            channelType: 'telegram',
                            rawMessage: update,
                        });
                    }
                }
            }
        } catch (err) {
            // Timeout or network error — retry
            console.warn('[EZ-Claw Telegram] Poll error:', err);
        }

        // Continue polling
        if (this.polling) {
            this.pollTimer = window.setTimeout(() => this.poll(), 1000);
        }
    }

    async sendMessage(chatId: string, text: string, replyToMessageId?: string): Promise<void> {
        const body: any = {
            chat_id: chatId,
            text,
            parse_mode: 'MarkdownV2',
        };

        if (replyToMessageId) {
            body.reply_to_message_id = parseInt(replyToMessageId);
        }

        const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            // Retry without markdown if parse_mode fails
            body.parse_mode = undefined;
            body.text = text.replace(/\\([_*\[\]()~`>#+=|{}.!-])/g, '$1');
            await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
    }
}

// ── Discord Bot Gateway ───────────────────────────────────────────

export class DiscordChannel {
    private token: string;
    private ws: WebSocket | null = null;
    private heartbeatInterval: number | null = null;
    private seq: number | null = null;
    private onMessage: MessageHandler;
    public connection: ChannelConnection;

    constructor(token: string, onMessage: MessageHandler) {
        this.token = token;
        this.onMessage = onMessage;
        this.connection = {
            type: 'discord',
            status: 'disconnected',
            messageCount: 0,
        };
    }

    async connect(): Promise<void> {
        this.connection.status = 'connecting';

        try {
            // Get gateway URL
            const res = await fetch('https://discord.com/api/v10/gateway/bot', {
                headers: { Authorization: `Bot ${this.token}` },
            });

            if (!res.ok) throw new Error(`Discord API error: ${res.status}`);

            const data = await res.json();
            const gatewayUrl = data.url + '?v=10&encoding=json';

            // Connect WebSocket
            this.ws = new WebSocket(gatewayUrl);

            this.ws.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                this.handlePayload(payload);
            };

            this.ws.onerror = (err) => {
                this.connection.status = 'error';
                this.connection.error = 'WebSocket error';
            };

            this.ws.onclose = () => {
                this.connection.status = 'disconnected';
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
            };
        } catch (err: any) {
            this.connection.status = 'error';
            this.connection.error = err.message;
            throw err;
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.connection.status = 'disconnected';
    }

    private handlePayload(payload: any): void {
        const { op, t, s, d } = payload;

        if (s) this.seq = s;

        switch (op) {
            case 10: // Hello — start heartbeating
                const interval = d.heartbeat_interval;
                this.heartbeatInterval = window.setInterval(() => {
                    this.ws?.send(JSON.stringify({ op: 1, d: this.seq }));
                }, interval);

                // Identify
                this.ws?.send(JSON.stringify({
                    op: 2,
                    d: {
                        token: this.token,
                        intents: 512 | 32768, // GUILD_MESSAGES | MESSAGE_CONTENT
                        properties: {
                            os: 'browser',
                            browser: 'ezclaw',
                            device: 'ezclaw',
                        },
                    },
                }));
                break;

            case 0: // Dispatch
                if (t === 'READY') {
                    this.connection.status = 'connected';
                    this.connection.botName = d.user?.username;
                } else if (t === 'MESSAGE_CREATE') {
                    // Ignore own messages
                    if (d.author?.bot) return;

                    this.connection.messageCount++;
                    this.onMessage({
                        channelType: 'discord',
                        rawMessage: d,
                    });
                }
                break;

            case 1: // Heartbeat request
                this.ws?.send(JSON.stringify({ op: 1, d: this.seq }));
                break;

            case 11: // Heartbeat ACK
                break;
        }
    }

    async sendMessage(channelId: string, content: string, replyTo?: string): Promise<void> {
        const body: any = { content };
        if (replyTo) {
            body.message_reference = { message_id: replyTo };
        }

        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }
}

// ── Slack Socket Mode ────────────────────────────────────────────

export class SlackChannel {
    private appToken: string;
    private botToken: string;
    private ws: WebSocket | null = null;
    private onMessage: MessageHandler;
    public connection: ChannelConnection;

    constructor(appToken: string, botToken: string, onMessage: MessageHandler) {
        this.appToken = appToken;
        this.botToken = botToken;
        this.onMessage = onMessage;
        this.connection = {
            type: 'slack',
            status: 'disconnected',
            messageCount: 0,
        };
    }

    async connect(): Promise<void> {
        this.connection.status = 'connecting';

        try {
            // Get WebSocket URL via Socket Mode
            const res = await fetch('https://slack.com/api/apps.connections.open', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.appToken}` },
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Slack connection failed');

            // Get bot info
            const authRes = await fetch('https://slack.com/api/auth.test', {
                headers: { Authorization: `Bearer ${this.botToken}` },
            });
            const authData = await authRes.json();
            this.connection.botName = authData.user;

            // Connect WebSocket
            this.ws = new WebSocket(data.url);

            this.ws.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                this.handlePayload(payload);
            };

            this.ws.onopen = () => {
                this.connection.status = 'connected';
            };

            this.ws.onerror = () => {
                this.connection.status = 'error';
                this.connection.error = 'WebSocket error';
            };

            this.ws.onclose = () => {
                this.connection.status = 'disconnected';
            };
        } catch (err: any) {
            this.connection.status = 'error';
            this.connection.error = err.message;
            throw err;
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connection.status = 'disconnected';
    }

    private handlePayload(payload: any): void {
        // Acknowledge envelope
        if (payload.envelope_id) {
            this.ws?.send(JSON.stringify({ envelope_id: payload.envelope_id }));
        }

        if (payload.type === 'events_api') {
            const event = payload.payload?.event;
            if (event?.type === 'message' && !event.bot_id && event.text) {
                this.connection.messageCount++;
                this.onMessage({
                    channelType: 'slack',
                    rawMessage: event,
                });
            }
        }
    }

    async sendMessage(channel: string, text: string, threadTs?: string): Promise<void> {
        const body: any = { channel, text };
        if (threadTs) body.thread_ts = threadTs;

        await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }
}

// ── Channel Manager (Orchestrator) ────────────────────────────────

export class ChannelManager {
    private channels: Map<string, TelegramChannel | DiscordChannel | SlackChannel> = new Map();
    private messageHandler: MessageHandler;

    constructor(onMessage: MessageHandler) {
        this.messageHandler = onMessage;
    }

    addTelegram(token: string): TelegramChannel {
        const ch = new TelegramChannel(token, this.messageHandler);
        this.channels.set('telegram', ch);
        return ch;
    }

    addDiscord(token: string): DiscordChannel {
        const ch = new DiscordChannel(token, this.messageHandler);
        this.channels.set('discord', ch);
        return ch;
    }

    addSlack(appToken: string, botToken: string): SlackChannel {
        const ch = new SlackChannel(appToken, botToken, this.messageHandler);
        this.channels.set('slack', ch);
        return ch;
    }

    getChannel(type: string): TelegramChannel | DiscordChannel | SlackChannel | undefined {
        return this.channels.get(type);
    }

    getAllConnections(): ChannelConnection[] {
        return Array.from(this.channels.values()).map(ch => ch.connection);
    }

    async connectAll(): Promise<void> {
        for (const ch of this.channels.values()) {
            try {
                await ch.connect();
            } catch (err) {
                console.error(`[EZ-Claw] Channel connect error:`, err);
            }
        }
    }

    disconnectAll(): void {
        for (const ch of this.channels.values()) {
            ch.disconnect();
        }
    }

    async sendToChannel(channelType: string, channelId: string, text: string, replyTo?: string): Promise<void> {
        const ch = this.channels.get(channelType);
        if (!ch) throw new Error(`Channel not configured: ${channelType}`);

        if (ch instanceof TelegramChannel) {
            await ch.sendMessage(channelId, text, replyTo);
        } else if (ch instanceof DiscordChannel) {
            await ch.sendMessage(channelId, text, replyTo);
        } else if (ch instanceof SlackChannel) {
            await ch.sendMessage(channelId, text, replyTo);
        }
    }
}
