class h {
  config;
  nextId = 1;
  tools = [];
  resources = [];
  prompts = [];
  connected = false;
  eventSource = null;
  ws = null;
  pendingRequests = /* @__PURE__ */ new Map();
  constructor(e) {
    this.config = e;
  }
  async connect() {
    this.config.transport === "websocket" ? await this.connectWebSocket() : await this.connectSSE(), await this.request("initialize", { protocolVersion: "2024-11-05", capabilities: { tools: {}, resources: { subscribe: false }, prompts: {} }, clientInfo: { name: "EZ-Claw", version: "0.1.0" } }) && (this.connected = true, await this.discoverCapabilities());
  }
  async connectSSE() {
    const e = this.config.url.endsWith("/sse") ? this.config.url : `${this.config.url}/sse`;
    return new Promise((s, t) => {
      this.eventSource = new EventSource(e), this.eventSource.onopen = () => s(), this.eventSource.onmessage = (o) => {
        try {
          const n = JSON.parse(o.data);
          this.handleMessage(n);
        } catch (n) {
          console.error("[MCP] Parse error:", n);
        }
      }, this.eventSource.onerror = (o) => {
        this.connected || t(new Error(`MCP SSE connection failed: ${this.config.url}`));
      };
    });
  }
  async connectWebSocket() {
    const e = this.config.url.replace(/^http/, "ws");
    return new Promise((s, t) => {
      this.ws = new WebSocket(e), this.ws.onopen = () => s(), this.ws.onmessage = (o) => {
        try {
          const n = JSON.parse(o.data);
          this.handleMessage(n);
        } catch (n) {
          console.error("[MCP] Parse error:", n);
        }
      }, this.ws.onerror = () => {
        this.connected || t(new Error(`MCP WebSocket connection failed: ${this.config.url}`));
      }, this.ws.onclose = () => {
        this.connected = false;
      };
    });
  }
  handleMessage(e) {
    if (e.id !== void 0 && this.pendingRequests.has(e.id)) {
      const s = this.pendingRequests.get(e.id);
      this.pendingRequests.delete(e.id), e.error ? s.reject(new Error(e.error.message)) : s.resolve(e.result);
    }
  }
  async request(e, s) {
    const t = this.nextId++, o = { jsonrpc: "2.0", id: t, method: e, params: s || {} };
    return new Promise((n, i) => {
      if (this.pendingRequests.set(t, { resolve: n, reject: i }), setTimeout(() => {
        this.pendingRequests.has(t) && (this.pendingRequests.delete(t), i(new Error(`MCP request timeout: ${e}`)));
      }, 3e4), this.config.transport === "websocket" && this.ws) this.ws.send(JSON.stringify(o));
      else {
        const l = this.config.url.replace(/\/sse$/, ""), a = { "Content-Type": "application/json" };
        this.config.apiKey && (a.Authorization = `Bearer ${this.config.apiKey}`), fetch(l, { method: "POST", headers: a, body: JSON.stringify(o) }).then((r) => r.json()).then((r) => this.handleMessage(r)).catch((r) => {
          this.pendingRequests.delete(t), i(r);
        });
      }
    });
  }
  async discoverCapabilities() {
    try {
      const e = await this.request("tools/list");
      this.tools = (e?.tools || []).map((s) => ({ ...s, serverId: this.config.id }));
    } catch {
      this.tools = [];
    }
    try {
      const e = await this.request("resources/list");
      this.resources = (e?.resources || []).map((s) => ({ ...s, serverId: this.config.id }));
    } catch {
      this.resources = [];
    }
    try {
      const e = await this.request("prompts/list");
      this.prompts = (e?.prompts || []).map((s) => ({ ...s, serverId: this.config.id }));
    } catch {
      this.prompts = [];
    }
  }
  async callTool(e, s) {
    return this.request("tools/call", { name: e, arguments: s });
  }
  async readResource(e) {
    return this.request("resources/read", { uri: e });
  }
  async getPrompt(e, s) {
    return this.request("prompts/get", { name: e, arguments: s });
  }
  disconnect() {
    this.connected = false, this.eventSource && (this.eventSource.close(), this.eventSource = null), this.ws && (this.ws.close(), this.ws = null), this.pendingRequests.clear();
  }
  get isConnected() {
    return this.connected;
  }
  get availableTools() {
    return this.tools;
  }
  get availableResources() {
    return this.resources;
  }
  get availablePrompts() {
    return this.prompts;
  }
}
class c {
  static instance = null;
  connections = /* @__PURE__ */ new Map();
  configs = [];
  static getInstance() {
    return c.instance || (c.instance = new c()), c.instance;
  }
  getConnection(e) {
    return this.connections.get(e);
  }
  addServer(e) {
    this.configs.push(e);
  }
  removeServer(e) {
    const s = this.connections.get(e);
    s && (s.disconnect(), this.connections.delete(e)), this.configs = this.configs.filter((t) => t.id !== e);
  }
  async connectAll() {
    const e = /* @__PURE__ */ new Map();
    for (const s of this.configs) if (s.enabled) try {
      const t = new h(s);
      await t.connect(), this.connections.set(s.id, t), e.set(s.id, null);
    } catch (t) {
      e.set(s.id, t), console.error(`[MCP] Failed to connect to ${s.name}:`, t);
    }
    return e;
  }
  allTools() {
    const e = [];
    for (const s of this.connections.values()) e.push(...s.availableTools);
    return e;
  }
  toolSchemas() {
    return this.allTools().map((e) => ({ type: "function", function: { name: `mcp_${e.serverId}_${e.name}`, description: `[MCP: ${e.serverId}] ${e.description}`, parameters: e.inputSchema } }));
  }
  async callTool(e, s) {
    const t = e.replace(/^mcp_/, "").split("_"), o = t[0], n = t.slice(1).join("_"), i = this.connections.get(o);
    if (!i) throw new Error(`MCP server not connected: ${o}`);
    return i.callTool(n, s);
  }
  disconnectAll() {
    for (const e of this.connections.values()) e.disconnect();
    this.connections.clear();
  }
  status() {
    return this.configs.map((e) => {
      const s = this.connections.get(e.id);
      return { id: e.id, name: e.name, connected: s?.isConnected || false, tools: s?.availableTools.length || 0 };
    });
  }
  exportConfigs() {
    const e = this.configs.map(({ apiKey: s, ...t }) => t);
    return JSON.stringify(e);
  }
  importConfigs(e) {
    try {
      this.configs = JSON.parse(e);
    } catch (s) {
      console.error("[MCP] Config import failed:", s);
    }
  }
}
export {
  h as MCPConnection,
  c as MCPManager
};
