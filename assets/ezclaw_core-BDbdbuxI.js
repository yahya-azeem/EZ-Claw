class N {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, rt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmagent_free(e, 0);
  }
  add_allowed_domain(e, _, r) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i;
    return t.wasmagent_add_allowed_domain(this.__wbg_ptr, n, s, l, c, g, p) !== 0;
  }
  add_credential(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = t.wasmagent_add_credential(this.__wbg_ptr, r, n, s, l);
    if (c[1]) throw b(c[0]);
  }
  build_messages(e, _, r, n) {
    let s, l;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const p = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), f = i, u = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), m = i, v = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), A = i, E = a(n, t.__wbindgen_malloc, t.__wbindgen_realloc), I = i, F = t.wasmagent_build_messages(this.__wbg_ptr, p, f, u, m, v, A, E, I);
      var c = F[0], g = F[1];
      if (F[3]) throw c = 0, g = 0, b(F[2]);
      return s = c, l = g, d(c, g);
    } finally {
      t.__wbindgen_free(s, l, 1);
    }
  }
  check_tool_security(e, _, r) {
    let n, s;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), u = i, m = t.wasmagent_check_tool_security(this.__wbg_ptr, l, c, g, p, f, u);
      return n = m[0], s = m[1], d(m[0], m[1]);
    } finally {
      t.__wbindgen_free(n, s, 1);
    }
  }
  estimate_context_tokens(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmagent_estimate_context_tokens(this.__wbg_ptr, _, r) >>> 0;
  }
  export_security_state() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmagent_export_security_state(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  format_tool_result(e, _, r) {
    let n, s;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const g = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), u = i, m = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), v = i, A = t.wasmagent_format_tool_result(this.__wbg_ptr, g, p, f, u, m, v);
      var l = A[0], c = A[1];
      if (A[3]) throw l = 0, c = 0, b(A[2]);
      return n = l, s = c, d(l, c);
    } finally {
      t.__wbindgen_free(n, s, 1);
    }
  }
  get_audit_log(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr), w(e);
      const n = t.wasmagent_get_audit_log(this.__wbg_ptr, e);
      return _ = n[0], r = n[1], d(n[0], n[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  get_tools_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmagent_get_tools_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmagent_new(_, r);
    if (n[2]) throw b(n[1]);
    return this.__wbg_ptr = n[0] >>> 0, rt.register(this, this.__wbg_ptr, this), this;
  }
  parse_tool_calls(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.wasmagent_parse_tool_calls(this.__wbg_ptr, l, c);
      var n = g[0], s = g[1];
      if (g[3]) throw n = 0, s = 0, b(g[2]);
      return _ = n, r = s, d(n, s);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  register_leak_secret(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmagent_register_leak_secret(this.__wbg_ptr, _, r);
  }
  secure_tool_response(e, _) {
    let r, n;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const s = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = t.wasmagent_secure_tool_response(this.__wbg_ptr, s, l, c, g);
      return r = p[0], n = p[1], d(p[0], p[1]);
    } finally {
      t.__wbindgen_free(r, n, 1);
    }
  }
  update_config(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmagent_update_config(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
}
Symbol.dispose && (N.prototype[Symbol.dispose] = N.prototype.free);
class P {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, nt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmagentloop_free(e, 0);
  }
  begin_iteration() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmagentloop_begin_iteration(this.__wbg_ptr) !== 0;
  }
  confirm() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), t.wasmagentloop_confirm(this.__wbg_ptr);
  }
  deny() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), t.wasmagentloop_deny(this.__wbg_ptr);
  }
  drain_events() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmagentloop_drain_events(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  iteration() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmagentloop_iteration(this.__wbg_ptr) >>> 0;
  }
  constructor(e) {
    w(e);
    const _ = t.wasmagentloop_new(e);
    return this.__wbg_ptr = _ >>> 0, nt.register(this, this.__wbg_ptr, this), this;
  }
  process_llm_response(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), y(e);
    const r = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i;
    return t.wasmagentloop_process_llm_response(this.__wbg_ptr, e, r, n) !== 0;
  }
  record_error(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmagentloop_record_error(this.__wbg_ptr, _, r);
  }
  record_tool_result(e, _, r) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i;
    y(_);
    const l = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i;
    t.wasmagentloop_record_tool_result(this.__wbg_ptr, n, s, _, l, c);
  }
  request_confirmation(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmagentloop_request_confirmation(this.__wbg_ptr, _, r);
  }
  reset() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), t.wasmagentloop_reset(this.__wbg_ptr);
  }
  should_continue() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmagentloop_should_continue(this.__wbg_ptr) !== 0;
  }
  state() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmagentloop_state(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
}
Symbol.dispose && (P.prototype[Symbol.dispose] = P.prototype.free);
class G {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ot.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmallowlist_free(e, 0);
  }
  add_domain(e, _, r) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i;
    return t.wasmallowlist_add_domain(this.__wbg_ptr, n, s, l, c, g, p) !== 0;
  }
  is_allowed(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmallowlist_is_allowed(this.__wbg_ptr, _, r) !== 0;
  }
  list_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmallowlist_list_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmallowlist_new();
    return this.__wbg_ptr = e >>> 0, ot.register(this, this.__wbg_ptr, this), this;
  }
  remove_domain(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmallowlist_remove_domain(this.__wbg_ptr, _, r) !== 0;
  }
}
Symbol.dispose && (G.prototype[Symbol.dispose] = G.prototype.free);
class H {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, st.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmchannelrouter_free(e, 0);
  }
  active_routes() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmchannelrouter_active_routes(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  export_state() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmchannelrouter_export_state(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  import_state(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmchannelrouter_import_state(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  constructor() {
    const e = t.wasmchannelrouter_new();
    return this.__wbg_ptr = e >>> 0, st.register(this, this.__wbg_ptr, this), this;
  }
  register_channel(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmchannelrouter_register_channel(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  route_message(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.wasmchannelrouter_route_message(this.__wbg_ptr, l, c);
      var n = g[0], s = g[1];
      if (g[3]) throw n = 0, s = 0, b(g[2]);
      return _ = n, r = s, d(n, s);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
}
Symbol.dispose && (H.prototype[Symbol.dispose] = H.prototype.free);
class R {
  static __wrap(e) {
    e = e >>> 0;
    const _ = Object.create(R.prototype);
    return _.__wbg_ptr = e, U.register(_, _.__wbg_ptr, _), _;
  }
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, U.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmconfig_free(e, 0);
  }
  get api_key() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const e = t.wasmconfig_api_key(this.__wbg_ptr);
    let _;
    return e[0] !== 0 && (_ = d(e[0], e[1]).slice(), t.__wbindgen_free(e[0], e[1] * 1, 1)), _;
  }
  get api_url() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const e = t.wasmconfig_api_url(this.__wbg_ptr);
    let _;
    return e[0] !== 0 && (_ = d(e[0], e[1]).slice(), t.__wbindgen_free(e[0], e[1] * 1, 1)), _;
  }
  get default_model() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const e = t.wasmconfig_default_model(this.__wbg_ptr);
    let _;
    return e[0] !== 0 && (_ = d(e[0], e[1]).slice(), t.__wbindgen_free(e[0], e[1] * 1, 1)), _;
  }
  get default_provider() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const e = t.wasmconfig_default_provider(this.__wbg_ptr);
    let _;
    return e[0] !== 0 && (_ = d(e[0], e[1]).slice(), t.__wbindgen_free(e[0], e[1] * 1, 1)), _;
  }
  get default_temperature() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmconfig_default_temperature(this.__wbg_ptr);
  }
  get encrypt_secrets() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmconfig_encrypt_secrets(this.__wbg_ptr) !== 0;
  }
  static from_json(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmconfig_from_json(_, r);
    if (n[2]) throw b(n[1]);
    return R.__wrap(n[0]);
  }
  static from_toml(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmconfig_from_toml(_, r);
    if (n[2]) throw b(n[1]);
    return R.__wrap(n[0]);
  }
  get identity_format() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmconfig_identity_format(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  get max_history_messages() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmconfig_max_history_messages(this.__wbg_ptr) >>> 0;
  }
  get max_tool_iterations() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmconfig_max_tool_iterations(this.__wbg_ptr) >>> 0;
  }
  get memory_auto_save() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmconfig_memory_auto_save(this.__wbg_ptr) !== 0;
  }
  get memory_backend() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmconfig_memory_backend(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmconfig_new();
    return this.__wbg_ptr = e >>> 0, U.register(this, this.__wbg_ptr, this), this;
  }
  set api_key(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    var _ = k(e) ? 0 : a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_api_key(this.__wbg_ptr, _, r);
  }
  set api_url(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    var _ = k(e) ? 0 : a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_api_url(this.__wbg_ptr, _, r);
  }
  set default_model(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    var _ = k(e) ? 0 : a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_default_model(this.__wbg_ptr, _, r);
  }
  set default_provider(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    var _ = k(e) ? 0 : a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_default_provider(this.__wbg_ptr, _, r);
  }
  set default_temperature(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), t.wasmconfig_set_default_temperature(this.__wbg_ptr, e);
  }
  set encrypt_secrets(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), y(e), t.wasmconfig_set_encrypt_secrets(this.__wbg_ptr, e);
  }
  set identity_format(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_identity_format(this.__wbg_ptr, _, r);
  }
  set max_history_messages(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), w(e), t.wasmconfig_set_max_history_messages(this.__wbg_ptr, e);
  }
  set max_tool_iterations(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), w(e), t.wasmconfig_set_max_tool_iterations(this.__wbg_ptr, e);
  }
  set memory_auto_save(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), y(e), t.wasmconfig_set_memory_auto_save(this.__wbg_ptr, e);
  }
  set memory_backend(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmconfig_set_memory_backend(this.__wbg_ptr, _, r);
  }
  to_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const s = t.wasmconfig_to_json(this.__wbg_ptr);
      var r = s[0], n = s[1];
      if (s[3]) throw r = 0, n = 0, b(s[2]);
      return e = r, _ = n, d(r, n);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  to_toml() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const s = t.wasmconfig_to_toml(this.__wbg_ptr);
      var r = s[0], n = s[1];
      if (s[3]) throw r = 0, n = 0, b(s[2]);
      return e = r, _ = n, d(r, n);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
}
Symbol.dispose && (R.prototype[Symbol.dispose] = R.prototype.free);
class J {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, it.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmcredentialvault_free(e, 0);
  }
  add_mapping_json(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmcredentialvault_add_mapping_json(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  export_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmcredentialvault_export_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  find_mapping_for_url(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmcredentialvault_find_mapping_for_url(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  get_encrypted(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmcredentialvault_get_encrypted(this.__wbg_ptr, _, r);
    let s;
    return n[0] !== 0 && (s = d(n[0], n[1]).slice(), t.__wbindgen_free(n[0], n[1] * 1, 1)), s;
  }
  has_credential(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmcredentialvault_has_credential(this.__wbg_ptr, _, r) !== 0;
  }
  import_json(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmcredentialvault_import_json(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  list_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmcredentialvault_list_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  log_access(e, _, r, n) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const s = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), f = i, u = a(n, t.__wbindgen_malloc, t.__wbindgen_realloc), m = i;
    t.wasmcredentialvault_log_access(this.__wbg_ptr, s, l, c, g, p, f, u, m);
  }
  constructor() {
    const e = t.wasmcredentialvault_new();
    return this.__wbg_ptr = e >>> 0, it.register(this, this.__wbg_ptr, this), this;
  }
  recent_accesses_json(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr), w(e);
      const n = t.wasmcredentialvault_recent_accesses_json(this.__wbg_ptr, e);
      return _ = n[0], r = n[1], d(n[0], n[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  remove_credential(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmcredentialvault_remove_credential(this.__wbg_ptr, _, r);
  }
  store_encrypted(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    t.wasmcredentialvault_store_encrypted(this.__wbg_ptr, r, n, s, l);
  }
}
Symbol.dispose && (J.prototype[Symbol.dispose] = J.prototype.free);
class X {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, lt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmdynamictoolregistry_free(e, 0);
  }
  count() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmdynamictoolregistry_count(this.__wbg_ptr) >>> 0;
  }
  export() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmdynamictoolregistry_export(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  import(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmdynamictoolregistry_import(this.__wbg_ptr, _, r);
    if (n[2]) throw b(n[1]);
    return n[0] >>> 0;
  }
  list_tools() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmdynamictoolregistry_list_tools(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmdynamictoolregistry_new();
    return this.__wbg_ptr = e >>> 0, lt.register(this, this.__wbg_ptr, this), this;
  }
  register(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmdynamictoolregistry_register(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  schemas_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmdynamictoolregistry_schemas_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  unregister(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmdynamictoolregistry_unregister(this.__wbg_ptr, _, r) !== 0;
  }
}
Symbol.dispose && (X.prototype[Symbol.dispose] = X.prototype.free);
class Y {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, at.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmleakscanner_free(e, 0);
  }
  has_leak(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmleakscanner_has_leak(this.__wbg_ptr, _, r) !== 0;
  }
  constructor() {
    const e = t.wasmleakscanner_new();
    return this.__wbg_ptr = e >>> 0, at.register(this, this.__wbg_ptr, this), this;
  }
  register_secret(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmleakscanner_register_secret(this.__wbg_ptr, _, r);
  }
  scan(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmleakscanner_scan(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  set_enabled(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), y(e), t.wasmleakscanner_set_enabled(this.__wbg_ptr, e);
  }
}
Symbol.dispose && (Y.prototype[Symbol.dispose] = Y.prototype.free);
class K {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, wt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmpromptdefense_free(e, 0);
  }
  is_dangerous(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmpromptdefense_is_dangerous(this.__wbg_ptr, _, r) !== 0;
  }
  constructor() {
    const e = t.wasmpromptdefense_new();
    return this.__wbg_ptr = e >>> 0, wt.register(this, this.__wbg_ptr, this), this;
  }
  sanitize(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmpromptdefense_sanitize(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  scan(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmpromptdefense_scan(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  set_enabled(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr), y(e), t.wasmpromptdefense_set_enabled(this.__wbg_ptr, e);
  }
  static wrap_external_content(e, _) {
    let r, n;
    try {
      const s = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = t.wasmpromptdefense_wrap_external_content(s, l, c, g);
      return r = p[0], n = p[1], d(p[0], p[1]);
    } finally {
      t.__wbindgen_free(r, n, 1);
    }
  }
  static wrap_tool_output(e, _) {
    let r, n;
    try {
      const s = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = t.wasmpromptdefense_wrap_tool_output(s, l, c, g);
      return r = p[0], n = p[1], d(p[0], p[1]);
    } finally {
      t.__wbindgen_free(r, n, 1);
    }
  }
}
Symbol.dispose && (K.prototype[Symbol.dispose] = K.prototype.free);
class Q {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ct.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmroutinesengine_free(e, 0);
  }
  add_routine(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmroutinesengine_add_routine(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  check_cron_triggers(e, _, r, n, s) {
    let l, c;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr), w(e), w(_), w(r), w(n), w(s);
      const g = t.wasmroutinesengine_check_cron_triggers(this.__wbg_ptr, e, _, r, n, s);
      return l = g[0], c = g[1], d(g[0], g[1]);
    } finally {
      t.__wbindgen_free(l, c, 1);
    }
  }
  export_state() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmroutinesengine_export_state(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  get_event_routines(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmroutinesengine_get_event_routines(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  get_heartbeat() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmroutinesengine_get_heartbeat(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  import_state(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmroutinesengine_import_state(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  list_routines() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmroutinesengine_list_routines(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  mark_executed(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    t.wasmroutinesengine_mark_executed(this.__wbg_ptr, r, n, s, l);
  }
  constructor() {
    const e = t.wasmroutinesengine_new();
    return this.__wbg_ptr = e >>> 0, ct.register(this, this.__wbg_ptr, this), this;
  }
  remove_routine(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmroutinesengine_remove_routine(this.__wbg_ptr, _, r) !== 0;
  }
  set_enabled(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i;
    return y(_), t.wasmroutinesengine_set_enabled(this.__wbg_ptr, r, n, _) !== 0;
  }
  set_heartbeat(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmroutinesengine_set_heartbeat(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  static validate_cron(e) {
    let _, r;
    try {
      const l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.wasmroutinesengine_validate_cron(l, c);
      var n = g[0], s = g[1];
      if (g[3]) throw n = 0, s = 0, b(g[2]);
      return _ = n, r = s, d(n, s);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
}
Symbol.dispose && (Q.prototype[Symbol.dispose] = Q.prototype.free);
class Z {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, gt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmsandboxmanager_free(e, 0);
  }
  add_allowed_domain(e, _, r) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i;
    return t.wasmsandboxmanager_add_allowed_domain(this.__wbg_ptr, n, s, l, c, g, p) !== 0;
  }
  add_credential_mapping(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmsandboxmanager_add_credential_mapping(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  audit_log_json(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr), w(e);
      const n = t.wasmsandboxmanager_audit_log_json(this.__wbg_ptr, e);
      return _ = n[0], r = n[1], d(n[0], n[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  check_request(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmsandboxmanager_check_request(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  check_response(e, _) {
    let r, n;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const s = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = t.wasmsandboxmanager_check_response(this.__wbg_ptr, s, l, c, g);
      return r = p[0], n = p[1], d(p[0], p[1]);
    } finally {
      t.__wbindgen_free(r, n, 1);
    }
  }
  export_state() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmsandboxmanager_export_state(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmsandboxmanager_new();
    return this.__wbg_ptr = e >>> 0, gt.register(this, this.__wbg_ptr, this), this;
  }
  register_secret(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmsandboxmanager_register_secret(this.__wbg_ptr, _, r);
  }
  set_policy(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmsandboxmanager_set_policy(this.__wbg_ptr, _, r);
  }
  store_credential(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    t.wasmsandboxmanager_store_credential(this.__wbg_ptr, r, n, s, l);
  }
}
Symbol.dispose && (Z.prototype[Symbol.dispose] = Z.prototype.free);
class L {
  static __wrap(e) {
    e = e >>> 0;
    const _ = Object.create(L.prototype);
    return _.__wbg_ptr = e, V.register(_, _.__wbg_ptr, _), _;
  }
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, V.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmsecuritypolicy_free(e, 0);
  }
  static from_json(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmsecuritypolicy_from_json(_, r);
    if (n[2]) throw b(n[1]);
    return L.__wrap(n[0]);
  }
  is_denied(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    return t.wasmsecuritypolicy_is_denied(this.__wbg_ptr, r, n, s, l) !== 0;
  }
  constructor() {
    const e = t.wasmsecuritypolicy_new();
    return this.__wbg_ptr = e >>> 0, V.register(this, this.__wbg_ptr, this), this;
  }
  requires_confirmation(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    return t.wasmsecuritypolicy_requires_confirmation(this.__wbg_ptr, r, n, s, l) !== 0;
  }
  set_autonomy(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmsecuritypolicy_set_autonomy(this.__wbg_ptr, _, r);
  }
  to_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmsecuritypolicy_to_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
}
Symbol.dispose && (L.prototype[Symbol.dispose] = L.prototype.free);
class tt {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, dt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmskillregistry_free(e, 0);
  }
  build_prompt(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmskillregistry_build_prompt(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  count() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmskillregistry_count(this.__wbg_ptr) >>> 0;
  }
  export() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmskillregistry_export(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  find_matching(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmskillregistry_find_matching(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  import(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmskillregistry_import(this.__wbg_ptr, _, r);
    if (n[2]) throw b(n[1]);
    return n[0] >>> 0;
  }
  list_skills() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmskillregistry_list_skills(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmskillregistry_new();
    return this.__wbg_ptr = e >>> 0, dt.register(this, this.__wbg_ptr, this), this;
  }
  register_skill(e, _) {
    let r, n;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const c = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), f = i, u = t.wasmskillregistry_register_skill(this.__wbg_ptr, c, g, p, f);
      var s = u[0], l = u[1];
      if (u[3]) throw s = 0, l = 0, b(u[2]);
      return r = s, n = l, d(s, l);
    } finally {
      t.__wbindgen_free(r, n, 1);
    }
  }
  set_enabled(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i;
    return y(_), t.wasmskillregistry_set_enabled(this.__wbg_ptr, r, n, _) !== 0;
  }
  unregister_skill(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmskillregistry_unregister_skill(this.__wbg_ptr, _, r) !== 0;
  }
}
Symbol.dispose && (tt.prototype[Symbol.dispose] = tt.prototype.free);
class O {
  static __wrap(e) {
    e = e >>> 0;
    const _ = Object.create(O.prototype);
    return _.__wbg_ptr = e, C.register(_, _.__wbg_ptr, _), _;
  }
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, C.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmtaskplan_free(e, 0);
  }
  add_task_json(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmtaskplan_add_task_json(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  complete_task(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    t.wasmtaskplan_complete_task(this.__wbg_ptr, r, n, s, l);
  }
  fail_task(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    t.wasmtaskplan_fail_task(this.__wbg_ptr, r, n, s, l);
  }
  static from_json(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmtaskplan_from_json(_, r);
    if (n[2]) throw b(n[1]);
    return O.__wrap(n[0]);
  }
  is_complete() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmtaskplan_is_complete(this.__wbg_ptr) !== 0;
  }
  constructor(e) {
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmtaskplan_new(_, r);
    return this.__wbg_ptr = n >>> 0, C.register(this, this.__wbg_ptr, this), this;
  }
  next_task() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmtaskplan_next_task(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  progress() {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    return w(this.__wbg_ptr), t.wasmtaskplan_progress(this.__wbg_ptr);
  }
  retry_task(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmtaskplan_retry_task(this.__wbg_ptr, _, r) !== 0;
  }
  start_task(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    t.wasmtaskplan_start_task(this.__wbg_ptr, _, r);
  }
  to_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmtaskplan_to_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
}
Symbol.dispose && (O.prototype[Symbol.dispose] = O.prototype.free);
class et {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, pt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmtoolregistry_free(e, 0);
  }
  get_capabilities(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmtoolregistry_get_capabilities(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  is_available(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmtoolregistry_is_available(this.__wbg_ptr, _, r) !== 0;
  }
  list_tools_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmtoolregistry_list_tools_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  constructor() {
    const e = t.wasmtoolregistry_new();
    return this.__wbg_ptr = e >>> 0, pt.register(this, this.__wbg_ptr, this), this;
  }
  static parse_tool_calls(e) {
    let _, r;
    try {
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmtoolregistry_parse_tool_calls(n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  register_json(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmtoolregistry_register_json(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  set_enabled(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i;
    return y(_), t.wasmtoolregistry_set_enabled(this.__wbg_ptr, r, n, _) !== 0;
  }
  to_llm_json() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmtoolregistry_to_llm_json(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  unregister(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmtoolregistry_unregister(this.__wbg_ptr, _, r) !== 0;
  }
}
Symbol.dispose && (et.prototype[Symbol.dispose] = et.prototype.free);
class _t {
  __destroy_into_raw() {
    const e = this.__wbg_ptr;
    return this.__wbg_ptr = 0, bt.unregister(this), e;
  }
  free() {
    const e = this.__destroy_into_raw();
    t.__wbg_wasmworkspace_free(e, 0);
  }
  delete(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmworkspace_delete(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  exists(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i;
    return t.wasmworkspace_exists(this.__wbg_ptr, _, r) !== 0;
  }
  export() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmworkspace_export(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  import(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmworkspace_import(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  list_dir(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = t.wasmworkspace_list_dir(this.__wbg_ptr, n, s);
      return _ = l[0], r = l[1], d(l[0], l[1]);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  mkdir(e) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const _ = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = t.wasmworkspace_mkdir(this.__wbg_ptr, _, r);
    if (n[1]) throw b(n[0]);
  }
  constructor() {
    const e = t.wasmworkspace_new();
    return this.__wbg_ptr = e >>> 0, bt.register(this, this.__wbg_ptr, this), this;
  }
  read_file(e) {
    let _, r;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.wasmworkspace_read_file(this.__wbg_ptr, l, c);
      var n = g[0], s = g[1];
      if (g[3]) throw n = 0, s = 0, b(g[2]);
      return _ = n, r = s, d(n, s);
    } finally {
      t.__wbindgen_free(_, r, 1);
    }
  }
  take_dirty_paths() {
    let e, _;
    try {
      if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
      w(this.__wbg_ptr);
      const r = t.wasmworkspace_take_dirty_paths(this.__wbg_ptr);
      return e = r[0], _ = r[1], d(r[0], r[1]);
    } finally {
      t.__wbindgen_free(e, _, 1);
    }
  }
  write_file(e, _) {
    if (this.__wbg_ptr == 0) throw new Error("Attempt to use a moved value");
    w(this.__wbg_ptr);
    const r = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = t.wasmworkspace_write_file(this.__wbg_ptr, r, n, s, l);
    if (c[1]) throw b(c[0]);
  }
}
Symbol.dispose && (_t.prototype[Symbol.dispose] = _t.prototype.free);
function Ft(o, e, _, r) {
  let n, s;
  try {
    const g = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), u = i;
    y(r);
    const m = t.build_provider_request(g, p, f, u, _, r);
    var l = m[0], c = m[1];
    if (m[3]) throw l = 0, c = 0, b(m[2]);
    return n = l, s = c, d(l, c);
  } finally {
    t.__wbindgen_free(n, s, 1);
  }
}
function Rt(o, e, _, r, n) {
  let s, l;
  try {
    const p = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), f = i, u = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), m = i;
    y(r);
    const v = a(n, t.__wbindgen_malloc, t.__wbindgen_realloc), A = i, E = t.build_provider_request_with_tools(p, f, u, m, _, r, v, A);
    var c = E[0], g = E[1];
    if (E[3]) throw c = 0, g = 0, b(E[2]);
    return s = c, l = g, d(c, g);
  } finally {
    t.__wbindgen_free(s, l, 1);
  }
}
function zt(o, e) {
  const _ = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), r = i, n = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i;
  return t.compute_tfidf_score(_, r, n, s);
}
function St(o, e) {
  let _, r;
  try {
    const l = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = t.decrypt(l, c, g, p);
    var n = f[0], s = f[1];
    if (f[3]) throw n = 0, s = 0, b(f[2]);
    return _ = n, r = s, d(n, s);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function jt(o, e) {
  let _, r;
  try {
    const n = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.default_aieos_identity(n, s, l, c);
    return _ = g[0], r = g[1], d(g[0], g[1]);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function Wt(o, e) {
  let _, r;
  try {
    const l = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = t.encrypt(l, c, g, p);
    var n = f[0], s = f[1];
    if (f[3]) throw n = 0, s = 0, b(f[2]);
    return _ = n, r = s, d(n, s);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function qt(o) {
  let e, _;
  try {
    const s = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = t.format_channel_response(s, l);
    var r = c[0], n = c[1];
    if (c[3]) throw r = 0, n = 0, b(c[2]);
    return e = r, _ = n, d(r, n);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Tt() {
  return t.health_check() !== 0;
}
function Lt() {
  t.init();
}
function Ot(o) {
  const e = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), _ = i;
  return t.is_aieos_format(e, _) !== 0;
}
function Mt() {
  let o, e;
  try {
    const _ = t.memory_count_sql();
    return o = _[0], e = _[1], d(_[0], _[1]);
  } finally {
    t.__wbindgen_free(o, e, 1);
  }
}
function Dt() {
  let o, e;
  try {
    const _ = t.memory_create_table_sql();
    return o = _[0], e = _[1], d(_[0], _[1]);
  } finally {
    t.__wbindgen_free(o, e, 1);
  }
}
function It(o) {
  let e, _;
  try {
    const r = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = t.memory_forget_sql(r, n);
    return e = s[0], _ = s[1], d(s[0], s[1]);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Ut(o) {
  let e, _;
  try {
    const r = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = t.memory_get_sql(r, n);
    return e = s[0], _ = s[1], d(s[0], s[1]);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Vt(o, e) {
  let _, r;
  try {
    const n = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i, l = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = t.memory_list_sql(n, s, l, c);
    return _ = g[0], r = g[1], d(g[0], g[1]);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function Ct(o, e, _) {
  let r, n;
  try {
    const s = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i;
    w(e);
    const c = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), g = i, p = t.memory_recall_sql(s, l, e, c, g);
    return r = p[0], n = p[1], d(p[0], p[1]);
  } finally {
    t.__wbindgen_free(r, n, 1);
  }
}
function Bt(o, e, _, r, n, s) {
  let l, c;
  try {
    const g = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), u = i, m = a(_, t.__wbindgen_malloc, t.__wbindgen_realloc), v = i, A = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), E = i, I = a(n, t.__wbindgen_malloc, t.__wbindgen_realloc), F = i, yt = a(s, t.__wbindgen_malloc, t.__wbindgen_realloc), vt = i, M = t.memory_store_sql(g, p, f, u, m, v, A, E, I, F, yt, vt);
    return l = M[0], c = M[1], d(M[0], M[1]);
  } finally {
    t.__wbindgen_free(l, c, 1);
  }
}
function $t(o, e) {
  let _, r;
  try {
    const l = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), c = i, g = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), p = i, f = t.normalize_channel_message(l, c, g, p);
    var n = f[0], s = f[1];
    if (f[3]) throw n = 0, s = 0, b(f[2]);
    return _ = n, r = s, d(n, s);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function Nt(o) {
  let e, _;
  try {
    const s = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = t.parse_aieos_identity(s, l);
    var r = c[0], n = c[1];
    if (c[3]) throw r = 0, n = 0, b(c[2]);
    return e = r, _ = n, d(r, n);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Pt(o) {
  let e, _;
  try {
    const s = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), l = i, c = t.parse_sse_line(s, l);
    var r = c[0], n = c[1];
    if (c[3]) throw r = 0, n = 0, b(c[2]);
    return e = r, _ = n, d(r, n);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Gt(o) {
  let e, _;
  try {
    const r = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = t.provider_base_url(r, n);
    return e = s[0], _ = s[1], d(s[0], s[1]);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Ht(o) {
  let e, _;
  try {
    const r = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), n = i, s = t.strip_markdown(r, n);
    return e = s[0], _ = s[1], d(s[0], s[1]);
  } finally {
    t.__wbindgen_free(e, _, 1);
  }
}
function Jt(o, e) {
  let _, r;
  try {
    const n = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i;
    w(e);
    const l = t.truncate_to_tokens(n, s, e);
    return _ = l[0], r = l[1], d(l[0], l[1]);
  } finally {
    t.__wbindgen_free(_, r, 1);
  }
}
function Xt() {
  let o, e;
  try {
    const _ = t.version();
    return o = _[0], e = _[1], d(_[0], _[1]);
  } finally {
    t.__wbindgen_free(o, e, 1);
  }
}
function Yt(o, e) {
  const _ = mt(o, t.__wbindgen_malloc), r = i, n = mt(e, t.__wbindgen_malloc), s = i;
  return t.wasm_cosine_similarity(_, r, n, s);
}
function Kt(o) {
  const e = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), _ = i;
  return t.wasm_estimate_tokens(e, _) >>> 0;
}
function Qt(o, e, _, r, n) {
  let s, l;
  try {
    const p = a(o, t.__wbindgen_malloc, t.__wbindgen_realloc), f = i, u = a(e, t.__wbindgen_malloc, t.__wbindgen_realloc), m = i;
    w(n);
    const v = t.wasm_hybrid_merge(p, f, u, m, _, r, n);
    var c = v[0], g = v[1];
    if (v[3]) throw c = 0, g = 0, b(v[2]);
    return s = c, l = g, d(c, g);
  } finally {
    t.__wbindgen_free(s, l, 1);
  }
}
function ut() {
  return { __proto__: null, "./ezclaw_core_bg.js": { __proto__: null, __wbg___wbindgen_is_function_3c846841762788c1: function(e) {
    const _ = typeof e == "function";
    return y(_), _;
  }, __wbg___wbindgen_is_object_781bc9f159099513: function(e) {
    const _ = e, r = typeof _ == "object" && _ !== null;
    return y(r), r;
  }, __wbg___wbindgen_is_string_7ef6b97b02428fae: function(e) {
    const _ = typeof e == "string";
    return y(_), _;
  }, __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(e) {
    const _ = e === void 0;
    return y(_), _;
  }, __wbg___wbindgen_throw_6ddd609b62940d55: function(e, _) {
    throw new Error(d(e, _));
  }, __wbg_call_2d781c1f4d5c0ef8: function() {
    return z(function(e, _, r) {
      return e.call(_, r);
    }, arguments);
  }, __wbg_crypto_38df2bab126b63dc: function() {
    return h(function(e) {
      return e.crypto;
    }, arguments);
  }, __wbg_error_a6fa202b58aa1cd3: function() {
    return h(function(e, _) {
      let r, n;
      try {
        r = e, n = _, console.error(d(e, _));
      } finally {
        t.__wbindgen_free(r, n, 1);
      }
    }, arguments);
  }, __wbg_getRandomValues_a1cf2e70b003a59d: function() {
    return z(function(e, _) {
      globalThis.crypto.getRandomValues(B(e, _));
    }, arguments);
  }, __wbg_getRandomValues_c44a50d8cfdaebeb: function() {
    return z(function(e, _) {
      e.getRandomValues(_);
    }, arguments);
  }, __wbg_length_ea16607d7b61445b: function() {
    return h(function(e) {
      const _ = e.length;
      return w(_), _;
    }, arguments);
  }, __wbg_msCrypto_bd5a034af96bcba6: function() {
    return h(function(e) {
      return e.msCrypto;
    }, arguments);
  }, __wbg_new_227d7c05414eb861: function() {
    return h(function() {
      return new Error();
    }, arguments);
  }, __wbg_new_with_length_825018a1616e9e55: function() {
    return h(function(e) {
      return new Uint8Array(e >>> 0);
    }, arguments);
  }, __wbg_node_84ea875411254db1: function() {
    return h(function(e) {
      return e.node;
    }, arguments);
  }, __wbg_process_44c7a14e11e9f69e: function() {
    return h(function(e) {
      return e.process;
    }, arguments);
  }, __wbg_prototypesetcall_d62e5099504357e6: function() {
    return h(function(e, _, r) {
      Uint8Array.prototype.set.call(B(e, _), r);
    }, arguments);
  }, __wbg_randomFillSync_6c25eac9869eb53c: function() {
    return z(function(e, _) {
      e.randomFillSync(_);
    }, arguments);
  }, __wbg_require_b4edbdcf3e2a1ef0: function() {
    return z(function() {
      return module.require;
    }, arguments);
  }, __wbg_stack_3b0d974bbf31e44f: function() {
    return h(function(e, _) {
      const r = _.stack, n = a(r, t.__wbindgen_malloc, t.__wbindgen_realloc), s = i;
      ft().setInt32(e + 4, s, true), ft().setInt32(e + 0, n, true);
    }, arguments);
  }, __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
    return h(function() {
      const e = typeof global > "u" ? null : global;
      return k(e) ? 0 : S(e);
    }, arguments);
  }, __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
    return h(function() {
      const e = typeof globalThis > "u" ? null : globalThis;
      return k(e) ? 0 : S(e);
    }, arguments);
  }, __wbg_static_accessor_SELF_f207c857566db248: function() {
    return h(function() {
      const e = typeof self > "u" ? null : self;
      return k(e) ? 0 : S(e);
    }, arguments);
  }, __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
    return h(function() {
      const e = typeof window > "u" ? null : window;
      return k(e) ? 0 : S(e);
    }, arguments);
  }, __wbg_subarray_a068d24e39478a8a: function() {
    return h(function(e, _, r) {
      return e.subarray(_ >>> 0, r >>> 0);
    }, arguments);
  }, __wbg_versions_276b2795b1c6a219: function() {
    return h(function(e) {
      return e.versions;
    }, arguments);
  }, __wbindgen_cast_0000000000000001: function() {
    return h(function(e, _) {
      return B(e, _);
    }, arguments);
  }, __wbindgen_cast_0000000000000002: function() {
    return h(function(e, _) {
      return d(e, _);
    }, arguments);
  }, __wbindgen_init_externref_table: function() {
    const e = t.__wbindgen_externrefs, _ = e.grow(4);
    e.set(0, void 0), e.set(_ + 0, void 0), e.set(_ + 1, null), e.set(_ + 2, true), e.set(_ + 3, false);
  } } };
}
const rt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmagent_free(o >>> 0, 1)), nt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmagentloop_free(o >>> 0, 1)), ot = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmallowlist_free(o >>> 0, 1)), st = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmchannelrouter_free(o >>> 0, 1)), U = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmconfig_free(o >>> 0, 1)), it = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmcredentialvault_free(o >>> 0, 1)), lt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmdynamictoolregistry_free(o >>> 0, 1)), at = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmleakscanner_free(o >>> 0, 1)), wt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmpromptdefense_free(o >>> 0, 1)), ct = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmroutinesengine_free(o >>> 0, 1)), gt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmsandboxmanager_free(o >>> 0, 1)), V = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmsecuritypolicy_free(o >>> 0, 1)), dt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmskillregistry_free(o >>> 0, 1)), C = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmtaskplan_free(o >>> 0, 1)), pt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmtoolregistry_free(o >>> 0, 1)), bt = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((o) => t.__wbg_wasmworkspace_free(o >>> 0, 1));
function S(o) {
  const e = t.__externref_table_alloc();
  return t.__wbindgen_externrefs.set(e, o), e;
}
function y(o) {
  if (typeof o != "boolean") throw new Error(`expected a boolean argument, found ${typeof o}`);
}
function w(o) {
  if (typeof o != "number") throw new Error(`expected a number argument, found ${typeof o}`);
}
function B(o, e) {
  return o = o >>> 0, q().subarray(o / 1, o / 1 + e);
}
let x = null;
function ft() {
  return (x === null || x.buffer.detached === true || x.buffer.detached === void 0 && x.buffer !== t.memory.buffer) && (x = new DataView(t.memory.buffer)), x;
}
let j = null;
function At() {
  return (j === null || j.byteLength === 0) && (j = new Float32Array(t.memory.buffer)), j;
}
function d(o, e) {
  return o = o >>> 0, kt(o, e);
}
let W = null;
function q() {
  return (W === null || W.byteLength === 0) && (W = new Uint8Array(t.memory.buffer)), W;
}
function z(o, e) {
  try {
    return o.apply(this, e);
  } catch (_) {
    const r = S(_);
    t.__wbindgen_exn_store(r);
  }
}
function k(o) {
  return o == null;
}
function h(o, e) {
  try {
    return o.apply(this, e);
  } catch (_) {
    let r = (function() {
      try {
        return _ instanceof Error ? `${_.message}

Stack:
${_.stack}` : _.toString();
      } catch {
        return "<failed to stringify thrown value>";
      }
    })();
    throw console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", r), _;
  }
}
function mt(o, e) {
  const _ = e(o.length * 4, 4) >>> 0;
  return At().set(o, _ / 4), i = o.length, _;
}
function a(o, e, _) {
  if (typeof o != "string") throw new Error(`expected a string argument, found ${typeof o}`);
  if (_ === void 0) {
    const c = T.encode(o), g = e(c.length, 1) >>> 0;
    return q().subarray(g, g + c.length).set(c), i = c.length, g;
  }
  let r = o.length, n = e(r, 1) >>> 0;
  const s = q();
  let l = 0;
  for (; l < r; l++) {
    const c = o.charCodeAt(l);
    if (c > 127) break;
    s[n + l] = c;
  }
  if (l !== r) {
    l !== 0 && (o = o.slice(l)), n = _(n, r, r = l + o.length * 3, 1) >>> 0;
    const c = q().subarray(n + l, n + r), g = T.encodeInto(o, c);
    if (g.read !== o.length) throw new Error("failed to pass whole string");
    l += g.written, n = _(n, r, l, 1) >>> 0;
  }
  return i = l, n;
}
function b(o) {
  const e = t.__wbindgen_externrefs.get(o);
  return t.__externref_table_dealloc(o), e;
}
let D = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
D.decode();
const Et = 2146435072;
let $ = 0;
function kt(o, e) {
  return $ += e, $ >= Et && (D = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }), D.decode(), $ = e), D.decode(q().subarray(o, o + e));
}
const T = new TextEncoder();
"encodeInto" in T || (T.encodeInto = function(o, e) {
  const _ = T.encode(o);
  return e.set(_), { read: o.length, written: _.length };
});
let i = 0, t;
function ht(o, e) {
  return t = o.exports, x = null, j = null, W = null, t.__wbindgen_start(), t;
}
async function xt(o, e) {
  if (typeof Response == "function" && o instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function") try {
      return await WebAssembly.instantiateStreaming(o, e);
    } catch (n) {
      if (o.ok && _(o.type) && o.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", n);
      else throw n;
    }
    const r = await o.arrayBuffer();
    return await WebAssembly.instantiate(r, e);
  } else {
    const r = await WebAssembly.instantiate(o, e);
    return r instanceof WebAssembly.Instance ? { instance: r, module: o } : r;
  }
  function _(r) {
    switch (r) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}
function Zt(o) {
  if (t !== void 0) return t;
  o !== void 0 && (Object.getPrototypeOf(o) === Object.prototype ? { module: o } = o : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const e = ut();
  o instanceof WebAssembly.Module || (o = new WebAssembly.Module(o));
  const _ = new WebAssembly.Instance(o, e);
  return ht(_);
}
async function te(o) {
  if (t !== void 0) return t;
  o !== void 0 && (Object.getPrototypeOf(o) === Object.prototype ? { module_or_path: o } = o : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), o === void 0 && (o = new URL("" + new URL("ezclaw_core_bg-bA2IR4wv.wasm", import.meta.url).href, import.meta.url));
  const e = ut();
  (typeof o == "string" || typeof Request == "function" && o instanceof Request || typeof URL == "function" && o instanceof URL) && (o = fetch(o));
  const { instance: _, module: r } = await xt(await o, e);
  return ht(_);
}
export {
  N as WasmAgent,
  P as WasmAgentLoop,
  G as WasmAllowlist,
  H as WasmChannelRouter,
  R as WasmConfig,
  J as WasmCredentialVault,
  X as WasmDynamicToolRegistry,
  Y as WasmLeakScanner,
  K as WasmPromptDefense,
  Q as WasmRoutinesEngine,
  Z as WasmSandboxManager,
  L as WasmSecurityPolicy,
  tt as WasmSkillRegistry,
  O as WasmTaskPlan,
  et as WasmToolRegistry,
  _t as WasmWorkspace,
  t as __wasm,
  Ft as build_provider_request,
  Rt as build_provider_request_with_tools,
  zt as compute_tfidf_score,
  St as decrypt,
  te as default,
  jt as default_aieos_identity,
  Wt as encrypt,
  qt as format_channel_response,
  Tt as health_check,
  Lt as init,
  Zt as initSync,
  Ot as is_aieos_format,
  Mt as memory_count_sql,
  Dt as memory_create_table_sql,
  It as memory_forget_sql,
  Ut as memory_get_sql,
  Vt as memory_list_sql,
  Ct as memory_recall_sql,
  Bt as memory_store_sql,
  $t as normalize_channel_message,
  Nt as parse_aieos_identity,
  Pt as parse_sse_line,
  Gt as provider_base_url,
  Ht as strip_markdown,
  Jt as truncate_to_tokens,
  Xt as version,
  Yt as wasm_cosine_similarity,
  Kt as wasm_estimate_tokens,
  Qt as wasm_hybrid_merge
};
