/**
 * EZ-Claw Constants — Centralized configuration tokens.
 * Follows Rule #9: No Magic Numbers.
 */

export const NETWORK = {
    BRIDGE_RELAY_URL: 'ws://localhost:8080',
    RETRY_INTERVAL_MS: 5000,
};

export const CLAW_DEFAULTS = {
    NAME: 'New Claw',
    EMOJI: '🦀',
    STATUS: 'running',
    TEMPERATURE: 0.7,
    MAX_ITERATIONS: 10,
    PROVIDER: 'deepseek',
    MODEL: 'deepseek-chat',
    FALLBACK_PROVIDER: 'openrouter',
};

export const WORKER = {
    NAME: 'EZ-Claw-Worker',
    TYPE: 'module' as const,
};

export const EVENTS = {
    INIT: 'INIT',
    INIT_SUCCESS: 'INIT_SUCCESS',
    GET_CLAWS: 'GET_CLAWS',
    STATE_UPDATED: 'STATE_UPDATED',
    CREATE_CLAW: 'CREATE_CLAW',
    UPDATE_CLAW: 'UPDATE_CLAW',
    DELETE_CLAW: 'DELETE_CLAW',
    CLEAR_CLAWS: 'CLEAR_CLAWS',
    RUN_TASK: 'RUN_TASK',
    STOP_TASK: 'STOP_TASK',
    TASK_STATUS: 'TASK_STATUS',
    TASK_COMPLETE: 'TASK_COMPLETE',
    MESSAGE_ADD: 'MESSAGE_ADD',
    ERROR: 'ERROR',
    PING: 'PING',
    PONG: 'PONG',
    RESPONSE: 'RESPONSE',
    LOG: 'LOG',
};

export const TIMEOUTS = {
    API_REQUEST_MS: 30000,
    WASM_INIT_MS: 10000,
    COPILOT_REFRESH_BUFFER_MS: 60000,
    UI_STATUS_MSG_MS: 3000,
};

export const STORAGE = {
    DB_NAME: 'ezclaw-db-v4',
    STORES: {
        SESSIONS: 'sessions',
        CONFIG: 'config',
        SECRETS: 'secrets',
        MEMORIES: 'memories',
        WORKSPACE: 'workspace',
    }
};
