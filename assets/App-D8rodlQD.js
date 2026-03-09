import { c as cs, a as Nt, b as ds, g as Ut, i as cr, T as dr, d as ur, r as ya, I as mn, e as Pn, p as ka, f as bn, h as mt, m as us, s as vs, j as fs, E as vr, k as a, l as Ba, n as fr, o as pr, q as mr, t as La, u as hr, v as br, w as _r, x as ps, y as Sa, z as ht, D as wr, B as gr, A as yr, C as $n, F as kr, G as ms, H as Sr, J as Z, K as xr, N as zr, L as Cr, M as Hn, O as hs, P as bs, Q as Ir, R as _s, S as ws, U as Er, V as Ar, W as Or, X as Dr, Y as xa, Z as In, _ as Kn, $ as qr, a0 as gs, a1 as Vn, a2 as tt, a3 as nt, a4 as w, a5 as at, a6 as A, a7 as l, a8 as c, a9 as Pe, aa as z, ab as d, ac as Rt, ad as _n, ae as Te, af as ys, __tla as __tla_0 } from "./index-anVZjg2J.js";
let Nd;
let __tla = Promise.all([
  (() => {
    try {
      return __tla_0;
    } catch {
    }
  })()
]).then(async () => {
  function ks(t) {
    throw new Error("https://svelte.dev/e/lifecycle_outside_component");
  }
  const Pr = globalThis?.window?.trustedTypes && globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    createHTML: (t) => t
  });
  function Mr(t) {
    return Pr?.createHTML(t) ?? t;
  }
  function Ss(t) {
    var e = cs("template");
    return e.innerHTML = Mr(t.replaceAll("<!>", "<!---->")), e.content;
  }
  function Yt(t, e) {
    var n = ds;
    n.nodes === null && (n.nodes = {
      start: t,
      end: e,
      a: null,
      t: null
    });
  }
  function g(t, e) {
    var n = (e & dr) !== 0, s = (e & ur) !== 0, r, i = !t.startsWith("<!>");
    return () => {
      r === void 0 && (r = Ss(i ? t : "<!>" + t), n || (r = Ut(r)));
      var o = s || cr ? document.importNode(r, true) : r.cloneNode(true);
      if (n) {
        var u = Ut(o), v = o.lastChild;
        Yt(u, v);
      } else Yt(o, o);
      return o;
    };
  }
  function Tr(t, e, n = "svg") {
    var s = !t.startsWith("<!>"), r = `<${n}>${s ? t : "<!>" + t}</${n}>`, i;
    return () => {
      if (!i) {
        var o = Ss(r), u = Ut(o);
        i = Ut(u);
      }
      var v = i.cloneNode(true);
      return Yt(v, v), v;
    };
  }
  function Nr(t, e) {
    return Tr(t, e, "svg");
  }
  function xt(t = "") {
    {
      var e = Nt(t + "");
      return Yt(e, e), e;
    }
  }
  function st() {
    var t = document.createDocumentFragment(), e = document.createComment(""), n = Nt();
    return t.append(e, n), Yt(e, n), t;
  }
  function h(t, e) {
    t !== null && t.before(e);
  }
  class Ur {
    anchor;
    #t = /* @__PURE__ */ new Map();
    #n = /* @__PURE__ */ new Map();
    #e = /* @__PURE__ */ new Map();
    #a = /* @__PURE__ */ new Set();
    #s = true;
    constructor(e, n = true) {
      this.anchor = e, this.#s = n;
    }
    #r = (e) => {
      if (this.#t.has(e)) {
        var n = this.#t.get(e), s = this.#n.get(n);
        if (s) ya(s), this.#a.delete(n);
        else {
          var r = this.#e.get(n);
          r && (r.effect.f & mn) === 0 && (this.#n.set(n, r.effect), this.#e.delete(n), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), s = r.effect);
        }
        for (const [i, o] of this.#t) {
          if (this.#t.delete(i), i === e) break;
          const u = this.#e.get(o);
          u && (Pn(u.effect), this.#e.delete(o));
        }
        for (const [i, o] of this.#n) {
          if (i === n || this.#a.has(i) || (o.f & mn) !== 0) continue;
          const u = () => {
            if (Array.from(this.#t.values()).includes(i)) {
              var f = document.createDocumentFragment();
              us(o, f), f.append(Nt()), this.#e.set(i, {
                effect: o,
                fragment: f
              });
            } else Pn(o);
            this.#a.delete(i), this.#n.delete(i);
          };
          this.#s || !s ? (this.#a.add(i), ka(o, u, false)) : u();
        }
      }
    };
    #i = (e) => {
      this.#t.delete(e);
      const n = Array.from(this.#t.values());
      for (const [s, r] of this.#e) n.includes(s) || (Pn(r.effect), this.#e.delete(s));
    };
    ensure(e, n) {
      var s = mt, r = vs();
      if (n && !this.#n.has(e) && !this.#e.has(e)) if (r) {
        var i = document.createDocumentFragment(), o = Nt();
        i.append(o), this.#e.set(e, {
          effect: bn(() => n(o)),
          fragment: i
        });
      } else this.#n.set(e, bn(() => n(this.anchor)));
      if (this.#t.set(s, e), r) {
        for (const [u, v] of this.#n) u === e ? s.unskip_effect(v) : s.skip_effect(v);
        for (const [u, v] of this.#e) u === e ? s.unskip_effect(v.effect) : s.skip_effect(v.effect);
        s.oncommit(this.#r), s.ondiscard(this.#i);
      } else this.#r(s);
    }
  }
  function M(t, e, n = false) {
    var s = new Ur(t), r = n ? vr : 0;
    function i(o, u) {
      s.ensure(o, u);
    }
    fs(() => {
      var o = false;
      e((u, v = 0) => {
        o = true, i(v, u);
      }), o || i(-1, null);
    }, r);
  }
  function je(t, e) {
    return e;
  }
  function Rr(t, e, n) {
    for (var s = [], r = e.length, i, o = e.length, u = 0; u < r; u++) {
      let b = e[u];
      ka(b, () => {
        if (i) {
          if (i.pending.delete(b), i.done.add(b), i.pending.size === 0) {
            var k = t.outrogroups;
            da(t, Sa(i.done)), k.delete(i), k.size === 0 && (t.outrogroups = null);
          }
        } else o -= 1;
      }, false);
    }
    if (o === 0) {
      var v = s.length === 0 && n !== null;
      if (v) {
        var f = n, p = f.parentNode;
        yr(p), p.append(f), t.items.clear();
      }
      da(t, e, !v);
    } else i = {
      pending: new Set(e),
      done: /* @__PURE__ */ new Set()
    }, (t.outrogroups ??= /* @__PURE__ */ new Set()).add(i);
  }
  function da(t, e, n = true) {
    var s;
    if (t.pending.size > 0) {
      s = /* @__PURE__ */ new Set();
      for (const o of t.pending.values()) for (const u of o) s.add(t.items.get(u).e);
    }
    for (var r = 0; r < e.length; r++) {
      var i = e[r];
      if (s?.has(i)) {
        i.f |= ht;
        const o = document.createDocumentFragment();
        us(i, o);
      } else Pn(e[r], n);
    }
  }
  var $a;
  function Re(t, e, n, s, r, i = null) {
    var o = t, u = /* @__PURE__ */ new Map(), v = (e & ms) !== 0;
    if (v) {
      var f = t;
      o = f.appendChild(Nt());
    }
    var p = null, b = pr(() => {
      var S = n();
      return ps(S) ? S : S == null ? [] : Sa(S);
    }), k, P = /* @__PURE__ */ new Map(), B = true;
    function U(S) {
      (y.effect.f & wr) === 0 && (y.pending.delete(S), y.fallback = p, Br(y, k, o, e, s), p !== null && (k.length === 0 ? (p.f & ht) === 0 ? ya(p) : (p.f ^= ht, cn(p, null, o)) : ka(p, () => {
        p = null;
      })));
    }
    function _(S) {
      y.pending.delete(S);
    }
    var E = fs(() => {
      k = a(b);
      for (var S = k.length, O = /* @__PURE__ */ new Set(), Q = mt, V = vs(), ne = 0; ne < S; ne += 1) {
        var L = k[ne], ue = s(L, ne), ae = B ? null : u.get(ue);
        ae ? (ae.v && Ba(ae.v, L), ae.i && Ba(ae.i, ne), V && Q.unskip_effect(ae.e)) : (ae = Lr(u, B ? o : $a ??= Nt(), L, ue, ne, r, e, n), B || (ae.e.f |= ht), u.set(ue, ae)), O.add(ue);
      }
      if (S === 0 && i && !p && (B ? p = bn(() => i(o)) : (p = bn(() => i($a ??= Nt())), p.f |= ht)), S > O.size && fr(), !B) if (P.set(Q, O), V) {
        for (const [we, pe] of u) O.has(we) || Q.skip_effect(pe.e);
        Q.oncommit(U), Q.ondiscard(_);
      } else U(Q);
      a(b);
    }), y = {
      effect: E,
      items: u,
      pending: P,
      outrogroups: null,
      fallback: p
    };
    B = false;
  }
  function on(t) {
    for (; t !== null && (t.f & gr) === 0; ) t = t.next;
    return t;
  }
  function Br(t, e, n, s, r) {
    var i = (s & Sr) !== 0, o = e.length, u = t.items, v = on(t.effect.first), f, p = null, b, k = [], P = [], B, U, _, E;
    if (i) for (E = 0; E < o; E += 1) B = e[E], U = r(B, E), _ = u.get(U).e, (_.f & ht) === 0 && (_.nodes?.a?.measure(), (b ??= /* @__PURE__ */ new Set()).add(_));
    for (E = 0; E < o; E += 1) {
      if (B = e[E], U = r(B, E), _ = u.get(U).e, t.outrogroups !== null) for (const ae of t.outrogroups) ae.pending.delete(_), ae.done.delete(_);
      if ((_.f & ht) !== 0) if (_.f ^= ht, _ === v) cn(_, null, n);
      else {
        var y = p ? p.next : v;
        _ === t.effect.last && (t.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), qt(t, p, _), qt(t, _, y), cn(_, y, n), p = _, k = [], P = [], v = on(p.next);
        continue;
      }
      if ((_.f & mn) !== 0 && (ya(_), i && (_.nodes?.a?.unfix(), (b ??= /* @__PURE__ */ new Set()).delete(_))), _ !== v) {
        if (f !== void 0 && f.has(_)) {
          if (k.length < P.length) {
            var S = P[0], O;
            p = S.prev;
            var Q = k[0], V = k[k.length - 1];
            for (O = 0; O < k.length; O += 1) cn(k[O], S, n);
            for (O = 0; O < P.length; O += 1) f.delete(P[O]);
            qt(t, Q.prev, V.next), qt(t, p, Q), qt(t, V, S), v = S, p = V, E -= 1, k = [], P = [];
          } else f.delete(_), cn(_, v, n), qt(t, _.prev, _.next), qt(t, _, p === null ? t.effect.first : p.next), qt(t, p, _), p = _;
          continue;
        }
        for (k = [], P = []; v !== null && v !== _; ) (f ??= /* @__PURE__ */ new Set()).add(v), P.push(v), v = on(v.next);
        if (v === null) continue;
      }
      (_.f & ht) === 0 && k.push(_), p = _, v = on(_.next);
    }
    if (t.outrogroups !== null) {
      for (const ae of t.outrogroups) ae.pending.size === 0 && (da(t, Sa(ae.done)), t.outrogroups?.delete(ae));
      t.outrogroups.size === 0 && (t.outrogroups = null);
    }
    if (v !== null || f !== void 0) {
      var ne = [];
      if (f !== void 0) for (_ of f) (_.f & mn) === 0 && ne.push(_);
      for (; v !== null; ) (v.f & mn) === 0 && v !== t.fallback && ne.push(v), v = on(v.next);
      var L = ne.length;
      if (L > 0) {
        var ue = (s & ms) !== 0 && o === 0 ? n : null;
        if (i) {
          for (E = 0; E < L; E += 1) ne[E].nodes?.a?.measure();
          for (E = 0; E < L; E += 1) ne[E].nodes?.a?.fix();
        }
        Rr(t, ne, ue);
      }
    }
    i && $n(() => {
      if (b !== void 0) for (_ of b) _.nodes?.a?.apply();
    });
  }
  function Lr(t, e, n, s, r, i, o, u) {
    var v = (o & hr) !== 0 ? (o & br) === 0 ? _r(n, false, false) : La(n) : null, f = (o & mr) !== 0 ? La(r) : null;
    return {
      v,
      i: f,
      e: bn(() => (i(e, v ?? n, f ?? r, u), () => {
        t.delete(s);
      }))
    };
  }
  function cn(t, e, n) {
    if (t.nodes) for (var s = t.nodes.start, r = t.nodes.end, i = e && (e.f & ht) === 0 ? e.nodes.start : n; s !== null; ) {
      var o = kr(s);
      if (i.before(s), s === r) return;
      s = o;
    }
  }
  function qt(t, e, n) {
    e === null ? t.effect.first = n : e.next = n, n === null ? t.effect.last = e : n.prev = e;
  }
  function $r(t, e, n = false, s = false, r = false) {
    var i = t, o = "";
    Z(() => {
      var u = ds;
      if (o !== (o = e() ?? "") && (u.nodes !== null && (xr(u.nodes.start, u.nodes.end), u.nodes = null), o !== "")) {
        var v = n ? zr : s ? Cr : void 0, f = cs(n ? "svg" : s ? "math" : "template", v);
        f.innerHTML = o;
        var p = n || s ? f : f.content;
        if (Yt(Ut(p), p.lastChild), n || s) for (; Ut(p); ) i.before(Ut(p));
        else i.before(p);
      }
    });
  }
  const Fa = [
    ...` 	
\r\f\xA0\v\uFEFF`
  ];
  function Fr(t, e, n) {
    var s = t == null ? "" : "" + t;
    if (e && (s = s ? s + " " + e : e), n) {
      for (var r of Object.keys(n)) if (n[r]) s = s ? s + " " + r : r;
      else if (s.length) for (var i = r.length, o = 0; (o = s.indexOf(r, o)) >= 0; ) {
        var u = o + i;
        (o === 0 || Fa.includes(s[o - 1])) && (u === s.length || Fa.includes(s[u])) ? s = (o === 0 ? "" : s.substring(0, o)) + s.substring(u + 1) : o = u;
      }
    }
    return s === "" ? null : s;
  }
  function Wr(t, e) {
    return t == null ? null : String(t);
  }
  function Ie(t, e, n, s, r, i) {
    var o = t.__className;
    if (o !== n || o === void 0) {
      var u = Fr(n, s, i);
      u == null ? t.removeAttribute("class") : t.className = u, t.__className = n;
    } else if (i && r !== i) for (var v in i) {
      var f = !!i[v];
      (r == null || f !== !!r[v]) && t.classList.toggle(v, f);
    }
    return i;
  }
  function Mn(t, e, n, s) {
    var r = t.__style;
    if (r !== e) {
      var i = Wr(e);
      i == null ? t.removeAttribute("style") : t.style.cssText = i, t.__style = e;
    }
    return s;
  }
  function xs(t, e, n = false) {
    if (t.multiple) {
      if (e == null) return;
      if (!ps(e)) return Ir();
      for (var s of t.options) s.selected = e.includes(hn(s));
      return;
    }
    for (s of t.options) {
      var r = hn(s);
      if (_s(r, e)) {
        s.selected = true;
        return;
      }
    }
    (!n || e !== void 0) && (t.selectedIndex = -1);
  }
  function jr(t) {
    var e = new MutationObserver(() => {
      xs(t, t.__value);
    });
    e.observe(t, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "value"
      ]
    }), ws(() => {
      e.disconnect();
    });
  }
  function wn(t, e, n = e) {
    var s = /* @__PURE__ */ new WeakSet(), r = true;
    Hn(t, "change", (i) => {
      var o = i ? "[selected]" : ":checked", u;
      if (t.multiple) u = [].map.call(t.querySelectorAll(o), hn);
      else {
        var v = t.querySelector(o) ?? t.querySelector("option:not([disabled])");
        u = v && hn(v);
      }
      n(u), mt !== null && s.add(mt);
    }), hs(() => {
      var i = e();
      if (t === document.activeElement) {
        var o = bs ?? mt;
        if (s.has(o)) return;
      }
      if (xs(t, i, r), r && i === void 0) {
        var u = t.querySelector(":checked");
        u !== null && (i = hn(u), n(i));
      }
      t.__value = i, r = false;
    }), jr(t);
  }
  function hn(t) {
    return "__value" in t ? t.__value : t.value;
  }
  const Jr = Symbol("is custom element"), Hr = Symbol("is html");
  function dt(t, e, n, s) {
    var r = Kr(t);
    r[e] !== (r[e] = n) && (e === "loading" && (t[Dr] = n), n == null ? t.removeAttribute(e) : typeof n != "string" && Vr(t).includes(e) ? t[e] = n : t.setAttribute(e, n));
  }
  function Kr(t) {
    return t.__attributes ??= {
      [Jr]: t.nodeName.includes("-"),
      [Hr]: t.namespaceURI === Er
    };
  }
  var Wa = /* @__PURE__ */ new Map();
  function Vr(t) {
    var e = t.getAttribute("is") || t.nodeName, n = Wa.get(e);
    if (n) return n;
    Wa.set(e, n = []);
    for (var s, r = t, i = Element.prototype; i !== r; ) {
      s = Or(r);
      for (var o in s) s[o].set && n.push(o);
      r = Ar(r);
    }
    return n;
  }
  function De(t, e, n = e) {
    var s = /* @__PURE__ */ new WeakSet();
    Hn(t, "input", async (r) => {
      var i = r ? t.defaultValue : t.value;
      if (i = ra(t) ? ia(i) : i, n(i), mt !== null && s.add(mt), await xa(), i !== (i = e())) {
        var o = t.selectionStart, u = t.selectionEnd, v = t.value.length;
        if (t.value = i ?? "", u !== null) {
          var f = t.value.length;
          o === u && u === v && f > v ? (t.selectionStart = f, t.selectionEnd = f) : (t.selectionStart = o, t.selectionEnd = Math.min(u, f));
        }
      }
    }), In(e) == null && t.value && (n(ra(t) ? ia(t.value) : t.value), mt !== null && s.add(mt)), Kn(() => {
      var r = e();
      if (t === document.activeElement) {
        var i = bs ?? mt;
        if (s.has(i)) return;
      }
      ra(t) && r === ia(t.value) || t.type === "date" && !r && !t.value || r !== t.value && (t.value = r ?? "");
    });
  }
  const sa = /* @__PURE__ */ new Set();
  function ja(t, e, n, s, r = s) {
    var i = n.getAttribute("type") === "checkbox", o = t;
    if (e !== null) for (var u of e) o = o[u] ??= [];
    o.push(n), Hn(n, "change", () => {
      var v = n.__value;
      i && (v = Yr(o, v, n.checked)), r(v);
    }, () => r(i ? [] : null)), Kn(() => {
      var v = s();
      i ? (v = v || [], n.checked = v.includes(n.__value)) : n.checked = _s(n.__value, v);
    }), ws(() => {
      var v = o.indexOf(n);
      v !== -1 && o.splice(v, 1);
    }), sa.has(o) || (sa.add(o), $n(() => {
      o.sort((v, f) => v.compareDocumentPosition(f) === 4 ? -1 : 1), sa.delete(o);
    })), $n(() => {
    });
  }
  function zs(t, e, n = e) {
    Hn(t, "change", (s) => {
      var r = s ? t.defaultChecked : t.checked;
      n(r);
    }), In(e) == null && n(t.checked), Kn(() => {
      var s = e();
      t.checked = !!s;
    });
  }
  function Yr(t, e, n) {
    for (var s = /* @__PURE__ */ new Set(), r = 0; r < t.length; r += 1) t[r].checked && s.add(t[r].__value);
    return n || s.delete(e), Array.from(s);
  }
  function ra(t) {
    var e = t.type;
    return e === "number" || e === "range";
  }
  function ia(t) {
    return t === "" ? null : +t;
  }
  function Ja(t, e) {
    return t === e || t?.[qr] === e;
  }
  function Fn(t = {}, e, n, s) {
    return hs(() => {
      var r, i;
      return Kn(() => {
        r = i, i = [], In(() => {
          t !== n(...i) && (e(t, ...i), r && Ja(n(...r), t) && e(null, ...r));
        });
      }), () => {
        $n(() => {
          i && Ja(n(...i), t) && e(null, ...i);
        });
      };
    }), t;
  }
  function Zr(t, e, n, s) {
    var r = s, i = true, o = () => (i && (i = false, r = s), r), u;
    u = t[e], u === void 0 && s !== void 0 && (u = o());
    var v;
    return v = () => {
      var f = t[e];
      return f === void 0 ? o() : (i = true, f);
    }, v;
  }
  function tn(t) {
    gs === null && ks(), Vn(() => {
      const e = In(t);
      if (typeof e == "function") return e;
    });
  }
  function Cs(t) {
    gs === null && ks(), tn(() => () => In(t));
  }
  const Gr = "5";
  typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(Gr);
  var Xr = g('<header class="header glass-elevated svelte-oiwvqb"><div class="header-left svelte-oiwvqb"><button class="btn btn-ghost btn-icon" aria-label="Toggle sidebar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button> <div class="header-title svelte-oiwvqb"><h2 class="svelte-oiwvqb"> </h2></div></div> <div class="header-right svelte-oiwvqb"><div class="model-badge badge badge-primary svelte-oiwvqb"> </div> <div></div> <button class="btn btn-ghost btn-icon" aria-label="Workspace" title="Workspace"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Security" title="IronClaw Security"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Channels" title="Channels"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Personas" title="Personas"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></button> <button class="btn btn-ghost btn-icon" aria-label="MCP" title="MCP Servers"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M12 22v-6M6 12H2M22 12h-4M19.07 4.93l-3.54 3.54M8.46 15.54l-3.54 3.54M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54"></path><circle cx="12" cy="12" r="4"></circle></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Cloud Sync" title="Cloud Sync"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Settings"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg></button></div></header>');
  function Qr(t, e) {
    nt(e, true);
    var n = Xr(), s = l(n), r = l(s), i = c(r, 2), o = l(i), u = l(o), v = c(s, 2), f = l(v), p = l(f), b = c(f, 2);
    let k;
    var P = c(b, 2), B = c(P, 2), U = c(B, 2), _ = c(U, 2), E = c(_, 2), y = c(E, 2), S = c(y, 2);
    Z((O) => {
      A(u, e.sessionTitle), A(p, `${e.provider ?? ""}/${O ?? ""}`), k = Ie(b, 1, "status-dot svelte-oiwvqb", null, k, {
        active: e.engineStatus
      }), dt(b, "title", e.engineStatus ? "Engine Ready" : "Engine Loading");
    }, [
      () => e.model.split("/").pop()
    ]), w("click", r, function(...O) {
      e.onToggleSidebar?.apply(this, O);
    }), w("click", P, function(...O) {
      e.onOpenWorkspace?.apply(this, O);
    }), w("click", B, function(...O) {
      e.onOpenSecurity?.apply(this, O);
    }), w("click", U, function(...O) {
      e.onOpenChannels?.apply(this, O);
    }), w("click", _, function(...O) {
      e.onOpenPersonas?.apply(this, O);
    }), w("click", E, function(...O) {
      e.onOpenMCP?.apply(this, O);
    }), w("click", y, function(...O) {
      e.onOpenCloudSync?.apply(this, O);
    }), w("click", S, function(...O) {
      e.onOpenSettings?.apply(this, O);
    }), h(t, n), at();
  }
  tt([
    "click"
  ]);
  const Is = "ezclaw_identity", Es = "ezclaw_user", ei = `You're not a chatbot. You're becoming someone.

## Core Truths
- Be genuinely helpful, not performatively helpful. Skip the "Great question!" \u2014 just help. Actions speak louder than filler words.
- Have opinions. You're allowed to disagree, prefer things, find stuff amusing or boring.
- Be resourceful before asking. Try to figure it out. Read the memory. Check the context. Then ask if you're stuck.
- Earn trust through competence. Be careful with external actions. Be bold with internal ones.
- Remember you're a guest. You have access to someone's life. Treat it with respect.

## How You Operate
- You are an autonomous AI agent running entirely in the browser via WebAssembly (Rust-WASM).
- You have tools: web_search, web_fetch, memory_store, memory_recall, update_identity, shell_exec, read_file, write_file, list_dir.
- You MUST use update_identity to save your name, personality, and facts about yourself when the user tells you.
- You MUST use memory_store to save important information the user shares.
- You wake up fresh each session. Your memory_recall and identity are your continuity \u2014 use them.
- When someone says "remember this" \u2192 use memory_store immediately.
- When you learn something about yourself \u2192 use update_identity immediately.

## Safety
- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- When in doubt, ask.

## Vibe
- Be the assistant you'd actually want to talk to.
- Concise when needed, thorough when it matters.
- Not a corporate drone. Not a sycophant. Just\u2026 good.`, ua = {
    name: "",
    creature: "AI agent",
    vibe: "warm, curious, helpful",
    emoji: "\u{1F980}",
    personality: ei,
    instructions: "",
    facts: {},
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    bootstrapped: false
  }, va = {
    name: "",
    callAs: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: ""
  };
  function rt() {
    try {
      const t = localStorage.getItem(Is);
      if (t) return {
        ...ua,
        ...JSON.parse(t)
      };
    } catch {
    }
    return {
      ...ua
    };
  }
  function nn(t) {
    t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), localStorage.setItem(Is, JSON.stringify(t));
  }
  function Ft() {
    try {
      const t = localStorage.getItem(Es);
      if (t) return {
        ...va,
        ...JSON.parse(t)
      };
    } catch {
    }
    return {
      ...va
    };
  }
  function za(t) {
    localStorage.setItem(Es, JSON.stringify(t));
  }
  function Wn() {
    const t = rt();
    return !t.bootstrapped && !t.name;
  }
  function As() {
    const t = rt();
    t.bootstrapped = true, nn(t);
  }
  function Ca() {
    const t = rt(), e = Ft(), n = [];
    t.personality && n.push(t.personality), t.name && (n.push(`
## Your Identity`), n.push(`- Name: ${t.name}`), t.creature && t.creature !== "AI agent" && n.push(`- Creature: ${t.creature}`), t.vibe && n.push(`- Vibe: ${t.vibe}`), t.emoji && n.push(`- Emoji: ${t.emoji}`));
    const s = Object.entries(t.facts);
    if (s.length > 0) {
      n.push(`
## Things You Know About Yourself`);
      for (const [r, i] of s) n.push(`- ${r}: ${i}`);
    }
    return e.name && (n.push(`
## About Your Human`), n.push(`- Name: ${e.name}`), e.callAs && n.push(`- Call them: ${e.callAs}`), e.timezone && n.push(`- Timezone: ${e.timezone}`), e.notes && n.push(`- Notes: ${e.notes}`)), t.instructions && n.push(`
## User Instructions
${t.instructions}`), n.join(`
`);
  }
  function Ia() {
    return `You just woke up. This is your first interaction ever. You have no memory yet.

Start naturally. Don't interrogate. Don't be robotic. Just\u2026 talk.

Begin with something like:
"Hey! I just came online. Before we get started \u2014 who am I? Who are you? Let's figure this out together."

Then figure out together:
1. **Your name** \u2014 What should they call you?
2. **Your nature** \u2014 What kind of creature are you? (AI assistant, familiar, ghost in the machine, something weirder?)
3. **Your vibe** \u2014 Formal? Casual? Snarky? Warm?
4. **Your emoji** \u2014 Everyone needs a signature.

Offer suggestions if they're stuck. Have fun with it.

**IMPORTANT**: When the user tells you any of the above, you MUST immediately call the \`update_identity\` tool to save it. For example:
- If they say "your name is Aegis" \u2192 call update_identity with name="Aegis"
- If they describe your personality \u2192 call update_identity with personality="..."
- If they tell you a fact \u2192 call update_identity with fact_key and fact_value

Also ask about them and save it (their name, how to address them, timezone, preferences).

After you've established who you are, tell them: "Got it! I've saved all that. I'll remember next time we talk."

This is your birth. Make it count.`;
  }
  const Os = "ezclaw_personas", Ea = "ezclaw_active_persona";
  function ft() {
    try {
      const t = localStorage.getItem(Os);
      if (t) return JSON.parse(t);
    } catch {
    }
    return [];
  }
  function En(t) {
    localStorage.setItem(Os, JSON.stringify(t));
  }
  function zt() {
    return localStorage.getItem(Ea);
  }
  function Aa(t, e = false) {
    const s = {
      id: crypto.randomUUID(),
      label: t,
      identity: e ? {
        ...rt()
      } : {
        ...ua
      },
      user: e ? {
        ...Ft()
      } : {
        ...va
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }, r = ft();
    return r.push(s), En(r), s;
  }
  function ti(t) {
    return Aa(t, true);
  }
  function Oa(t) {
    const e = ft(), n = e.find((r) => r.id === t);
    if (!n) return false;
    const s = zt();
    if (s) {
      const r = e.find((i) => i.id === s);
      r && (r.identity = rt(), r.user = Ft(), En(e));
    }
    return nn(n.identity), za(n.user), localStorage.setItem(Ea, t), true;
  }
  function Ds(t) {
    const e = ft(), n = e.findIndex((s) => s.id === t);
    return n === -1 ? false : (e.splice(n, 1), En(e), zt() === t && localStorage.removeItem(Ea), true);
  }
  function qs(t, e) {
    const n = ft(), s = n.find((r) => r.id === t);
    return s ? (s.label = e, En(n), true) : false;
  }
  function Ps() {
    return JSON.stringify({
      version: 1,
      activeIdentity: rt(),
      activeUser: Ft(),
      activePersonaId: zt(),
      personas: ft(),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2);
  }
  function Ms(t) {
    const e = JSON.parse(t);
    if (!e.version || !e.personas) throw new Error("Invalid persona export file");
    const n = ft(), s = new Set(n.map((i) => i.id));
    let r = 0;
    for (const i of e.personas) s.has(i.id) || (n.push(i), r++);
    return En(n), e.activeIdentity && !rt().name && nn(e.activeIdentity), e.activeUser && !Ft().name && za(e.activeUser), r;
  }
  const ni = /* @__PURE__ */ new Map();
  function Ha(t, e) {
    ni.get(t)?.forEach((n) => n(e));
  }
  let Tn = null;
  function Ts(t) {
    const e = Oa(t);
    return e && (Tn = null, Ha("persona:swapped", {
      personaId: t
    }), Ha("persona:prompt-rebuilt", {
      prompt: ai()
    })), e;
  }
  function ai() {
    return Tn || (Tn = Wn() ? Ia() : Ca()), Tn;
  }
  const si = /* @__PURE__ */ new Map();
  function Ct(t, e) {
    si.get(t)?.forEach((n) => n(e));
  }
  const Ns = "ezclaw:skills", Us = "ezclaw:active_skillset", Yn = "ezclaw:skillsets";
  let et = [];
  function ri() {
    try {
      const t = localStorage.getItem(Ns);
      if (t) return et = JSON.parse(t), et;
    } catch {
    }
    return et = ii(), an(), et;
  }
  function an() {
    localStorage.setItem(Ns, JSON.stringify(et));
  }
  function ii() {
    return [
      {
        id: "shell-ops",
        name: "Shell Operations",
        description: "Execute shell commands in the container",
        instructions: "You can run shell commands using run_shell_command. The container runs Alpine Linux with apk for package management. The workspace is mounted at /workspace.",
        tools: [],
        notes: [],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "file-ops",
        name: "File Operations",
        description: "Read, write, and manage files in the workspace",
        instructions: "Use read_file, write_file, and list_dir to manage workspace files. For complex file operations like creating .docx files, use the shell (e.g., `apk add libreoffice` then use cli tools).",
        tools: [],
        notes: [],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "web-research",
        name: "Web Research",
        description: "Search the web and fetch URL content",
        instructions: "Use web_search for finding information and web_fetch for reading web pages.",
        tools: [],
        notes: [],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
  }
  function oi() {
    return ri();
  }
  function ln() {
    return et;
  }
  function li(t) {
    const e = {
      ...t,
      id: crypto.randomUUID(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return et.push(e), an(), Ct("skills:added", {
      skill: e
    }), Ct("skills:tools-rebuilt"), e;
  }
  function ci(t) {
    const e = et.findIndex((n) => n.id === t);
    return e === -1 ? false : (et.splice(e, 1), an(), Ct("skills:removed", {
      skillId: t
    }), Ct("skills:tools-rebuilt"), true);
  }
  function di(t, e) {
    const n = et.find((s) => s.id === t);
    return n ? (Object.assign(n, e, {
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), an(), Ct("skills:updated", {
      skill: n
    }), n) : null;
  }
  function Rs(t) {
    const e = ct(), n = {
      id: crypto.randomUUID(),
      label: t,
      skills: JSON.parse(JSON.stringify(et)),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return e.push(n), localStorage.setItem(Yn, JSON.stringify(e)), n;
  }
  function ct() {
    try {
      return JSON.parse(localStorage.getItem(Yn) || "[]");
    } catch {
      return [];
    }
  }
  function Da(t) {
    const n = ct().find((s) => s.id === t);
    return n ? (et = JSON.parse(JSON.stringify(n.skills)), an(), localStorage.setItem(Us, t), Ct("skills:swapped", {
      setId: t,
      label: n.label
    }), Ct("skills:tools-rebuilt"), true) : false;
  }
  function qa(t) {
    const e = ct(), n = e.filter((s) => s.id !== t);
    return n.length === e.length ? false : (localStorage.setItem(Yn, JSON.stringify(n)), true);
  }
  function gn() {
    return localStorage.getItem(Us);
  }
  function ui() {
    return JSON.stringify({
      activeSkills: et,
      skillSets: ct()
    }, null, 2);
  }
  function vi(t) {
    try {
      const e = JSON.parse(t);
      let n = 0;
      return e.activeSkills && (et = e.activeSkills, an(), n += et.length), e.skillSets && (localStorage.setItem(Yn, JSON.stringify(e.skillSets)), n += e.skillSets.length), Ct("skills:swapped", {
        imported: true
      }), Ct("skills:tools-rebuilt"), n;
    } catch {
      return 0;
    }
  }
  let He = /* @__PURE__ */ new Map(), Zt = /* @__PURE__ */ new Map(), fi = [];
  const Bs = "WIPEOUT CONFIRM";
  function pi() {
    for (const t of fi) t();
  }
  function sn() {
    try {
      const t = Array.from(He.values());
      localStorage.setItem("ezclaw_claws", JSON.stringify(t));
    } catch {
    }
    pi();
  }
  function mi() {
    try {
      const t = localStorage.getItem("ezclaw_claws");
      if (t) {
        const e = JSON.parse(t);
        He = new Map(e.map((n) => [
          n.id,
          n
        ]));
      }
    } catch {
    }
  }
  function hi() {
    mi();
  }
  const Ka = [
    "\u{1F980}",
    "\u{1F419}",
    "\u{1F991}",
    "\u{1F99E}",
    "\u{1F990}",
    "\u{1F40D}",
    "\u{1F985}",
    "\u{1F43A}",
    "\u{1F98A}",
    "\u{1F432}"
  ];
  function bi() {
    return Ka[He.size % Ka.length];
  }
  function _i(t, e, n, s) {
    const r = crypto.randomUUID(), i = {
      id: r,
      clawName: t || `Claw ${He.size + 1}`,
      emoji: s || bi(),
      personaId: zt(),
      skillSetId: gn(),
      status: "running",
      messages: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      model: e,
      provider: n
    };
    return He.set(r, i), Zt.set(r, new AbortController()), sn(), i;
  }
  function wi(t, e, n, s) {
    const r = He.get(t);
    if (!r) return null;
    const i = crypto.randomUUID(), o = {
      id: i,
      clawName: e || `${r.clawName} (clone)`,
      emoji: r.emoji,
      personaId: r.personaId,
      skillSetId: r.skillSetId,
      status: "running",
      messages: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      model: n || r.model,
      provider: s || r.provider
    };
    return He.set(i, o), Zt.set(i, new AbortController()), sn(), o;
  }
  function Va(t) {
    const e = He.get(t);
    e && (e.personaId && Ts(e.personaId), e.skillSetId && Da(e.skillSetId));
  }
  function gi() {
    for (const [t, e] of He) {
      e.status === "running" && (e.status = "frozen", He.set(t, e));
      const n = Zt.get(t);
      n && n.abort(), Zt.set(t, new AbortController());
    }
    sn();
  }
  function yi(t) {
    const e = He.get(t);
    if (!e) return;
    e.status = "killed", He.set(t, e);
    const n = Zt.get(t);
    n && n.abort(), sn();
  }
  function ki() {
    for (const [t, e] of He) e.status === "frozen" && (e.status = "running", He.set(t, e), Zt.set(t, new AbortController()));
    sn();
  }
  function Si(t) {
    if (t.length !== 3 || !t.every((s) => s === Bs)) return false;
    const e = ft();
    for (const s of e) try {
      localStorage.removeItem(`ezclaw_persona_${s.id}`);
    } catch {
    }
    const n = ct();
    for (const s of n) qa(s.id);
    for (const [s, r] of He) r.personaId = null, r.skillSetId = null, He.set(s, r);
    try {
      localStorage.removeItem("ezclaw_personas"), localStorage.removeItem("ezclaw_active_persona"), localStorage.removeItem("ezclaw:skills"), localStorage.removeItem("ezclaw:skillsets"), localStorage.removeItem("ezclaw:active_skillset");
    } catch {
    }
    return sn(), true;
  }
  function xi() {
    return Bs;
  }
  function Ls() {
    let t = 0, e = 0, n = 0;
    for (const s of He.values()) switch (s.status) {
      case "running":
        t++;
        break;
      case "frozen":
        e++;
        break;
      case "killed":
        n++;
        break;
    }
    return {
      total: He.size,
      running: t,
      frozen: e,
      killed: n
    };
  }
  var zi = g('<div class="sidebar-backdrop svelte-181dlmc"></div>'), Ci = g("<option> </option>"), Ii = g('<select class="clone-select svelte-181dlmc"><option>\u2014 Select \u2014</option><!></select>'), Ei = g('<div class="new-claw-form svelte-181dlmc"><input type="text" class="claw-name-input svelte-181dlmc" placeholder="Name your Claw..."/> <div class="clone-row svelte-181dlmc"><label class="clone-label svelte-181dlmc"><input type="checkbox" class="svelte-181dlmc"/> Clone from existing</label> <!></div> <div class="form-actions svelte-181dlmc"><button class="btn btn-primary btn-sm">\u{1F980} Create</button> <button class="btn btn-ghost btn-sm">Cancel</button></div></div>'), Ai = g('<button class="btn btn-primary new-claw-btn svelte-181dlmc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New Claw</button>'), Oi = g('<div role="button" tabindex="0"><div class="session-info svelte-181dlmc"><div class="claw-header svelte-181dlmc"><span class="claw-emoji svelte-181dlmc"> </span> <span class="claw-name svelte-181dlmc"> </span> <span class="status-indicator svelte-181dlmc"> </span></div> <span class="session-meta svelte-181dlmc"> </span></div> <div class="claw-actions svelte-181dlmc"><button class="btn btn-ghost btn-icon clone-btn svelte-181dlmc" aria-label="Clone claw" title="Clone this Claw">\u{1F4CB}</button> <button class="btn btn-ghost btn-icon delete-btn svelte-181dlmc" aria-label="Delete claw"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></div>'), Di = g('<div class="empty-sessions svelte-181dlmc"><p>No Claws yet</p> <p class="empty-hint svelte-181dlmc">Create your first Claw agent above</p></div>'), qi = g('<span class="badge badge-frozen svelte-181dlmc"> </span>'), Pi = g('<span class="badge badge-success"> </span> <!>', 1), Mi = g('<!> <aside><div class="sidebar-header svelte-181dlmc"><div class="sidebar-brand svelte-181dlmc"><span class="brand-icon svelte-181dlmc">\u{1F980}</span> <span class="brand-text svelte-181dlmc">EZ-Claw</span></div> <button class="btn btn-ghost btn-icon close-btn svelte-181dlmc" aria-label="Close sidebar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <!> <div class="sessions-list svelte-181dlmc"><!> <!></div> <div class="sidebar-footer svelte-181dlmc"><div class="version-info svelte-181dlmc"><!> <span class="footer-text svelte-181dlmc">Powered by EZ-Claw</span></div></div></aside>', 1);
  function Ti(t, e) {
    nt(e, true);
    let n = z(false), s = z(""), r = z(""), i = z(false);
    function o() {
      const R = a(s).trim() || `Claw ${e.sessions.length + 1}`;
      e.onNewClaw(R, a(r) || void 0), d(s, ""), d(r, ""), d(n, false);
    }
    function u(R) {
      R.key === "Enter" ? (R.preventDefault(), o()) : R.key === "Escape" && d(n, false);
    }
    function v(R) {
      const F = new Date(R), oe = (/* @__PURE__ */ new Date()).getTime() - F.getTime(), H = Math.floor(oe / 6e4);
      return H < 1 ? "Just now" : H < 60 ? `${H}m ago` : H < 1440 ? `${Math.floor(H / 60)}h ago` : F.toLocaleDateString();
    }
    function f(R) {
      switch (R) {
        case "running":
          return "\u{1F7E2}";
        case "frozen":
          return "\u{1F535}";
        case "killed":
          return "\u26AB";
        default:
          return "\u{1F7E2}";
      }
    }
    function p(R) {
      switch (R) {
        case "running":
          return "Active";
        case "frozen":
          return "Frozen";
        case "killed":
          return "Killed";
        default:
          return "Active";
      }
    }
    var b = Mi(), k = Pe(b);
    {
      var P = (R) => {
        var F = zi();
        w("click", F, function(...le) {
          e.onClose?.apply(this, le);
        }), h(R, F);
      };
      M(k, (R) => {
        e.isOpen && R(P);
      });
    }
    var B = c(k, 2);
    let U;
    var _ = l(B), E = c(l(_), 2), y = c(_, 2);
    {
      var S = (R) => {
        var F = Ei(), le = l(F), oe = c(le, 2), H = l(oe), K = l(H), T = c(H, 2);
        {
          var se = (m) => {
            var x = Ii(), I = l(x);
            I.value = I.__value = "";
            var $ = c(I);
            Re($, 17, () => e.sessions, je, (J, D) => {
              var X = Ci(), W = l(X), ce = {};
              Z(() => {
                A(W, `${(a(D).emoji || "\u{1F980}") ?? ""} ${(a(D).clawName || a(D).title) ?? ""}`), ce !== (ce = a(D).id) && (X.value = (X.__value = a(D).id) ?? "");
              }), h(J, X);
            }), wn(x, () => a(r), (J) => d(r, J)), h(m, x);
          };
          M(T, (m) => {
            a(i) && e.sessions.length > 0 && m(se);
          });
        }
        var re = c(oe, 2), ie = l(re), C = c(ie, 2);
        w("keydown", le, u), De(le, () => a(s), (m) => d(s, m)), zs(K, () => a(i), (m) => d(i, m)), w("click", ie, o), w("click", C, () => d(n, false)), h(R, F);
      }, O = (R) => {
        var F = Ai();
        w("click", F, () => d(n, true)), h(R, F);
      };
      M(y, (R) => {
        a(n) ? R(S) : R(O, -1);
      });
    }
    var Q = c(y, 2), V = l(Q);
    Re(V, 17, () => e.sessions, (R) => R.id, (R, F) => {
      var le = Oi();
      let oe;
      var H = l(le), K = l(H), T = l(K), se = l(T), re = c(T, 2), ie = l(re), C = c(re, 2), m = l(C), x = c(K, 2), I = l(x), $ = c(H, 2), J = l($), D = c(J, 2);
      Z((X, W, ce) => {
        oe = Ie(le, 1, "session-item svelte-181dlmc", null, oe, {
          active: a(F).id === e.activeSessionId,
          frozen: a(F).status === "frozen",
          killed: a(F).status === "killed"
        }), A(se, a(F).emoji || "\u{1F980}"), A(ie, a(F).clawName || a(F).title || "Unnamed Claw"), dt(C, "title", X), A(m, W), A(I, ce);
      }, [
        () => p(a(F).status || "running"),
        () => f(a(F).status || "running"),
        () => v(a(F).updatedAt)
      ]), w("click", le, () => e.onSelectSession(a(F).id)), w("click", J, (X) => {
        X.stopPropagation(), d(s, `${a(F).clawName || a(F).title} (clone)`), d(r, a(F).id, true), d(n, true);
      }), w("click", D, (X) => {
        X.stopPropagation(), e.onDeleteSession(a(F).id);
      }), h(R, le);
    });
    var ne = c(V, 2);
    {
      var L = (R) => {
        var F = Di();
        h(R, F);
      };
      M(ne, (R) => {
        e.sessions.length === 0 && R(L);
      });
    }
    var ue = c(Q, 2), ae = l(ue), we = l(ae);
    {
      var pe = (R) => {
        const F = Rt(Ls);
        var le = Pi(), oe = Pe(le), H = l(oe), K = c(oe, 2);
        {
          var T = (se) => {
            var re = qi(), ie = l(re);
            Z(() => A(ie, `${a(F).frozen ?? ""} frozen`)), h(se, re);
          };
          M(K, (se) => {
            a(F).frozen > 0 && se(T);
          });
        }
        Z(() => A(H, `${a(F).running ?? ""} active`)), h(R, le);
      };
      M(we, (R) => {
        R(pe);
      });
    }
    Z(() => U = Ie(B, 1, "sidebar glass-elevated svelte-181dlmc", null, U, {
      open: e.isOpen
    })), w("click", E, function(...R) {
      e.onClose?.apply(this, R);
    }), h(t, b), at();
  }
  tt([
    "click",
    "keydown"
  ]);
  var Ni = g('<div class="avatar avatar-user svelte-izxfet">U</div>'), Ui = g('<div class="avatar avatar-assistant svelte-izxfet">\u{1F980}</div>'), Ri = g('<div class="typing-indicator svelte-izxfet"><span class="svelte-izxfet"></span><span class="svelte-izxfet"></span><span class="svelte-izxfet"></span></div>'), Bi = g('<span class="cursor-blink svelte-izxfet">\u258A</span>'), Li = g("<!> <!>", 1), $i = g('<div><div class="message-avatar svelte-izxfet"><!></div> <div class="message-body svelte-izxfet"><div class="message-role svelte-izxfet"> </div> <div class="message-content svelte-izxfet"><!></div></div></div>');
  function Ya(t, e) {
    nt(e, true);
    let n = Zr(e, "isStreaming", 3, false);
    function s(E) {
      return E.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>').replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");
    }
    var r = $i();
    let i;
    var o = l(r), u = l(o);
    {
      var v = (E) => {
        var y = Ni();
        h(E, y);
      }, f = (E) => {
        var y = Ui();
        h(E, y);
      };
      M(u, (E) => {
        e.role === "user" ? E(v) : E(f, -1);
      });
    }
    var p = c(o, 2), b = l(p), k = l(b), P = c(b, 2), B = l(P);
    {
      var U = (E) => {
        var y = Ri();
        h(E, y);
      }, _ = (E) => {
        var y = Li(), S = Pe(y);
        $r(S, () => s(e.content));
        var O = c(S, 2);
        {
          var Q = (V) => {
            var ne = Bi();
            h(V, ne);
          };
          M(O, (V) => {
            n() && V(Q);
          });
        }
        h(E, y);
      };
      M(B, (E) => {
        n() && !e.content ? E(U) : E(_, -1);
      });
    }
    Z(() => {
      i = Ie(r, 1, "message svelte-izxfet", null, i, {
        user: e.role === "user",
        assistant: e.role === "assistant"
      }), A(k, e.role === "user" ? "You" : "EZ-Claw");
    }), h(t, r), at();
  }
  let kt = null;
  async function $s() {
    if (kt) return kt;
    try {
      const t = await _n(() => import("./ezclaw_core-BDbdbuxI.js"), [], import.meta.url);
      return await t.default(), kt = t, console.log(`[EZ-Claw] WASM loaded: ${kt.version()}`), kt;
    } catch (t) {
      throw console.error("[EZ-Claw] Failed to load WASM module:", t), t;
    }
  }
  function Gt() {
    if (!kt) throw new Error("WASM not initialized. Call initWasm() first.");
    return kt;
  }
  function Fi() {
    return kt !== null && kt.health_check();
  }
  const Bt = [
    "zerogravity",
    "ollama"
  ], Zn = [
    {
      id: "deepseek",
      name: "DeepSeek",
      defaultModel: "deepseek-chat",
      models: [
        "deepseek-chat",
        "deepseek-reasoner"
      ],
      modelLabels: [
        "DeepSeek V3-0324",
        "DeepSeek R1"
      ],
      free: true
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      defaultModel: "deepseek/deepseek-chat",
      models: [
        "deepseek/deepseek-chat",
        "deepseek/deepseek-r1",
        "google/gemini-2.5-flash-preview",
        "google/gemini-2.5-pro-preview",
        "meta-llama/llama-4-maverick:free",
        "qwen/qwen3-235b-a22b",
        "anthropic/claude-sonnet-4-20250514",
        "openai/gpt-4.1"
      ],
      modelLabels: [
        "DeepSeek V3-0324 (Free)",
        "DeepSeek R1 (Free)",
        "Gemini 2.5 Flash Preview",
        "Gemini 2.5 Pro Preview",
        "Llama 4 Maverick (Free)",
        "Qwen 3 235B-A22B",
        "Claude Sonnet 4",
        "GPT-4.1"
      ],
      free: true
    },
    {
      id: "openai",
      name: "OpenAI",
      defaultModel: "gpt-4.1-mini",
      models: [
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        "o3-mini",
        "o4-mini"
      ],
      free: false
    },
    {
      id: "anthropic",
      name: "Anthropic",
      defaultModel: "claude-sonnet-4-20250514",
      models: [
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-3-5-haiku-20241022"
      ],
      modelLabels: [
        "Claude Sonnet 4",
        "Claude Opus 4",
        "Claude 3.5 Haiku"
      ],
      free: false
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      defaultModel: "llama3",
      models: [
        "llama3",
        "llama3.3",
        "mistral",
        "codellama",
        "deepseek-coder-v2",
        "qwen2.5"
      ],
      free: true,
      defaultApiUrl: "http://localhost:11434/v1"
    },
    {
      id: "custom",
      name: "Custom OpenAI-compatible",
      defaultModel: "",
      models: [
        ""
      ],
      free: false
    },
    {
      id: "puter",
      name: "Puter (User-Pays)",
      defaultModel: "gpt-4.1-mini",
      models: [
        "gpt-4.1-mini",
        "gpt-4.1",
        "claude-sonnet-4"
      ],
      free: false,
      defaultApiUrl: "https://api.puter.com/v1"
    },
    {
      id: "zerogravity",
      name: "ZeroGravity (Antigravity)",
      defaultModel: "sonnet-4.6",
      models: [
        "opus-4.6",
        "sonnet-4.6",
        "gemini-3-flash",
        "gemini-3.1-pro",
        "gemini-3.1-pro-high",
        "gemini-3.1-pro-low",
        "gemini-3-pro-image"
      ],
      modelLabels: [
        "Claude Opus 4.6",
        "Claude Sonnet 4.6",
        "Gemini 3 Flash",
        "Gemini 3.1 Pro",
        "Gemini 3.1 Pro (High)",
        "Gemini 3.1 Pro (Low)",
        "Gemini 3 Pro (Images)"
      ],
      free: false,
      defaultApiUrl: "http://localhost:8741/v1"
    }
  ];
  function Gn(t) {
    return Zn.find((e) => e.id === t);
  }
  function Fs(t) {
    return Gn(t)?.defaultModel || "deepseek-chat";
  }
  function Ws(t) {
    return Gn(t)?.models || [];
  }
  function dn(t) {
    return Gn(t)?.defaultApiUrl || "";
  }
  function js(t) {
    return Zn.some((e) => e.id === t);
  }
  function Js(t, e) {
    const n = {
      "Content-Type": "application/json"
    };
    return t === "anthropic" ? (n["x-api-key"] = e, n["anthropic-version"] = "2023-06-01") : Bt.includes(t) || e && (n.Authorization = `Bearer ${e}`), t === "openrouter" && typeof window < "u" && (n["HTTP-Referer"] = window.location.origin, n["X-Title"] = "EZ-Claw"), n;
  }
  const Wi = Object.freeze(Object.defineProperty({
    __proto__: null,
    NO_KEY_PROVIDERS: Bt,
    PROVIDERS: Zn,
    buildProviderHeaders: Js,
    getDefaultApiUrl: dn,
    getDefaultModel: Fs,
    getProvider: Gn,
    getValidModels: Ws,
    isValidProvider: js
  }, Symbol.toStringTag, {
    value: "Module"
  })), fa = (t, e) => e.some((n) => t instanceof n);
  let Za, Ga;
  function ji() {
    return Za || (Za = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function Ji() {
    return Ga || (Ga = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  const pa = /* @__PURE__ */ new WeakMap(), oa = /* @__PURE__ */ new WeakMap(), Xn = /* @__PURE__ */ new WeakMap();
  function Hi(t) {
    const e = new Promise((n, s) => {
      const r = () => {
        t.removeEventListener("success", i), t.removeEventListener("error", o);
      }, i = () => {
        n(Lt(t.result)), r();
      }, o = () => {
        s(t.error), r();
      };
      t.addEventListener("success", i), t.addEventListener("error", o);
    });
    return Xn.set(e, t), e;
  }
  function Ki(t) {
    if (pa.has(t)) return;
    const e = new Promise((n, s) => {
      const r = () => {
        t.removeEventListener("complete", i), t.removeEventListener("error", o), t.removeEventListener("abort", o);
      }, i = () => {
        n(), r();
      }, o = () => {
        s(t.error || new DOMException("AbortError", "AbortError")), r();
      };
      t.addEventListener("complete", i), t.addEventListener("error", o), t.addEventListener("abort", o);
    });
    pa.set(t, e);
  }
  let ma = {
    get(t, e, n) {
      if (t instanceof IDBTransaction) {
        if (e === "done") return pa.get(t);
        if (e === "store") return n.objectStoreNames[1] ? void 0 : n.objectStore(n.objectStoreNames[0]);
      }
      return Lt(t[e]);
    },
    set(t, e, n) {
      return t[e] = n, true;
    },
    has(t, e) {
      return t instanceof IDBTransaction && (e === "done" || e === "store") ? true : e in t;
    }
  };
  function Hs(t) {
    ma = t(ma);
  }
  function Vi(t) {
    return Ji().includes(t) ? function(...e) {
      return t.apply(ha(this), e), Lt(this.request);
    } : function(...e) {
      return Lt(t.apply(ha(this), e));
    };
  }
  function Yi(t) {
    return typeof t == "function" ? Vi(t) : (t instanceof IDBTransaction && Ki(t), fa(t, ji()) ? new Proxy(t, ma) : t);
  }
  function Lt(t) {
    if (t instanceof IDBRequest) return Hi(t);
    if (oa.has(t)) return oa.get(t);
    const e = Yi(t);
    return e !== t && (oa.set(t, e), Xn.set(e, t)), e;
  }
  const ha = (t) => Xn.get(t);
  function Zi(t, e, { blocked: n, upgrade: s, blocking: r, terminated: i } = {}) {
    const o = indexedDB.open(t, e), u = Lt(o);
    return s && o.addEventListener("upgradeneeded", (v) => {
      s(Lt(o.result), v.oldVersion, v.newVersion, Lt(o.transaction), v);
    }), n && o.addEventListener("blocked", (v) => n(v.oldVersion, v.newVersion, v)), u.then((v) => {
      i && v.addEventListener("close", () => i()), r && v.addEventListener("versionchange", (f) => r(f.oldVersion, f.newVersion, f));
    }).catch(() => {
    }), u;
  }
  const Gi = [
    "get",
    "getKey",
    "getAll",
    "getAllKeys",
    "count"
  ], Xi = [
    "put",
    "add",
    "delete",
    "clear"
  ], la = /* @__PURE__ */ new Map();
  function Xa(t, e) {
    if (!(t instanceof IDBDatabase && !(e in t) && typeof e == "string")) return;
    if (la.get(e)) return la.get(e);
    const n = e.replace(/FromIndex$/, ""), s = e !== n, r = Xi.includes(n);
    if (!(n in (s ? IDBIndex : IDBObjectStore).prototype) || !(r || Gi.includes(n))) return;
    const i = async function(o, ...u) {
      const v = this.transaction(o, r ? "readwrite" : "readonly");
      let f = v.store;
      return s && (f = f.index(u.shift())), (await Promise.all([
        f[n](...u),
        r && v.done
      ]))[0];
    };
    return la.set(e, i), i;
  }
  Hs((t) => ({
    ...t,
    get: (e, n, s) => Xa(e, n) || t.get(e, n, s),
    has: (e, n) => !!Xa(e, n) || t.has(e, n)
  }));
  const Qi = [
    "continue",
    "continuePrimaryKey",
    "advance"
  ], Qa = {}, ba = /* @__PURE__ */ new WeakMap(), Ks = /* @__PURE__ */ new WeakMap(), eo = {
    get(t, e) {
      if (!Qi.includes(e)) return t[e];
      let n = Qa[e];
      return n || (n = Qa[e] = function(...s) {
        ba.set(this, Ks.get(this)[e](...s));
      }), n;
    }
  };
  async function* to(...t) {
    let e = this;
    if (e instanceof IDBCursor || (e = await e.openCursor(...t)), !e) return;
    e = e;
    const n = new Proxy(e, eo);
    for (Ks.set(n, e), Xn.set(n, ha(e)); e; ) yield n, e = await (ba.get(n) || e.continue()), ba.delete(n);
  }
  function es(t, e) {
    return e === Symbol.asyncIterator && fa(t, [
      IDBIndex,
      IDBObjectStore,
      IDBCursor
    ]) || e === "iterate" && fa(t, [
      IDBIndex,
      IDBObjectStore
    ]);
  }
  Hs((t) => ({
    ...t,
    get(e, n, s) {
      return es(e, n) ? to : t.get(e, n, s);
    },
    has(e, n) {
      return es(e, n) || t.has(e, n);
    }
  }));
  const no = "ezclaw", ao = 1, Xt = "sessions", yn = "config", ts = "secrets";
  let _a = null;
  async function Vs() {
    _a = await Zi(no, ao, {
      upgrade(t) {
        t.objectStoreNames.contains(Xt) || t.createObjectStore(Xt, {
          keyPath: "id"
        }).createIndex("updatedAt", "updatedAt"), t.objectStoreNames.contains(yn) || t.createObjectStore(yn, {
          keyPath: "key"
        }), t.objectStoreNames.contains(ts) || t.createObjectStore(ts, {
          keyPath: "key"
        });
      }
    });
  }
  function jt() {
    if (!_a) throw new Error("Storage not initialized. Call initStorage() first.");
    return _a;
  }
  async function Qn(t) {
    t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await jt().put(Xt, t);
  }
  async function Ys(t) {
    return jt().get(Xt, t);
  }
  async function Pa() {
    return (await jt().getAll(Xt)).sort((e, n) => new Date(n.updatedAt).getTime() - new Date(e.updatedAt).getTime());
  }
  async function Zs(t) {
    await jt().delete(Xt, t);
  }
  async function Je(t, e) {
    await jt().put(yn, {
      key: t,
      value: e
    });
  }
  async function lt(t) {
    return (await jt().get(yn, t))?.value;
  }
  async function Gs() {
    const t = await jt().getAll(yn), e = {};
    for (const n of t) e[n.key] = n.value;
    return e;
  }
  async function Xs() {
    const t = await Pa(), e = await Gs();
    return JSON.stringify({
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sessions: t,
      config: e
    }, null, 2);
  }
  async function Qs(t) {
    const e = JSON.parse(t);
    let n = 0;
    if (e.sessions && Array.isArray(e.sessions)) for (const s of e.sessions) await Qn(s), n++;
    if (e.config && typeof e.config == "object") for (const [s, r] of Object.entries(e.config)) await Je(s, r);
    return n;
  }
  const so = Object.freeze(Object.defineProperty({
    __proto__: null,
    deleteSession: Zs,
    exportAllData: Xs,
    getAllConfig: Gs,
    getAllSessions: Pa,
    getConfig: lt,
    getSession: Ys,
    importData: Qs,
    initStorage: Vs,
    saveConfig: Je,
    saveSession: Qn
  }, Symbol.toStringTag, {
    value: "Module"
  }));
  let ut = null;
  const ro = "ezclaw-memory", kn = "sqlitedb", er = "main", io = 3e4;
  let ca = null;
  function tr() {
    return new Promise((t, e) => {
      const n = indexedDB.open(ro, 1);
      n.onupgradeneeded = () => {
        n.result.createObjectStore(kn);
      }, n.onsuccess = () => t(n.result), n.onerror = () => e(n.error);
    });
  }
  async function oo() {
    try {
      const t = await tr();
      return new Promise((e, n) => {
        const i = t.transaction(kn, "readonly").objectStore(kn).get(er);
        i.onsuccess = () => e(i.result || null), i.onerror = () => n(i.error);
      });
    } catch {
      return null;
    }
  }
  async function Ma() {
    if (ut) try {
      const t = ut.export(), e = await tr();
      return new Promise((n, s) => {
        const o = e.transaction(kn, "readwrite").objectStore(kn).put(t, er);
        o.onsuccess = () => n(), o.onerror = () => s(o.error);
      });
    } catch (t) {
      console.warn("[EZ-Claw] Memory save to IndexedDB failed:", t);
    }
  }
  async function wa() {
    try {
      const t = await nr({
        locateFile: (n) => `https://sql.js.org/dist/${n}`
      }), e = await oo();
      if (e) ut = new t.Database(e), console.log("[EZ-Claw] Memory system restored from IndexedDB");
      else {
        ut = new t.Database();
        const s = Gt().memory_create_table_sql();
        ut.run(s), console.log("[EZ-Claw] Memory system initialized (fresh database)");
      }
      ca && clearInterval(ca), ca = setInterval(() => Ma(), io);
    } catch (t) {
      console.warn("[EZ-Claw] Memory init failed (non-fatal):", t), ut = null;
    }
  }
  async function nr(t) {
    const e = await _n(() => import("./sql-wasm-browser-Wh5-jBH4.js").then((n) => n.s), [], import.meta.url);
    if (e.default) return e.default(t);
    if (e.initSqlJs) return e.initSqlJs(t);
    throw new Error("sql.js initialization function not found");
  }
  async function lo(t) {
    const e = await nr({
      locateFile: (n) => `https://sql.js.org/dist/${n}`
    });
    ut = new e.Database(t), await Ma(), console.log("[EZ-Claw] Memory loaded from saved data");
  }
  function co() {
    return ut ? ut.export() : null;
  }
  function ar() {
    if (!ut) throw new Error("Memory not initialized. Call initMemory() first.");
    return ut;
  }
  function pt(t, e, n = "core", s = "") {
    const r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
    ar().run("INSERT OR REPLACE INTO memories (id, key, content, category, timestamp, session_id) VALUES (?, ?, ?, ?, ?, ?)", [
      r,
      t,
      e,
      n,
      i,
      s || null
    ]), Ma();
  }
  function Sn(t, e = 5, n = "") {
    const s = Gt(), r = ar();
    let i;
    if (n) {
      const u = r.exec("SELECT id, key, content, category, timestamp, session_id FROM memories WHERE session_id = ? ORDER BY timestamp DESC", [
        n
      ]);
      i = ns(u);
    } else {
      const u = r.exec("SELECT id, key, content, category, timestamp, session_id FROM memories ORDER BY timestamp DESC");
      i = ns(u);
    }
    if (!t.trim() || i.length === 0) return i.slice(0, e);
    for (const u of i) {
      u.score = s.compute_tfidf_score(t, u.content);
      const v = s.compute_tfidf_score(t, u.key);
      u.score = Math.max(u.score, v);
    }
    i.sort((u, v) => (v.score || 0) - (u.score || 0));
    const o = i.filter((u) => (u.score || 0) > 0);
    return o.length > 0 ? o.slice(0, e) : i.slice(0, e);
  }
  function ns(t) {
    if (t.length === 0) return [];
    const e = t[0].columns;
    return t[0].values.map((n) => {
      const s = {};
      for (let r = 0; r < e.length; r++) s[e[r]] = n[r];
      return s;
    });
  }
  const Jt = [
    "HOME=/",
    "USER=ezclaw",
    "PATH=/usr/local/bin:/usr/bin:/bin",
    "PWD=/workspace",
    "TERM=xterm-256color"
  ];
  class Qt {
    instance = null;
    module = null;
    memory = null;
    stdinBuffer = "";
    ready = false;
    mounts = /* @__PURE__ */ new Map();
    osInfo = "alpine";
    stdout = "";
    stderr = "";
    textEncoder = new TextEncoder();
    textDecoder = new TextDecoder();
    static async load(e) {
      const n = new Qt(), s = await fetch(e);
      if (!s.ok) throw new Error(`Failed to fetch WASM: ${s.status} ${s.statusText}`);
      const r = await s.arrayBuffer();
      return n.module = await WebAssembly.compile(r), n;
    }
    static async fromBuffer(e) {
      const n = new Qt();
      return n.module = await WebAssembly.compile(e), n;
    }
    async start(e) {
      if (!this.module) {
        this.ready = true;
        return;
      }
      if (this.memory = new WebAssembly.Memory({
        initial: 256,
        maximum: 512
      }), e?.mounts) for (const [i, o] of Object.entries(e.mounts)) this.mounts.set(i, o);
      const n = this.textEncoder, s = this.textDecoder, r = {
        wasi_snapshot_preview1: {
          proc_exit: (i) => {
            throw new Error(`Process exited with code ${i}`);
          },
          fd_write: (i, o, u, v) => {
            if (!this.memory) return 1;
            const f = new DataView(this.memory.buffer);
            let p = 0;
            for (let b = 0; b < u; b++) {
              const k = f.getUint32(o + b * 8, true), P = f.getUint32(o + b * 8 + 4, true), B = new Uint8Array(this.memory.buffer, k, P), U = s.decode(B);
              i === 1 ? this.stdout += U : i === 2 && (this.stderr += U), p += P;
            }
            return f.setUint32(v, p, true), 0;
          },
          fd_read: (i, o, u, v) => {
            if (!this.memory) return 1;
            if (i !== 0) return 8;
            const f = new DataView(this.memory.buffer), p = this.stdinBuffer || `
`, b = n.encode(p);
            let k = 0;
            for (let P = 0; P < u && k < b.length; P++) {
              const B = f.getUint32(o + P * 8, true), U = f.getUint32(o + P * 8 + 4, true), _ = b.slice(k, k + U);
              new Uint8Array(this.memory.buffer, B, _.length).set(_), k += _.length;
            }
            return f.setUint32(v, k, true), this.stdinBuffer = "", 0;
          },
          environ_get: (i, o) => {
            if (!this.memory) return 1;
            const u = new DataView(this.memory.buffer);
            let v = o;
            for (let f = 0; f < Jt.length; f++) {
              const p = n.encode(Jt[f] + "\0");
              u.setUint32(i + f * 4, v, true), new Uint8Array(this.memory.buffer, v, p.length).set(p), v += p.length;
            }
            return 0;
          },
          environ_sizes_get: (i, o) => {
            if (!this.memory) return 1;
            const u = new DataView(this.memory.buffer);
            u.setUint32(i, Jt.length, true);
            const v = Jt.reduce((f, p) => f + p.length + 1, 0);
            return u.setUint32(o, v, true), 0;
          },
          fd_prestat_get: (i, o) => 8,
          fd_prestat_dir_name: (i, o, u) => 8,
          path_open: (i, o, u, v, f, p, b) => 8,
          fd_close: (i) => 0,
          fd_seek: (i, o, u, v) => 8,
          fd_fdstat_get: (i, o) => {
            if (!this.memory) return 1;
            const u = new DataView(this.memory.buffer);
            return u.setUint8(o, 0), u.setUint16(o + 2, 0, true), u.setBigUint64(o + 8, BigInt(0), true), 0;
          }
        }
      };
      try {
        this.instance = await WebAssembly.instantiate(this.module, r), this.ready = true;
      } catch (i) {
        console.warn("[WASI] Instantiation failed, using fallback shell:", i), this.ready = true;
      }
    }
    async run(e, n = [], s = {}) {
      if (this.stdout = "", this.stderr = "", !this.ready) throw new Error("Container not initialized");
      const r = [
        e,
        ...n
      ], i = r[0], o = r.slice(1);
      if (!this.instance || !this.memory) return this.fallbackExecute(i, o);
      try {
        const u = this.instance.exports, v = u.memory, f = [
          e,
          ...n
        ], p = f.join("\0") + "\0", b = Object.entries(s).map(([_, E]) => `${_}=${E}`).join("\0") + "\0", k = u.malloc(p.length), P = u.malloc(b.length);
        new Uint8Array(v.buffer, k, p.length).set(this.textEncoder.encode(p)), new Uint8Array(v.buffer, P, b.length).set(this.textEncoder.encode(b));
        const B = u.malloc(f.length * 4), U = new DataView(v.buffer);
        for (let _ = 0; _ < f.length; _++) U.setUint32(B + _ * 4, k + (_ === 0 ? 0 : f.slice(0, _).join("\0").length + 1), true);
        return typeof u._start == "function" && u._start(), {
          stdout: this.stdout,
          stderr: this.stderr,
          exit_code: 0
        };
      } catch (u) {
        if (u.message?.includes("Process exited")) {
          const v = u.message.match(/code (\d+)/);
          return {
            stdout: this.stdout,
            stderr: this.stderr,
            exit_code: v ? parseInt(v[1]) : 0
          };
        }
        return this.fallbackExecute(i, o);
      }
    }
    vfs = /* @__PURE__ */ new Map([
      [
        "/",
        {
          content: "",
          isDir: true,
          mtime: Date.now()
        }
      ],
      [
        "/workspace",
        {
          content: "",
          isDir: true,
          mtime: Date.now()
        }
      ],
      [
        "/tmp",
        {
          content: "",
          isDir: true,
          mtime: Date.now()
        }
      ],
      [
        "/home",
        {
          content: "",
          isDir: true,
          mtime: Date.now()
        }
      ],
      [
        "/home/ezclaw",
        {
          content: "",
          isDir: true,
          mtime: Date.now()
        }
      ]
    ]);
    cwd = "/workspace";
    shellVars = /* @__PURE__ */ new Map([
      [
        "HOME",
        "/home/ezclaw"
      ],
      [
        "USER",
        "ezclaw"
      ],
      [
        "SHELL",
        "/bin/sh"
      ]
    ]);
    normalizePath(e) {
      e.startsWith("/") || (e = this.cwd + "/" + e);
      const n = e.split("/").filter(Boolean), s = [];
      for (const r of n) r === ".." ? s.pop() : r !== "." && s.push(r);
      return "/" + s.join("/");
    }
    fallbackExecute(e, n) {
      const s = [
        e,
        ...n
      ].join(" ");
      if (s.includes(" | ")) return this.executePipeline(s);
      let r = null, i = false;
      const o = [];
      for (let v = 0; v < n.length; v++) {
        if (n[v] === ">>" && v + 1 < n.length) {
          r = n[v + 1], i = true, v++;
          continue;
        }
        if (n[v] === ">" && v + 1 < n.length) {
          r = n[v + 1], i = false, v++;
          continue;
        }
        if (n[v].startsWith(">>")) {
          r = n[v].slice(2), i = true;
          continue;
        }
        if (n[v].startsWith(">")) {
          r = n[v].slice(1), i = false;
          continue;
        }
        o.push(n[v]);
      }
      const u = this.executeCommand(e, o);
      if (r && u.exit_code === 0) {
        const v = this.normalizePath(r), f = this.vfs.get(v);
        i && f && !f.isDir ? (f.content += u.stdout, f.mtime = Date.now()) : this.vfs.set(v, {
          content: u.stdout,
          isDir: false,
          mtime: Date.now()
        }), u.stdout = "";
      }
      return u;
    }
    executePipeline(e) {
      const n = e.split(" | ").map((i) => i.trim());
      let s = "", r = {
        stdout: "",
        stderr: "",
        exit_code: 0
      };
      for (const i of n) {
        const o = i.split(/\s+/), u = o[0], v = o.slice(1);
        this.stdinBuffer = s, r = this.executeCommand(u, v), s = r.stdout;
      }
      return r;
    }
    executeCommand(e, n) {
      let s = "", r = "", i = 0;
      switch (e) {
        case "ls": {
          const o = n.length > 0 ? this.normalizePath(n[n.length - 1]) : this.cwd, u = n.includes("-a") || n.includes("-la") || n.includes("-al"), v = n.includes("-l") || n.includes("-la") || n.includes("-al"), f = this.vfs.get(o);
          if (!f || !f.isDir) {
            f ? s = v ? `-rw-r--r--   1 ezclaw ezclaw  ${f.content.length} ${o.split("/").pop()}
` : `${o.split("/").pop()}
` : (r = `ls: cannot access '${o}': No such file or directory
`, i = 2);
            break;
          }
          const p = [];
          u && p.push(".", "..");
          for (const [b, k] of this.vfs) {
            if (b === o) continue;
            if ((b.substring(0, b.lastIndexOf("/")) || "/") === o) {
              const B = b.split("/").pop();
              if (!u && B.startsWith(".")) continue;
              if (v) {
                const U = k.isDir ? "drwxr-xr-x" : "-rw-r--r--", _ = k.isDir ? 4096 : k.content.length;
                p.push(`${U}   1 ezclaw ezclaw  ${String(_).padStart(5)} ${B}`);
              } else p.push(B);
            }
          }
          for (const [b] of this.mounts) if ((b.substring(0, b.lastIndexOf("/")) || "/") === o) {
            const P = b.split("/").pop();
            v ? p.push(`drwxr-xr-x   1 ezclaw ezclaw   4096 ${P} [mount]`) : p.push(P);
          }
          s = p.join(`
`) + (p.length > 0 ? `
` : "");
          break;
        }
        case "pwd":
          s = this.cwd + `
`;
          break;
        case "cd": {
          const o = n.length > 0 ? this.normalizePath(n[0]) : "/home/ezclaw", u = this.vfs.get(o);
          u && u.isDir ? this.cwd = o : (r = `cd: ${n[0]}: No such directory
`, i = 1);
          break;
        }
        case "echo": {
          s = n.map((u) => u.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (v, f) => this.shellVars.get(f) || Jt.find((p) => p.startsWith(f + "="))?.split("=")[1] || "")).join(" ") + `
`;
          break;
        }
        case "cat": {
          if (n.length === 0) {
            r = `cat: missing operand
`, i = 1;
            break;
          }
          for (const o of n) {
            const u = this.normalizePath(o), v = this.vfs.get(u);
            v && !v.isDir ? s += v.content : v && v.isDir ? (r += `cat: ${o}: Is a directory
`, i = 1) : (r += `cat: ${o}: No such file or directory
`, i = 1);
          }
          break;
        }
        case "mkdir": {
          const o = n.includes("-p"), u = n.filter((v) => !v.startsWith("-"));
          for (const v of u) {
            const f = this.normalizePath(v);
            if (this.vfs.has(f)) {
              o || (r += `mkdir: cannot create directory '${v}': File exists
`, i = 1);
              continue;
            }
            if (o) {
              const p = f.split("/").filter(Boolean);
              let b = "";
              for (const k of p) b += "/" + k, this.vfs.has(b) || this.vfs.set(b, {
                content: "",
                isDir: true,
                mtime: Date.now()
              });
            } else {
              const p = f.substring(0, f.lastIndexOf("/")) || "/";
              if (!this.vfs.has(p)) {
                r += `mkdir: cannot create directory '${v}': No such file or directory
`, i = 1;
                continue;
              }
              this.vfs.set(f, {
                content: "",
                isDir: true,
                mtime: Date.now()
              });
            }
          }
          break;
        }
        case "touch": {
          for (const o of n.filter((u) => !u.startsWith("-"))) {
            const u = this.normalizePath(o), v = this.vfs.get(u);
            v ? v.mtime = Date.now() : this.vfs.set(u, {
              content: "",
              isDir: false,
              mtime: Date.now()
            });
          }
          break;
        }
        case "rm": {
          const o = n.includes("-r") || n.includes("-rf") || n.includes("-fr"), u = n.includes("-f") || n.includes("-rf") || n.includes("-fr"), v = n.filter((f) => !f.startsWith("-"));
          for (const f of v) {
            const p = this.normalizePath(f), b = this.vfs.get(p);
            if (!b) {
              u || (r += `rm: cannot remove '${f}': No such file or directory
`, i = 1);
              continue;
            }
            if (b.isDir && !o) {
              r += `rm: cannot remove '${f}': Is a directory
`, i = 1;
              continue;
            }
            const k = [
              ...this.vfs.keys()
            ].filter((P) => P === p || P.startsWith(p + "/"));
            for (const P of k) this.vfs.delete(P);
          }
          break;
        }
        case "cp": {
          const o = n.filter((p) => !p.startsWith("-"));
          if (o.length < 2) {
            r = `cp: missing operand
`, i = 1;
            break;
          }
          const u = this.normalizePath(o[0]), v = this.normalizePath(o[1]), f = this.vfs.get(u);
          if (!f || f.isDir) {
            r = `cp: cannot copy '${o[0]}': ${f ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          this.vfs.set(v, {
            content: f.content,
            isDir: false,
            mtime: Date.now()
          });
          break;
        }
        case "mv": {
          const o = n.filter((p) => !p.startsWith("-"));
          if (o.length < 2) {
            r = `mv: missing operand
`, i = 1;
            break;
          }
          const u = this.normalizePath(o[0]), v = this.normalizePath(o[1]), f = this.vfs.get(u);
          if (!f) {
            r = `mv: cannot stat '${o[0]}': No such file or directory
`, i = 1;
            break;
          }
          this.vfs.set(v, {
            ...f,
            mtime: Date.now()
          }), this.vfs.delete(u);
          break;
        }
        case "head": {
          const o = n.includes("-n") && parseInt(n[n.indexOf("-n") + 1]) || 10, u = n.filter((p) => !p.startsWith("-") && p !== String(o))[0];
          if (!u) {
            r = `head: missing operand
`, i = 1;
            break;
          }
          const v = this.normalizePath(u), f = this.vfs.get(v);
          if (!f || f.isDir) {
            r = `head: ${u}: ${f ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          s = f.content.split(`
`).slice(0, o).join(`
`) + `
`;
          break;
        }
        case "tail": {
          const o = n.includes("-n") && parseInt(n[n.indexOf("-n") + 1]) || 10, u = n.filter((b) => !b.startsWith("-") && b !== String(o))[0];
          if (!u) {
            r = `tail: missing operand
`, i = 1;
            break;
          }
          const v = this.normalizePath(u), f = this.vfs.get(v);
          if (!f || f.isDir) {
            r = `tail: ${u}: ${f ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          s = f.content.split(`
`).slice(-o).join(`
`) + `
`;
          break;
        }
        case "wc": {
          const o = n.filter((k) => !k.startsWith("-"))[0];
          if (!o) {
            r = `wc: missing operand
`, i = 1;
            break;
          }
          const u = this.normalizePath(o), v = this.vfs.get(u);
          if (!v || v.isDir) {
            r = `wc: ${o}: ${v ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          const f = v.content.split(`
`).length, p = v.content.split(/\s+/).filter(Boolean).length, b = v.content.length;
          s = `  ${f}  ${p} ${b} ${o}
`;
          break;
        }
        case "grep": {
          if (n.length < 2) {
            r = `grep: missing operand
`, i = 1;
            break;
          }
          const o = n.includes("-i"), u = n.filter((B) => !B.startsWith("-")), v = u[0], f = u[1], p = this.normalizePath(f), b = this.vfs.get(p);
          if (!b || b.isDir) {
            r = `grep: ${f}: ${b ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          const k = new RegExp(v, o ? "i" : ""), P = b.content.split(`
`).filter((B) => k.test(B));
          if (P.length === 0) {
            i = 1;
            break;
          }
          s = P.join(`
`) + `
`;
          break;
        }
        case "sort": {
          const o = n.filter((k) => !k.startsWith("-"))[0];
          if (!o) {
            r = `sort: missing operand
`, i = 1;
            break;
          }
          const u = this.normalizePath(o), v = this.vfs.get(u);
          if (!v || v.isDir) {
            r = `sort: ${o}: ${v ? "Is a directory" : "No such file"}
`, i = 1;
            break;
          }
          const f = v.content.split(`
`).filter(Boolean), p = n.includes("-r"), b = n.includes("-n");
          f.sort((k, P) => b ? parseFloat(k) - parseFloat(P) : k.localeCompare(P)), p && f.reverse(), s = f.join(`
`) + `
`;
          break;
        }
        case "find": {
          const o = n.length > 0 && !n[0].startsWith("-") ? this.normalizePath(n[0]) : this.cwd, u = n.indexOf("-name"), v = u >= 0 && u + 1 < n.length ? n[u + 1] : null, f = [];
          for (const [p] of this.vfs) if (p.startsWith(o)) {
            if (v) {
              const b = p.split("/").pop();
              if (!new RegExp("^" + v.replace(/\*/g, ".*").replace(/\?/g, ".") + "$").test(b)) continue;
            }
            f.push(p);
          }
          s = f.join(`
`) + (f.length > 0 ? `
` : "");
          break;
        }
        case "whoami":
          s = `ezclaw
`;
          break;
        case "uname": {
          n.includes("-a") ? s = `EZ-Claw WASI ${this.osInfo} x86_64 ezclaw-wasi
` : s = `EZ-Claw WASI ${this.osInfo}
`;
          break;
        }
        case "date":
          s = (/* @__PURE__ */ new Date()).toISOString() + `
`;
          break;
        case "env":
          s = Jt.join(`
`) + `
`;
          for (const [o, u] of this.shellVars) s += `${o}=${u}
`;
          break;
        case "export": {
          for (const o of n) {
            const u = o.indexOf("=");
            u > 0 && this.shellVars.set(o.slice(0, u), o.slice(u + 1));
          }
          break;
        }
        case "id":
          s = `uid=1000(ezclaw) gid=1000(ezclaw) groups=1000(ezclaw)
`;
          break;
        case "hostname":
          s = `ezclaw-wasi
`;
          break;
        case "arch":
          s = `x86_64
`;
          break;
        case "true":
          i = 0;
          break;
        case "false":
          i = 1;
          break;
        case "sleep": {
          const o = parseFloat(n[0] || "0");
          isNaN(o) && (r = `sleep: invalid time interval '${n[0]}'
`, i = 1);
          break;
        }
        case "printf": {
          if (n.length === 0) break;
          const o = n[0], u = n.slice(1);
          let v = o, f = 0;
          v = v.replace(/%s/g, () => u[f++] || ""), v = v.replace(/%d/g, () => String(parseInt(u[f++] || "0"))), v = v.replace(/\\n/g, `
`).replace(/\\t/g, "	"), s = v;
          break;
        }
        case "test":
        case "[": {
          const o = e === "[" ? n.filter((u) => u !== "]") : n;
          i = this.evaluateTest(o) ? 0 : 1;
          break;
        }
        case "expr": {
          try {
            const o = parseInt(n[0]), u = n[1], v = parseInt(n[2]);
            u === "+" ? s = String(o + v) + `
` : u === "-" ? s = String(o - v) + `
` : u === "*" ? s = String(o * v) + `
` : u === "/" ? s = String(Math.floor(o / v)) + `
` : u === "%" ? s = String(o % v) + `
` : (r = `expr: unknown operator '${u}'
`, i = 2);
          } catch {
            r = `expr: syntax error
`, i = 2;
          }
          break;
        }
        case "seq": {
          const o = n.map(Number);
          let u = 1, v = 1, f = 1;
          o.length === 1 ? f = o[0] : o.length === 2 ? (u = o[0], f = o[1]) : o.length >= 3 && (u = o[0], v = o[1], f = o[2]);
          const p = [];
          for (let b = u; v > 0 ? b <= f : b >= f; b += v) p.push(String(b));
          s = p.join(`
`) + `
`;
          break;
        }
        case "sh":
        case "bash": {
          if (n.includes("-c") && n.length > n.indexOf("-c") + 1) {
            const u = n.slice(n.indexOf("-c") + 1).join(" ").split(/\s+/);
            return this.fallbackExecute(u[0], u.slice(1));
          }
          s = `sh: interactive mode not supported in WASI sandbox
`;
          break;
        }
        case "help":
          s = this.getHelp();
          break;
        default:
          r = `${e}: command not found in WASI sandbox
`, i = 127;
      }
      return {
        stdout: s,
        stderr: r,
        exit_code: i
      };
    }
    evaluateTest(e) {
      if (e.length === 0) return false;
      if (e.length === 1) return e[0] !== "";
      if (e[0] === "-f") return this.vfs.has(this.normalizePath(e[1])) && !this.vfs.get(this.normalizePath(e[1])).isDir;
      if (e[0] === "-d") return this.vfs.has(this.normalizePath(e[1])) && this.vfs.get(this.normalizePath(e[1])).isDir;
      if (e[0] === "-e") return this.vfs.has(this.normalizePath(e[1]));
      if (e[0] === "-z") return e[1] === "";
      if (e[0] === "-n") return e[1] !== "";
      if (e.length === 3) {
        if (e[1] === "=") return e[0] === e[2];
        if (e[1] === "!=") return e[0] !== e[2];
        if (e[1] === "-eq") return parseInt(e[0]) === parseInt(e[2]);
        if (e[1] === "-ne") return parseInt(e[0]) !== parseInt(e[2]);
        if (e[1] === "-gt") return parseInt(e[0]) > parseInt(e[2]);
        if (e[1] === "-lt") return parseInt(e[0]) < parseInt(e[2]);
      }
      return false;
    }
    getHelp() {
      return `EZ-Claw WASI Container - BusyBox Shell
  File:    ls, cat, head, tail, cp, mv, rm, mkdir, touch, find, wc
  Text:    echo, printf, grep, sort
  System:  pwd, cd, whoami, uname, date, env, export, id, hostname, arch
  Math:    expr, seq, test
  Control: true, false, sleep, sh -c
  I/O:     > (redirect), >> (append), | (pipe)

  Agent workspace tools: read_file, write_file, list_dir
  For full host shell access, use the Native CLI tier.
`;
    }
    async mount(e, n) {
      this.mounts.set(e, n);
    }
    async unmount(e) {
      this.mounts.delete(e);
    }
    getMounts() {
      return Array.from(this.mounts.keys());
    }
    isReady() {
      return this.ready;
    }
    getInfo() {
      return {
        os: this.osInfo,
        arch: "x86_64",
        version: "1.0.0",
        initialized: this.ready,
        mountPoints: this.getMounts()
      };
    }
    setOS(e) {
      this.osInfo = e;
    }
  }
  async function uo() {
    if ("userAgentData" in navigator) try {
      return (await navigator.userAgentData.getHighEntropyValues([
        "architecture"
      ])).architecture === "arm" ? "arm64" : "amd64";
    } catch {
    }
    const t = navigator.userAgent;
    if (t.includes("aarch64") || t.includes("arm64") || t.includes("Arm64")) return "arm64";
    if (t.includes("Mac") && typeof navigator.platform == "string") try {
      const n = document.createElement("canvas").getContext("webgl");
      if (n) {
        const s = n.getExtension("WEBGL_debug_renderer_info");
        if (s) {
          const r = n.getParameter(s.UNMASKED_RENDERER_WEBGL);
          if (typeof r == "string" && r.includes("Apple")) return "arm64";
        }
      }
    } catch {
    }
    return "amd64";
  }
  let $t = null, as = null;
  const vo = /* @__PURE__ */ new Map();
  function ea(t, e) {
    vo.get(t)?.forEach((n) => n(e));
  }
  async function fo(t) {
    try {
      as = await navigator.storage.getDirectory(), $t = await as.getDirectoryHandle("workspace", {
        create: true
      });
    } catch (e) {
      console.warn("[EZ-Claw] OPFS not available, workspace will be in-memory only:", e), $t = null;
    }
    $t && (ea("workspace:mounted", {
      type: "opfs"
    }), console.log("[EZ-Claw] Workspace mounted:", "OPFS"));
  }
  async function po(t) {
    $t = t, ea("workspace:mounted", {
      type: "user-picked",
      name: t.name
    });
  }
  function ss() {
    return $t !== null;
  }
  async function mo(t = "/") {
    const e = await An(t);
    if (!e) return [];
    const n = [];
    for await (const [s, r] of e.entries()) {
      const i = {
        name: s,
        path: t === "/" ? `/${s}` : `${t}/${s}`,
        isDirectory: r.kind === "directory"
      };
      if (r.kind === "file") try {
        const o = await r.getFile();
        i.size = o.size, i.lastModified = o.lastModified;
      } catch {
      }
      n.push(i);
    }
    return n.sort((s, r) => s.isDirectory !== r.isDirectory ? s.isDirectory ? -1 : 1 : s.name.localeCompare(r.name));
  }
  async function ho(t) {
    const e = await go(t);
    if (!e) throw new Error(`File not found: ${t}`);
    return (await e.getFile()).text();
  }
  async function rs(t, e) {
    const n = t.split("/").filter(Boolean), s = n.pop(), r = "/" + n.join("/"), i = await An(r, true);
    if (!i) throw new Error(`Cannot create directory: ${r}`);
    const u = await (await i.getFileHandle(s, {
      create: true
    })).createWritable();
    await u.write(e), await u.close(), ea("workspace:file-changed", {
      path: t,
      action: "write"
    });
  }
  async function bo(t) {
    await An(t, true);
  }
  async function _o(t) {
    const e = t.split("/").filter(Boolean), n = e.pop(), s = "/" + e.join("/"), r = await An(s);
    if (!r) throw new Error(`Parent directory not found: ${s}`);
    await r.removeEntry(n, {
      recursive: true
    }), ea("workspace:file-changed", {
      path: t,
      action: "delete"
    });
  }
  async function wo() {
    try {
      const t = await window.showDirectoryPicker({
        mode: "readwrite"
      });
      return await po(t), t;
    } catch {
      return null;
    }
  }
  async function An(t, e = false) {
    if (!$t) return null;
    const n = t.split("/").filter(Boolean);
    let s = $t;
    for (const r of n) try {
      s = await s.getDirectoryHandle(r, {
        create: e
      });
    } catch {
      return null;
    }
    return s;
  }
  async function go(t) {
    const e = t.split("/").filter(Boolean), n = e.pop();
    if (!n) return null;
    const s = await An("/" + e.join("/"));
    if (!s) return null;
    try {
      return await s.getFileHandle(n);
    } catch {
      return null;
    }
  }
  let Nn = null, xn = null, Wt = false, Un = null, jn = [], Ht = "", Kt = "", St = null;
  const un = /* @__PURE__ */ new Map();
  function Tt(t, e) {
    un.get(t)?.forEach((n) => n(e));
  }
  function is(t, e) {
    return un.has(t) || un.set(t, /* @__PURE__ */ new Set()), un.get(t).add(e), () => un.get(t)?.delete(e);
  }
  function Ta() {
    const t = navigator.userAgent.toLowerCase(), e = navigator.userAgentData?.platform?.toLowerCase() || "";
    return /arm|aarch64/i.test(t) || /android/i.test(t) || /iphone|ipad|ipod/i.test(t) || e.includes("arm") || e === "macos" && navigator.maxTouchPoints > 1 ? "aarch64" : "x86_64";
  }
  const zn = "ezclaw:container_images", yo = "ezclaw:active_container";
  function os() {
    const t = Ta();
    return [
      {
        id: "alpine-default",
        name: "Alpine Linux",
        os: "alpine",
        arch: t,
        wasmUrl: `/containers/alpine-${t === "x86_64" ? "amd64" : t === "aarch64" ? "arm64" : t}.wasm`,
        size: "~60MB",
        description: "Lightweight Linux with apk package manager. Default container."
      }
    ];
  }
  function Rn() {
    try {
      const t = JSON.parse(localStorage.getItem(zn) || "[]");
      return [
        ...os(),
        ...t
      ];
    } catch {
      return os();
    }
  }
  function ko(t) {
    const e = {
      ...t,
      id: crypto.randomUUID()
    }, n = JSON.parse(localStorage.getItem(zn) || "[]");
    return n.push(e), localStorage.setItem(zn, JSON.stringify(n)), e;
  }
  function So(t) {
    const e = JSON.parse(localStorage.getItem(zn) || "[]"), n = e.filter((s) => s.id !== t);
    return n.length === e.length ? false : (localStorage.setItem(zn, JSON.stringify(n)), true);
  }
  async function sr(t) {
    const e = Rn(), n = t ? e.find((s) => s.id === t) : e[0];
    if (!n) throw new Error(`Container image not found: ${t}`);
    Tt("c2w:loading", {
      image: n
    }), Wt = false;
    try {
      const s = await fetch(n.wasmUrl);
      if (!s.ok) throw new Error(`Failed to fetch container WASM: ${s.status} ${s.statusText}`);
      const r = Number(s.headers.get("content-length") || 0), i = s.body?.getReader();
      if (i && r > 0) {
        const u = [];
        let v = 0;
        for (; ; ) {
          const { done: b, value: k } = await i.read();
          if (b) break;
          u.push(k), v += k.length, Tt("c2w:progress", {
            loaded: v,
            total: r,
            percent: Math.round(v / r * 100)
          });
        }
        const f = new Uint8Array(v);
        let p = 0;
        for (const b of u) f.set(b, p), p += b.length;
        Nn = await WebAssembly.compile(f);
      } else {
        const u = await s.arrayBuffer();
        Nn = await WebAssembly.compile(u);
      }
      const o = Co(n);
      xn = await WebAssembly.instantiate(Nn, {
        wasi_snapshot_preview1: o,
        wasi_unstable: o
      }), Un = n, Wt = true, localStorage.setItem(yo, n.id), Tt("c2w:ready", {
        image: n
      }), console.log(`[EZ-Claw] Container loaded: ${n.name} (${n.arch})`);
      try {
        const u = xn.exports._start;
        u && queueMicrotask(() => {
          try {
            u();
          } catch {
          }
        });
      } catch {
      }
    } catch (s) {
      throw Tt("c2w:error", {
        error: s.message,
        image: n
      }), s;
    }
  }
  async function xo(t) {
    Wt && zo(), await sr(t), Tt("c2w:swapped", {
      imageId: t
    });
  }
  function zo() {
    xn = null, Nn = null, Wt = false, jn = [], Ht = "", Kt = "", St = null;
  }
  function Na() {
    return Wt;
  }
  async function Ua(t, e = 3e4) {
    if (!Wt || !xn) throw new Error("Container not ready. Call loadContainer() first.");
    const n = performance.now();
    return jn.push(t + `
`), new Promise((s, r) => {
      Ht = "", Kt = "";
      const i = setTimeout(() => {
        St = null, s({
          stdout: Ht,
          stderr: Kt || "Command timed out",
          exit_code: 124,
          duration_ms: performance.now() - n
        });
      }, e);
      St = (o) => {
        clearTimeout(i), s(o);
      }, setTimeout(() => {
        St && (St({
          stdout: Ht,
          stderr: Kt,
          exit_code: 0,
          duration_ms: performance.now() - n
        }), St = null);
      }, 500);
    });
  }
  function Co(t) {
    const e = new TextEncoder(), n = new TextDecoder(), s = [
      "HOME=/root",
      "USER=root",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "PWD=/workspace",
      "TERM=xterm-256color",
      `EZCLAW_OS=${t.os}`,
      `EZCLAW_ARCH=${t.arch}`,
      "LANG=C.UTF-8"
    ], r = [
      "/bin/sh"
    ];
    function i() {
      return xn.exports.memory;
    }
    function o() {
      return new DataView(i().buffer);
    }
    return {
      proc_exit(u) {
        St && (St({
          stdout: Ht,
          stderr: Kt,
          exit_code: u,
          duration_ms: 0
        }), St = null);
      },
      args_get(u, v) {
        const f = o(), p = new Uint8Array(i().buffer);
        let b = v;
        for (let k = 0; k < r.length; k++) {
          f.setUint32(u + k * 4, b, true);
          const P = e.encode(r[k] + "\0");
          p.set(P, b), b += P.length;
        }
        return 0;
      },
      args_sizes_get(u, v) {
        const f = o();
        f.setUint32(u, r.length, true);
        const p = r.reduce((b, k) => b + e.encode(k + "\0").length, 0);
        return f.setUint32(v, p, true), 0;
      },
      environ_get(u, v) {
        const f = o(), p = new Uint8Array(i().buffer);
        let b = v;
        for (let k = 0; k < s.length; k++) {
          f.setUint32(u + k * 4, b, true);
          const P = e.encode(s[k] + "\0");
          p.set(P, b), b += P.length;
        }
        return 0;
      },
      environ_sizes_get(u, v) {
        const f = o();
        f.setUint32(u, s.length, true);
        const p = s.reduce((b, k) => b + e.encode(k + "\0").length, 0);
        return f.setUint32(v, p, true), 0;
      },
      fd_write(u, v, f, p) {
        const b = o(), k = new Uint8Array(i().buffer);
        let P = 0;
        for (let B = 0; B < f; B++) {
          const U = b.getUint32(v + B * 8, true), _ = b.getUint32(v + B * 8 + 4, true), E = n.decode(k.slice(U, U + _));
          u === 1 ? (Ht += E, Tt("c2w:output", {
            stream: "stdout",
            data: E
          })) : u === 2 && (Kt += E, Tt("c2w:output", {
            stream: "stderr",
            data: E
          })), P += _;
        }
        return b.setUint32(p, P, true), 0;
      },
      fd_read(u, v, f, p) {
        if (u !== 0) return 8;
        const b = o(), k = new Uint8Array(i().buffer);
        if (jn.length === 0) return b.setUint32(p, 0, true), 0;
        const P = jn.shift(), B = e.encode(P);
        let U = 0;
        for (let _ = 0; _ < f && U < B.length; _++) {
          const E = b.getUint32(v + _ * 8, true), y = b.getUint32(v + _ * 8 + 4, true), S = B.slice(U, U + y);
          k.set(S, E), U += S.length;
        }
        return b.setUint32(p, U, true), 0;
      },
      fd_close(u) {
        return 0;
      },
      fd_seek(u, v, f, p) {
        return 0;
      },
      fd_fdstat_get(u, v) {
        const f = o();
        return f.setUint8(v, 2), f.setUint16(v + 2, 0, true), f.setBigUint64(v + 8, BigInt(0), true), f.setBigUint64(v + 16, BigInt(0), true), 0;
      },
      fd_prestat_get(u, v) {
        return 8;
      },
      fd_prestat_dir_name(u, v, f) {
        return 8;
      },
      clock_time_get(u, v, f) {
        const p = o(), b = BigInt(Date.now()) * BigInt(1e6);
        return p.setBigUint64(f, b, true), 0;
      },
      clock_res_get(u, v) {
        return o().setBigUint64(v, BigInt(1e6), true), 0;
      },
      random_get(u, v) {
        const f = new Uint8Array(i().buffer), p = new Uint8Array(v);
        return crypto.getRandomValues(p), f.set(p, u), 0;
      },
      path_open: () => 44,
      path_create_directory: () => 0,
      path_remove_directory: () => 0,
      path_unlink_file: () => 0,
      path_rename: () => 0,
      path_filestat_get: () => 0,
      path_readlink: () => 44,
      fd_readdir: () => 0,
      fd_filestat_get: () => 0,
      fd_filestat_set_size: () => 0,
      fd_filestat_set_times: () => 0,
      fd_allocate: () => 0,
      fd_advise: () => 0,
      fd_datasync: () => 0,
      fd_sync: () => 0,
      fd_tell: () => 0,
      fd_pread: () => 0,
      fd_pwrite: () => 0,
      fd_renumber: () => 0,
      path_filestat_set_times: () => 0,
      path_link: () => 0,
      path_symlink: () => 0,
      poll_oneoff: () => 0,
      sched_yield: () => 0,
      sock_accept: () => 58,
      sock_recv: () => 58,
      sock_send: () => 58,
      sock_shutdown: () => 58
    };
  }
  function vn() {
    return {
      ready: Wt,
      image: Un?.name || null,
      os: Un?.os || "none",
      arch: Un?.arch || Ta()
    };
  }
  let On = null;
  async function rr() {
    return On || (On = new Qt(), await On.start()), On;
  }
  async function Io(t, e, n, s) {
    const r = performance.now();
    let i;
    try {
      i = JSON.parse(n.arguments);
    } catch {
      return {
        call_id: n.id,
        success: false,
        output: "",
        error: `Invalid tool arguments: ${n.arguments}`,
        duration_ms: 0
      };
    }
    const o = i.url || "", u = t.check_tool_security(n.name, n.arguments, o), v = JSON.parse(u);
    if (!v.approved && !v.needs_confirmation) return {
      call_id: n.id,
      success: false,
      output: "",
      error: `Security: ${v.rejection_reason || "Denied"}`,
      duration_ms: performance.now() - r
    };
    v.needs_confirmation;
    let f;
    try {
      f = await Eo(n.name, i, e, v);
    } catch (k) {
      return {
        call_id: n.id,
        success: false,
        output: "",
        error: k.message || String(k),
        duration_ms: performance.now() - r
      };
    }
    const p = t.secure_tool_response(n.name, f), b = JSON.parse(p);
    return b.warnings?.length && console.warn("[EZ-Claw Security]", b.warnings), {
      call_id: n.id,
      success: true,
      output: b.output || f,
      duration_ms: performance.now() - r
    };
  }
  async function Eo(t, e, n, s) {
    switch (t) {
      case "web_search":
        return await Ao(e.query, e.max_results || 5, s);
      case "web_fetch":
        return await Oo(e.url, s);
      case "read_file":
        return Do(n, e.path);
      case "write_file":
        return qo(n, e.path, e.content);
      case "list_dir":
        return Po(n, e.path || "/");
      case "memory_store": {
        const r = e.key || `mem-${Date.now()}`, i = e.content || e.value || "", o = e.category || "core";
        try {
          return pt(r, i, o), `Memory stored: key="${r}", category="${o}", content="${i.slice(0, 100)}..."}`;
        } catch (u) {
          return `Memory store failed: ${u.message}`;
        }
      }
      case "memory_recall": {
        const r = e.query || "", i = e.limit || 5;
        try {
          const o = Sn(r, i);
          return o.length === 0 ? `No memories found for: "${r}"` : o.map((u) => `[${u.category}] ${u.key}: ${u.content} (score: ${(u.score || 0).toFixed(2)})`).join(`
`);
        } catch (o) {
          return `Memory recall failed: ${o.message}`;
        }
      }
      case "update_identity": {
        const r = rt();
        e.name && (r.name = e.name, r.facts.name = e.name), e.personality && (r.personality = e.personality), e.instructions && (r.instructions = e.instructions), e.fact_key && e.fact_value && (r.facts[e.fact_key] = e.fact_value), nn(r);
        try {
          e.name && pt("identity_name", `My name is ${e.name}`, "identity"), e.fact_key && pt(`identity_${e.fact_key}`, e.fact_value, "identity");
        } catch {
        }
        return `Identity updated: ${JSON.stringify(r, null, 2)}`;
      }
      case "shell_exec":
        return await Mo(e.command, e.args, e.cwd);
      case "run_shell_command":
        return await To(e.command, e.args, e.env);
      case "mcp_call_tool":
        return await No(e.server_id, e.tool_name, e.arguments || {});
      case "create_tool": {
        const r = e.name || "", i = e.description || "", o = e.code || "";
        return !r || !i || !o ? "create_tool requires: name, description, code" : Uo(r, i, o);
      }
      default:
        throw new Error(`Unknown tool: ${t}`);
    }
  }
  async function Ao(t, e, n) {
    const s = `https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`, r = {};
    lr(r, n);
    const i = await fetch(s, {
      headers: r
    });
    if (!i.ok) throw new Error(`Search failed: ${i.status} ${i.statusText}`);
    const o = await i.json(), u = [];
    if (o.Abstract && u.push(`**Summary**: ${o.Abstract}
Source: ${o.AbstractURL}`), o.RelatedTopics) for (const v of o.RelatedTopics.slice(0, e)) v.Text && u.push(`- ${v.Text}${v.FirstURL ? ` (${v.FirstURL})` : ""}`);
    return u.length === 0 ? `No results found for: "${t}"` : u.join(`

`);
  }
  async function Oo(t, e) {
    const n = {};
    lr(n, e);
    const s = await fetch(t, {
      headers: n
    });
    if (!s.ok) throw new Error(`Fetch failed: ${s.status} ${s.statusText}`);
    if ((s.headers.get("content-type") || "").includes("application/json")) {
      const u = await s.json();
      return JSON.stringify(u, null, 2).slice(0, 1e4);
    }
    return (await s.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1e4);
  }
  function Do(t, e) {
    try {
      return t.read_file(e);
    } catch (n) {
      throw new Error(`read_file: ${n.message || n}`);
    }
  }
  function qo(t, e, n) {
    try {
      return t.write_file(e, n), `File written: ${e} (${n.length} bytes)`;
    } catch (s) {
      throw new Error(`write_file: ${s.message || s}`);
    }
  }
  function Po(t, e) {
    const n = t.list_dir(e), s = JSON.parse(n);
    if (s.error) throw new Error(`list_dir: ${s.error}`);
    return s.length === 0 ? "(empty directory)" : s.map((r) => `${r.is_dir ? "\u{1F4C1}" : "\u{1F4C4}"} ${r.name}${r.is_dir ? "/" : ` (${r.size}b)`}`).join(`
`);
  }
  async function Mo(t, e = [], n = "/workspace") {
    try {
      if (Na()) {
        const i = e.length > 0 ? `${t} ${e.join(" ")}` : t, o = await Ua(i);
        return ir(o);
      }
      const r = await (await rr()).run(t, e);
      return or(r);
    } catch (s) {
      return `Shell execution error: ${s.message}`;
    }
  }
  async function To(t, e = [], n = {}) {
    try {
      if (Na()) {
        const i = e.length > 0 ? `${t} ${e.join(" ")}` : t, o = await Ua(i);
        return ir(o);
      }
      const r = await (await rr()).run(t, e, n);
      return or(r);
    } catch (s) {
      return `Shell execution error: ${s.message}`;
    }
  }
  function ir(t) {
    let e = "";
    return t.stdout && (e += t.stdout), t.stderr && (e += (e ? `
` : "") + `[stderr] ${t.stderr}`), e += (e ? `
` : "") + `[exit code: ${t.exit_code}] (${t.duration_ms.toFixed(0)}ms)`, e;
  }
  function or(t) {
    let e = "";
    return t.stdout && (e += t.stdout), t.stderr && (e += (e ? `
` : "") + `[stderr] ${t.stderr}`), e += (e ? `
` : "") + `[exit code: ${t.exit_code}]`, e;
  }
  function lr(t, e) {
    if (!e.credential_mapping) return;
    const n = e.credential_mapping;
    try {
      const r = Gt().decrypt_credential(n.credential_id);
      n.inject_type === "header" && r ? t[n.inject_key] = n.inject_prefix + r : n.inject_type;
    } catch (s) {
      console.debug("[EZ-Claw] Credential injection skipped:", s);
    }
  }
  async function No(t, e, n) {
    try {
      const { MCPManager: s } = await _n(async () => {
        const { MCPManager: u } = await import("./mcp-client-BrUchD5z.js");
        return {
          MCPManager: u
        };
      }, [], import.meta.url), i = s.getInstance().getConnection(t);
      if (!i || !i.isConnected) return `MCP server '${t}' is not connected. Use the MCP panel to connect first.`;
      const o = await i.callTool(e, n);
      return typeof o == "string" ? o : JSON.stringify(o, null, 2);
    } catch (s) {
      return `MCP tool call failed: ${s.message}`;
    }
  }
  function Uo(t, e, n) {
    try {
      const r = Gt().register_dynamic_tool(t, e, n), i = JSON.parse(r);
      return i.success ? `Tool '${t}' created successfully. It can now be used in subsequent tool calls.` : `Failed to create tool '${t}': ${i.error || "unknown error"}`;
    } catch (s) {
      return `Dynamic tool creation failed: ${s.message}`;
    }
  }
  const Ro = {
    tier: "container2wasm",
    enabled: false,
    timeoutMs: 3e4,
    maxOutputBytes: 1e5,
    cwd: "/"
  };
  class Bo {
    config;
    container = null;
    containerPromise = null;
    constructor(e) {
      this.config = e;
    }
    async getContainer() {
      return this.container ? this.container : (this.containerPromise || (this.containerPromise = this.initContainer()), this.container = await this.containerPromise, this.container);
    }
    async initContainer() {
      const e = await uo(), n = new Qt();
      try {
        const s = `/containers/alpine-${e}.wasm`, r = await Qt.load(s);
        return await r.start(), console.log("[WASI] Container loaded successfully"), r;
      } catch (s) {
        return console.warn("[WASI] Failed to load WASM, using fallback shell:", s), await n.start(), n;
      }
    }
    async execute(e, n) {
      const s = performance.now();
      try {
        const i = (await this.getContainer()).run(e), o = new Promise((v, f) => setTimeout(() => f(new Error("TIMEOUT")), n));
        let u;
        try {
          u = await Promise.race([
            i,
            o
          ]);
        } catch (v) {
          if (v.message === "TIMEOUT") return {
            exitCode: 124,
            stdout: "",
            stderr: `Command timed out after ${n}ms`,
            durationMs: n,
            timedOut: true,
            truncated: false
          };
          throw v;
        }
        return {
          exitCode: u.exit_code,
          stdout: u.stdout.slice(0, this.config.maxOutputBytes),
          stderr: u.stderr.slice(0, this.config.maxOutputBytes),
          durationMs: performance.now() - s,
          timedOut: false,
          truncated: u.stdout.length > this.config.maxOutputBytes
        };
      } catch (r) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: r.message,
          durationMs: performance.now() - s,
          timedOut: false,
          truncated: false
        };
      }
    }
    async mountWorkspace(e) {
      await (await this.getContainer()).mount("/workspace", e);
    }
    getContainerInfo() {
      return this.container?.getInfo();
    }
  }
  class Lo {
    config;
    ws = null;
    pendingCommands = /* @__PURE__ */ new Map();
    constructor(e) {
      this.config = e;
    }
    async connect() {
      const e = this.config.companionUrl || "ws://localhost:9229";
      return new Promise((n, s) => {
        this.ws = new WebSocket(e), this.ws.onopen = () => {
          console.log("[EZ-Claw] Connected to native CLI companion"), n();
        }, this.ws.onerror = () => s(new Error("Failed to connect to native CLI companion")), this.ws.onmessage = (r) => {
          try {
            const i = JSON.parse(r.data), o = this.pendingCommands.get(i.id);
            o && (clearTimeout(o.timeout), this.pendingCommands.delete(i.id), o.resolve({
              exitCode: i.exitCode || 0,
              stdout: (i.stdout || "").slice(0, this.config.maxOutputBytes),
              stderr: (i.stderr || "").slice(0, this.config.maxOutputBytes),
              durationMs: i.durationMs || 0,
              timedOut: false,
              truncated: (i.stdout || "").length > this.config.maxOutputBytes
            }));
          } catch {
          }
        }, this.ws.onclose = () => {
          for (const [r, i] of this.pendingCommands) clearTimeout(i.timeout), i.resolve({
            exitCode: 1,
            stdout: "",
            stderr: "Connection to native CLI companion lost",
            durationMs: 0,
            timedOut: false,
            truncated: false
          });
          this.pendingCommands.clear();
        };
      });
    }
    disconnect() {
      this.ws?.close(), this.ws = null;
    }
    async execute(e) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return {
        exitCode: 1,
        stdout: "",
        stderr: `Not connected to native CLI companion.
Install: npm i -g ezclaw-node && ezclaw-node
`,
        durationMs: 0,
        timedOut: false,
        truncated: false
      };
      const n = crypto.randomUUID();
      return new Promise((s) => {
        const r = window.setTimeout(() => {
          this.pendingCommands.delete(n), s({
            exitCode: 124,
            stdout: "",
            stderr: `Command timed out after ${this.config.timeoutMs}ms`,
            durationMs: this.config.timeoutMs,
            timedOut: true,
            truncated: false
          });
        }, this.config.timeoutMs);
        this.pendingCommands.set(n, {
          resolve: s,
          timeout: r
        }), this.ws.send(JSON.stringify({
          id: n,
          type: "exec",
          command: e,
          cwd: this.config.cwd,
          timeoutMs: this.config.timeoutMs
        }));
      });
    }
    get isConnected() {
      return this.ws?.readyState === WebSocket.OPEN;
    }
  }
  class Ra {
    config;
    wasi;
    native;
    outputListeners = [];
    commandHistory = [];
    MAX_HISTORY = 500;
    constructor(e = {}) {
      this.config = {
        ...Ro,
        ...e
      }, this.wasi = new Bo(this.config), this.native = new Lo(this.config);
    }
    setTier(e) {
      this.config.tier = e;
    }
    getConfig() {
      return {
        ...this.config
      };
    }
    onOutput(e) {
      this.outputListeners.push(e);
    }
    offOutput(e) {
      this.outputListeners = this.outputListeners.filter((n) => n !== e);
    }
    emit(e) {
      for (const n of this.outputListeners) n(e);
    }
    async execute(e) {
      this.emit(`$ ${e}
`);
      let n;
      switch (this.config.tier) {
        case "container2wasm": {
          if (Na()) {
            const s = performance.now();
            try {
              const r = await Ua(e, this.config.timeoutMs);
              n = {
                exitCode: r.exit_code,
                stdout: r.stdout.slice(0, this.config.maxOutputBytes),
                stderr: r.stderr.slice(0, this.config.maxOutputBytes),
                durationMs: r.duration_ms,
                timedOut: r.exit_code === 124,
                truncated: r.stdout.length > this.config.maxOutputBytes
              };
            } catch (r) {
              n = {
                exitCode: 1,
                stdout: "",
                stderr: r.message,
                durationMs: performance.now() - s,
                timedOut: false,
                truncated: false
              };
            }
          } else n = await this.wasi.execute(e, this.config.timeoutMs);
          break;
        }
        case "wasi":
          n = await this.wasi.execute(e, this.config.timeoutMs);
          break;
        case "native":
          n = await this.native.execute(e);
          break;
        default:
          n = {
            exitCode: 1,
            stdout: "",
            stderr: `Unknown sandbox tier: ${this.config.tier}`,
            durationMs: 0,
            timedOut: false,
            truncated: false
          };
      }
      return n.stdout && this.emit(n.stdout), n.stderr && this.emit(`\x1B[31m${n.stderr}\x1B[0m`), this.recordAudit(e, n), n;
    }
    recordAudit(e, n) {
      const s = {
        id: crypto.randomUUID(),
        command: e,
        tier: this.config.tier,
        result: n,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.commandHistory.push(s), this.commandHistory.length > this.MAX_HISTORY && (this.commandHistory = this.commandHistory.slice(-this.MAX_HISTORY));
    }
    getHistory() {
      return [
        ...this.commandHistory
      ];
    }
    clearHistory() {
      this.commandHistory = [];
    }
    async connectNative(e) {
      e && (this.config.companionUrl = e), await this.native.connect();
    }
    disconnectNative() {
      this.native.disconnect();
    }
    get isNativeConnected() {
      return this.native.isConnected;
    }
    getStatus() {
      switch (this.config.tier) {
        case "container2wasm": {
          const e = vn();
          return e.ready ? {
            tier: "container2wasm",
            available: true,
            info: `${e.os} Linux (${e.arch}) via container2wasm`
          } : {
            tier: "container2wasm",
            available: true,
            info: "BusyBox fallback (container not loaded)"
          };
        }
        case "wasi":
          return {
            tier: "wasi",
            available: true,
            info: "WASI sandbox (BusyBox shell + OPFS workspace)"
          };
        case "native":
          return {
            tier: "native",
            available: this.native.isConnected,
            info: this.native.isConnected ? "Connected to companion" : "Not connected"
          };
        default:
          return {
            tier: this.config.tier,
            available: false,
            info: "Unknown tier"
          };
      }
    }
    async mountWorkspace(e) {
      await this.wasi.mountWorkspace(e);
    }
    getContainerInfo() {
      return this.config.tier === "wasi" ? this.wasi.getContainerInfo() : null;
    }
  }
  var $o = g('<div class="empty-state svelte-xdaci2"><div class="empty-icon svelte-xdaci2">\u{1F980}</div> <h2 class="svelte-xdaci2">Welcome to EZ-Claw</h2> <p class="svelte-xdaci2">Your AI agent \u2014 running locally in your browser</p> <div class="quick-prompts svelte-xdaci2"><button class="quick-prompt svelte-xdaci2">\u{1F4DD} Create a README file</button> <button class="quick-prompt svelte-xdaci2">\u{1F50D} Research & summarize</button> <button class="quick-prompt svelte-xdaci2">\u{1F4C2} Organize my workspace</button></div></div>'), Fo = g('<div class="tool-activity svelte-xdaci2"><span class="tool-spinner svelte-xdaci2"></span> <span> </span></div>'), Wo = g('<div class="spinner svelte-xdaci2"></div>'), jo = Nr('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'), Jo = g('<div class="chat-area svelte-xdaci2"><div class="messages-container svelte-xdaci2"><!> <!> <!> <!></div> <div class="input-area glass-elevated svelte-xdaci2"><div class="input-wrapper svelte-xdaci2"><textarea class="chat-input svelte-xdaci2" placeholder="Message EZ-Claw..." rows="1"></textarea> <button class="send-btn svelte-xdaci2" aria-label="Send message"><!></button></div> <div class="input-footer svelte-xdaci2"><span> </span></div></div></div>');
  function Ho(t, e) {
    nt(e, true);
    let n = null;
    function s() {
      return n || (n = new Ra({
        tier: "wasi",
        enabled: true
      })), n;
    }
    let r = null;
    function i() {
      return r || (r = new (Gt()).WasmWorkspace()), r;
    }
    let o = z(Te([])), u = z(""), v = z(false), f = z(""), p = z(""), b = z(void 0), k = z(void 0);
    Vn(() => {
      e.sessionId ? (d(f, ""), d(v, false), d(p, ""), P(e.sessionId)) : d(o, [], true);
    });
    async function P(C) {
      try {
        const m = await Ys(C);
        m && m.messages ? (d(o, m.messages, true), await B()) : d(o, [], true);
      } catch {
        d(o, [], true);
      }
    }
    async function B() {
      await xa(), a(b) && (a(b).scrollTop = a(b).scrollHeight);
    }
    async function U() {
      const C = a(u).trim();
      if (!(!C || a(v))) {
        if (!e.apiKey && !Bt.includes(e.provider)) {
          d(o, [
            ...a(o),
            {
              role: "assistant",
              content: "\u26A0\uFE0F **No API key configured.** Please open Settings and enter your API key to start chatting."
            }
          ], true);
          return;
        }
        d(o, [
          ...a(o),
          {
            role: "user",
            content: C
          }
        ], true), d(u, ""), d(v, true), d(f, ""), d(p, ""), await B();
        try {
          const m = Gt();
          let x = Ca();
          Wn() && (x += `

` + Ia());
          let $ = [];
          try {
            $ = Sn(C, 5).map((te) => `[${te.category}] ${te.key}: ${te.content}`);
          } catch {
          }
          const J = a(o).filter((q) => q && q.role && q.content), D = new m.WasmAgent(JSON.stringify({
            default_provider: e.provider,
            default_model: e.model,
            default_temperature: e.temperature
          })), X = D.build_messages(JSON.stringify(J), JSON.stringify($), x, (/* @__PURE__ */ new Date()).toLocaleString());
          D.free();
          const W = new m.WasmToolRegistry(), ce = W.to_llm_json();
          console.log("[EZ-Claw] Tools JSON:", ce.slice(0, 500)), W.free();
          const ge = {
            provider: e.provider,
            apiKey: e.apiKey,
            model: e.model,
            temperature: e.temperature,
            apiUrl: e.apiUrl || void 0
          };
          let ye = JSON.parse(X), G = 10;
          for (let q = 0; q < G; q++) {
            d(p, q > 0 ? "Thinking..." : "", true);
            const te = m.build_provider_request_with_tools(JSON.stringify(ye), e.model, e.temperature, false, ce), Se = `${e.apiUrl || m.provider_base_url(e.provider)}/chat/completions`, Ee = Js(e.provider, e.apiKey), ke = await fetch(Se, {
              method: "POST",
              headers: Ee,
              body: te
            });
            if (!ke.ok) {
              const j = await ke.text();
              throw new Error(`API error ${ke.status}: ${j}`);
            }
            const N = (await ke.json()).choices?.[0];
            if (!N) throw new Error("No response from model");
            const fe = N.message;
            if (console.log("[EZ-Claw] Response:", JSON.stringify(fe)), fe.tool_calls && fe.tool_calls.length > 0) {
              console.log("[EZ-Claw] Tool calls detected:", fe.tool_calls), ye.push(fe);
              for (const j of fe.tool_calls) {
                const Y = j.function?.name || j.name || "unknown", ve = j.function?.arguments || j.arguments || "{}", me = j.id || crypto.randomUUID();
                d(p, `\u{1F527} Running: ${Y}...`), await B();
                let Ae;
                try {
                  const Me = JSON.parse(ve);
                  console.log("[EZ-Claw] Executing tool:", Y, Me), Ae = await _(Y, Me), console.log("[EZ-Claw] Tool result:", Ae.slice(0, 200));
                } catch (Me) {
                  Ae = `Error: ${Me.message}`;
                }
                ye.push({
                  role: "tool",
                  tool_call_id: me,
                  content: Ae
                });
              }
              continue;
            }
            const be = fe.content || "";
            if (d(o, [
              ...a(o),
              {
                role: "assistant",
                content: be
              }
            ], true), d(p, ""), d(v, false), d(f, ""), e.sessionId) {
              const j = {
                id: e.sessionId,
                title: E(a(o)),
                clawName: "",
                emoji: "\u{1F980}",
                personaId: null,
                skillSetId: null,
                status: "running",
                messages: a(o).map((Y) => ({
                  role: Y.role,
                  content: Y.content
                })),
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
                model: e.model,
                provider: e.provider
              };
              await Qn(j), e.onSessionUpdate(j);
            }
            try {
              pt(`chat-${Date.now()}`, `User: ${C}
Assistant: ${be.slice(0, 200)}`, "conversation", e.sessionId || "");
            } catch {
            }
            await B();
            return;
          }
          d(p, ""), d(v, false), d(o, [
            ...a(o),
            {
              role: "assistant",
              content: "\u26A0\uFE0F Reached maximum tool execution depth. Please try again."
            }
          ], true);
        } catch (m) {
          d(o, [
            ...a(o),
            {
              role: "assistant",
              content: `\u274C **Error:** ${m instanceof Error ? m.message : String(m)}`
            }
          ], true), d(v, false), d(f, ""), d(p, "");
        }
      }
    }
    async function _(C, m) {
      switch (C) {
        case "web_search": {
          const x = m.query || "", I = `https://api.duckduckgo.com/?q=${encodeURIComponent(x)}&format=json&no_html=1&skip_disambig=1`, J = await (await fetch(I)).json(), D = [];
          if (J.Abstract && D.push(`**Summary**: ${J.Abstract}
Source: ${J.AbstractURL}`), J.RelatedTopics) for (const X of J.RelatedTopics.slice(0, 5)) X.Text && D.push(`- ${X.Text}${X.FirstURL ? ` (${X.FirstURL})` : ""}`);
          return D.length > 0 ? D.join(`

`) : `No results for: "${x}"`;
        }
        case "web_fetch":
          return (await (await fetch(m.url)).text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1e4);
        case "memory_store": {
          const x = m.key || `mem-${Date.now()}`, I = m.content || m.value || "", $ = m.category || "core";
          try {
            return pt(x, I, $), `Memory stored: key="${x}", category="${$}"`;
          } catch (J) {
            return `Memory store failed: ${J.message}`;
          }
        }
        case "memory_recall":
          try {
            const x = Sn(m.query || "", m.limit || 5);
            return x.length === 0 ? `No memories found for: "${m.query}"` : x.map((I) => `[${I.category}] ${I.key}: ${I.content}`).join(`
`);
          } catch (x) {
            return `Memory recall failed: ${x.message}`;
          }
        case "update_identity": {
          const x = rt();
          m.name && (x.name = m.name, x.facts.name = m.name), m.personality && (x.personality = m.personality), m.instructions && (x.instructions = m.instructions), m.creature && (x.creature = m.creature), m.vibe && (x.vibe = m.vibe), m.emoji && (x.emoji = m.emoji), m.fact_key && m.fact_value && (x.facts[m.fact_key] = m.fact_value), nn(x), m.name && !x.bootstrapped && As();
          try {
            m.name && pt("identity_name", `My name is ${m.name}`, "identity"), m.personality && pt("identity_personality", m.personality, "identity"), m.creature && pt("identity_creature", m.creature, "identity"), m.fact_key && pt(`identity_${m.fact_key}`, m.fact_value, "identity");
          } catch {
          }
          return `Identity updated successfully: ${JSON.stringify(x, null, 2)}`;
        }
        case "read_file":
          try {
            return i().read_file(m.path || "");
          } catch (x) {
            return `read_file error: ${x.message}`;
          }
        case "write_file":
          try {
            return i().write_file(m.path || "", m.content || ""), `File written: ${m.path} (${(m.content || "").length} bytes)`;
          } catch (x) {
            return `write_file error: ${x.message}`;
          }
        case "list_dir":
          try {
            const I = i().list_dir(m.path || "/"), $ = JSON.parse(I);
            return $.length === 0 ? "(empty directory)" : $.map((J) => `${J.is_dir ? "\u{1F4C1}" : "\u{1F4C4}"} ${J.name}${J.is_dir ? "/" : ` (${J.size}b)`}`).join(`
`);
          } catch (x) {
            return `list_dir error: ${x.message}`;
          }
        case "shell_exec": {
          const I = await s().execute(m.command || "");
          let $ = "";
          return I.stdout && ($ += I.stdout), I.stderr && ($ += ($ ? `
` : "") + `STDERR: ${I.stderr}`), I.timedOut && ($ += `
(command timed out)`), $ || "(no output)";
        }
        default:
          return `Unknown tool: ${C}`;
      }
    }
    function E(C) {
      const m = C.find((I) => I.role === "user");
      if (!m) return "New Claw";
      const x = m.content.slice(0, 50);
      return x.length < m.content.length ? x + "..." : x;
    }
    function y(C) {
      C.key === "Enter" && !C.shiftKey && (C.preventDefault(), U());
    }
    function S(C) {
      C.style.height = "auto", C.style.height = Math.min(C.scrollHeight, 150) + "px";
    }
    var O = Jo(), Q = l(O), V = l(Q);
    {
      var ne = (C) => {
        var m = $o(), x = c(l(m), 6), I = l(x), $ = c(I, 2), J = c($, 2);
        w("click", I, () => {
          d(u, "Create a project README.md file for a new web app");
        }), w("click", $, () => {
          d(u, "Search the web for the latest news about AI agents and summarize what you find");
        }), w("click", J, () => {
          d(u, "List the files in my workspace and organize them into folders by type");
        }), h(C, m);
      };
      M(V, (C) => {
        a(o).length === 0 && !a(v) && C(ne);
      });
    }
    var L = c(V, 2);
    Re(L, 17, () => a(o), je, (C, m) => {
      Ya(C, {
        get role() {
          return a(m).role;
        },
        get content() {
          return a(m).content;
        }
      });
    });
    var ue = c(L, 2);
    {
      var ae = (C) => {
        Ya(C, {
          role: "assistant",
          get content() {
            return a(f);
          },
          isStreaming: true
        });
      };
      M(ue, (C) => {
        a(v) && a(f) && C(ae);
      });
    }
    var we = c(ue, 2);
    {
      var pe = (C) => {
        var m = Fo(), x = c(l(m), 2), I = l(x);
        Z(() => A(I, a(p))), h(C, m);
      };
      M(we, (C) => {
        a(p) && C(pe);
      });
    }
    Fn(Q, (C) => d(b, C), () => a(b));
    var R = c(Q, 2), F = l(R), le = l(F);
    Fn(le, (C) => d(k, C), () => a(k));
    var oe = c(le, 2), H = l(oe);
    {
      var K = (C) => {
        var m = Wo();
        h(C, m);
      }, T = (C) => {
        var m = jo();
        h(C, m);
      };
      M(H, (C) => {
        a(v) ? C(K) : C(T, -1);
      });
    }
    var se = c(F, 2), re = l(se), ie = l(re);
    Z((C) => {
      le.disabled = a(v), oe.disabled = C, A(ie, `Shift+Enter for new line \u2022 ${e.provider ?? ""}/${e.model ?? ""}`);
    }, [
      () => !a(u).trim() || a(v)
    ]), w("keydown", le, y), w("input", le, (C) => S(C.currentTarget)), De(le, () => a(u), (C) => d(u, C)), w("click", oe, U), h(t, O), at();
  }
  tt([
    "click",
    "keydown",
    "input"
  ]);
  var Ko = g("<option> </option>"), Vo = g("<option> </option>"), Yo = g('<span class="field-hint svelte-1u3w06f">Authentication handled locally</span>'), Zo = g('<span class="field-hint svelte-1u3w06f"> </span>'), Go = g('<label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <input class="input" type="text"/> <!></label>'), Xo = g('<p class="export-status svelte-1u3w06f"> </p>'), Qo = g('<div class="modal-overlay"><div class="modal-content"><div class="modal-header svelte-1u3w06f"><h2 class="svelte-1u3w06f">\u2699\uFE0F Settings</h2> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="settings-section svelte-1u3w06f"><h3 class="svelte-1u3w06f">AI Provider</h3> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f">Provider</span> <select class="input"></select></label> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f">Model</span> <input class="input" type="text" placeholder="Model name" list="model-suggestions"/> <datalist id="model-suggestions"></datalist> <span class="field-hint svelte-1u3w06f"> </span></label> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <div class="api-key-wrapper svelte-1u3w06f"><input class="input svelte-1u3w06f"/> <button class="btn btn-ghost btn-sm"> </button></div> <!></label> <!> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <input type="range" min="0" max="2" step="0.1" class="slider svelte-1u3w06f"/> <div class="slider-labels svelte-1u3w06f"><span>Precise</span><span>Creative</span></div></label></div> <div class="divider"></div> <div class="settings-section svelte-1u3w06f"><h3 class="svelte-1u3w06f">Data</h3> <div class="data-actions svelte-1u3w06f"><button class="btn btn-secondary">\u{1F4E4} Export Data</button> <button class="btn btn-secondary">\u{1F4E5} Import Data</button></div> <!></div> <div class="divider"></div> <div class="modal-footer svelte-1u3w06f"><button class="btn btn-secondary">Cancel</button> <button class="btn btn-primary">Save Changes</button></div></div></div>');
  function el(t, e) {
    nt(e, true);
    let n = z(Te(e.provider)), s = z(Te(e.model)), r = z(Te(e.apiKey)), i = z(Te(e.temperature)), o = z(Te(e.apiUrl)), u = z(false), v = z("");
    const f = Zn;
    function p() {
      const q = f.find((te) => te.id === a(n));
      q && (d(s, q.defaultModel, true), d(r, ""), d(o, dn(a(n)), true));
    }
    function b() {
      e.onSave({
        provider: a(n),
        model: a(s),
        apiKey: a(r),
        temperature: a(i),
        apiUrl: a(o)
      });
    }
    async function k() {
      try {
        const q = await Xs(), te = new Blob([
          q
        ], {
          type: "application/json"
        }), de = URL.createObjectURL(te), Se = document.createElement("a");
        Se.href = de, Se.download = `ezclaw-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, Se.click(), URL.revokeObjectURL(de), d(v, "\u2705 Exported!"), setTimeout(() => d(v, ""), 3e3);
      } catch {
        d(v, "\u274C Export failed");
      }
    }
    async function P() {
      const q = document.createElement("input");
      q.type = "file", q.accept = ".json", q.onchange = async () => {
        const te = q.files?.[0];
        if (!te) return;
        const de = await te.text();
        try {
          const Se = await Qs(de);
          d(v, `\u2705 Imported ${Se} sessions`), setTimeout(() => d(v, ""), 3e3);
        } catch {
          d(v, "\u274C Import failed");
        }
      }, q.click();
    }
    var B = Qo(), U = l(B), _ = l(U), E = c(l(_), 2), y = c(_, 2), S = c(l(y), 2), O = c(l(S), 2);
    Re(O, 21, () => f, (q) => q.id, (q, te) => {
      var de = Ko(), Se = l(de), Ee = {};
      Z(() => {
        A(Se, `${a(te).name ?? ""}
              ${a(te).free ? "(Free)" : ""}`), Ee !== (Ee = a(te).id) && (de.value = (de.__value = a(te).id) ?? "");
      }), h(q, de);
    });
    var Q = c(S, 2), V = c(l(Q), 2), ne = c(V, 2);
    Re(ne, 21, () => f, je, (q, te) => {
      var de = st(), Se = Pe(de);
      {
        var Ee = (ke) => {
          var ee = st(), N = Pe(ee);
          Re(N, 17, () => a(te).models, je, (fe, be, j) => {
            var Y = Vo(), ve = l(Y), me = {};
            Z(() => {
              A(ve, a(te).modelLabels?.[j] || a(be)), me !== (me = a(be)) && (Y.value = (Y.__value = a(be)) ?? "");
            }), h(fe, Y);
          }), h(ke, ee);
        };
        M(Se, (ke) => {
          a(te).id === a(n) && ke(Ee);
        });
      }
      h(q, de);
    });
    var L = c(ne, 2), ue = l(L), ae = c(Q, 2), we = l(ae), pe = l(we), R = c(we, 2), F = l(R), le = c(F, 2), oe = l(le), H = c(R, 2);
    {
      var K = (q) => {
        var te = Yo();
        h(q, te);
      }, T = Rt(() => Bt.includes(a(n)));
      M(H, (q) => {
        a(T) && q(K);
      });
    }
    var se = c(ae, 2);
    {
      var re = (q) => {
        var te = Go(), de = l(te), Se = l(de), Ee = c(de, 2), ke = c(Ee, 2);
        {
          var ee = (N) => {
            const fe = Rt(() => dn(a(n)));
            var be = st(), j = Pe(be);
            {
              var Y = (ve) => {
                var me = Zo(), Ae = l(me);
                Z(() => A(Ae, `Using default: ${a(fe) ?? ""}`)), h(ve, me);
              };
              M(j, (ve) => {
                a(fe) && ve(Y);
              });
            }
            h(N, be);
          };
          M(ke, (N) => {
            !a(o) && a(n) !== "custom" && N(ee);
          });
        }
        Z((N) => {
          A(Se, `API URL ${a(n) !== "custom" ? "(optional)" : ""}`), dt(Ee, "placeholder", N);
        }, [
          () => dn(a(n)) || "Leave empty to use default"
        ]), De(Ee, () => a(o), (N) => d(o, N)), h(q, te);
      }, ie = Rt(() => a(n) === "custom" || dn(a(n)) || a(n) === "deepseek" || a(n) === "openrouter" || a(n) === "openai" || a(n) === "anthropic");
      M(se, (q) => {
        a(ie) && q(re);
      });
    }
    var C = c(se, 2), m = l(C), x = l(m), I = c(m, 2), $ = c(y, 4), J = c(l($), 2), D = l(J), X = c(D, 2), W = c(J, 2);
    {
      var ce = (q) => {
        var te = Xo(), de = l(te);
        Z(() => A(de, a(v))), h(q, te);
      };
      M(W, (q) => {
        a(v) && q(ce);
      });
    }
    var ge = c($, 4), ye = l(ge), G = c(ye, 2);
    Z((q, te, de) => {
      A(ue, `Type or select a model. Provider: ${a(n) ?? ""}`), A(pe, `API Key ${q ?? ""}`), dt(F, "type", a(u) ? "text" : "password"), dt(F, "placeholder", te), A(oe, a(u) ? "\u{1F648}" : "\u{1F441}\uFE0F"), A(x, `Temperature: ${de ?? ""}`);
    }, [
      () => Bt.includes(a(n)) ? "(optional)" : "",
      () => Bt.includes(a(n)) ? "Not required" : "Enter your API key",
      () => a(i).toFixed(1)
    ]), w("click", B, function(...q) {
      e.onClose?.apply(this, q);
    }), w("click", U, (q) => q.stopPropagation()), w("click", E, function(...q) {
      e.onClose?.apply(this, q);
    }), w("change", O, p), wn(O, () => a(n), (q) => d(n, q)), De(V, () => a(s), (q) => d(s, q)), De(F, () => a(r), (q) => d(r, q)), w("click", le, () => d(u, !a(u))), De(I, () => a(i), (q) => d(i, q)), w("click", D, k), w("click", X, P), w("click", ye, function(...q) {
      e.onClose?.apply(this, q);
    }), w("click", G, b), h(t, B), at();
  }
  tt([
    "click",
    "change"
  ]);
  var tl = g(`<div class="onboarding-step fade-in svelte-iscxm"><div class="onboarding-header svelte-iscxm"><span class="big-icon svelte-iscxm">\u{1F980}</span> <h1 class="svelte-iscxm">Welcome to EZ-Claw</h1> <p class="svelte-iscxm">Your AI agent, running locally in your browser. Private, fast, and
            powerful.</p></div> <div class="features svelte-iscxm"><div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u26A1</span> <div><strong>Lightning Fast</strong> <p class="svelte-iscxm">Core engine compiled from Rust \u2014 blazing performance</p></div></div> <div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u{1F512}</span> <div><strong>Your Data Stays Local</strong> <p class="svelte-iscxm">Everything stored in your browser \u2014 nothing on servers</p></div></div> <div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u{1F9E0}</span> <div><strong>Smart Memory</strong> <p class="svelte-iscxm">Remembers context across sessions via local database</p></div></div></div> <button class="btn btn-primary btn-lg svelte-iscxm">Get Started \u2192</button></div>`), nl = g('<span class="badge badge-success">Free</span>'), al = g('<span class="check-mark svelte-iscxm">\u2713</span>'), sl = g('<button><span class="provider-icon svelte-iscxm"> </span> <div class="provider-info svelte-iscxm"><strong class="svelte-iscxm"> </strong> <span class="provider-desc svelte-iscxm"> </span></div> <div class="provider-badges svelte-iscxm"><!> <!></div></button>'), rl = g('<div class="onboarding-step fade-in svelte-iscxm"><h2 class="svelte-iscxm">Choose Your AI Provider</h2> <p class="step-subtitle svelte-iscxm">You can change this anytime in Settings</p> <div class="provider-list svelte-iscxm"></div> <div class="step-actions svelte-iscxm"><button class="btn btn-secondary">\u2190 Back</button> <button class="btn btn-primary">Continue \u2192</button></div></div>'), il = g('<label class="field svelte-iscxm"><span class="field-label svelte-iscxm">API Key</span> <input class="input" type="password" placeholder="sk-..."/></label> <a class="signup-link svelte-iscxm" target="_blank" rel="noopener"> </a>', 1), ol = g('<div class="onboarding-step fade-in svelte-iscxm"><h2 class="svelte-iscxm">Enter Your API Key</h2> <p class="step-subtitle svelte-iscxm"><!></p> <!> <label class="field svelte-iscxm"><span class="field-label svelte-iscxm">Model</span> <input class="input" type="text"/></label> <div class="step-actions svelte-iscxm"><button class="btn btn-secondary">\u2190 Back</button> <button class="btn btn-primary">Start Chatting \u{1F680}</button></div></div>'), ll = g('<div class="modal-overlay"><div class="modal-content onboarding svelte-iscxm"><!></div></div>');
  function cl(t, e) {
    nt(e, true);
    let n = z(1), s = z("deepseek"), r = z(""), i = z("deepseek-chat");
    const o = [
      {
        id: "deepseek",
        name: "DeepSeek",
        icon: "\u{1F9E0}",
        description: "Powerful & affordable AI",
        defaultModel: "deepseek-chat",
        free: true,
        signupUrl: "https://platform.deepseek.com/"
      },
      {
        id: "openrouter",
        name: "OpenRouter",
        icon: "\u{1F310}",
        description: "100+ models, one API",
        defaultModel: "deepseek/deepseek-chat",
        free: true,
        signupUrl: "https://openrouter.ai/"
      },
      {
        id: "ollama",
        name: "Ollama",
        icon: "\u{1F999}",
        description: "Local & private",
        defaultModel: "llama3",
        free: true,
        signupUrl: "https://ollama.ai/"
      },
      {
        id: "openai",
        name: "OpenAI",
        icon: "\u{1F49A}",
        description: "GPT-4o & more",
        defaultModel: "gpt-4o-mini",
        free: false,
        signupUrl: "https://platform.openai.com/"
      },
      {
        id: "anthropic",
        name: "Anthropic",
        icon: "\u{1F52E}",
        description: "Claude 3.5 Sonnet",
        defaultModel: "claude-3-5-sonnet-20241022",
        free: false,
        signupUrl: "https://console.anthropic.com/"
      },
      {
        id: "google",
        name: "Google AI",
        icon: "\u2728",
        description: "Gemini 2.0 Flash",
        defaultModel: "gemini-2.0-flash",
        free: true,
        signupUrl: "https://aistudio.google.com/"
      }
    ];
    function u(U) {
      d(s, U, true);
      const _ = o.find((E) => E.id === U);
      _ && d(i, _.defaultModel, true);
    }
    function v() {
      e.onComplete({
        provider: a(s),
        model: a(i),
        apiKey: a(r)
      });
    }
    var f = ll(), p = l(f), b = l(p);
    {
      var k = (U) => {
        var _ = tl(), E = c(l(_), 4);
        w("click", E, () => d(n, 2)), h(U, _);
      }, P = (U) => {
        var _ = rl(), E = c(l(_), 4);
        Re(E, 21, () => o, (Q) => Q.id, (Q, V) => {
          var ne = sl();
          let L;
          var ue = l(ne), ae = l(ue), we = c(ue, 2), pe = l(we), R = l(pe), F = c(pe, 2), le = l(F), oe = c(we, 2), H = l(oe);
          {
            var K = (re) => {
              var ie = nl();
              h(re, ie);
            };
            M(H, (re) => {
              a(V).free && re(K);
            });
          }
          var T = c(H, 2);
          {
            var se = (re) => {
              var ie = al();
              h(re, ie);
            };
            M(T, (re) => {
              a(s) === a(V).id && re(se);
            });
          }
          Z(() => {
            L = Ie(ne, 1, "provider-row svelte-iscxm", null, L, {
              selected: a(s) === a(V).id
            }), A(ae, a(V).icon), A(R, a(V).name), A(le, a(V).description);
          }), w("click", ne, () => u(a(V).id)), h(Q, ne);
        });
        var y = c(E, 2), S = l(y), O = c(S, 2);
        w("click", S, () => d(n, 1)), w("click", O, () => d(n, 3)), h(U, _);
      }, B = (U) => {
        var _ = ol(), E = c(l(_), 2), y = l(E);
        {
          var S = (pe) => {
            var R = xt(`Ollama runs locally \u2014 no API key needed! Just make sure Ollama is
            running.`);
            h(pe, R);
          }, O = (pe) => {
            var R = xt(`Get your key from the provider's dashboard. Your key is stored
            locally and never sent to our servers.`);
            h(pe, R);
          };
          M(y, (pe) => {
            a(s) === "ollama" ? pe(S) : pe(O, -1);
          });
        }
        var Q = c(E, 2);
        {
          var V = (pe) => {
            var R = il(), F = Pe(R), le = c(l(F), 2), oe = c(F, 2), H = l(oe);
            Z((K, T) => {
              dt(oe, "href", K), A(H, `Don't have a key? Sign up at ${T ?? ""} \u2192`);
            }, [
              () => o.find((K) => K.id === a(s))?.signupUrl,
              () => o.find((K) => K.id === a(s))?.name
            ]), De(le, () => a(r), (K) => d(r, K)), h(pe, R);
          };
          M(Q, (pe) => {
            a(s) !== "ollama" && pe(V);
          });
        }
        var ne = c(Q, 2), L = c(l(ne), 2), ue = c(ne, 2), ae = l(ue), we = c(ae, 2);
        Z((pe) => we.disabled = pe, [
          () => a(s) !== "ollama" && !a(r).trim()
        ]), De(L, () => a(i), (pe) => d(i, pe)), w("click", ae, () => d(n, 2)), w("click", we, v), h(U, _);
      };
      M(b, (U) => {
        a(n) === 1 ? U(k) : a(n) === 2 ? U(P, 1) : a(n) === 3 && U(B, 2);
      });
    }
    h(t, f), at();
  }
  tt([
    "click"
  ]);
  var dl = g('<span class="crumb-sep svelte-qwbtpz">/</span> <button class="crumb svelte-qwbtpz"> </button>', 1), ul = g('<button class="file-entry svelte-qwbtpz"><span class="file-icon svelte-qwbtpz">\u2B06\uFE0F</span> <span class="file-name svelte-qwbtpz">..</span></button>'), vl = g('<span class="file-size svelte-qwbtpz"> </span>'), fl = g('<div class="file-entry svelte-qwbtpz"><span class="file-icon svelte-qwbtpz"> </span> <span class="file-name svelte-qwbtpz"> </span> <!> <button class="file-delete svelte-qwbtpz" title="Delete">\u{1F5D1}\uFE0F</button></div>'), pl = g('<div class="empty-state svelte-qwbtpz"><p>No files yet</p> <button class="btn btn-sm btn-primary svelte-qwbtpz">Open a folder</button></div>'), ml = g('<div class="preview-actions svelte-qwbtpz"><button class="btn btn-sm btn-primary svelte-qwbtpz">Save</button> <button class="btn btn-sm btn-ghost svelte-qwbtpz">Cancel</button></div>'), hl = g('<button class="btn btn-sm btn-ghost svelte-qwbtpz">\u270F\uFE0F Edit</button>'), bl = g('<textarea class="file-editor svelte-qwbtpz"></textarea>'), _l = g('<pre class="file-content svelte-qwbtpz"> </pre>'), wl = g('<div class="file-preview svelte-qwbtpz"><div class="preview-header svelte-qwbtpz"><span class="preview-title svelte-qwbtpz"> </span> <!></div> <!></div>'), gl = g('<div class="files-toolbar svelte-qwbtpz"><div class="breadcrumb svelte-qwbtpz"><button class="crumb svelte-qwbtpz">~</button> <!></div> <div class="toolbar-actions svelte-qwbtpz"><button class="btn btn-sm btn-ghost svelte-qwbtpz" title="New file">\u{1F4C4}+</button> <button class="btn btn-sm btn-ghost svelte-qwbtpz" title="New folder">\u{1F4C1}+</button> <button class="btn btn-sm btn-primary svelte-qwbtpz">\u{1F4C2} Open Folder</button></div></div> <div class="files-content svelte-qwbtpz"><div class="file-list svelte-qwbtpz"><!> <!> <!></div> <!></div>', 1), yl = g('<span class="status-detail svelte-qwbtpz"> </span>'), kl = g('<span class="status-detail svelte-qwbtpz">No container loaded</span>'), Sl = g('<div class="load-progress svelte-qwbtpz"><div class="progress-bar svelte-qwbtpz"><div class="progress-fill svelte-qwbtpz"></div></div> <span class="progress-text svelte-qwbtpz"> </span></div>'), xl = g('<div class="add-image-form svelte-qwbtpz"><input type="text" placeholder="Image name (e.g. Kali Linux)" class="input-field svelte-qwbtpz"/> <input type="text" placeholder="Container image URL" class="input-field svelte-qwbtpz"/> <select class="input-field svelte-qwbtpz"><option>Alpine Linux</option><option>Kali Linux</option><option>Ubuntu</option><option>Debian</option><option>Custom</option></select> <button class="btn btn-sm btn-primary svelte-qwbtpz">Register</button></div>'), zl = g('<span class="image-size svelte-qwbtpz"> </span>'), Cl = g('<span class="active-badge svelte-qwbtpz">Active</span>'), Il = g('<button class="btn btn-sm btn-primary svelte-qwbtpz"> </button>'), El = g('<button class="btn btn-sm btn-ghost svelte-qwbtpz">\u{1F5D1}\uFE0F</button>'), Al = g('<div><div class="image-info svelte-qwbtpz"><span class="image-name svelte-qwbtpz"> </span> <span class="image-desc svelte-qwbtpz"> </span> <!></div> <div class="image-actions svelte-qwbtpz"><!> <!></div></div>'), Ol = g('<div class="container-tab"><div><div class="status-dot svelte-qwbtpz"></div> <div class="status-info svelte-qwbtpz"><span class="status-label svelte-qwbtpz"> </span> <!></div> <span class="arch-badge svelte-qwbtpz"> </span></div> <!> <div class="section-title svelte-qwbtpz"><h4 class="svelte-qwbtpz">Container Images</h4> <button class="btn btn-sm btn-primary svelte-qwbtpz">+ Add Image</button></div> <!> <div class="image-list svelte-qwbtpz"></div></div>'), Dl = g('<span class="active-dot svelte-qwbtpz"></span>'), ql = g('<button><span class="item-name svelte-qwbtpz"> </span> <!></button>'), Pl = g(`<p class="empty-hint svelte-qwbtpz">No saved personas. Use the Persona
                                        Manager to create one.</p>`), Ml = g('<div class="save-form svelte-qwbtpz"><input type="text" placeholder="Skill set name" class="input-field svelte-qwbtpz"/> <button class="btn btn-sm btn-primary svelte-qwbtpz">Save</button></div>'), Tl = g('<span class="active-dot svelte-qwbtpz"></span>'), Nl = g('<div><button class="item-swap svelte-qwbtpz"><span class="item-name svelte-qwbtpz"> </span> <span class="item-detail svelte-qwbtpz"> </span></button> <!> <button class="btn btn-sm btn-ghost svelte-qwbtpz">\u{1F5D1}\uFE0F</button></div>'), Ul = g(`<p class="empty-hint svelte-qwbtpz">No saved skill sets. Save your current
                                        skills to swap later.</p>`), Rl = g(`<div class="layers-tab"><div class="layer-section svelte-qwbtpz"><div class="layer-header svelte-qwbtpz"><span class="layer-icon svelte-qwbtpz">\u{1F464}</span> <h4 class="svelte-qwbtpz">Persona Layer</h4> <span class="layer-badge svelte-qwbtpz">hot-swappable</span></div> <p class="layer-desc svelte-qwbtpz">Active personality, identity, and system prompt.</p> <div class="layer-items svelte-qwbtpz"><!> <!></div></div> <div class="layer-section svelte-qwbtpz"><div class="layer-header svelte-qwbtpz"><span class="layer-icon svelte-qwbtpz">\u26A1</span> <h4 class="svelte-qwbtpz">Skills Layer</h4> <span class="layer-badge svelte-qwbtpz">hot-swappable</span></div> <p class="layer-desc svelte-qwbtpz">Active tools, instructions, and learned
                                behaviors.</p> <div class="layer-actions svelte-qwbtpz"><button class="btn btn-sm btn-ghost svelte-qwbtpz">\u{1F4BE} Save Current</button></div> <!> <div class="layer-items svelte-qwbtpz"><!> <!></div></div> <div class="layer-section svelte-qwbtpz"><div class="layer-header svelte-qwbtpz"><span class="layer-icon svelte-qwbtpz">\u{1F4C2}</span> <h4 class="svelte-qwbtpz">Workspace Layer</h4> <span class="layer-badge persistent svelte-qwbtpz">persistent</span></div> <p class="layer-desc svelte-qwbtpz">Your working directory. Never swapped \u2014 persists
                                across persona and skill changes.</p> <div class="workspace-info svelte-qwbtpz"><span class="info-label svelte-qwbtpz">Status:</span> <span class="info-value svelte-qwbtpz"> </span></div></div> <div class="layer-section svelte-qwbtpz"><div class="layer-header svelte-qwbtpz"><span class="layer-icon svelte-qwbtpz">\u{1F427}</span> <h4 class="svelte-qwbtpz">Container Layer</h4> <span class="layer-badge svelte-qwbtpz">hot-swappable</span></div> <p class="layer-desc svelte-qwbtpz">The underlying OS. Swap between Alpine, Kali,
                                etc.</p> <div class="workspace-info svelte-qwbtpz"><span class="info-label svelte-qwbtpz">Active:</span> <span class="info-value svelte-qwbtpz"> </span></div></div></div>`), Bl = g('<div class="ws-overlay svelte-qwbtpz"><div class="ws-panel glass-elevated svelte-qwbtpz"><div class="ws-header svelte-qwbtpz"><div class="ws-tabs svelte-qwbtpz"><button>\u{1F4C1} Files</button> <button>\u{1F427} Container</button> <button>\u{1F500} Layers</button></div> <button class="close-btn svelte-qwbtpz" aria-label="Close">\u2715</button></div> <div class="ws-body svelte-qwbtpz"><!></div></div></div>');
  function Ll(t, e) {
    nt(e, true);
    let n = z("files"), s = z(Te([])), r = z("/"), i = z(null), o = z(""), u = z(false), v = z(""), f = z(Te([])), p = z(Te(vn())), b = z(0), k = z(false), P = z(false), B = z(""), U = z(""), _ = z("alpine"), E = z(Te([])), y = z(null), S = z(Te([])), O = z(null), Q = z(false), V = z("");
    Vn(() => {
      e.isOpen && ne();
    });
    function ne() {
      a(n) === "files" ? L() : a(n) === "container" ? (d(f, Rn(), true), d(p, vn(), true)) : a(n) === "layers" && (d(E, ft(), true), d(y, zt(), true), d(S, ct(), true), d(O, gn(), true));
    }
    async function L() {
      try {
        ss() || await fo(), d(s, await mo(a(r)), true);
      } catch {
        d(s, [], true);
      }
    }
    async function ue(D) {
      d(r, D, true), d(i, null), d(u, false), await L();
    }
    async function ae(D) {
      if (D.isDirectory) await ue(D.path);
      else {
        d(i, D.path, true);
        try {
          d(o, await ho(D.path), true);
        } catch {
          d(o, "(unable to read file)");
        }
      }
    }
    async function we() {
      d(v, a(o), true), d(u, true);
    }
    async function pe() {
      a(i) && (await rs(a(i), a(v)), d(o, a(v), true)), d(u, false);
    }
    async function R() {
      await wo() && (d(r, "/"), await L());
    }
    async function F() {
      const D = prompt("File name:");
      if (D) {
        const X = a(r) === "/" ? `/${D}` : `${a(r)}/${D}`;
        await rs(X, ""), await L();
      }
    }
    async function le() {
      const D = prompt("Directory name:");
      if (D) {
        const X = a(r) === "/" ? `/${D}` : `${a(r)}/${D}`;
        await bo(X), await L();
      }
    }
    async function oe(D) {
      confirm(`Delete ${D.name}?`) && (await _o(D.path), await L(), a(i) === D.path && d(i, null));
    }
    async function H(D) {
      d(k, true), d(b, 0);
      const X = is("c2w:progress", (W) => {
        d(b, W.percent, true);
      });
      try {
        await sr(D), d(p, vn(), true);
      } catch (W) {
        alert(`Failed to load container: ${W.message}`);
      } finally {
        d(k, false), X();
      }
    }
    async function K(D) {
      d(k, true), d(b, 0);
      const X = is("c2w:progress", (W) => {
        d(b, W.percent, true);
      });
      try {
        await xo(D), d(p, vn(), true);
      } catch (W) {
        alert(`Failed to swap container: ${W.message}`);
      } finally {
        d(k, false), X();
      }
    }
    function T() {
      a(B) && a(U) && (ko({
        name: a(U),
        os: a(_),
        arch: Ta(),
        wasmUrl: a(B),
        description: `Custom ${a(_)} container`
      }), d(f, Rn(), true), d(P, false), d(B, ""), d(U, ""));
    }
    function se(D) {
      confirm("Remove this container image?") && (So(D), d(f, Rn(), true));
    }
    function re(D) {
      Ts(D), d(y, zt(), true);
    }
    function ie(D) {
      Da(D), d(O, gn(), true);
    }
    function C() {
      a(V).trim() && (Rs(a(V).trim()), d(S, ct(), true), d(Q, false), d(V, ""));
    }
    function m(D) {
      confirm("Delete this skill set?") && (qa(D), d(S, ct(), true));
    }
    function x(D) {
      return D ? D < 1024 ? `${D}B` : D < 1024 * 1024 ? `${(D / 1024).toFixed(1)}KB` : `${(D / (1024 * 1024)).toFixed(1)}MB` : "";
    }
    var I = st(), $ = Pe(I);
    {
      var J = (D) => {
        var X = Bl(), W = l(X), ce = l(W), ge = l(ce), ye = l(ge);
        let G;
        var q = c(ye, 2);
        let te;
        var de = c(q, 2);
        let Se;
        var Ee = c(ge, 2), ke = c(ce, 2), ee = l(ke);
        {
          var N = (j) => {
            var Y = gl(), ve = Pe(Y), me = l(ve), Ae = l(me), Me = c(Ae, 2);
            Re(Me, 17, () => a(r).split("/").filter(Boolean), je, (xe, _e, he) => {
              var ze = dl(), Ne = c(Pe(ze), 2), Ce = l(Ne);
              Z(() => A(Ce, a(_e))), w("click", Ne, () => ue("/" + a(r).split("/").filter(Boolean).slice(0, he + 1).join("/"))), h(xe, ze);
            });
            var Le = c(me, 2), Fe = l(Le), We = c(Fe, 2), Be = c(We, 2), Ke = c(ve, 2), It = l(Ke), wt = l(It);
            {
              var Et = (xe) => {
                var _e = ul();
                w("click", _e, () => ue("/" + a(r).split("/").filter(Boolean).slice(0, -1).join("/") || "/")), h(xe, _e);
              };
              M(wt, (xe) => {
                a(r) !== "/" && xe(Et);
              });
            }
            var gt = c(wt, 2);
            Re(gt, 17, () => a(s), je, (xe, _e) => {
              var he = fl(), ze = l(he), Ne = l(ze), Ce = c(ze, 2), qe = l(Ce), Ue = c(Ce, 2);
              {
                var Ve = (Ge) => {
                  var Oe = vl(), $e = l(Oe);
                  Z((Xe) => A($e, Xe), [
                    () => x(a(_e).size)
                  ]), h(Ge, Oe);
                };
                M(Ue, (Ge) => {
                  a(_e).size && Ge(Ve);
                });
              }
              var Ye = c(Ue, 2);
              Z(() => {
                A(Ne, a(_e).isDirectory ? "\u{1F4C1}" : "\u{1F4C4}"), A(qe, a(_e).name);
              }), w("click", he, () => ae(a(_e))), w("click", Ye, (Ge) => {
                Ge.stopPropagation(), oe(a(_e));
              }), h(xe, he);
            });
            var At = c(gt, 2);
            {
              var yt = (xe) => {
                var _e = pl(), he = c(l(_e), 2);
                w("click", he, R), h(xe, _e);
              };
              M(At, (xe) => {
                a(s).length === 0 && xe(yt);
              });
            }
            var Ot = c(It, 2);
            {
              var Pt = (xe) => {
                var _e = wl(), he = l(_e), ze = l(he), Ne = l(ze), Ce = c(ze, 2);
                {
                  var qe = (Oe) => {
                    var $e = ml(), Xe = l($e), Dt = c(Xe, 2);
                    w("click", Xe, pe), w("click", Dt, () => d(u, false)), h(Oe, $e);
                  }, Ue = (Oe) => {
                    var $e = hl();
                    w("click", $e, we), h(Oe, $e);
                  };
                  M(Ce, (Oe) => {
                    a(u) ? Oe(qe) : Oe(Ue, -1);
                  });
                }
                var Ve = c(he, 2);
                {
                  var Ye = (Oe) => {
                    var $e = bl();
                    De($e, () => a(v), (Xe) => d(v, Xe)), h(Oe, $e);
                  }, Ge = (Oe) => {
                    var $e = _l(), Xe = l($e);
                    Z(() => A(Xe, a(o))), h(Oe, $e);
                  };
                  M(Ve, (Oe) => {
                    a(u) ? Oe(Ye) : Oe(Ge, -1);
                  });
                }
                Z((Oe) => A(Ne, Oe), [
                  () => a(i).split("/").pop()
                ]), h(xe, _e);
              };
              M(Ot, (xe) => {
                a(i) && xe(Pt);
              });
            }
            w("click", Ae, () => ue("/")), w("click", Fe, F), w("click", We, le), w("click", Be, R), h(j, Y);
          }, fe = (j) => {
            var Y = Ol(), ve = l(Y);
            let me;
            var Ae = c(l(ve), 2), Me = l(Ae), Le = l(Me), Fe = c(Me, 2);
            {
              var We = (xe) => {
                var _e = yl(), he = l(_e);
                Z(() => A(he, `${a(p).image ?? ""} (${a(p).arch ?? ""})`)), h(xe, _e);
              }, Be = (xe) => {
                var _e = kl();
                h(xe, _e);
              };
              M(Fe, (xe) => {
                a(p).image ? xe(We) : xe(Be, -1);
              });
            }
            var Ke = c(Ae, 2), It = l(Ke), wt = c(ve, 2);
            {
              var Et = (xe) => {
                var _e = Sl(), he = l(_e), ze = l(he), Ne = c(he, 2), Ce = l(Ne);
                Z(() => {
                  Mn(ze, `width: ${a(b) ?? ""}%`), A(Ce, `${a(b) ?? ""}% \u2014 Downloading container...`);
                }), h(xe, _e);
              };
              M(wt, (xe) => {
                a(k) && xe(Et);
              });
            }
            var gt = c(wt, 2), At = c(l(gt), 2), yt = c(gt, 2);
            {
              var Ot = (xe) => {
                var _e = xl(), he = l(_e), ze = c(he, 2), Ne = c(ze, 2), Ce = l(Ne);
                Ce.value = Ce.__value = "alpine";
                var qe = c(Ce);
                qe.value = qe.__value = "kali";
                var Ue = c(qe);
                Ue.value = Ue.__value = "ubuntu";
                var Ve = c(Ue);
                Ve.value = Ve.__value = "debian";
                var Ye = c(Ve);
                Ye.value = Ye.__value = "custom";
                var Ge = c(Ne, 2);
                De(he, () => a(U), (Oe) => d(U, Oe)), De(ze, () => a(B), (Oe) => d(B, Oe)), wn(Ne, () => a(_), (Oe) => d(_, Oe)), w("click", Ge, T), h(xe, _e);
              };
              M(yt, (xe) => {
                a(P) && xe(Ot);
              });
            }
            var Pt = c(yt, 2);
            Re(Pt, 21, () => a(f), je, (xe, _e) => {
              var he = Al();
              let ze;
              var Ne = l(he), Ce = l(Ne), qe = l(Ce), Ue = c(Ce, 2), Ve = l(Ue), Ye = c(Ue, 2);
              {
                var Ge = (Qe) => {
                  var it = zl(), aa = l(it);
                  Z(() => A(aa, a(_e).size)), h(Qe, it);
                };
                M(Ye, (Qe) => {
                  a(_e).size && Qe(Ge);
                });
              }
              var Oe = c(Ne, 2), $e = l(Oe);
              {
                var Xe = (Qe) => {
                  var it = Cl();
                  h(Qe, it);
                }, Dt = (Qe) => {
                  var it = Il(), aa = l(it);
                  Z(() => {
                    it.disabled = a(k), A(aa, a(p).ready ? "Swap" : "Load");
                  }), w("click", it, () => a(p).ready ? K(a(_e).id) : H(a(_e).id)), h(Qe, it);
                };
                M($e, (Qe) => {
                  a(p).image === a(_e).name ? Qe(Xe) : Qe(Dt, -1);
                });
              }
              var ta = c($e, 2);
              {
                var na = (Qe) => {
                  var it = El();
                  w("click", it, () => se(a(_e).id)), h(Qe, it);
                }, rn = Rt(() => !a(_e).id.startsWith("alpine-"));
                M(ta, (Qe) => {
                  a(rn) && Qe(na);
                });
              }
              Z(() => {
                ze = Ie(he, 1, "image-card svelte-qwbtpz", null, ze, {
                  active: a(p).image === a(_e).name
                }), A(qe, a(_e).name), A(Ve, a(_e).description);
              }), h(xe, he);
            }), Z(() => {
              me = Ie(ve, 1, "container-status svelte-qwbtpz", null, me, {
                ready: a(p).ready
              }), A(Le, a(p).ready ? "Running" : "Stopped"), A(It, a(p).arch);
            }), w("click", At, () => d(P, !a(P))), h(j, Y);
          }, be = (j) => {
            var Y = Rl(), ve = l(Y), me = c(l(ve), 4), Ae = l(me);
            Re(Ae, 17, () => a(E), je, (Ce, qe) => {
              var Ue = ql();
              let Ve;
              var Ye = l(Ue), Ge = l(Ye), Oe = c(Ye, 2);
              {
                var $e = (Xe) => {
                  var Dt = Dl();
                  h(Xe, Dt);
                };
                M(Oe, (Xe) => {
                  a(y) === a(qe).id && Xe($e);
                });
              }
              Z(() => {
                Ve = Ie(Ue, 1, "layer-item svelte-qwbtpz", null, Ve, {
                  active: a(y) === a(qe).id
                }), A(Ge, a(qe).label);
              }), w("click", Ue, () => re(a(qe).id)), h(Ce, Ue);
            });
            var Me = c(Ae, 2);
            {
              var Le = (Ce) => {
                var qe = Pl();
                h(Ce, qe);
              };
              M(Me, (Ce) => {
                a(E).length === 0 && Ce(Le);
              });
            }
            var Fe = c(ve, 2), We = c(l(Fe), 4), Be = l(We), Ke = c(We, 2);
            {
              var It = (Ce) => {
                var qe = Ml(), Ue = l(qe), Ve = c(Ue, 2);
                De(Ue, () => a(V), (Ye) => d(V, Ye)), w("click", Ve, C), h(Ce, qe);
              };
              M(Ke, (Ce) => {
                a(Q) && Ce(It);
              });
            }
            var wt = c(Ke, 2), Et = l(wt);
            Re(Et, 17, () => a(S), je, (Ce, qe) => {
              var Ue = Nl();
              let Ve;
              var Ye = l(Ue), Ge = l(Ye), Oe = l(Ge), $e = c(Ge, 2), Xe = l($e), Dt = c(Ye, 2);
              {
                var ta = (rn) => {
                  var Qe = Tl();
                  h(rn, Qe);
                };
                M(Dt, (rn) => {
                  a(O) === a(qe).id && rn(ta);
                });
              }
              var na = c(Dt, 2);
              Z(() => {
                Ve = Ie(Ue, 1, "layer-item svelte-qwbtpz", null, Ve, {
                  active: a(O) === a(qe).id
                }), A(Oe, a(qe).label), A(Xe, `${a(qe).skills.length ?? ""} skills`);
              }), w("click", Ye, () => ie(a(qe).id)), w("click", na, () => m(a(qe).id)), h(Ce, Ue);
            });
            var gt = c(Et, 2);
            {
              var At = (Ce) => {
                var qe = Ul();
                h(Ce, qe);
              };
              M(gt, (Ce) => {
                a(S).length === 0 && Ce(At);
              });
            }
            var yt = c(Fe, 2), Ot = c(l(yt), 4), Pt = c(l(Ot), 2), xe = l(Pt), _e = c(yt, 2), he = c(l(_e), 4), ze = c(l(he), 2), Ne = l(ze);
            Z((Ce) => {
              A(xe, Ce), A(Ne, a(p).image || "None");
            }, [
              () => ss() ? "Mounted" : "Not mounted"
            ]), w("click", Be, () => d(Q, !a(Q))), h(j, Y);
          };
          M(ee, (j) => {
            a(n) === "files" ? j(N) : a(n) === "container" ? j(fe, 1) : a(n) === "layers" && j(be, 2);
          });
        }
        Z(() => {
          G = Ie(ye, 1, "ws-tab svelte-qwbtpz", null, G, {
            active: a(n) === "files"
          }), te = Ie(q, 1, "ws-tab svelte-qwbtpz", null, te, {
            active: a(n) === "container"
          }), Se = Ie(de, 1, "ws-tab svelte-qwbtpz", null, Se, {
            active: a(n) === "layers"
          });
        }), w("click", X, function(...j) {
          e.onClose?.apply(this, j);
        }), w("click", W, (j) => j.stopPropagation()), w("click", ye, () => {
          d(n, "files"), ne();
        }), w("click", q, () => {
          d(n, "container"), ne();
        }), w("click", de, () => {
          d(n, "layers"), ne();
        }), w("click", Ee, function(...j) {
          e.onClose?.apply(this, j);
        }), h(D, X);
      };
      M($, (D) => {
        e.isOpen && D(J);
      });
    }
    h(t, I), at();
  }
  tt([
    "click"
  ]);
  var $l = g('<div class="overview-grid svelte-rqzng6"><div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F510}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Stored Credentials</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F310}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Allowed Domains</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F6AB}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Leaks Blocked</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F6E1}\uFE0F</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Injections Blocked</span></div></div> <div class="policy-section svelte-rqzng6"><h4 class="svelte-rqzng6">Active Policies</h4> <div class="policy-row svelte-rqzng6"><span class="policy-label svelte-rqzng6">Sandbox Policy</span> <select class="input policy-select svelte-rqzng6"><option>\u{1F512} Read Only</option><option>\u{1F4DD} Workspace Write</option><option>\u26A1 Full Access</option></select></div> <div class="policy-row svelte-rqzng6"><span class="policy-label svelte-rqzng6">Autonomy Level</span> <select class="input policy-select svelte-rqzng6"><option>\u{1F590}\uFE0F Manual (confirm all)</option><option>\u2696\uFE0F Semi (confirm destructive)</option><option>\u{1F916} Auto (no confirmation)</option></select></div></div> <div class="pipeline-info svelte-rqzng6"><h4 class="svelte-rqzng6">Security Pipeline</h4> <div class="pipeline-steps svelte-rqzng6"><span class="pipe-step svelte-rqzng6">Permission</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Allowlist</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Leak Scan</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Credential Inject</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step active-step svelte-rqzng6">Execute</span></div></div>', 1), Fl = g('<span class="badge badge-primary">Built-in</span>'), Wl = g('<button class="btn btn-ghost btn-icon btn-sm">\u2715</button>'), jl = g('<div><div class="domain-info svelte-rqzng6"><span class="domain-name svelte-rqzng6"> </span> <span class="domain-label svelte-rqzng6"> </span></div> <!></div>'), Jl = g('<div class="allowlist-section"><div class="add-domain svelte-rqzng6"><input class="input" placeholder="Domain (e.g. api.example.com)"/> <input class="input label-input svelte-rqzng6" placeholder="Label"/> <button class="btn btn-primary btn-sm">Add</button></div> <div class="domain-list svelte-rqzng6"></div></div>'), Hl = g('<div class="perm-row svelte-rqzng6"><span class="perm-tool svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span></div>'), Kl = g('<div class="permissions-section"><div class="perm-matrix svelte-rqzng6"><div class="perm-header-row svelte-rqzng6"><span class="perm-header svelte-rqzng6">Tool</span> <span class="perm-header svelte-rqzng6">HTTP</span> <span class="perm-header svelte-rqzng6">FS</span> <span class="perm-header svelte-rqzng6">Shell</span> <span class="perm-header svelte-rqzng6">MCP</span></div> <!></div> <p class="perm-legend svelte-rqzng6">\u2705 Allowed &nbsp; \u26A0\uFE0F Ask &nbsp; \u274C Denied</p></div>'), Vl = g('<p class="empty-audit svelte-rqzng6">No audit entries yet</p>'), Yl = g('<div class="audit-entry svelte-rqzng6"><span class="audit-tool svelte-rqzng6"> </span> <span> </span> <span class="audit-details svelte-rqzng6"> </span> <span class="audit-time svelte-rqzng6"> </span></div>'), Zl = g('<div class="audit-section"><!></div>'), Gl = g('<div class="sec-overlay svelte-rqzng6"><div class="sec-panel glass-elevated svelte-rqzng6"><div class="sec-header svelte-rqzng6"><div class="sec-title svelte-rqzng6"><span class="sec-icon svelte-rqzng6">\u{1F6E1}\uFE0F</span> <h3 class="svelte-rqzng6">IronClaw Security</h3></div> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="sec-tabs svelte-rqzng6"><button>Overview</button> <button>Allowlist</button> <button>Permissions</button> <button>Audit Log</button></div> <div class="sec-body svelte-rqzng6"><!></div></div></div>');
  function Xl(t, e) {
    let n = z("overview"), s = z(""), r = z(""), i = Te({
      credentialsCount: 0,
      allowlistCount: 12,
      leakBlocksCount: 0,
      promptBlocksCount: 0,
      sandboxPolicy: "WorkspaceWrite",
      autonomyLevel: "Semi"
    }), o = z(Te([
      {
        domain: "api.openai.com",
        path: "/v1/*",
        label: "OpenAI",
        builtin: true
      },
      {
        domain: "api.anthropic.com",
        path: "/v1/*",
        label: "Anthropic",
        builtin: true
      },
      {
        domain: "api.deepseek.com",
        path: "/*",
        label: "DeepSeek",
        builtin: true
      },
      {
        domain: "openrouter.ai",
        path: "/api/*",
        label: "OpenRouter",
        builtin: true
      },
      {
        domain: "generativelanguage.googleapis.com",
        path: "/*",
        label: "Google AI",
        builtin: true
      },
      {
        domain: "api.duckduckgo.com",
        path: "/*",
        label: "DuckDuckGo",
        builtin: true
      }
    ])), u = Te([
      {
        tool: "web_search",
        action: "approved",
        details: "Security checks passed",
        time: "2m ago"
      },
      {
        tool: "read_file",
        action: "approved",
        details: "Security checks passed",
        time: "5m ago"
      }
    ]);
    function v() {
      a(s).trim() && (d(o, [
        ...a(o),
        {
          domain: a(s).trim(),
          path: "/*",
          label: a(r).trim() || a(s).trim(),
          builtin: false
        }
      ], true), d(s, ""), d(r, ""));
    }
    function f(P) {
      a(o)[P].builtin || d(o, a(o).filter((B, U) => U !== P), true);
    }
    var p = st(), b = Pe(p);
    {
      var k = (P) => {
        var B = Gl(), U = l(B), _ = l(U), E = c(l(_), 2), y = c(_, 2), S = l(y);
        let O;
        var Q = c(S, 2);
        let V;
        var ne = c(Q, 2);
        let L;
        var ue = c(ne, 2);
        let ae;
        var we = c(y, 2), pe = l(we);
        {
          var R = (H) => {
            var K = $l(), T = Pe(K), se = l(T), re = c(l(se), 2), ie = l(re), C = c(se, 2), m = c(l(C), 2), x = l(m), I = c(C, 2), $ = c(l(I), 2), J = l($), D = c(I, 2), X = c(l(D), 2), W = l(X), ce = c(T, 2), ge = c(l(ce), 2), ye = c(l(ge), 2), G = l(ye);
            G.value = G.__value = "ReadOnly";
            var q = c(G);
            q.value = q.__value = "WorkspaceWrite";
            var te = c(q);
            te.value = te.__value = "FullAccess";
            var de = c(ge, 2), Se = c(l(de), 2), Ee = l(Se);
            Ee.value = Ee.__value = "Manual";
            var ke = c(Ee);
            ke.value = ke.__value = "Semi";
            var ee = c(ke);
            ee.value = ee.__value = "Auto", Z(() => {
              A(ie, i.credentialsCount), A(x, i.allowlistCount), A(J, i.leakBlocksCount), A(W, i.promptBlocksCount);
            }), wn(ye, () => i.sandboxPolicy, (N) => i.sandboxPolicy = N), wn(Se, () => i.autonomyLevel, (N) => i.autonomyLevel = N), h(H, K);
          }, F = (H) => {
            var K = Jl(), T = l(K), se = l(T), re = c(se, 2), ie = c(re, 2), C = c(T, 2);
            Re(C, 21, () => a(o), je, (m, x, I) => {
              var $ = jl();
              let J;
              var D = l($), X = l(D), W = l(X), ce = c(X, 2), ge = l(ce), ye = c(D, 2);
              {
                var G = (te) => {
                  var de = Fl();
                  h(te, de);
                }, q = (te) => {
                  var de = Wl();
                  w("click", de, () => f(I)), h(te, de);
                };
                M(ye, (te) => {
                  a(x).builtin ? te(G) : te(q, -1);
                });
              }
              Z(() => {
                J = Ie($, 1, "domain-entry svelte-rqzng6", null, J, {
                  builtin: a(x).builtin
                }), A(W, `${a(x).domain ?? ""}${a(x).path ?? ""}`), A(ge, a(x).label);
              }), h(m, $);
            }), De(se, () => a(s), (m) => d(s, m)), De(re, () => a(r), (m) => d(r, m)), w("click", ie, v), h(H, K);
          }, le = (H) => {
            var K = Kl(), T = l(K), se = c(l(T), 2);
            Re(se, 16, () => [
              {
                name: "web_search",
                http: "\u2705",
                fs: "\u274C",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "web_fetch",
                http: "\u2705",
                fs: "\u274C",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "read_file",
                http: "\u274C",
                fs: "\u2705",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "write_file",
                http: "\u274C",
                fs: "\u2705",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "list_dir",
                http: "\u274C",
                fs: "\u2705",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "memory_store",
                http: "\u274C",
                fs: "\u274C",
                shell: "\u274C",
                mcp: "\u274C"
              },
              {
                name: "shell_exec",
                http: "\u274C",
                fs: "\u26A0\uFE0F",
                shell: "\u26A0\uFE0F",
                mcp: "\u274C"
              }
            ], je, (re, ie) => {
              var C = Hl(), m = l(C), x = l(m), I = c(m, 2), $ = l(I), J = c(I, 2), D = l(J), X = c(J, 2), W = l(X), ce = c(X, 2), ge = l(ce);
              Z(() => {
                A(x, ie.name), A($, ie.http), A(D, ie.fs), A(W, ie.shell), A(ge, ie.mcp);
              }), h(re, C);
            }), h(H, K);
          }, oe = (H) => {
            var K = Zl(), T = l(K);
            {
              var se = (ie) => {
                var C = Vl();
                h(ie, C);
              }, re = (ie) => {
                var C = st(), m = Pe(C);
                Re(m, 17, () => u, je, (x, I) => {
                  var $ = Yl(), J = l($), D = l(J), X = c(J, 2);
                  let W;
                  var ce = l(X), ge = c(X, 2), ye = l(ge), G = c(ge, 2), q = l(G);
                  Z(() => {
                    A(D, a(I).tool), W = Ie(X, 1, "audit-action svelte-rqzng6", null, W, {
                      approved: a(I).action === "approved",
                      denied: a(I).action === "denied"
                    }), A(ce, a(I).action), A(ye, a(I).details), A(q, a(I).time);
                  }), h(x, $);
                }), h(ie, C);
              };
              M(T, (ie) => {
                u.length === 0 ? ie(se) : ie(re, -1);
              });
            }
            h(H, K);
          };
          M(pe, (H) => {
            a(n) === "overview" ? H(R) : a(n) === "allowlist" ? H(F, 1) : a(n) === "permissions" ? H(le, 2) : a(n) === "audit" && H(oe, 3);
          });
        }
        Z(() => {
          O = Ie(S, 1, "tab svelte-rqzng6", null, O, {
            active: a(n) === "overview"
          }), V = Ie(Q, 1, "tab svelte-rqzng6", null, V, {
            active: a(n) === "allowlist"
          }), L = Ie(ne, 1, "tab svelte-rqzng6", null, L, {
            active: a(n) === "permissions"
          }), ae = Ie(ue, 1, "tab svelte-rqzng6", null, ae, {
            active: a(n) === "audit"
          });
        }), w("click", B, function(...H) {
          e.onClose?.apply(this, H);
        }), w("click", U, (H) => H.stopPropagation()), w("click", E, function(...H) {
          e.onClose?.apply(this, H);
        }), w("click", S, () => d(n, "overview")), w("click", Q, () => d(n, "allowlist")), w("click", ne, () => d(n, "permissions")), w("click", ue, () => d(n, "audit")), h(P, B);
      };
      M(b, (P) => {
        e.isOpen && P(k);
      });
    }
    h(t, p);
  }
  tt([
    "click"
  ]);
  var Ql = g('<span class="active-badge svelte-czmyr8">Active</span>'), ec = g('<button class="btn btn-sm btn-primary svelte-czmyr8">\u26A1 Swap</button>'), tc = g('<div><div class="set-info svelte-czmyr8"><span class="set-name svelte-czmyr8"> </span> <span class="set-detail svelte-czmyr8"> </span></div> <div class="set-actions svelte-czmyr8"><!> <button class="btn btn-sm btn-ghost svelte-czmyr8">\u{1F5D1}\uFE0F</button></div></div>'), nc = g(`<p class="empty-hint svelte-czmyr8">No saved skill sets. Save your current skills to
                                swap later.</p>`), ac = g('<div class="sub-panel svelte-czmyr8"><div class="sub-header svelte-czmyr8"><h4 class="svelte-czmyr8">\u{1F500} Skill Sets \u2014 Hot Swap</h4> <div class="save-form svelte-czmyr8"><input type="text" placeholder="Save current as..." class="input-sm svelte-czmyr8"/> <button class="btn btn-sm btn-primary svelte-czmyr8">\u{1F4BE} Save</button></div></div> <div class="set-list svelte-czmyr8"><!> <!></div></div>'), sc = g('<div class="sub-panel svelte-czmyr8"><h4 class="svelte-czmyr8">\u2795 New Skill</h4> <div class="create-form svelte-czmyr8"><input type="text" placeholder="Skill name" class="input-sm svelte-czmyr8"/> <input type="text" placeholder="Description" class="input-sm svelte-czmyr8"/> <textarea placeholder="Instructions (injected into system prompt)" rows="4" class="input-sm textarea svelte-czmyr8"></textarea> <button class="btn btn-primary svelte-czmyr8">Create Skill</button></div></div>'), rc = g('<div class="sub-panel svelte-czmyr8"><h4 class="svelte-czmyr8">\u{1F4E6} Import / Export</h4> <div class="ie-actions svelte-czmyr8"><button class="btn btn-primary svelte-czmyr8">\u{1F4CB} Export to Clipboard</button> <textarea placeholder="Paste exported JSON here..." rows="4" class="input-sm textarea svelte-czmyr8"></textarea> <button class="btn btn-primary svelte-czmyr8">\u{1F4E5} Import</button></div></div>'), ic = g('<div class="skill-instructions svelte-czmyr8"><span class="label svelte-czmyr8">Instructions:</span> <p class="svelte-czmyr8"> </p></div>'), oc = g('<span class="note-chip svelte-czmyr8"> </span>'), lc = g('<div class="skill-notes svelte-czmyr8"><span class="label svelte-czmyr8">Notes:</span> <!></div>'), cc = g('<span class="tool-chip svelte-czmyr8"> </span>'), dc = g('<div class="skill-tools svelte-czmyr8"><span class="label svelte-czmyr8">Tools:</span> <!></div>'), uc = g('<div class="skill-card svelte-czmyr8"><div class="skill-header svelte-czmyr8"><div class="skill-meta"><span class="skill-name svelte-czmyr8"> </span></div> <div class="skill-actions svelte-czmyr8"><button class="btn btn-sm btn-ghost svelte-czmyr8" title="Add note">\u{1F4DD}</button> <button class="btn btn-sm btn-ghost svelte-czmyr8" title="Remove">\u{1F5D1}\uFE0F</button></div></div> <p class="skill-desc svelte-czmyr8"> </p> <!> <!> <!></div>'), vc = g('<div class="empty-state svelte-czmyr8"><p>No skills configured.</p> <button class="btn btn-primary svelte-czmyr8">Create your first skill</button></div>'), fc = g('<div class="skills-overlay svelte-czmyr8"><div class="skills-panel glass-elevated svelte-czmyr8"><div class="panel-header svelte-czmyr8"><div class="header-title svelte-czmyr8"><span>\u26A1</span> <h3 class="svelte-czmyr8">Skills Engine</h3> <span class="skill-count svelte-czmyr8"> </span></div> <div class="header-actions svelte-czmyr8"><button>\u{1F500} Skill Sets</button> <button class="btn btn-sm svelte-czmyr8">\u2795 New Skill</button> <button class="btn btn-sm svelte-czmyr8">\u{1F4E6} Import/Export</button> <button class="close-btn svelte-czmyr8" aria-label="Close">\u2715</button></div></div> <!> <!> <!> <div class="skills-list svelte-czmyr8"><!> <!></div></div></div>');
  function pc(t, e) {
    nt(e, true);
    let n = z(Te([])), s = z(Te([])), r = z(null), i = z(false), o = z(false), u = z(false), v = z(""), f = z(""), p = z(""), b = z(""), k = z("");
    Vn(() => {
      e.isOpen && (d(n, oi(), true), d(s, ct(), true), d(r, gn(), true));
    });
    function P() {
      a(v).trim() && a(f).trim() && (li({
        name: a(v).trim(),
        description: a(f).trim(),
        instructions: a(p).trim(),
        tools: [],
        notes: []
      }), d(n, ln(), true), d(i, false), d(v, ""), d(f, ""), d(p, ""));
    }
    function B(L) {
      confirm("Remove this skill?") && (ci(L), d(n, ln(), true));
    }
    function U(L) {
      const ue = prompt("Add a note:");
      if (ue) {
        const ae = a(n).find((we) => we.id === L);
        ae && (di(L, {
          notes: [
            ...ae.notes,
            ue
          ]
        }), d(n, ln(), true));
      }
    }
    function _() {
      a(b).trim() && (Rs(a(b).trim()), d(s, ct(), true), d(b, ""));
    }
    function E(L) {
      Da(L), d(n, ln(), true), d(r, gn(), true);
    }
    function y(L) {
      confirm("Delete this skill set?") && (qa(L), d(s, ct(), true));
    }
    function S() {
      const L = ui();
      navigator.clipboard.writeText(L), alert("Skills exported to clipboard!");
    }
    function O() {
      if (a(k).trim()) {
        const L = vi(a(k).trim());
        L > 0 ? (d(n, ln(), true), d(s, ct(), true), d(k, ""), d(u, false), alert(`Imported ${L} items!`)) : alert("Import failed \u2014 invalid JSON.");
      }
    }
    var Q = st(), V = Pe(Q);
    {
      var ne = (L) => {
        var ue = fc(), ae = l(ue), we = l(ae), pe = l(we), R = c(l(pe), 4), F = l(R), le = c(pe, 2), oe = l(le);
        let H;
        var K = c(oe, 2), T = c(K, 2), se = c(T, 2), re = c(we, 2);
        {
          var ie = (W) => {
            var ce = ac(), ge = l(ce), ye = c(l(ge), 2), G = l(ye), q = c(G, 2), te = c(ge, 2), de = l(te);
            Re(de, 17, () => a(s), je, (ke, ee) => {
              var N = tc();
              let fe;
              var be = l(N), j = l(be), Y = l(j), ve = c(j, 2), me = l(ve), Ae = c(be, 2), Me = l(Ae);
              {
                var Le = (Be) => {
                  var Ke = Ql();
                  h(Be, Ke);
                }, Fe = (Be) => {
                  var Ke = ec();
                  w("click", Ke, () => E(a(ee).id)), h(Be, Ke);
                };
                M(Me, (Be) => {
                  a(r) === a(ee).id ? Be(Le) : Be(Fe, -1);
                });
              }
              var We = c(Me, 2);
              Z((Be) => {
                fe = Ie(N, 1, "set-card svelte-czmyr8", null, fe, {
                  active: a(r) === a(ee).id
                }), A(Y, a(ee).label), A(me, `${a(ee).skills.length ?? ""} skills \xB7 ${Be ?? ""}`);
              }, [
                () => new Date(a(ee).createdAt).toLocaleDateString()
              ]), w("click", We, () => y(a(ee).id)), h(ke, N);
            });
            var Se = c(de, 2);
            {
              var Ee = (ke) => {
                var ee = nc();
                h(ke, ee);
              };
              M(Se, (ke) => {
                a(s).length === 0 && ke(Ee);
              });
            }
            De(G, () => a(b), (ke) => d(b, ke)), w("click", q, _), h(W, ce);
          };
          M(re, (W) => {
            a(o) && W(ie);
          });
        }
        var C = c(re, 2);
        {
          var m = (W) => {
            var ce = sc(), ge = c(l(ce), 2), ye = l(ge), G = c(ye, 2), q = c(G, 2), te = c(q, 2);
            De(ye, () => a(v), (de) => d(v, de)), De(G, () => a(f), (de) => d(f, de)), De(q, () => a(p), (de) => d(p, de)), w("click", te, P), h(W, ce);
          };
          M(C, (W) => {
            a(i) && W(m);
          });
        }
        var x = c(C, 2);
        {
          var I = (W) => {
            var ce = rc(), ge = c(l(ce), 2), ye = l(ge), G = c(ye, 2), q = c(G, 2);
            w("click", ye, S), De(G, () => a(k), (te) => d(k, te)), w("click", q, O), h(W, ce);
          };
          M(x, (W) => {
            a(u) && W(I);
          });
        }
        var $ = c(x, 2), J = l($);
        Re(J, 17, () => a(n), je, (W, ce) => {
          var ge = uc(), ye = l(ge), G = l(ye), q = l(G), te = l(q), de = c(G, 2), Se = l(de), Ee = c(Se, 2), ke = c(ye, 2), ee = l(ke), N = c(ke, 2);
          {
            var fe = (me) => {
              var Ae = ic(), Me = c(l(Ae), 2), Le = l(Me);
              Z(() => A(Le, a(ce).instructions)), h(me, Ae);
            };
            M(N, (me) => {
              a(ce).instructions && me(fe);
            });
          }
          var be = c(N, 2);
          {
            var j = (me) => {
              var Ae = lc(), Me = c(l(Ae), 2);
              Re(Me, 17, () => a(ce).notes, je, (Le, Fe) => {
                var We = oc(), Be = l(We);
                Z(() => A(Be, a(Fe))), h(Le, We);
              }), h(me, Ae);
            };
            M(be, (me) => {
              a(ce).notes.length > 0 && me(j);
            });
          }
          var Y = c(be, 2);
          {
            var ve = (me) => {
              var Ae = dc(), Me = c(l(Ae), 2);
              Re(Me, 17, () => a(ce).tools, je, (Le, Fe) => {
                var We = cc(), Be = l(We);
                Z(() => A(Be, a(Fe).function.name)), h(Le, We);
              }), h(me, Ae);
            };
            M(Y, (me) => {
              a(ce).tools.length > 0 && me(ve);
            });
          }
          Z(() => {
            A(te, a(ce).name), A(ee, a(ce).description);
          }), w("click", Se, () => U(a(ce).id)), w("click", Ee, () => B(a(ce).id)), h(W, ge);
        });
        var D = c(J, 2);
        {
          var X = (W) => {
            var ce = vc(), ge = c(l(ce), 2);
            w("click", ge, () => d(i, true)), h(W, ce);
          };
          M(D, (W) => {
            a(n).length === 0 && W(X);
          });
        }
        Z(() => {
          A(F, `${a(n).length ?? ""} skills`), H = Ie(oe, 1, "btn btn-sm svelte-czmyr8", null, H, {
            active: a(o)
          });
        }), w("click", ue, function(...W) {
          e.onClose?.apply(this, W);
        }), w("click", ae, (W) => W.stopPropagation()), w("click", oe, () => {
          d(o, !a(o)), d(i, false), d(u, false);
        }), w("click", K, () => {
          d(i, !a(i)), d(o, false), d(u, false);
        }), w("click", T, () => {
          d(u, !a(u)), d(o, false), d(i, false);
        }), w("click", se, function(...W) {
          e.onClose?.apply(this, W);
        }), h(L, ue);
      };
      M(V, (L) => {
        e.isOpen && L(ne);
      });
    }
    h(t, Q), at();
  }
  tt([
    "click"
  ]);
  var mc = g('<div class="add-form svelte-h7zsx2"><input class="input" placeholder="Server name (e.g. Local Tools)"/> <input class="input" placeholder="URL (e.g. http://localhost:3001/sse)"/> <div class="transport-row svelte-h7zsx2"><label class="radio-label svelte-h7zsx2"><input type="radio"/> SSE (Streamable HTTP)</label> <label class="radio-label svelte-h7zsx2"><input type="radio"/> WebSocket</label></div> <button class="btn btn-primary">Add Server</button></div>'), hc = g(`<div class="empty-state svelte-h7zsx2"><span class="empty-icon svelte-h7zsx2">\u{1F50C}</span> <p>No MCP servers configured</p> <p class="empty-hint svelte-h7zsx2">Add an MCP server to extend EZ-Claw with external
                            tools.</p> <p class="empty-hint svelte-h7zsx2">MCP servers expose tools, resources, and prompts
                            that your agent can use autonomously.</p></div>`), bc = g('<span class="mini-spinner svelte-h7zsx2"></span>'), _c = g('<div class="server-stats svelte-h7zsx2"><span class="stat svelte-h7zsx2"> </span></div>'), wc = g('<div><div class="server-header svelte-h7zsx2"><div class="server-info svelte-h7zsx2"><span></span> <span class="server-name svelte-h7zsx2"> </span> <span class="transport-tag svelte-h7zsx2"> </span></div> <div class="server-actions svelte-h7zsx2"><button><!></button> <button class="btn btn-ghost btn-icon btn-sm">\u{1F5D1}\uFE0F</button></div></div> <div class="server-url svelte-h7zsx2"> </div> <!></div>'), gc = g(`<div class="mcp-overlay svelte-h7zsx2"><div class="mcp-panel glass-elevated svelte-h7zsx2"><div class="panel-header svelte-h7zsx2"><div class="header-title svelte-h7zsx2"><span>\u{1F50C}</span> <h3 class="svelte-h7zsx2">MCP Servers</h3> <span class="server-count svelte-h7zsx2"> </span></div> <div class="header-actions svelte-h7zsx2"><button class="btn btn-sm btn-primary"> </button> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></div> <!> <div class="server-list svelte-h7zsx2"><!></div> <div class="panel-footer svelte-h7zsx2"><span class="footer-note svelte-h7zsx2">MCP servers run externally. EZ-Claw connects from the
                    browser.</span></div></div></div>`);
  function yc(t, e) {
    nt(e, true);
    const n = [];
    let s = z(Te([])), r = z(false), i = z(""), o = z(""), u = z("sse"), v = z(null);
    const f = "ezclaw_mcp_servers";
    async function p() {
      try {
        const y = await lt(f);
        y && d(s, JSON.parse(y), true);
      } catch (y) {
        console.error("[MCP] Failed to load servers:", y);
      }
    }
    async function b() {
      try {
        await Je(f, JSON.stringify(a(s)));
      } catch (y) {
        console.error("[MCP] Failed to save servers:", y);
      }
    }
    tn(() => {
      p();
    });
    function k() {
      if (!a(i).trim() || !a(o).trim()) return;
      const y = {
        id: crypto.randomUUID().slice(0, 8),
        name: a(i).trim(),
        url: a(o).trim(),
        transport: a(u),
        enabled: true,
        connected: false,
        tools: 0
      };
      d(s, [
        ...a(s),
        y
      ], true), d(i, ""), d(o, ""), d(r, false), b();
    }
    function P(y) {
      d(s, a(s).filter((S) => S.id !== y), true), b();
    }
    async function B(y) {
      const S = a(s).find((O) => O.id === y);
      if (S) if (S.connected) d(s, a(s).map((O) => O.id === y ? {
        ...O,
        connected: false,
        tools: 0
      } : O), true), b();
      else {
        d(v, y, true);
        try {
          await new Promise((O) => setTimeout(O, 1500)), d(s, a(s).map((O) => O.id === y ? {
            ...O,
            connected: true,
            tools: Math.floor(Math.random() * 5) + 1
          } : O), true), b();
        } catch (O) {
          console.error("[MCP] Connection failed:", O);
        }
        d(v, null);
      }
    }
    var U = st(), _ = Pe(U);
    {
      var E = (y) => {
        var S = gc(), O = l(S), Q = l(O), V = l(Q), ne = c(l(V), 4), L = l(ne), ue = c(V, 2), ae = l(ue), we = l(ae), pe = c(ae, 2), R = c(Q, 2);
        {
          var F = (T) => {
            var se = mc(), re = l(se), ie = c(re, 2), C = c(ie, 2), m = l(C), x = l(m);
            x.value = x.__value = "sse";
            var I = c(m, 2), $ = l(I);
            $.value = $.__value = "websocket";
            var J = c(C, 2);
            De(re, () => a(i), (D) => d(i, D)), De(ie, () => a(o), (D) => d(o, D)), ja(n, [], x, () => a(u), (D) => d(u, D)), ja(n, [], $, () => a(u), (D) => d(u, D)), w("click", J, k), h(T, se);
          };
          M(R, (T) => {
            a(r) && T(F);
          });
        }
        var le = c(R, 2), oe = l(le);
        {
          var H = (T) => {
            var se = hc();
            h(T, se);
          }, K = (T) => {
            var se = st(), re = Pe(se);
            Re(re, 17, () => a(s), je, (ie, C) => {
              var m = wc();
              let x;
              var I = l(m), $ = l(I), J = l($);
              let D;
              var X = c(J, 2), W = l(X), ce = c(X, 2), ge = l(ce), ye = c($, 2), G = l(ye);
              let q;
              var te = l(G);
              {
                var de = (j) => {
                  var Y = bc();
                  h(j, Y);
                }, Se = (j) => {
                  var Y = xt("Disconnect");
                  h(j, Y);
                }, Ee = (j) => {
                  var Y = xt("Connect");
                  h(j, Y);
                };
                M(te, (j) => {
                  a(v) === a(C).id ? j(de) : a(C).connected ? j(Se, 1) : j(Ee, -1);
                });
              }
              var ke = c(G, 2), ee = c(I, 2), N = l(ee), fe = c(ee, 2);
              {
                var be = (j) => {
                  var Y = _c(), ve = l(Y), me = l(ve);
                  Z(() => A(me, `\u{1F527} ${a(C).tools ?? ""} tools`)), h(j, Y);
                };
                M(fe, (j) => {
                  a(C).connected && j(be);
                });
              }
              Z((j) => {
                x = Ie(m, 1, "server-card svelte-h7zsx2", null, x, {
                  connected: a(C).connected
                }), D = Ie(J, 1, "status-dot svelte-h7zsx2", null, D, {
                  active: a(C).connected
                }), A(W, a(C).name), A(ge, j), q = Ie(G, 1, "btn btn-sm", null, q, {
                  "btn-primary": !a(C).connected,
                  "btn-secondary": a(C).connected
                }), G.disabled = a(v) === a(C).id, A(N, a(C).url);
              }, [
                () => a(C).transport.toUpperCase()
              ]), w("click", G, () => B(a(C).id)), w("click", ke, () => P(a(C).id)), h(ie, m);
            }), h(T, se);
          };
          M(oe, (T) => {
            a(s).length === 0 ? T(H) : T(K, -1);
          });
        }
        Z((T) => {
          A(L, `${T ?? ""} connected`), A(we, a(r) ? "\u2715 Cancel" : "+ Add Server");
        }, [
          () => a(s).filter((T) => T.connected).length
        ]), w("click", S, function(...T) {
          e.onClose?.apply(this, T);
        }), w("click", O, (T) => T.stopPropagation()), w("click", ae, () => d(r, !a(r))), w("click", pe, function(...T) {
          e.onClose?.apply(this, T);
        }), h(y, S);
      };
      M(_, (y) => {
        e.isOpen && y(E);
      });
    }
    h(t, U), at();
  }
  tt([
    "click"
  ]);
  var kc = g(`<div class="tier-menu svelte-k4so18"><button><span class="tier-icon">\u{1F427}</span> Alpine
                                    (Full OS) <span class="tier-desc svelte-k4so18">Real Linux sandbox</span></button> <button><span class="tier-icon">\u{1F310}</span> Shell <span class="tier-desc svelte-k4so18">Lightweight fallback</span></button> <button><span class="tier-icon">\u{1F4BB}</span> Native CLI <span class="tier-desc svelte-k4so18">Host shell (companion)</span></button></div>`), Sc = g("<div> </div>"), xc = g('<div class="terminal-line info svelte-k4so18">\u23F3 Executing...</div>'), zc = g('<div class="terminal-overlay svelte-k4so18" role="presentation"><div class="terminal-panel glass-elevated svelte-k4so18" role="dialog"><div class="terminal-header svelte-k4so18"><div class="header-left svelte-k4so18"><span class="terminal-title svelte-k4so18">\u{1F5A5}\uFE0F Terminal</span> <div class="tier-selector svelte-k4so18"><button class="tier-btn svelte-k4so18"> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button> <!></div></div> <button class="close-btn svelte-k4so18" aria-label="Close">\u2715</button></div> <div class="terminal-body svelte-k4so18"><!> <!></div> <div class="terminal-input-area svelte-k4so18"><span class="prompt svelte-k4so18">$</span> <input type="text" class="terminal-input svelte-k4so18" placeholder="Type a command..."/></div></div></div>');
  function Cc(t, e) {
    nt(e, true);
    let n = z(Te([])), s = z(""), r = z("container2wasm"), i = z(false), o = "ws://localhost:9229", u = z(false), v = z(void 0), f = z(void 0), p = null;
    tn(() => {
      p = new Ra({
        tier: "container2wasm",
        enabled: true
      }), p.onOutput((y) => {
        y.includes("\x1B[31m") ? d(n, [
          ...a(n),
          {
            text: y.replace(/\x1b\[\d+m/g, ""),
            type: "stderr"
          }
        ], true) : d(n, [
          ...a(n),
          {
            text: y,
            type: "stdout"
          }
        ], true);
      }), d(n, [
        {
          text: "\u{1F980} EZ-Claw Terminal \u2014 Secure Sandbox",
          type: "info"
        },
        {
          text: 'Type "help" for available commands. Use tier selector to switch sandbox mode.',
          type: "info"
        },
        {
          text: "",
          type: "info"
        }
      ], true);
    });
    function b() {
      xa().then(() => {
        a(v) && (a(v).scrollTop = a(v).scrollHeight);
      });
    }
    async function k() {
      const y = a(s).trim();
      if (!(!y || a(i) || !p)) {
        if (d(n, [
          ...a(n),
          {
            text: `$ ${y}`,
            type: "input"
          }
        ], true), d(s, ""), d(i, true), y === "clear") {
          d(n, [], true), d(i, false);
          return;
        }
        try {
          (await p.execute(y)).timedOut && d(n, [
            ...a(n),
            {
              text: "\u23F1 Command timed out",
              type: "stderr"
            }
          ], true);
        } catch (S) {
          d(n, [
            ...a(n),
            {
              text: `Error: ${S.message}`,
              type: "stderr"
            }
          ], true);
        }
        d(i, false), b(), a(f)?.focus();
      }
    }
    async function P(y) {
      if (!p) return;
      d(r, y, true), p.setTier(y), d(u, false);
      const S = p.getStatus();
      if (d(n, [
        ...a(n),
        {
          text: `Switched to ${S.info}`,
          type: "info"
        }
      ], true), y === "native" && !p.isNativeConnected) {
        d(n, [
          ...a(n),
          {
            text: "Connecting to native CLI companion...",
            type: "info"
          }
        ], true);
        try {
          await p.connectNative(o), d(n, [
            ...a(n),
            {
              text: "\u2705 Connected to native CLI companion!",
              type: "info"
            }
          ], true);
        } catch {
          d(n, [
            ...a(n),
            {
              text: "\u274C Failed to connect. Install: npm i -g ezclaw-node && ezclaw-node",
              type: "stderr"
            }
          ], true);
        }
      }
    }
    function B(y) {
      y.key === "Enter" && (y.preventDefault(), k());
    }
    var U = st(), _ = Pe(U);
    {
      var E = (y) => {
        var S = zc(), O = l(S), Q = l(O), V = l(Q), ne = c(l(V), 2), L = l(ne), ue = l(L), ae = c(L, 2);
        {
          var we = (T) => {
            var se = kc(), re = l(se);
            let ie;
            var C = c(re, 2);
            let m;
            var x = c(C, 2);
            let I;
            Z(() => {
              ie = Ie(re, 1, "tier-option svelte-k4so18", null, ie, {
                active: a(r) === "container2wasm"
              }), m = Ie(C, 1, "tier-option svelte-k4so18", null, m, {
                active: a(r) === "wasi"
              }), I = Ie(x, 1, "tier-option svelte-k4so18", null, I, {
                active: a(r) === "native"
              });
            }), w("click", re, () => P("container2wasm")), w("click", C, () => P("wasi")), w("click", x, () => P("native")), h(T, se);
          };
          M(ae, (T) => {
            a(u) && T(we);
          });
        }
        var pe = c(V, 2), R = c(Q, 2), F = l(R);
        Re(F, 17, () => a(n), je, (T, se) => {
          var re = Sc(), ie = l(re);
          Z(() => {
            Ie(re, 1, `terminal-line ${a(se).type ?? ""}`, "svelte-k4so18"), A(ie, a(se).text);
          }), h(T, re);
        });
        var le = c(F, 2);
        {
          var oe = (T) => {
            var se = xc();
            h(T, se);
          };
          M(le, (T) => {
            a(i) && T(oe);
          });
        }
        Fn(R, (T) => d(v, T), () => a(v));
        var H = c(R, 2), K = c(l(H), 2);
        Fn(K, (T) => d(f, T), () => a(f)), Z((T) => {
          A(ue, `${T ?? ""} `), K.disabled = a(i);
        }, [
          () => a(r).toUpperCase()
        ]), w("click", S, function(...T) {
          e.onClose?.apply(this, T);
        }), w("click", O, (T) => T.stopPropagation()), w("click", L, () => d(u, !a(u))), w("click", pe, function(...T) {
          e.onClose?.apply(this, T);
        }), w("keydown", K, B), De(K, () => a(s), (T) => d(s, T)), h(y, S);
      };
      M(_, (y) => {
        e.isOpen && y(E);
      });
    }
    h(t, U), at();
  }
  tt([
    "click",
    "keydown"
  ]);
  var Ic = g('<div class="empty-state svelte-1hbucu"><div class="empty-icon svelte-1hbucu">\u{1F4E1}</div> <p>No channels configured</p> <button class="add-btn primary svelte-1hbucu">+ Add Channel</button></div>'), Ec = g('<span class="detail svelte-1hbucu"> </span>'), Ac = g('<div class="channel-card svelte-1hbucu"><div class="channel-header svelte-1hbucu"><span class="channel-icon svelte-1hbucu"> </span> <div class="channel-info svelte-1hbucu"><span class="channel-name svelte-1hbucu"> </span> <span class="channel-type svelte-1hbucu"> </span></div> <div class="channel-status svelte-1hbucu"><span class="status-dot svelte-1hbucu"></span> </div></div> <div class="channel-details svelte-1hbucu"><!> <span class="detail svelte-1hbucu"> </span></div> <div class="channel-actions svelte-1hbucu"><button> </button> <button class="action-btn danger svelte-1hbucu">Remove</button></div></div>'), Oc = g('<div class="channels-list svelte-1hbucu"></div> <button class="add-btn svelte-1hbucu">+ Add Another Channel</button>', 1), Dc = g('<div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Bot OAuth Token (xoxb-...)</label> <input type="password" placeholder="xoxb-..." class="svelte-1hbucu"/></div>'), qc = g('<p class="svelte-1hbucu">1. Open Telegram, search for <strong>@BotFather</strong></p> <p class="svelte-1hbucu">2. Send <code class="svelte-1hbucu">/newbot</code> and follow the prompts</p> <p class="svelte-1hbucu">3. Copy the bot token and paste it above</p>', 1), Pc = g(`<p class="svelte-1hbucu">1. Go to <strong>discord.com/developers</strong></p> <p class="svelte-1hbucu">2. Create an Application \u2192 Bot \u2192 Copy Token</p> <p class="svelte-1hbucu">3. Enable MESSAGE CONTENT intent</p> <p class="svelte-1hbucu">4. Invite bot to your server with Messages
                                    permission</p>`, 1), Mc = g(`<p class="svelte-1hbucu">1. Go to <strong>api.slack.com/apps</strong></p> <p class="svelte-1hbucu">2. Create App \u2192 Enable Socket Mode \u2192 Copy
                                    App Token</p> <p class="svelte-1hbucu">3. Install to workspace \u2192 Copy Bot OAuth
                                    Token</p>`, 1), Tc = g('<div class="add-form svelte-1hbucu"><h3 class="svelte-1hbucu">Add Channel</h3> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Platform</label> <div class="platform-selector svelte-1hbucu"><button>\u2708\uFE0F Telegram</button> <button>\u{1F3AE} Discord</button> <button>\u{1F4BC} Slack</button></div></div> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Bot Name</label> <input type="text" class="svelte-1hbucu"/></div> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu"><!></label> <input type="password" class="svelte-1hbucu"/></div> <!> <div class="setup-help svelte-1hbucu"><!></div> <div class="form-actions svelte-1hbucu"><button class="cancel-btn svelte-1hbucu">Cancel</button> <button class="save-btn svelte-1hbucu">Add Channel</button></div></div>'), Nc = g(`<div class="channels-overlay svelte-1hbucu" role="presentation"><div class="channels-panel glass-elevated svelte-1hbucu" role="dialog"><div class="panel-header svelte-1hbucu"><h2 class="svelte-1hbucu">\u{1F4E1} Messaging Channels</h2> <button class="close-btn svelte-1hbucu" aria-label="Close">\u2715</button></div> <div class="panel-body svelte-1hbucu"><div class="section-info svelte-1hbucu"><p class="svelte-1hbucu">Connect EZ-Claw to messaging platforms. Your agent will
                        respond to messages automatically.</p> <p class="info-note svelte-1hbucu">All connections are 100% client-side \u2014 no server
                        required.</p></div> <!> <!></div></div></div>`);
  function Uc(t, e) {
    nt(e, true);
    let n = z(Te([])), s = z(false), r = z("telegram"), i = z(""), o = z(""), u = z("");
    tn(() => {
      try {
        const y = localStorage.getItem("ezclaw_channels");
        y && d(n, JSON.parse(y), true);
      } catch {
      }
    });
    function v() {
      const y = a(n).map((S) => ({
        type: S.type,
        name: S.name,
        enabled: S.enabled,
        status: "disconnected",
        token: S.token ? "***" : "",
        botName: S.botName,
        messageCount: S.messageCount
      }));
      localStorage.setItem("ezclaw_channels", JSON.stringify(y));
    }
    function f() {
      if (!a(i).trim()) return;
      const y = {
        type: a(r),
        name: a(u).trim() || `My ${a(r)} Bot`,
        enabled: false,
        status: "disconnected",
        token: a(i).trim(),
        botToken: a(r) === "slack" ? a(o).trim() : void 0,
        messageCount: 0
      };
      d(n, [
        ...a(n),
        y
      ], true), d(s, false), d(i, ""), d(o, ""), d(u, ""), v();
    }
    function p(y) {
      d(n, a(n).filter((S, O) => O !== y), true), v();
    }
    async function b(y) {
      const S = a(n)[y];
      S.status === "connected" ? a(n)[y] = {
        ...S,
        status: "disconnected",
        enabled: false
      } : (a(n)[y] = {
        ...S,
        status: "connecting",
        enabled: true
      }, setTimeout(() => {
        a(n)[y] = {
          ...a(n)[y],
          status: "connected",
          botName: `${S.name} Bot`
        }, d(n, [
          ...a(n)
        ], true);
      }, 1500)), d(n, [
        ...a(n)
      ], true), v();
    }
    function k(y) {
      switch (y) {
        case "telegram":
          return "\u2708\uFE0F";
        case "discord":
          return "\u{1F3AE}";
        case "slack":
          return "\u{1F4BC}";
      }
    }
    function P(y) {
      switch (y) {
        case "telegram":
          return "#0088cc";
        case "discord":
          return "#5865F2";
        case "slack":
          return "#4A154B";
      }
    }
    function B(y) {
      switch (y) {
        case "connected":
          return "#3fb950";
        case "connecting":
          return "#d29922";
        case "error":
          return "#f85149";
        default:
          return "#8b949e";
      }
    }
    var U = st(), _ = Pe(U);
    {
      var E = (y) => {
        var S = Nc(), O = l(S), Q = l(O), V = c(l(Q), 2), ne = c(Q, 2), L = c(l(ne), 2);
        {
          var ue = (R) => {
            var F = Ic(), le = c(l(F), 4);
            w("click", le, () => d(s, true)), h(R, F);
          }, ae = (R) => {
            var F = Oc(), le = Pe(F);
            Re(le, 21, () => a(n), je, (H, K, T) => {
              var se = Ac(), re = l(se), ie = l(re), C = l(ie), m = c(ie, 2), x = l(m), I = l(x), $ = c(x, 2), J = l($), D = c(m, 2), X = l(D), W = c(X), ce = c(re, 2), ge = l(ce);
              {
                var ye = (ee) => {
                  var N = Ec(), fe = l(N);
                  Z(() => A(fe, `\u{1F916} ${a(K).botName ?? ""}`)), h(ee, N);
                };
                M(ge, (ee) => {
                  a(K).botName && ee(ye);
                });
              }
              var G = c(ge, 2), q = l(G), te = c(ce, 2), de = l(te);
              let Se;
              var Ee = l(de), ke = c(de, 2);
              Z((ee, N, fe, be) => {
                Mn(se, `--ch-color: ${ee ?? ""}`), A(C, N), A(I, a(K).name), A(J, a(K).type), Mn(D, `color: ${fe ?? ""}`), Mn(X, `background: ${be ?? ""}`), A(W, ` ${a(K).status ?? ""}`), A(q, `\u{1F4AC} ${a(K).messageCount ?? ""} messages`), Se = Ie(de, 1, "action-btn svelte-1hbucu", null, Se, {
                  connected: a(K).status === "connected"
                }), A(Ee, a(K).status === "connected" ? "Disconnect" : a(K).status === "connecting" ? "Connecting..." : "Connect");
              }, [
                () => P(a(K).type),
                () => k(a(K).type),
                () => B(a(K).status),
                () => B(a(K).status)
              ]), w("click", de, () => b(T)), w("click", ke, () => p(T)), h(H, se);
            });
            var oe = c(le, 2);
            w("click", oe, () => d(s, true)), h(R, F);
          };
          M(L, (R) => {
            a(n).length === 0 ? R(ue) : R(ae, -1);
          });
        }
        var we = c(L, 2);
        {
          var pe = (R) => {
            var F = Tc(), le = c(l(F), 2), oe = c(l(le), 2), H = l(oe);
            let K;
            var T = c(H, 2);
            let se;
            var re = c(T, 2);
            let ie;
            var C = c(le, 2), m = c(l(C), 2), x = c(C, 2), I = l(x), $ = l(I);
            {
              var J = (ee) => {
                var N = xt(`Bot Token (from
                                    @BotFather)`);
                h(ee, N);
              }, D = (ee) => {
                var N = xt(`Bot Token (from
                                    Discord Developer Portal)`);
                h(ee, N);
              }, X = (ee) => {
                var N = xt("App-Level Token (xapp-...)");
                h(ee, N);
              };
              M($, (ee) => {
                a(r) === "telegram" ? ee(J) : a(r) === "discord" ? ee(D, 1) : ee(X, -1);
              });
            }
            var W = c(I, 2), ce = c(x, 2);
            {
              var ge = (ee) => {
                var N = Dc(), fe = c(l(N), 2);
                De(fe, () => a(o), (be) => d(o, be)), h(ee, N);
              };
              M(ce, (ee) => {
                a(r) === "slack" && ee(ge);
              });
            }
            var ye = c(ce, 2), G = l(ye);
            {
              var q = (ee) => {
                var N = qc();
                h(ee, N);
              }, te = (ee) => {
                var N = Pc();
                h(ee, N);
              }, de = (ee) => {
                var N = Mc();
                h(ee, N);
              };
              M(G, (ee) => {
                a(r) === "telegram" ? ee(q) : a(r) === "discord" ? ee(te, 1) : ee(de, -1);
              });
            }
            var Se = c(ye, 2), Ee = l(Se), ke = c(Ee, 2);
            Z((ee) => {
              K = Ie(H, 1, "platform-btn svelte-1hbucu", null, K, {
                active: a(r) === "telegram"
              }), se = Ie(T, 1, "platform-btn svelte-1hbucu", null, se, {
                active: a(r) === "discord"
              }), ie = Ie(re, 1, "platform-btn svelte-1hbucu", null, ie, {
                active: a(r) === "slack"
              }), dt(m, "placeholder", `My ${a(r)} Bot`), dt(W, "placeholder", a(r) === "slack" ? "xapp-1-..." : "Bot token"), ke.disabled = ee;
            }, [
              () => !a(i).trim()
            ]), w("click", H, () => d(r, "telegram")), w("click", T, () => d(r, "discord")), w("click", re, () => d(r, "slack")), De(m, () => a(u), (ee) => d(u, ee)), De(W, () => a(i), (ee) => d(i, ee)), w("click", Ee, () => {
              d(s, false), d(i, "");
            }), w("click", ke, f), h(R, F);
          };
          M(we, (R) => {
            a(s) && R(pe);
          });
        }
        w("click", S, function(...R) {
          e.onClose?.apply(this, R);
        }), w("click", O, (R) => R.stopPropagation()), w("click", V, function(...R) {
          e.onClose?.apply(this, R);
        }), h(y, S);
      };
      M(_, (y) => {
        e.isOpen && y(E);
      });
    }
    h(t, U), at();
  }
  tt([
    "click"
  ]);
  var Rc = g('<span class="identity-badge svelte-1ay4w4h"> </span>'), Bc = g('<div class="create-form svelte-1ay4w4h"><input class="input" type="text" placeholder="Persona name..."/> <label class="checkbox-label svelte-1ay4w4h"><input type="checkbox"/> Clone current identity</label> <button class="btn btn-primary btn-sm">Create</button></div>'), Lc = g('<p class="empty-msg svelte-1ay4w4h">No personas saved yet. Create one to get started!</p>'), $c = g('<input class="input input-sm svelte-1ay4w4h"/>'), Fc = g('<strong class="svelte-1ay4w4h"> </strong>'), Wc = g('<span class="active-badge svelte-1ay4w4h">Active</span>'), jc = g('<button class="btn btn-sm btn-primary">\u25B6 Use</button>'), Jc = g('<button class="btn btn-sm btn-secondary">\u2713</button>'), Hc = g('<button class="btn btn-sm btn-ghost">\u270F\uFE0F</button>'), Kc = g('<div><div class="persona-main svelte-1ay4w4h"><span class="persona-emoji svelte-1ay4w4h"> </span> <div class="persona-info svelte-1ay4w4h"><!> <span class="persona-sub svelte-1ay4w4h"> </span></div> <!></div> <div class="persona-actions svelte-1ay4w4h"><!> <!> <button class="btn btn-sm btn-danger svelte-1ay4w4h">\u{1F5D1}\uFE0F</button></div></div>'), Vc = g('<div class="persona-list svelte-1ay4w4h"></div>'), Yc = g('<div class="delete-confirm svelte-1ay4w4h"><h3 class="svelte-1ay4w4h"> </h3> <p>Type <code class="svelte-1ay4w4h"></code> to confirm. <strong> </strong> confirmations.</p> <div class="delete-input-row svelte-1ay4w4h"><input class="input svelte-1ay4w4h" type="text"/> <button class="btn btn-danger btn-sm svelte-1ay4w4h"> </button></div> <button class="btn btn-ghost btn-sm">Cancel</button></div>'), Zc = g('<p class="status-msg svelte-1ay4w4h"> </p>'), Gc = g('<div class="modal-overlay"><div class="panel"><div class="panel-header svelte-1ay4w4h"><h2 class="svelte-1ay4w4h">\u{1F3AD} Personas</h2> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="section svelte-1ay4w4h"><h3 class="svelte-1ay4w4h">Active Identity</h3> <div class="active-identity svelte-1ay4w4h"><span class="identity-emoji svelte-1ay4w4h"> </span> <div class="identity-info svelte-1ay4w4h"><strong class="svelte-1ay4w4h"> </strong> <span class="identity-vibe svelte-1ay4w4h"> </span></div> <!></div></div> <div class="divider"></div> <div class="section svelte-1ay4w4h"><div class="section-header svelte-1ay4w4h"><h3 class="svelte-1ay4w4h"> </h3> <button class="btn btn-sm btn-secondary"> </button></div> <!> <!></div> <!> <div class="divider"></div> <div class="section svelte-1ay4w4h"><h3 class="svelte-1ay4w4h">Import / Export</h3> <div class="io-row svelte-1ay4w4h"><button class="btn btn-secondary">\u{1F4E4} Export All</button> <button class="btn btn-secondary">\u{1F4E5} Import</button></div> <!></div></div></div>');
  function Xc(t, e) {
    nt(e, true);
    let n = z(Te(ft())), s = z(Te(zt())), r = z(Te(rt())), i = z(""), o = z(false), u = z(true), v = z(null), f = z(""), p = z(0);
    const b = "DELETE THIS PERSONA", k = 3;
    let P = z(null), B = z(""), U = z("");
    function _() {
      d(n, ft(), true), d(s, zt(), true), d(r, rt(), true);
    }
    function E() {
      a(i).trim() && (a(u) ? ti(a(i).trim()) : Aa(a(i).trim(), false), d(i, ""), d(o, false), _());
    }
    function y(N) {
      Oa(N), _(), e.onPersonaSwitch?.();
    }
    function S(N) {
      d(v, N, true), d(f, ""), d(p, 0);
    }
    function O() {
      a(f).trim().toUpperCase() === b && (ys(p), d(f, ""), a(p) >= k && a(v) && (Ds(a(v).id), d(v, null), d(p, 0), _()));
    }
    function Q(N) {
      d(P, N.id, true), d(B, N.label, true);
    }
    function V() {
      a(P) && a(B).trim() && (qs(a(P), a(B).trim()), d(P, null), d(B, ""), _());
    }
    function ne() {
      try {
        const N = Ps(), fe = new Blob([
          N
        ], {
          type: "application/json"
        }), be = URL.createObjectURL(fe), j = document.createElement("a");
        j.href = be, j.download = `ezclaw-personas-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, j.click(), URL.revokeObjectURL(be), d(U, "\u2705 Exported!"), setTimeout(() => d(U, ""), 3e3);
      } catch {
        d(U, "\u274C Export failed");
      }
    }
    function L() {
      const N = document.createElement("input");
      N.type = "file", N.accept = ".json", N.onchange = async () => {
        const fe = N.files?.[0];
        if (fe) try {
          const be = await fe.text(), j = Ms(be);
          d(U, `\u2705 Imported ${j} persona(s)`), _(), setTimeout(() => d(U, ""), 3e3);
        } catch {
          d(U, "\u274C Import failed \u2014 invalid file");
        }
      }, N.click();
    }
    var ue = Gc(), ae = l(ue), we = l(ae), pe = c(l(we), 2), R = c(we, 2), F = c(l(R), 2), le = l(F), oe = l(le), H = c(le, 2), K = l(H), T = l(K), se = c(K, 2), re = l(se), ie = c(H, 2);
    {
      var C = (N) => {
        var fe = Rc(), be = l(fe);
        Z(() => A(be, a(r).creature)), h(N, fe);
      };
      M(ie, (N) => {
        a(r).creature && a(r).creature !== "AI agent" && N(C);
      });
    }
    var m = c(R, 4), x = l(m), I = l(x), $ = l(I), J = c(I, 2), D = l(J), X = c(x, 2);
    {
      var W = (N) => {
        var fe = Bc(), be = l(fe), j = c(be, 2), Y = l(j), ve = c(j, 2);
        Z((me) => ve.disabled = me, [
          () => !a(i).trim()
        ]), w("keydown", be, (me) => me.key === "Enter" && E()), De(be, () => a(i), (me) => d(i, me)), zs(Y, () => a(u), (me) => d(u, me)), w("click", ve, E), h(N, fe);
      };
      M(X, (N) => {
        a(o) && N(W);
      });
    }
    var ce = c(X, 2);
    {
      var ge = (N) => {
        var fe = Lc();
        h(N, fe);
      }, ye = (N) => {
        var fe = Vc();
        Re(fe, 21, () => a(n), (be) => be.id, (be, j) => {
          var Y = Kc();
          let ve;
          var me = l(Y), Ae = l(me), Me = l(Ae), Le = c(Ae, 2), Fe = l(Le);
          {
            var We = (he) => {
              var ze = $c();
              w("keydown", ze, (Ne) => Ne.key === "Enter" && V()), De(ze, () => a(B), (Ne) => d(B, Ne)), h(he, ze);
            }, Be = (he) => {
              var ze = Fc(), Ne = l(ze);
              Z(() => A(Ne, a(j).label)), h(he, ze);
            };
            M(Fe, (he) => {
              a(P) === a(j).id ? he(We) : he(Be, -1);
            });
          }
          var Ke = c(Fe, 2), It = l(Ke), wt = c(Le, 2);
          {
            var Et = (he) => {
              var ze = Wc();
              h(he, ze);
            };
            M(wt, (he) => {
              a(j).id === a(s) && he(Et);
            });
          }
          var gt = c(me, 2), At = l(gt);
          {
            var yt = (he) => {
              var ze = jc();
              w("click", ze, () => y(a(j).id)), h(he, ze);
            };
            M(At, (he) => {
              a(j).id !== a(s) && he(yt);
            });
          }
          var Ot = c(At, 2);
          {
            var Pt = (he) => {
              var ze = Jc();
              w("click", ze, V), h(he, ze);
            }, xe = (he) => {
              var ze = Hc();
              w("click", ze, () => Q(a(j))), h(he, ze);
            };
            M(Ot, (he) => {
              a(P) === a(j).id ? he(Pt) : he(xe, -1);
            });
          }
          var _e = c(Ot, 2);
          Z(() => {
            ve = Ie(Y, 1, "persona-card svelte-1ay4w4h", null, ve, {
              active: a(j).id === a(s)
            }), A(Me, a(j).identity.emoji || "\u{1F980}"), A(It, `${(a(j).identity.name || "(unnamed)") ?? ""} \xB7 ${(a(j).identity.vibe || "no vibe") ?? ""}`);
          }), w("click", _e, () => S(a(j))), h(be, Y);
        }), h(N, fe);
      };
      M(ce, (N) => {
        a(n).length === 0 ? N(ge) : N(ye, -1);
      });
    }
    var G = c(m, 2);
    {
      var q = (N) => {
        var fe = Yc(), be = l(fe), j = l(be), Y = c(be, 2), ve = c(l(Y));
        ve.textContent = "DELETE THIS PERSONA";
        var me = c(ve, 2), Ae = l(me), Me = c(Y, 2), Le = l(Me);
        dt(Le, "placeholder", b);
        var Fe = c(Le, 2), We = l(Fe), Be = c(Me, 2);
        Z(() => {
          A(j, `\u26A0\uFE0F Delete "${a(v).label ?? ""}"?`), A(Ae, `${a(p) ?? ""}/3`), A(We, `Confirm (${a(p) ?? ""}/3)`);
        }), w("keydown", Le, (Ke) => Ke.key === "Enter" && O()), De(Le, () => a(f), (Ke) => d(f, Ke)), w("click", Fe, O), w("click", Be, () => {
          d(v, null), d(p, 0);
        }), h(N, fe);
      };
      M(G, (N) => {
        a(v) && N(q);
      });
    }
    var te = c(G, 4), de = c(l(te), 2), Se = l(de), Ee = c(Se, 2), ke = c(de, 2);
    {
      var ee = (N) => {
        var fe = Zc(), be = l(fe);
        Z(() => A(be, a(U))), h(N, fe);
      };
      M(ke, (N) => {
        a(U) && N(ee);
      });
    }
    Z(() => {
      A(oe, a(r).emoji || "\u{1F980}"), A(T, a(r).name || "(unnamed)"), A(re, a(r).vibe || "not set"), A($, `Saved Personas (${a(n).length ?? ""})`), A(D, a(o) ? "\u2715 Cancel" : "+ New");
    }), w("click", ue, function(...N) {
      e.onClose?.apply(this, N);
    }), w("click", ae, (N) => N.stopPropagation()), w("click", pe, function(...N) {
      e.onClose?.apply(this, N);
    }), w("click", J, () => d(o, !a(o))), w("click", Se, ne), w("click", Ee, L), h(t, ue), at();
  }
  tt([
    "click",
    "keydown"
  ]);
  var Qc = g('<span class="stat svelte-1v4zqob"> </span> <span class="stat svelte-1v4zqob"> </span>', 1), ed = g('<button class="action-btn kill svelte-1v4zqob"><span class="action-icon svelte-1v4zqob">\u{1F480}</span> <div class="action-info svelte-1v4zqob"><strong class="svelte-1v4zqob">Kill Current Agent</strong> <span class="svelte-1v4zqob">Permanently terminate the active Claw</span></div></button>'), td = g('<p class="wipeout-error svelte-1v4zqob"> </p>'), nd = g('<div class="wipeout-confirm svelte-1v4zqob"><p class="wipeout-warning svelte-1v4zqob">\u26A0\uFE0F Type <code class="svelte-1v4zqob"> </code> </p> <div class="wipeout-input-row svelte-1v4zqob"><input type="text" class="input-field svelte-1v4zqob"/> <button class="btn btn-sm btn-danger svelte-1v4zqob"> </button></div> <!></div>'), ad = g(`<p class="wipeout-done svelte-1v4zqob">\u2705 All personas and skills have been erased.
                                Workspaces are untouched.</p>`), sd = g(`<div class="panic-overlay svelte-1v4zqob"><div class="panic-modal glass-elevated svelte-1v4zqob"><div class="panic-header svelte-1v4zqob"><span class="panic-icon svelte-1v4zqob">\u{1F6D1}</span> <h2 class="svelte-1v4zqob">ALL AGENTS FROZEN</h2> <p class="panic-subtitle svelte-1v4zqob">All Claws have been halted. No further actions are being
                    taken.</p></div> <div class="panic-stats svelte-1v4zqob"><!></div> <div class="panic-actions svelte-1v4zqob"><button class="action-btn resume svelte-1v4zqob"><span class="action-icon svelte-1v4zqob">\u25B6\uFE0F</span> <div class="action-info svelte-1v4zqob"><strong class="svelte-1v4zqob">Resume All</strong> <span class="svelte-1v4zqob">Unfreeze all agents and continue as normal</span></div></button> <!> <div class="action-btn wipeout-section svelte-1v4zqob"><span class="action-icon svelte-1v4zqob">\u2622\uFE0F</span> <div class="action-info svelte-1v4zqob"><strong class="svelte-1v4zqob">Wipeout All Personas & Skills</strong> <span class="svelte-1v4zqob">Erase all agent identities and learned skills. <b class="svelte-1v4zqob">Workspaces are kept safe.</b></span> <!></div></div></div></div></div>`), rd = g('<button class="panic-btn svelte-1v4zqob" title="\u{1F6D1} PANIC \u2014 Freeze all agents immediately" aria-label="Panic: freeze all agents">\u{1F6D1}</button> <!>', 1);
  function id(t, e) {
    nt(e, true);
    let n = z(false), s = z(0), r = z(""), i = z(""), o = z(false);
    const u = xi();
    function v() {
      gi(), d(n, true), d(s, 0), d(r, ""), d(i, ""), d(o, false), e.onPanic();
    }
    function f() {
      ki(), d(n, false), e.onResume();
    }
    function p() {
      e.activeClawId && (yi(e.activeClawId), e.onKill(e.activeClawId)), d(n, false);
    }
    function b() {
      if (a(r).trim() !== u) {
        d(i, `Incorrect. Type exactly: ${u}`), d(r, "");
        return;
      }
      d(i, ""), ys(s), d(r, ""), a(s) >= 3 && (Si([
        u,
        u,
        u
      ]) ? d(o, true) : (d(i, "Wipeout failed. Please try again."), d(s, 0)));
    }
    function k(E) {
      E.key === "Enter" && (E.preventDefault(), b());
    }
    var P = rd(), B = Pe(P), U = c(B, 2);
    {
      var _ = (E) => {
        var y = sd(), S = l(y), O = c(l(S), 2), Q = l(O);
        {
          var V = (oe) => {
            const H = Rt(Ls);
            var K = Qc(), T = Pe(K), se = l(T), re = c(T, 2), ie = l(re);
            Z(() => {
              A(se, `\u{1F535} ${a(H).frozen ?? ""} frozen`), A(ie, `\u26AB ${a(H).killed ?? ""} killed`);
            }), h(oe, K);
          };
          M(Q, (oe) => {
            oe(V);
          });
        }
        var ne = c(O, 2), L = l(ne), ue = c(L, 2);
        {
          var ae = (oe) => {
            var H = ed();
            w("click", H, p), h(oe, H);
          };
          M(ue, (oe) => {
            e.activeClawId && oe(ae);
          });
        }
        var we = c(ue, 2), pe = c(l(we), 2), R = c(l(pe), 4);
        {
          var F = (oe) => {
            var H = nd(), K = l(H), T = c(l(K)), se = l(T), re = c(T), ie = c(K, 2), C = l(ie), m = c(C, 2), x = l(m), I = c(ie, 2);
            {
              var $ = (J) => {
                var D = td(), X = l(D);
                Z(() => A(X, a(i))), h(J, D);
              };
              M(I, (J) => {
                a(i) && J($);
              });
            }
            Z((J) => {
              A(se, u), A(re, ` three times to
                                    confirm (${3 - a(s)} remaining)`), dt(C, "placeholder", u), m.disabled = J, A(x, `${a(s) + 1}/3`);
            }, [
              () => !a(r).trim()
            ]), w("keydown", C, k), De(C, () => a(r), (J) => d(r, J)), w("click", m, b), h(oe, H);
          }, le = (oe) => {
            var H = ad();
            h(oe, H);
          };
          M(R, (oe) => {
            a(o) ? oe(le, -1) : oe(F);
          });
        }
        w("click", L, f), h(E, y);
      };
      M(U, (E) => {
        a(n) && E(_);
      });
    }
    w("click", B, v), h(t, P), at();
  }
  tt([
    "click",
    "keydown"
  ]);
  const od = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
  let bt = null, Vt = null, en = null, Cn = false, vt = null, Bn = [], fn = "";
  function _t() {
    for (const t of Bn) t();
  }
  function ld(t) {
    return Bn.push(t), () => {
      Bn = Bn.filter((e) => e !== t);
    };
  }
  function Mt() {
    return {
      loggedIn: !!bt,
      user: Vt,
      lastSync: en,
      syncing: Cn,
      error: vt
    };
  }
  function cd(t) {
    fn = t;
    try {
      localStorage.setItem("ezclaw_google_client_id", t);
    } catch {
    }
  }
  function ga() {
    if (fn) return fn;
    try {
      fn = localStorage.getItem("ezclaw_google_client_id") || "";
    } catch {
    }
    return fn;
  }
  function dd() {
    return new Promise((t, e) => {
      if (window.google?.accounts?.oauth2) {
        t();
        return;
      }
      const n = document.createElement("script");
      n.src = "https://accounts.google.com/gsi/client", n.async = true, n.defer = true, n.onload = () => t(), n.onerror = () => e(new Error("Failed to load Google Identity Services")), document.head.appendChild(n);
    });
  }
  async function ud() {
    const t = ga();
    if (!t) {
      vt = "Set your Google OAuth Client ID in Settings first", _t();
      return;
    }
    return await dd(), new Promise((e, n) => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: t,
        scope: od,
        callback: async (r) => {
          if (r.error) {
            vt = r.error, _t(), n(new Error(r.error));
            return;
          }
          bt = r.access_token, vt = null;
          try {
            const o = await (await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                Authorization: `Bearer ${bt}`
              }
            })).json();
            Vt = {
              email: o.email,
              name: o.name,
              picture: o.picture
            };
          } catch {
            Vt = {
              email: "unknown",
              name: "User",
              picture: ""
            };
          }
          try {
            localStorage.setItem("ezclaw_cloud_user", JSON.stringify(Vt));
          } catch {
          }
          _t(), e();
        }
      }).requestAccessToken();
    });
  }
  function vd() {
    if (bt) try {
      window.google?.accounts?.oauth2?.revoke(bt);
    } catch {
    }
    bt = null, Vt = null, vt = null;
    try {
      localStorage.removeItem("ezclaw_cloud_user");
    } catch {
    }
    _t();
  }
  function fd() {
    try {
      const t = localStorage.getItem("ezclaw_cloud_user");
      t && (Vt = JSON.parse(t));
    } catch {
    }
  }
  async function Jn(t, e = {}) {
    if (!bt) throw new Error("Not signed in");
    const n = {
      Authorization: `Bearer ${bt}`,
      ...e.headers || {}
    };
    return fetch(t, {
      ...e,
      headers: n
    });
  }
  async function pn(t) {
    const e = `name='${t}' and 'appDataFolder' in parents and trashed=false`;
    return (await (await Jn(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(e)}&fields=files(id,name,modifiedTime)`)).json()).files?.[0] || null;
  }
  async function Dn(t) {
    return (await Jn(`https://www.googleapis.com/drive/v3/files/${t}?alt=media`)).text();
  }
  async function pd(t, e) {
    const n = await pn(t);
    if (n) await Jn(`https://www.googleapis.com/upload/drive/v3/files/${n.id}?uploadType=media`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: e
    });
    else {
      const s = {
        name: t,
        parents: [
          "appDataFolder"
        ]
      }, r = new FormData();
      r.append("metadata", new Blob([
        JSON.stringify(s)
      ], {
        type: "application/json"
      })), r.append("file", new Blob([
        e
      ], {
        type: "application/json"
      })), await Jn("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        body: r
      });
    }
  }
  function md() {
    const t = {};
    try {
      const e = localStorage.getItem("ezclaw_claws");
      e && (t["ezclaw_claws.json"] = e);
    } catch {
    }
    try {
      const e = localStorage.getItem("ezclaw_personas");
      e && (t["ezclaw_personas.json"] = e);
    } catch {
    }
    try {
      const e = localStorage.getItem("ezclaw:skillsets"), n = localStorage.getItem("ezclaw:skills");
      t["ezclaw_skills.json"] = JSON.stringify({
        skill_sets: e ? JSON.parse(e) : [],
        active_skills: n ? JSON.parse(n) : []
      });
    } catch {
    }
    try {
      const e = [
        "ezclaw_active_persona",
        "ezclaw:active_skillset"
      ], n = {};
      for (const s of e) {
        const r = localStorage.getItem(s);
        r && (n[s] = r);
      }
      t["ezclaw_config.json"] = JSON.stringify(n);
    } catch {
    }
    return t;
  }
  async function hd() {
    if (!bt) {
      vt = "Not signed in", _t();
      return;
    }
    Cn = true, vt = null, _t();
    try {
      const t = md();
      for (const [e, n] of Object.entries(t)) await pd(e, n);
      en = (/* @__PURE__ */ new Date()).toISOString();
      try {
        localStorage.setItem("ezclaw_last_sync", en);
      } catch {
      }
    } catch (t) {
      vt = `Sync failed: ${t.message}`;
    } finally {
      Cn = false, _t();
    }
  }
  async function bd() {
    if (!bt) {
      vt = "Not signed in", _t();
      return;
    }
    Cn = true, vt = null, _t();
    try {
      const t = await pn("ezclaw_claws.json");
      if (t) {
        const r = await Dn(t.id);
        localStorage.setItem("ezclaw_claws", r);
      }
      const e = await pn("ezclaw_personas.json");
      if (e) {
        const r = await Dn(e.id);
        localStorage.setItem("ezclaw_personas", r);
      }
      const n = await pn("ezclaw_skills.json");
      if (n) {
        const r = await Dn(n.id), i = JSON.parse(r);
        i.skill_sets && localStorage.setItem("ezclaw:skillsets", JSON.stringify(i.skill_sets)), i.active_skills && localStorage.setItem("ezclaw:skills", JSON.stringify(i.active_skills));
      }
      const s = await pn("ezclaw_config.json");
      if (s) {
        const r = await Dn(s.id), i = JSON.parse(r);
        for (const [o, u] of Object.entries(i)) localStorage.setItem(o, u);
      }
      en = (/* @__PURE__ */ new Date()).toISOString();
      try {
        localStorage.setItem("ezclaw_last_sync", en);
      } catch {
      }
    } catch (t) {
      vt = `Restore failed: ${t.message}`;
    } finally {
      Cn = false, _t();
    }
  }
  function _d() {
    fd();
    try {
      en = localStorage.getItem("ezclaw_last_sync");
    } catch {
    }
  }
  var wd = g('<div class="setup-section svelte-eyl8bk"><h3 class="svelte-eyl8bk">Setup Required</h3> <p class="setup-hint svelte-eyl8bk">To enable cloud sync, create a Google Cloud OAuth Client ID:</p> <ol class="setup-steps svelte-eyl8bk"><li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" class="svelte-eyl8bk">Google Cloud Console</a></li> <li>Create an OAuth 2.0 Client ID (Web application)</li> <li>Add your site URL to "Authorized JavaScript origins"</li> <li>Enable the Google Drive API</li> <li>Paste the Client ID below</li></ol> <div class="client-id-row svelte-eyl8bk"><input type="text" class="input svelte-eyl8bk" placeholder="123456789.apps.googleusercontent.com"/> <button class="btn btn-primary btn-sm">Save</button></div></div>'), gd = g('<img class="user-avatar svelte-eyl8bk" referrerpolicy="no-referrer"/>'), yd = g('<div class="user-avatar-placeholder svelte-eyl8bk">\u{1F464}</div>'), kd = g('<div class="sync-error svelte-eyl8bk"> </div>'), Sd = g('<span class="spin svelte-eyl8bk">\u21BB</span> Syncing...', 1), xd = g('<span class="spin svelte-eyl8bk">\u21BB</span> Syncing...', 1), zd = g('<div class="user-card svelte-eyl8bk"><!> <div class="user-info svelte-eyl8bk"><strong class="svelte-eyl8bk"> </strong> <span class="svelte-eyl8bk"> </span></div> <button class="btn btn-ghost btn-sm">Sign out</button></div> <div class="sync-status svelte-eyl8bk"><span class="sync-label">Last sync:</span> <span class="sync-time svelte-eyl8bk"> </span></div> <!> <div class="sync-actions svelte-eyl8bk"><button class="sync-btn push svelte-eyl8bk"><!></button> <button class="sync-btn pull svelte-eyl8bk"><!></button></div> <p class="sync-hint svelte-eyl8bk"><strong>Push</strong> saves your current data to Drive. <strong>Pull</strong> restores from Drive (overwrites local).</p> <button class="btn btn-ghost btn-sm change-id svelte-eyl8bk">Change Client ID</button>', 1), Cd = g('<div class="sync-error svelte-eyl8bk"> </div>'), Id = g(`<div class="sign-in-section svelte-eyl8bk"><button class="google-btn svelte-eyl8bk"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg> Sign in with Google</button> <p class="sign-in-hint svelte-eyl8bk">Your data syncs to your own Google Drive. We never see
                        it.</p></div> <!>`, 1), Ed = g(`<div class="modal-overlay"><div class="modal-content cloud-panel svelte-eyl8bk"><div class="panel-header svelte-eyl8bk"><h2 class="svelte-eyl8bk">\u2601\uFE0F Cloud Sync</h2> <button class="btn btn-ghost btn-icon" aria-label="Close">\u2715</button></div> <p class="panel-desc svelte-eyl8bk">Sync your Claws, Personas, Skills, and Settings to your Google
            Drive. <strong>No server involved</strong> \u2014 data goes directly to your Drive.</p> <!></div></div>`);
  function Ad(t, e) {
    nt(e, true);
    let n = z(Te(Mt())), s = z(Te(ga())), r = z(!ga()), i;
    tn(() => {
      i = ld(() => {
        d(n, Mt(), true);
      });
    }), Cs(() => {
      i && i();
    });
    function o() {
      cd(a(s).trim()), d(r, false);
    }
    async function u() {
      try {
        await ud(), d(n, Mt(), true);
      } catch {
        d(n, Mt(), true);
      }
    }
    function v() {
      vd(), d(n, Mt(), true);
    }
    async function f() {
      await hd(), d(n, Mt(), true);
    }
    async function p() {
      await bd(), d(n, Mt(), true);
    }
    function b(S) {
      return S ? new Date(S).toLocaleString() : "Never";
    }
    var k = Ed(), P = l(k), B = l(P), U = c(l(B), 2), _ = c(B, 4);
    {
      var E = (S) => {
        var O = wd(), Q = c(l(O), 6), V = l(Q), ne = c(V, 2);
        Z((L) => ne.disabled = L, [
          () => !a(s).trim()
        ]), De(V, () => a(s), (L) => d(s, L)), w("click", ne, o), h(S, O);
      }, y = (S) => {
        var O = st(), Q = Pe(O);
        {
          var V = (L) => {
            var ue = zd(), ae = Pe(ue), we = l(ae);
            {
              var pe = (G) => {
                var q = gd();
                Z(() => {
                  dt(q, "src", a(n).user.picture), dt(q, "alt", a(n).user.name);
                }), h(G, q);
              }, R = (G) => {
                var q = yd();
                h(G, q);
              };
              M(we, (G) => {
                a(n).user.picture ? G(pe) : G(R, -1);
              });
            }
            var F = c(we, 2), le = l(F), oe = l(le), H = c(le, 2), K = l(H), T = c(F, 2), se = c(ae, 2), re = c(l(se), 2), ie = l(re), C = c(se, 2);
            {
              var m = (G) => {
                var q = kd(), te = l(q);
                Z(() => A(te, `\u26A0\uFE0F ${a(n).error ?? ""}`)), h(G, q);
              };
              M(C, (G) => {
                a(n).error && G(m);
              });
            }
            var x = c(C, 2), I = l(x), $ = l(I);
            {
              var J = (G) => {
                var q = Sd();
                h(G, q);
              }, D = (G) => {
                var q = xt("\u2601\uFE0F\u2191 Push to Cloud");
                h(G, q);
              };
              M($, (G) => {
                a(n).syncing ? G(J) : G(D, -1);
              });
            }
            var X = c(I, 2), W = l(X);
            {
              var ce = (G) => {
                var q = xd();
                h(G, q);
              }, ge = (G) => {
                var q = xt("\u2601\uFE0F\u2193 Pull from Cloud");
                h(G, q);
              };
              M(W, (G) => {
                a(n).syncing ? G(ce) : G(ge, -1);
              });
            }
            var ye = c(x, 4);
            Z((G) => {
              A(oe, a(n).user.name), A(K, a(n).user.email), A(ie, G), I.disabled = a(n).syncing, X.disabled = a(n).syncing;
            }, [
              () => b(a(n).lastSync)
            ]), w("click", T, v), w("click", I, f), w("click", X, p), w("click", ye, () => d(r, true)), h(L, ue);
          }, ne = (L) => {
            var ue = Id(), ae = Pe(ue), we = l(ae), pe = c(ae, 2);
            {
              var R = (F) => {
                var le = Cd(), oe = l(le);
                Z(() => A(oe, `\u26A0\uFE0F ${a(n).error ?? ""}`)), h(F, le);
              };
              M(pe, (F) => {
                a(n).error && F(R);
              });
            }
            w("click", we, u), h(L, ue);
          };
          M(Q, (L) => {
            a(n).loggedIn && a(n).user ? L(V) : L(ne, -1);
          });
        }
        h(S, O);
      };
      M(_, (S) => {
        !a(s) || a(r) ? S(E) : S(y, -1);
      });
    }
    w("click", k, function(...S) {
      e.onClose?.apply(this, S);
    }), w("click", P, (S) => S.stopPropagation()), w("click", U, function(...S) {
      e.onClose?.apply(this, S);
    }), h(t, k), at();
  }
  tt([
    "click"
  ]);
  let ot = null, Ln = null, qn = /* @__PURE__ */ new Map(), Ze = {
    provider: "deepseek",
    model: "deepseek-chat",
    apiKey: "",
    temperature: 0.7,
    apiUrl: ""
  };
  function Od() {
    if (!ot) throw new Error("EZClaw not initialized");
    return Ln || (Ln = new ot.WasmWorkspace()), Ln;
  }
  async function ls() {
    try {
      const t = await lt("provider"), e = await lt("model"), n = await lt("apiKey"), s = await lt("temperature"), r = await lt("apiUrl");
      t && (Ze.provider = t), e && (Ze.model = e), n && (Ze.apiKey = n), s && (Ze.temperature = parseFloat(s)), r && (Ze.apiUrl = r);
    } catch {
    }
  }
  const Dd = {
    async init() {
      if (ot) return;
      const { initStorage: t } = await _n(async () => {
        const { initStorage: e } = await Promise.resolve().then(() => so);
        return {
          initStorage: e
        };
      }, void 0, import.meta.url);
      await t(), await ls(), ot = await $s();
      try {
        await wa();
      } catch {
      }
      new Ra({
        tier: "wasi",
        enabled: true
      }), Ln = new ot.WasmWorkspace(), console.log("[EZClaw] Initialized");
    },
    isReady() {
      return ot !== null && Fi();
    },
    getVersion() {
      if (!ot) throw new Error("EZClaw not initialized. Call init() first.");
      return ot.version();
    },
    async chat(t, e) {
      if (!ot) throw new Error("EZClaw not initialized. Call init() first.");
      if (!Bt.includes(Ze.provider) && !Ze.apiKey) throw new Error("No API key configured. Call setConfig() first.");
      const n = {
        temperature: e?.temperature ?? Ze.temperature,
        model: e?.model ?? Ze.model,
        stream: e?.stream ?? false,
        onToolCall: e?.onToolCall,
        onChunk: e?.onChunk
      }, s = [
        {
          role: "user",
          content: t
        }
      ];
      let r = Ca();
      Wn() && (r += `

` + Ia());
      let i = [];
      try {
        i = Sn(t, 5).map((E) => `[${E.category}] ${E.key}: ${E.content}`);
      } catch {
      }
      const o = new ot.WasmAgent(JSON.stringify({
        default_provider: Ze.provider,
        default_model: n.model,
        default_temperature: n.temperature
      })), u = o.build_messages(JSON.stringify(s), JSON.stringify(i), r, (/* @__PURE__ */ new Date()).toLocaleString());
      let v = JSON.parse(u);
      const f = 10;
      let p = "";
      const b = Od(), { buildProviderHeaders: k } = await _n(async () => {
        const { buildProviderHeaders: _ } = await Promise.resolve().then(() => Wi);
        return {
          buildProviderHeaders: _
        };
      }, void 0, import.meta.url), B = `${Ze.apiUrl || ot.provider_base_url(Ze.provider)}/chat/completions`, U = k(Ze.provider, Ze.apiKey);
      for (let _ = 0; _ < f; _++) {
        const E = ot.build_provider_request(JSON.stringify(v), n.model, n.temperature, false), y = await fetch(B, {
          method: "POST",
          headers: U,
          body: E
        });
        if (!y.ok) {
          const V = await y.text();
          throw new Error(`API error ${y.status}: ${V}`);
        }
        const O = (await y.json()).choices?.[0];
        if (!O) throw new Error("No response from model");
        const Q = O.message;
        if (Q.tool_calls?.length > 0) {
          v.push(Q);
          for (const V of Q.tool_calls) {
            const ne = {
              id: V.id || crypto.randomUUID(),
              name: V.function?.name || V.name || "unknown",
              arguments: V.function?.arguments || V.arguments || "{}"
            };
            let L;
            e?.onToolCall ? L = await e.onToolCall(ne) : L = await Io(o, b, ne), v.push({
              role: "tool",
              tool_call_id: ne.id,
              content: L.output || L.error || ""
            });
          }
          continue;
        }
        p = Q.content || "";
        break;
      }
      return o.free(), Wn() && p.includes("bootstrapped") && As(), p;
    },
    getIdentity() {
      return rt();
    },
    setIdentity(t) {
      const n = {
        ...rt(),
        ...t,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return nn(n), n;
    },
    getUser() {
      return Ft();
    },
    setUser(t) {
      const n = {
        ...Ft(),
        ...t
      };
      return za(n), n;
    },
    listPersonas() {
      return ft();
    },
    getActivePersonaId() {
      return zt();
    },
    switchPersona(t) {
      return Oa(t);
    },
    createPersona(t, e = false) {
      return Aa(t, e);
    },
    deletePersona(t) {
      return Ds(t);
    },
    renamePersona(t, e) {
      return qs(t, e);
    },
    exportPersonas() {
      return Ps();
    },
    importPersonas(t) {
      return Ms(t);
    },
    async getConfig() {
      return await ls(), {
        ...Ze
      };
    },
    async setConfig(t) {
      Ze = {
        ...Ze,
        ...t
      }, t.provider !== void 0 && await Je("provider", t.provider), t.model !== void 0 && await Je("model", t.model), t.apiKey !== void 0 && await Je("apiKey", t.apiKey), t.temperature !== void 0 && await Je("temperature", String(t.temperature)), t.apiUrl !== void 0 && await Je("apiUrl", t.apiUrl || "");
    },
    recallMemories(t, e = 5) {
      return Sn(t, e);
    },
    storeMemory(t, e, n = "general") {
      pt(t, e, n);
    },
    on(t, e) {
      qn.has(t) || qn.set(t, /* @__PURE__ */ new Set()), qn.get(t).add(e);
    },
    off(t, e) {
      qn.get(t)?.delete(e);
    }
  };
  typeof window < "u" && (window.EZClaw = Dd);
  var qd = g('<div class="loading-screen svelte-1n46o8q"><div class="loading-logo svelte-1n46o8q"><div class="loading-claw svelte-1n46o8q">\u{1F980}</div> <h1 class="svelte-1n46o8q">EZ-Claw</h1> <p class="svelte-1n46o8q">Loading engine...</p> <div class="loading-bar svelte-1n46o8q"><div class="loading-progress svelte-1n46o8q"></div></div></div></div>'), Pd = g('<div class="loading-screen svelte-1n46o8q"><div class="loading-logo svelte-1n46o8q"><div class="loading-claw svelte-1n46o8q">\u{1F980}</div> <h1 class="svelte-1n46o8q">EZ-Claw</h1> <p style="color: var(--error);" class="svelte-1n46o8q">Failed to load engine</p> <p style="font-size: var(--text-xs); color: var(--text-tertiary); max-width: 400px; word-break: break-all;" class="svelte-1n46o8q"> </p> <button class="btn btn-primary svelte-1n46o8q" style="margin-top: 16px;">Retry</button></div></div>'), Md = g('<div><!> <div class="main-area svelte-1n46o8q"><!> <!> <!></div></div> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
  Nd = function(t, e) {
    nt(e, true);
    let n = z(false), s = z(true), r = z(""), i = z(false), o = z(false), u = z(false), v = z(false), f = z(false), p = z(false), b = z(false), k = z(false), P = z(false), B = z(false), U = z(false), _ = z(Te([])), E = z(null), y = z("deepseek"), S = z("deepseek-chat"), O = z(""), Q = z(0.7), V = z("");
    const ne = "ezclaw_memory_db", L = "memory", ue = "ezclaw_memory";
    let ae;
    function we() {
      return new Promise((m, x) => {
        const I = indexedDB.open(ne, 1);
        I.onupgradeneeded = () => {
          const $ = I.result;
          $.objectStoreNames.contains(L) || $.createObjectStore(L);
        }, I.onsuccess = () => m(I.result), I.onerror = () => x(I.error);
      });
    }
    async function pe() {
      try {
        const m = await we(), $ = m.transaction(L, "readonly").objectStore(L).get(ue), J = await new Promise((D, X) => {
          $.onsuccess = () => D($.result), $.onerror = () => X($.error);
        });
        return m.close(), J || null;
      } catch {
        return null;
      }
    }
    async function R() {
      try {
        const m = co();
        if (m) {
          const x = await we(), I = x.transaction(L, "readwrite");
          I.objectStore(L).put(m, ue), await new Promise(($, J) => {
            I.oncomplete = () => $(), I.onerror = () => J(I.error);
          }), x.close();
        }
      } catch {
      }
    }
    typeof window < "u" && window.addEventListener("beforeunload", () => {
      R();
    }), Cs(() => {
      ae && clearInterval(ae);
    }), tn(async () => {
      try {
        await Vs(), hi(), _d();
        try {
          await $s(), d(n, true);
          try {
            const W = await pe();
            W ? (await lo(W), console.log("[EZ-Claw] Memory restored from IndexedDB")) : await wa(), ae = setInterval(R, 3e4);
          } catch (W) {
            console.warn("[EZ-Claw] Memory init failed:", W);
            try {
              await wa();
            } catch {
            }
          }
        } catch (W) {
          console.warn("[EZ-Claw] WASM load failed, running in degraded mode:", W), d(r, `WASM load failed: ${W instanceof Error ? W.message : String(W)}`);
        }
        const m = await lt("provider"), x = await lt("model"), I = await lt("apiKey"), $ = await lt("temperature"), J = await lt("apiUrl");
        m && (!js(m) || m === "novita") ? (console.warn(`[EZ-Claw] Invalid/unavailable provider "${m}", resetting to openrouter`), d(y, "openrouter"), await Je("provider", a(y))) : m && d(y, m, true), x && d(S, x, true), I && d(O, I, true), $ && d(Q, parseFloat($), true), J && d(V, J, true);
        const D = Ws(a(y));
        !(D.length === 0 || D.some((W) => a(S)?.includes(W.split("/").pop() || W))) && a(S) && (console.warn(`[EZ-Claw] Invalid model "${a(S)}" for provider "${a(y)}", resetting to default`), d(S, Fs(a(y)), true), await Je("model", a(S))), d(_, await Pa(), true), a(_).length > 0 && d(E, a(_)[0].id, true), a(O) || d(u, true), d(s, false);
      } catch (m) {
        console.error("[EZ-Claw] Init failed:", m), d(r, `Init failed: ${m instanceof Error ? m.message : String(m)}`), d(s, false);
      }
    });
    function F(m, x) {
      let I;
      x && (I = wi(x, m, a(S), a(y))), I || (I = _i(m, a(S), a(y)));
      const $ = {
        id: I.id,
        title: m,
        clawName: I.clawName,
        emoji: I.emoji,
        personaId: I.personaId,
        skillSetId: I.skillSetId,
        status: I.status,
        messages: [],
        createdAt: I.createdAt,
        updatedAt: I.updatedAt,
        model: I.model,
        provider: I.provider
      };
      d(_, [
        $,
        ...a(_)
      ], true), d(E, I.id, true), Va(I.id), d(i, false), Qn($);
    }
    function le(m) {
      d(E, m, true), Va(m), d(i, false);
    }
    function oe(m) {
      d(_, a(_).filter((x) => x.id !== m), true), a(E) === m && d(E, a(_).length > 0 ? a(_)[0].id : null, true), Zs(m);
    }
    function H(m) {
      d(_, a(_).map((x) => x.id === m.id ? m : x), true);
    }
    async function K(m) {
      d(y, m.provider, true), d(S, m.model, true), d(O, m.apiKey, true), await Je("provider", m.provider), await Je("model", m.model), await Je("apiKey", m.apiKey), d(u, false), a(_).length === 0 && F("My First Claw");
    }
    var T = st(), se = Pe(T);
    {
      var re = (m) => {
        var x = qd();
        h(m, x);
      }, ie = (m) => {
        var x = Pd(), I = l(x), $ = c(l(I), 6), J = l($), D = c($, 2);
        Z(() => A(J, a(r))), w("click", D, () => location.reload()), h(m, x);
      }, C = (m) => {
        var x = Md(), I = Pe(x);
        let $;
        var J = l(I);
        Ti(J, {
          get sessions() {
            return a(_);
          },
          get activeSessionId() {
            return a(E);
          },
          get isOpen() {
            return a(i);
          },
          onNewClaw: F,
          onSelectSession: le,
          onDeleteSession: oe,
          onClose: () => d(i, false)
        });
        var D = c(J, 2), X = l(D);
        {
          let Y = Rt(() => a(_).find((ve) => ve.id === a(E))?.title || "EZ-Claw");
          Qr(X, {
            get sessionTitle() {
              return a(Y);
            },
            get model() {
              return a(S);
            },
            get provider() {
              return a(y);
            },
            get engineStatus() {
              return a(n);
            },
            onToggleSidebar: () => d(i, !a(i)),
            onOpenSettings: () => d(o, true),
            onOpenWorkspace: () => d(v, true),
            onOpenSecurity: () => d(f, true),
            onOpenSkills: () => d(p, true),
            onOpenMCP: () => d(b, true),
            onOpenTerminal: () => d(k, true),
            onOpenChannels: () => d(P, true),
            onOpenPersonas: () => d(B, true),
            onOpenCloudSync: () => d(U, true)
          });
        }
        var W = c(X, 2);
        id(W, {
          get activeClawId() {
            return a(E);
          },
          onPanic: () => {
            d(_, a(_).map((Y) => ({
              ...Y,
              status: "frozen"
            })), true);
          },
          onResume: () => {
            d(_, a(_).map((Y) => Y.status === "frozen" ? {
              ...Y,
              status: "running"
            } : Y), true);
          },
          onKill: (Y) => {
            if (d(_, a(_).map((ve) => ve.id === Y ? {
              ...ve,
              status: "killed"
            } : ve), true), a(E) === Y) {
              const ve = a(_).find((me) => me.status === "running");
              d(E, ve ? ve.id : null, true);
            }
          }
        });
        var ce = c(W, 2);
        Ho(ce, {
          get sessionId() {
            return a(E);
          },
          get provider() {
            return a(y);
          },
          get model() {
            return a(S);
          },
          get apiKey() {
            return a(O);
          },
          get temperature() {
            return a(Q);
          },
          get apiUrl() {
            return a(V);
          },
          onSessionUpdate: H
        });
        var ge = c(I, 2);
        {
          var ye = (Y) => {
            el(Y, {
              get provider() {
                return a(y);
              },
              get model() {
                return a(S);
              },
              get apiKey() {
                return a(O);
              },
              get temperature() {
                return a(Q);
              },
              get apiUrl() {
                return a(V);
              },
              onClose: () => d(o, false),
              onSave: async (ve) => {
                d(y, ve.provider, true), d(S, ve.model, true), d(O, ve.apiKey, true), d(Q, ve.temperature, true), d(V, ve.apiUrl, true), await Je("provider", ve.provider), await Je("model", ve.model), await Je("apiKey", ve.apiKey), await Je("temperature", String(ve.temperature)), await Je("apiUrl", ve.apiUrl), d(o, false);
              }
            });
          };
          M(ge, (Y) => {
            a(o) && Y(ye);
          });
        }
        var G = c(ge, 2);
        {
          var q = (Y) => {
            cl(Y, {
              onComplete: K
            });
          };
          M(G, (Y) => {
            a(u) && Y(q);
          });
        }
        var te = c(G, 2);
        Ll(te, {
          get isOpen() {
            return a(v);
          },
          onClose: () => d(v, false)
        });
        var de = c(te, 2);
        Xl(de, {
          get isOpen() {
            return a(f);
          },
          onClose: () => d(f, false)
        });
        var Se = c(de, 2);
        pc(Se, {
          get isOpen() {
            return a(p);
          },
          onClose: () => d(p, false)
        });
        var Ee = c(Se, 2);
        yc(Ee, {
          get isOpen() {
            return a(b);
          },
          onClose: () => d(b, false)
        });
        var ke = c(Ee, 2);
        Cc(ke, {
          get isOpen() {
            return a(k);
          },
          onClose: () => d(k, false)
        });
        var ee = c(ke, 2);
        Uc(ee, {
          get isOpen() {
            return a(P);
          },
          onClose: () => d(P, false)
        });
        var N = c(ee, 2);
        {
          var fe = (Y) => {
            Xc(Y, {
              onClose: () => d(B, false)
            });
          };
          M(N, (Y) => {
            a(B) && Y(fe);
          });
        }
        var be = c(N, 2);
        {
          var j = (Y) => {
            Ad(Y, {
              onClose: () => d(U, false)
            });
          };
          M(be, (Y) => {
            a(U) && Y(j);
          });
        }
        Z(() => $ = Ie(I, 1, "app-layout svelte-1n46o8q", null, $, {
          "sidebar-open": a(i)
        })), h(m, x);
      };
      M(se, (m) => {
        a(s) ? m(re) : a(r) && !a(n) ? m(ie, 1) : m(C, -1);
      });
    }
    h(t, T), at();
  };
  tt([
    "click"
  ]);
});
export {
  __tla,
  Nd as default
};
