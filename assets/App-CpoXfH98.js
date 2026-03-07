import { c as Na, a as Ge, b as Ua, g as Xe, i as Dn, T as qn, d as Nn, r as ia, I as mt, e as At, p as oa, f as bt, h as je, m as Ra, s as Ba, j as La, E as Un, k as n, l as ga, n as Rn, o as Bn, q as Ln, t as ya, u as Wn, v as jn, w as Fn, x as Wa, y as la, z as Fe, A as ja, D as $n, B as Ot, C as Jn, F as Hn, G as Vn, H as Kn, J as ae, K as Yn, N as Zn, L as Gn, M as Dt, O as Fa, P as $a, Q as Xn, R as Ja, S as Ha, U as Qn, V as es, W as ts, X as as, Y as ca, Z as wt, _ as qt, $ as ns, a0 as Va, a1 as da, a2 as De, a3 as qe, a4 as x, a5 as Ne, a6 as q, a7 as l, a8 as d, a9 as Ee, aa as Tt, ab as O, ac as Ce, ad as c, ae as zt, af as ss, __tla as __tla_0 } from "./index-BkEexPGR.js";
let co;
let __tla = Promise.all([
  (() => {
    try {
      return __tla_0;
    } catch {
    }
  })()
]).then(async () => {
  function Ka(t) {
    throw new Error("https://svelte.dev/e/lifecycle_outside_component");
  }
  const rs = globalThis?.window?.trustedTypes && globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    createHTML: (t) => t
  });
  function is(t) {
    return rs?.createHTML(t) ?? t;
  }
  function Ya(t) {
    var e = Na("template");
    return e.innerHTML = is(t.replaceAll("<!>", "<!---->")), e.content;
  }
  function nt(t, e) {
    var a = Ua;
    a.nodes === null && (a.nodes = {
      start: t,
      end: e,
      a: null,
      t: null
    });
  }
  function E(t, e) {
    var a = (e & qn) !== 0, s = (e & Nn) !== 0, r, i = !t.startsWith("<!>");
    return () => {
      r === void 0 && (r = Ya(i ? t : "<!>" + t), a || (r = Xe(r)));
      var o = s || Dn ? document.importNode(r, true) : r.cloneNode(true);
      if (a) {
        var u = Xe(o), v = o.lastChild;
        nt(u, v);
      } else nt(o, o);
      return o;
    };
  }
  function os(t, e, a = "svg") {
    var s = !t.startsWith("<!>"), r = `<${a}>${s ? t : "<!>" + t}</${a}>`, i;
    return () => {
      if (!i) {
        var o = Ya(r), u = Xe(o);
        i = Xe(u);
      }
      var v = i.cloneNode(true);
      return nt(v, v), v;
    };
  }
  function ls(t, e) {
    return os(t, e, "svg");
  }
  function Qe(t = "") {
    {
      var e = Ge(t + "");
      return nt(e, e), e;
    }
  }
  function Be() {
    var t = document.createDocumentFragment(), e = document.createComment(""), a = Ge();
    return t.append(e, a), nt(e, a), t;
  }
  function g(t, e) {
    t !== null && t.before(e);
  }
  class cs {
    anchor;
    #t = /* @__PURE__ */ new Map();
    #a = /* @__PURE__ */ new Map();
    #e = /* @__PURE__ */ new Map();
    #n = /* @__PURE__ */ new Set();
    #s = true;
    constructor(e, a = true) {
      this.anchor = e, this.#s = a;
    }
    #r = (e) => {
      if (this.#t.has(e)) {
        var a = this.#t.get(e), s = this.#a.get(a);
        if (s) ia(s), this.#n.delete(a);
        else {
          var r = this.#e.get(a);
          r && (r.effect.f & mt) === 0 && (this.#a.set(a, r.effect), this.#e.delete(a), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), s = r.effect);
        }
        for (const [i, o] of this.#t) {
          if (this.#t.delete(i), i === e) break;
          const u = this.#e.get(o);
          u && (At(u.effect), this.#e.delete(o));
        }
        for (const [i, o] of this.#a) {
          if (i === a || this.#n.has(i) || (o.f & mt) !== 0) continue;
          const u = () => {
            if (Array.from(this.#t.values()).includes(i)) {
              var b = document.createDocumentFragment();
              Ra(o, b), b.append(Ge()), this.#e.set(i, {
                effect: o,
                fragment: b
              });
            } else At(o);
            this.#n.delete(i), this.#a.delete(i);
          };
          this.#s || !s ? (this.#n.add(i), oa(o, u, false)) : u();
        }
      }
    };
    #i = (e) => {
      this.#t.delete(e);
      const a = Array.from(this.#t.values());
      for (const [s, r] of this.#e) a.includes(s) || (At(r.effect), this.#e.delete(s));
    };
    ensure(e, a) {
      var s = je, r = Ba();
      if (a && !this.#a.has(e) && !this.#e.has(e)) if (r) {
        var i = document.createDocumentFragment(), o = Ge();
        i.append(o), this.#e.set(e, {
          effect: bt(() => a(o)),
          fragment: i
        });
      } else this.#a.set(e, bt(() => a(this.anchor)));
      if (this.#t.set(s, e), r) {
        for (const [u, v] of this.#a) u === e ? s.unskip_effect(v) : s.skip_effect(v);
        for (const [u, v] of this.#e) u === e ? s.unskip_effect(v.effect) : s.skip_effect(v.effect);
        s.oncommit(this.#r), s.ondiscard(this.#i);
      } else this.#r(s);
    }
  }
  function $(t, e, a = false) {
    var s = new cs(t), r = a ? Un : 0;
    function i(o, u) {
      s.ensure(o, u);
    }
    La(() => {
      var o = false;
      e((u, v = 0) => {
        o = true, i(v, u);
      }), o || i(-1, null);
    }, r);
  }
  function Te(t, e) {
    return e;
  }
  function ds(t, e, a) {
    for (var s = [], r = e.length, i, o = e.length, u = 0; u < r; u++) {
      let z = e[u];
      oa(z, () => {
        if (i) {
          if (i.pending.delete(z), i.done.add(z), i.pending.size === 0) {
            var T = t.outrogroups;
            Kt(t, la(i.done)), T.delete(i), T.size === 0 && (t.outrogroups = null);
          }
        } else o -= 1;
      }, false);
    }
    if (o === 0) {
      var v = s.length === 0 && a !== null;
      if (v) {
        var b = a, _ = b.parentNode;
        Vn(_), _.append(b), t.items.clear();
      }
      Kt(t, e, !v);
    } else i = {
      pending: new Set(e),
      done: /* @__PURE__ */ new Set()
    }, (t.outrogroups ??= /* @__PURE__ */ new Set()).add(i);
  }
  function Kt(t, e, a = true) {
    var s;
    if (t.pending.size > 0) {
      s = /* @__PURE__ */ new Set();
      for (const o of t.pending.values()) for (const u of o) s.add(t.items.get(u).e);
    }
    for (var r = 0; r < e.length; r++) {
      var i = e[r];
      if (s?.has(i)) {
        i.f |= Fe;
        const o = document.createDocumentFragment();
        Ra(i, o);
      } else At(e[r], a);
    }
  }
  var wa;
  function Ie(t, e, a, s, r, i = null) {
    var o = t, u = /* @__PURE__ */ new Map(), v = (e & ja) !== 0;
    if (v) {
      var b = t;
      o = b.appendChild(Ge());
    }
    var _ = null, z = Bn(() => {
      var w = a();
      return Wa(w) ? w : w == null ? [] : la(w);
    }), T, L = /* @__PURE__ */ new Map(), U = true;
    function S(w) {
      (h.effect.f & $n) === 0 && (h.pending.delete(w), h.fallback = _, us(h, T, o, e, s), _ !== null && (T.length === 0 ? (_.f & Fe) === 0 ? ia(_) : (_.f ^= Fe, ft(_, null, o)) : oa(_, () => {
        _ = null;
      })));
    }
    function p(w) {
      h.pending.delete(w);
    }
    var y = La(() => {
      T = n(z);
      for (var w = T.length, D = /* @__PURE__ */ new Set(), V = je, I = Ba(), R = 0; R < w; R += 1) {
        var X = T[R], se = s(X, R), Q = U ? null : u.get(se);
        Q ? (Q.v && ga(Q.v, X), Q.i && ga(Q.i, R), I && V.unskip_effect(Q.e)) : (Q = vs(u, U ? o : wa ??= Ge(), X, se, R, r, e, a), U || (Q.e.f |= Fe), u.set(se, Q)), D.add(se);
      }
      if (w === 0 && i && !_ && (U ? _ = bt(() => i(o)) : (_ = bt(() => i(wa ??= Ge())), _.f |= Fe)), w > D.size && Rn(), !U) if (L.set(V, D), I) {
        for (const [pe, Z] of u) D.has(pe) || V.skip_effect(Z.e);
        V.oncommit(S), V.ondiscard(p);
      } else S(V);
      n(z);
    }), h = {
      effect: y,
      items: u,
      pending: L,
      outrogroups: null,
      fallback: _
    };
    U = false;
  }
  function vt(t) {
    for (; t !== null && (t.f & Jn) === 0; ) t = t.next;
    return t;
  }
  function us(t, e, a, s, r) {
    var i = (s & Hn) !== 0, o = e.length, u = t.items, v = vt(t.effect.first), b, _ = null, z, T = [], L = [], U, S, p, y;
    if (i) for (y = 0; y < o; y += 1) U = e[y], S = r(U, y), p = u.get(S).e, (p.f & Fe) === 0 && (p.nodes?.a?.measure(), (z ??= /* @__PURE__ */ new Set()).add(p));
    for (y = 0; y < o; y += 1) {
      if (U = e[y], S = r(U, y), p = u.get(S).e, t.outrogroups !== null) for (const Q of t.outrogroups) Q.pending.delete(p), Q.done.delete(p);
      if ((p.f & Fe) !== 0) if (p.f ^= Fe, p === v) ft(p, null, a);
      else {
        var h = _ ? _.next : v;
        p === t.effect.last && (t.effect.last = p.prev), p.prev && (p.prev.next = p.next), p.next && (p.next.prev = p.prev), Ve(t, _, p), Ve(t, p, h), ft(p, h, a), _ = p, T = [], L = [], v = vt(_.next);
        continue;
      }
      if ((p.f & mt) !== 0 && (ia(p), i && (p.nodes?.a?.unfix(), (z ??= /* @__PURE__ */ new Set()).delete(p))), p !== v) {
        if (b !== void 0 && b.has(p)) {
          if (T.length < L.length) {
            var w = L[0], D;
            _ = w.prev;
            var V = T[0], I = T[T.length - 1];
            for (D = 0; D < T.length; D += 1) ft(T[D], w, a);
            for (D = 0; D < L.length; D += 1) b.delete(L[D]);
            Ve(t, V.prev, I.next), Ve(t, _, V), Ve(t, I, w), v = w, _ = I, y -= 1, T = [], L = [];
          } else b.delete(p), ft(p, v, a), Ve(t, p.prev, p.next), Ve(t, p, _ === null ? t.effect.first : _.next), Ve(t, _, p), _ = p;
          continue;
        }
        for (T = [], L = []; v !== null && v !== p; ) (b ??= /* @__PURE__ */ new Set()).add(v), L.push(v), v = vt(v.next);
        if (v === null) continue;
      }
      (p.f & Fe) === 0 && T.push(p), _ = p, v = vt(p.next);
    }
    if (t.outrogroups !== null) {
      for (const Q of t.outrogroups) Q.pending.size === 0 && (Kt(t, la(Q.done)), t.outrogroups?.delete(Q));
      t.outrogroups.size === 0 && (t.outrogroups = null);
    }
    if (v !== null || b !== void 0) {
      var R = [];
      if (b !== void 0) for (p of b) (p.f & mt) === 0 && R.push(p);
      for (; v !== null; ) (v.f & mt) === 0 && v !== t.fallback && R.push(v), v = vt(v.next);
      var X = R.length;
      if (X > 0) {
        var se = (s & ja) !== 0 && o === 0 ? a : null;
        if (i) {
          for (y = 0; y < X; y += 1) R[y].nodes?.a?.measure();
          for (y = 0; y < X; y += 1) R[y].nodes?.a?.fix();
        }
        ds(t, R, se);
      }
    }
    i && Ot(() => {
      if (z !== void 0) for (p of z) p.nodes?.a?.apply();
    });
  }
  function vs(t, e, a, s, r, i, o, u) {
    var v = (o & Wn) !== 0 ? (o & jn) === 0 ? Fn(a, false, false) : ya(a) : null, b = (o & Ln) !== 0 ? ya(r) : null;
    return {
      v,
      i: b,
      e: bt(() => (i(e, v ?? a, b ?? r, u), () => {
        t.delete(s);
      }))
    };
  }
  function ft(t, e, a) {
    if (t.nodes) for (var s = t.nodes.start, r = t.nodes.end, i = e && (e.f & Fe) === 0 ? e.nodes.start : a; s !== null; ) {
      var o = Kn(s);
      if (i.before(s), s === r) return;
      s = o;
    }
  }
  function Ve(t, e, a) {
    e === null ? t.effect.first = a : e.next = a, a === null ? t.effect.last = e : a.prev = e;
  }
  function fs(t, e, a = false, s = false, r = false) {
    var i = t, o = "";
    ae(() => {
      var u = Ua;
      if (o !== (o = e() ?? "") && (u.nodes !== null && (Yn(u.nodes.start, u.nodes.end), u.nodes = null), o !== "")) {
        var v = a ? Zn : s ? Gn : void 0, b = Na(a ? "svg" : s ? "math" : "template", v);
        b.innerHTML = o;
        var _ = a || s ? b : b.content;
        if (nt(Xe(_), _.lastChild), a || s) for (; Xe(_); ) i.before(Xe(_));
        else i.before(_);
      }
    });
  }
  const xa = [
    ...` 	
\r\f\xA0\v\uFEFF`
  ];
  function ps(t, e, a) {
    var s = t == null ? "" : "" + t;
    if (e && (s = s ? s + " " + e : e), a) {
      for (var r of Object.keys(a)) if (a[r]) s = s ? s + " " + r : r;
      else if (s.length) for (var i = r.length, o = 0; (o = s.indexOf(r, o)) >= 0; ) {
        var u = o + i;
        (o === 0 || xa.includes(s[o - 1])) && (u === s.length || xa.includes(s[u])) ? s = (o === 0 ? "" : s.substring(0, o)) + s.substring(u + 1) : o = u;
      }
    }
    return s === "" ? null : s;
  }
  function ka(t, e = false) {
    var a = e ? " !important;" : ";", s = "";
    for (var r of Object.keys(t)) {
      var i = t[r];
      i != null && i !== "" && (s += " " + r + ": " + i + a);
    }
    return s;
  }
  function Wt(t) {
    return t[0] !== "-" || t[1] !== "-" ? t.toLowerCase() : t;
  }
  function ms(t, e) {
    if (e) {
      var a = "", s, r;
      if (Array.isArray(e) ? (s = e[0], r = e[1]) : s = e, t) {
        t = String(t).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
        var i = false, o = 0, u = false, v = [];
        s && v.push(...Object.keys(s).map(Wt)), r && v.push(...Object.keys(r).map(Wt));
        var b = 0, _ = -1;
        const S = t.length;
        for (var z = 0; z < S; z++) {
          var T = t[z];
          if (u ? T === "/" && t[z - 1] === "*" && (u = false) : i ? i === T && (i = false) : T === "/" && t[z + 1] === "*" ? u = true : T === '"' || T === "'" ? i = T : T === "(" ? o++ : T === ")" && o--, !u && i === false && o === 0) {
            if (T === ":" && _ === -1) _ = z;
            else if (T === ";" || z === S - 1) {
              if (_ !== -1) {
                var L = Wt(t.substring(b, _).trim());
                if (!v.includes(L)) {
                  T !== ";" && z++;
                  var U = t.substring(b, z).trim();
                  a += " " + U + ";";
                }
              }
              b = z + 1, _ = -1;
            }
          }
        }
      }
      return s && (a += ka(s)), r && (a += ka(r, true)), a = a.trim(), a === "" ? null : a;
    }
    return t == null ? null : String(t);
  }
  function we(t, e, a, s, r, i) {
    var o = t.__className;
    if (o !== a || o === void 0) {
      var u = ps(a, s, i);
      u == null ? t.removeAttribute("class") : t.className = u, t.__className = a;
    } else if (i && r !== i) for (var v in i) {
      var b = !!i[v];
      (r == null || b !== !!r[v]) && t.classList.toggle(v, b);
    }
    return i;
  }
  function jt(t, e = {}, a, s) {
    for (var r in a) {
      var i = a[r];
      e[r] !== i && (a[r] == null ? t.style.removeProperty(r) : t.style.setProperty(r, i, s));
    }
  }
  function It(t, e, a, s) {
    var r = t.__style;
    if (r !== e) {
      var i = ms(e, s);
      i == null ? t.removeAttribute("style") : t.style.cssText = i, t.__style = e;
    } else s && (Array.isArray(s) ? (jt(t, a?.[0], s[0]), jt(t, a?.[1], s[1], "important")) : jt(t, a, s));
    return s;
  }
  function Za(t, e, a = false) {
    if (t.multiple) {
      if (e == null) return;
      if (!Wa(e)) return Xn();
      for (var s of t.options) s.selected = e.includes(ht(s));
      return;
    }
    for (s of t.options) {
      var r = ht(s);
      if (Ja(r, e)) {
        s.selected = true;
        return;
      }
    }
    (!a || e !== void 0) && (t.selectedIndex = -1);
  }
  function hs(t) {
    var e = new MutationObserver(() => {
      Za(t, t.__value);
    });
    e.observe(t, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "value"
      ]
    }), Ha(() => {
      e.disconnect();
    });
  }
  function Yt(t, e, a = e) {
    var s = /* @__PURE__ */ new WeakSet(), r = true;
    Dt(t, "change", (i) => {
      var o = i ? "[selected]" : ":checked", u;
      if (t.multiple) u = [].map.call(t.querySelectorAll(o), ht);
      else {
        var v = t.querySelector(o) ?? t.querySelector("option:not([disabled])");
        u = v && ht(v);
      }
      a(u), je !== null && s.add(je);
    }), Fa(() => {
      var i = e();
      if (t === document.activeElement) {
        var o = $a ?? je;
        if (s.has(o)) return;
      }
      if (Za(t, i, r), r && i === void 0) {
        var u = t.querySelector(":checked");
        u !== null && (i = ht(u), a(i));
      }
      t.__value = i, r = false;
    }), hs(t);
  }
  function ht(t) {
    return "__value" in t ? t.__value : t.value;
  }
  const bs = Symbol("is custom element"), _s = Symbol("is html");
  function gs(t, e) {
    var a = Ga(t);
    a.checked !== (a.checked = e ?? void 0) && (t.checked = e);
  }
  function Ke(t, e, a, s) {
    var r = Ga(t);
    r[e] !== (r[e] = a) && (e === "loading" && (t[as] = a), a == null ? t.removeAttribute(e) : typeof a != "string" && ys(t).includes(e) ? t[e] = a : t.setAttribute(e, a));
  }
  function Ga(t) {
    return t.__attributes ??= {
      [bs]: t.nodeName.includes("-"),
      [_s]: t.namespaceURI === Qn
    };
  }
  var Sa = /* @__PURE__ */ new Map();
  function ys(t) {
    var e = t.getAttribute("is") || t.nodeName, a = Sa.get(e);
    if (a) return a;
    Sa.set(e, a = []);
    for (var s, r = t, i = Element.prototype; i !== r; ) {
      s = ts(r);
      for (var o in s) s[o].set && a.push(o);
      r = es(r);
    }
    return a;
  }
  function Se(t, e, a = e) {
    var s = /* @__PURE__ */ new WeakSet();
    Dt(t, "input", async (r) => {
      var i = r ? t.defaultValue : t.value;
      if (i = $t(t) ? Jt(i) : i, a(i), je !== null && s.add(je), await ca(), i !== (i = e())) {
        var o = t.selectionStart, u = t.selectionEnd, v = t.value.length;
        if (t.value = i ?? "", u !== null) {
          var b = t.value.length;
          o === u && u === v && b > v ? (t.selectionStart = b, t.selectionEnd = b) : (t.selectionStart = o, t.selectionEnd = Math.min(u, b));
        }
      }
    }), wt(e) == null && t.value && (a($t(t) ? Jt(t.value) : t.value), je !== null && s.add(je)), qt(() => {
      var r = e();
      if (t === document.activeElement) {
        var i = $a ?? je;
        if (s.has(i)) return;
      }
      $t(t) && r === Jt(t.value) || t.type === "date" && !r && !t.value || r !== t.value && (t.value = r ?? "");
    });
  }
  const Ft = /* @__PURE__ */ new Set();
  function Ca(t, e, a, s, r = s) {
    var i = a.getAttribute("type") === "checkbox", o = t;
    if (e !== null) for (var u of e) o = o[u] ??= [];
    o.push(a), Dt(a, "change", () => {
      var v = a.__value;
      i && (v = xs(o, v, a.checked)), r(v);
    }, () => r(i ? [] : null)), qt(() => {
      var v = s();
      i ? (v = v || [], a.checked = v.includes(a.__value)) : a.checked = Ja(a.__value, v);
    }), Ha(() => {
      var v = o.indexOf(a);
      v !== -1 && o.splice(v, 1);
    }), Ft.has(o) || (Ft.add(o), Ot(() => {
      o.sort((v, b) => v.compareDocumentPosition(b) === 4 ? -1 : 1), Ft.delete(o);
    })), Ot(() => {
    });
  }
  function ws(t, e, a = e) {
    Dt(t, "change", (s) => {
      var r = s ? t.defaultChecked : t.checked;
      a(r);
    }), wt(e) == null && a(t.checked), qt(() => {
      var s = e();
      t.checked = !!s;
    });
  }
  function xs(t, e, a) {
    for (var s = /* @__PURE__ */ new Set(), r = 0; r < t.length; r += 1) t[r].checked && s.add(t[r].__value);
    return a || s.delete(e), Array.from(s);
  }
  function $t(t) {
    var e = t.type;
    return e === "number" || e === "range";
  }
  function Jt(t) {
    return t === "" ? null : +t;
  }
  function Ea(t, e) {
    return t === e || t?.[ns] === e;
  }
  function Pt(t = {}, e, a, s) {
    return Fa(() => {
      var r, i;
      return qt(() => {
        r = i, i = [], wt(() => {
          t !== a(...i) && (e(t, ...i), r && Ea(a(...r), t) && e(null, ...r));
        });
      }), () => {
        Ot(() => {
          i && Ea(a(...i), t) && e(null, ...i);
        });
      };
    }), t;
  }
  function ks(t, e, a, s) {
    var r = s, i = true, o = () => (i && (i = false, r = s), r), u;
    u = t[e], u === void 0 && s !== void 0 && (u = o());
    var v;
    return v = () => {
      var b = t[e];
      return b === void 0 ? o() : (i = true, b);
    }, v;
  }
  function xt(t) {
    Va === null && Ka(), da(() => {
      const e = wt(t);
      if (typeof e == "function") return e;
    });
  }
  function Ss(t) {
    Va === null && Ka(), xt(() => () => wt(t));
  }
  const Cs = "5";
  typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(Cs);
  var Es = E('<header class="header glass-elevated svelte-oiwvqb"><div class="header-left svelte-oiwvqb"><button class="btn btn-ghost btn-icon" aria-label="Toggle sidebar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button> <div class="header-title svelte-oiwvqb"><h2 class="svelte-oiwvqb"> </h2></div></div> <div class="header-right svelte-oiwvqb"><div class="model-badge badge badge-primary svelte-oiwvqb"> </div> <div></div> <button class="btn btn-ghost btn-icon" aria-label="Workspace" title="Workspace"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Security" title="IronClaw Security"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Channels" title="Channels"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Personas" title="Personas"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></button> <button class="btn btn-ghost btn-icon" aria-label="MCP" title="MCP Servers"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M12 22v-6M6 12H2M22 12h-4M19.07 4.93l-3.54 3.54M8.46 15.54l-3.54 3.54M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54"></path><circle cx="12" cy="12" r="4"></circle></svg></button> <button class="btn btn-ghost btn-icon" aria-label="Settings"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg></button></div></header>');
  function As(t, e) {
    qe(e, true);
    var a = Es(), s = l(a), r = l(s), i = d(r, 2), o = l(i), u = l(o), v = d(s, 2), b = l(v), _ = l(b), z = d(b, 2);
    let T;
    var L = d(z, 2), U = d(L, 2), S = d(U, 2), p = d(S, 2), y = d(p, 2), h = d(y, 2);
    ae((w) => {
      q(u, e.sessionTitle), q(_, `${e.provider ?? ""}/${w ?? ""}`), T = we(z, 1, "status-dot svelte-oiwvqb", null, T, {
        active: e.wasmStatus
      }), Ke(z, "title", e.wasmStatus ? "WASM Ready" : "WASM Loading");
    }, [
      () => e.model.split("/").pop()
    ]), x("click", r, function(...w) {
      e.onToggleSidebar?.apply(this, w);
    }), x("click", L, function(...w) {
      e.onOpenWorkspace?.apply(this, w);
    }), x("click", U, function(...w) {
      e.onOpenSecurity?.apply(this, w);
    }), x("click", S, function(...w) {
      e.onOpenChannels?.apply(this, w);
    }), x("click", p, function(...w) {
      e.onOpenPersonas?.apply(this, w);
    }), x("click", y, function(...w) {
      e.onOpenMCP?.apply(this, w);
    }), x("click", h, function(...w) {
      e.onOpenSettings?.apply(this, w);
    }), g(t, a), Ne();
  }
  De([
    "click"
  ]);
  var zs = E('<div class="sidebar-backdrop svelte-181dlmc"></div>'), Is = E('<div role="button" tabindex="0"><div class="session-info svelte-181dlmc"><span class="session-title svelte-181dlmc"> </span> <span class="session-meta svelte-181dlmc"> </span></div> <button class="btn btn-ghost btn-icon delete-btn svelte-181dlmc" aria-label="Delete session"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div>'), Ms = E('<div class="empty-sessions svelte-181dlmc"><p>No conversations yet</p> <p class="empty-hint svelte-181dlmc">Start a new chat above</p></div>'), Os = E('<!> <aside><div class="sidebar-header svelte-181dlmc"><div class="sidebar-brand svelte-181dlmc"><span class="brand-icon svelte-181dlmc">\u{1F980}</span> <span class="brand-text svelte-181dlmc">EZ-Claw</span></div> <button class="btn btn-ghost btn-icon close-btn svelte-181dlmc" aria-label="Close sidebar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <button class="btn btn-primary new-chat-btn svelte-181dlmc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New Chat</button> <div class="sessions-list svelte-181dlmc"><!> <!></div> <div class="sidebar-footer svelte-181dlmc"><div class="version-info svelte-181dlmc"><span class="badge badge-success">WASM</span> <span class="footer-text svelte-181dlmc">Powered by ZeroClaw</span></div></div></aside>', 1);
  function Ts(t, e) {
    qe(e, true);
    function a(p) {
      const y = new Date(p), w = (/* @__PURE__ */ new Date()).getTime() - y.getTime(), D = Math.floor(w / 6e4);
      return D < 1 ? "Just now" : D < 60 ? `${D}m ago` : D < 1440 ? `${Math.floor(D / 60)}h ago` : y.toLocaleDateString();
    }
    function s(p, y = 30) {
      return p.length > y ? p.slice(0, y) + "..." : p;
    }
    var r = Os(), i = Ee(r);
    {
      var o = (p) => {
        var y = zs();
        x("click", y, function(...h) {
          e.onClose?.apply(this, h);
        }), g(p, y);
      };
      $(i, (p) => {
        e.isOpen && p(o);
      });
    }
    var u = d(i, 2);
    let v;
    var b = l(u), _ = d(l(b), 2), z = d(b, 2), T = d(z, 2), L = l(T);
    Ie(L, 17, () => e.sessions, (p) => p.id, (p, y) => {
      var h = Is();
      let w;
      var D = l(h), V = l(D), I = l(V), R = d(V, 2), X = l(R), se = d(D, 2);
      ae((Q, pe) => {
        w = we(h, 1, "session-item svelte-181dlmc", null, w, {
          active: n(y).id === e.activeSessionId
        }), q(I, Q), q(X, pe);
      }, [
        () => s(n(y).title),
        () => a(n(y).updatedAt)
      ]), x("click", h, () => e.onSelectSession(n(y).id)), x("click", se, (Q) => {
        Q.stopPropagation(), e.onDeleteSession(n(y).id);
      }), g(p, h);
    });
    var U = d(L, 2);
    {
      var S = (p) => {
        var y = Ms();
        g(p, y);
      };
      $(U, (p) => {
        e.sessions.length === 0 && p(S);
      });
    }
    ae(() => v = we(u, 1, "sidebar glass-elevated svelte-181dlmc", null, v, {
      open: e.isOpen
    })), x("click", _, function(...p) {
      e.onClose?.apply(this, p);
    }), x("click", z, function(...p) {
      e.onNewSession?.apply(this, p);
    }), g(t, r), Ne();
  }
  De([
    "click"
  ]);
  var Ps = E('<div class="avatar avatar-user svelte-izxfet">U</div>'), Ds = E('<div class="avatar avatar-assistant svelte-izxfet">\u{1F980}</div>'), qs = E('<div class="typing-indicator svelte-izxfet"><span class="svelte-izxfet"></span><span class="svelte-izxfet"></span><span class="svelte-izxfet"></span></div>'), Ns = E('<span class="cursor-blink svelte-izxfet">\u258A</span>'), Us = E("<!> <!>", 1), Rs = E('<div><div class="message-avatar svelte-izxfet"><!></div> <div class="message-body svelte-izxfet"><div class="message-role svelte-izxfet"> </div> <div class="message-content svelte-izxfet"><!></div></div></div>');
  function Aa(t, e) {
    qe(e, true);
    let a = ks(e, "isStreaming", 3, false);
    function s(y) {
      return y.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>').replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");
    }
    var r = Rs();
    let i;
    var o = l(r), u = l(o);
    {
      var v = (y) => {
        var h = Ps();
        g(y, h);
      }, b = (y) => {
        var h = Ds();
        g(y, h);
      };
      $(u, (y) => {
        e.role === "user" ? y(v) : y(b, -1);
      });
    }
    var _ = d(o, 2), z = l(_), T = l(z), L = d(z, 2), U = l(L);
    {
      var S = (y) => {
        var h = qs();
        g(y, h);
      }, p = (y) => {
        var h = Us(), w = Ee(h);
        fs(w, () => s(e.content));
        var D = d(w, 2);
        {
          var V = (I) => {
            var R = Ns();
            g(I, R);
          };
          $(D, (I) => {
            a() && I(V);
          });
        }
        g(y, h);
      };
      $(U, (y) => {
        a() && !e.content ? y(S) : y(p, -1);
      });
    }
    ae(() => {
      i = we(r, 1, "message svelte-izxfet", null, i, {
        user: e.role === "user",
        assistant: e.role === "assistant"
      }), q(T, e.role === "user" ? "You" : "EZ-Claw");
    }), g(t, r), Ne();
  }
  let Je = null;
  async function Xa() {
    if (Je) return Je;
    try {
      const t = await Tt(() => import("./ezclaw_core-BDbdbuxI.js"), [], import.meta.url);
      return await t.default(), Je = t, console.log(`[EZ-Claw] WASM loaded: ${Je.version()}`), Je;
    } catch (t) {
      throw console.error("[EZ-Claw] Failed to load WASM module:", t), t;
    }
  }
  function st() {
    if (!Je) throw new Error("WASM not initialized. Call initWasm() first.");
    return Je;
  }
  function Bs() {
    return Je !== null && Je.health_check();
  }
  const et = [
    "zerogravity",
    "ollama"
  ], Nt = [
    {
      id: "deepseek",
      name: "DeepSeek",
      defaultModel: "deepseek-chat",
      models: [
        "deepseek-chat",
        "deepseek-reasoner"
      ],
      modelLabels: [
        "DeepSeek V3",
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
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o"
      ],
      modelLabels: [
        "DeepSeek V3 (Free)",
        "DeepSeek R1 (Free)",
        "Gemini 2.0 Flash (Free)",
        "Llama 3.3 70B (Free)",
        "Qwen 2.5 72B (Free)",
        "Claude 3.5 Sonnet",
        "GPT-4o"
      ],
      free: true
    },
    {
      id: "openai",
      name: "OpenAI",
      defaultModel: "gpt-4o-mini",
      models: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo"
      ],
      free: false
    },
    {
      id: "anthropic",
      name: "Anthropic",
      defaultModel: "claude-3-5-sonnet-20241022",
      models: [
        "claude-3-5-sonnet-20241022",
        "claude-3-haiku-20240307"
      ],
      modelLabels: [
        "Claude 3.5 Sonnet",
        "Claude 3 Haiku"
      ],
      free: false
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      defaultModel: "llama3",
      models: [
        "llama3",
        "mistral",
        "codellama",
        "deepseek-coder-v2"
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
      defaultModel: "gpt-4o-mini",
      models: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-5-sonnet"
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
  function Ut(t) {
    return Nt.find((e) => e.id === t);
  }
  function Qa(t) {
    return Ut(t)?.defaultModel || "deepseek-chat";
  }
  function en(t) {
    return Ut(t)?.models || [];
  }
  function pt(t) {
    return Ut(t)?.defaultApiUrl || "";
  }
  function tn(t) {
    return Nt.some((e) => e.id === t);
  }
  function an(t, e) {
    const a = {
      "Content-Type": "application/json"
    };
    return t === "anthropic" ? (a["x-api-key"] = e, a["anthropic-version"] = "2023-06-01") : et.includes(t) || e && (a.Authorization = `Bearer ${e}`), t === "openrouter" && typeof window < "u" && (a["HTTP-Referer"] = window.location.origin, a["X-Title"] = "EZ-Claw"), a;
  }
  const Ls = Object.freeze(Object.defineProperty({
    __proto__: null,
    NO_KEY_PROVIDERS: et,
    PROVIDERS: Nt,
    buildProviderHeaders: an,
    getDefaultApiUrl: pt,
    getDefaultModel: Qa,
    getProvider: Ut,
    getValidModels: en,
    isValidProvider: tn
  }, Symbol.toStringTag, {
    value: "Module"
  })), Zt = (t, e) => e.some((a) => t instanceof a);
  let za, Ia;
  function Ws() {
    return za || (za = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function js() {
    return Ia || (Ia = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  const Gt = /* @__PURE__ */ new WeakMap(), Ht = /* @__PURE__ */ new WeakMap(), Rt = /* @__PURE__ */ new WeakMap();
  function Fs(t) {
    const e = new Promise((a, s) => {
      const r = () => {
        t.removeEventListener("success", i), t.removeEventListener("error", o);
      }, i = () => {
        a(tt(t.result)), r();
      }, o = () => {
        s(t.error), r();
      };
      t.addEventListener("success", i), t.addEventListener("error", o);
    });
    return Rt.set(e, t), e;
  }
  function $s(t) {
    if (Gt.has(t)) return;
    const e = new Promise((a, s) => {
      const r = () => {
        t.removeEventListener("complete", i), t.removeEventListener("error", o), t.removeEventListener("abort", o);
      }, i = () => {
        a(), r();
      }, o = () => {
        s(t.error || new DOMException("AbortError", "AbortError")), r();
      };
      t.addEventListener("complete", i), t.addEventListener("error", o), t.addEventListener("abort", o);
    });
    Gt.set(t, e);
  }
  let Xt = {
    get(t, e, a) {
      if (t instanceof IDBTransaction) {
        if (e === "done") return Gt.get(t);
        if (e === "store") return a.objectStoreNames[1] ? void 0 : a.objectStore(a.objectStoreNames[0]);
      }
      return tt(t[e]);
    },
    set(t, e, a) {
      return t[e] = a, true;
    },
    has(t, e) {
      return t instanceof IDBTransaction && (e === "done" || e === "store") ? true : e in t;
    }
  };
  function nn(t) {
    Xt = t(Xt);
  }
  function Js(t) {
    return js().includes(t) ? function(...e) {
      return t.apply(Qt(this), e), tt(this.request);
    } : function(...e) {
      return tt(t.apply(Qt(this), e));
    };
  }
  function Hs(t) {
    return typeof t == "function" ? Js(t) : (t instanceof IDBTransaction && $s(t), Zt(t, Ws()) ? new Proxy(t, Xt) : t);
  }
  function tt(t) {
    if (t instanceof IDBRequest) return Fs(t);
    if (Ht.has(t)) return Ht.get(t);
    const e = Hs(t);
    return e !== t && (Ht.set(t, e), Rt.set(e, t)), e;
  }
  const Qt = (t) => Rt.get(t);
  function Vs(t, e, { blocked: a, upgrade: s, blocking: r, terminated: i } = {}) {
    const o = indexedDB.open(t, e), u = tt(o);
    return s && o.addEventListener("upgradeneeded", (v) => {
      s(tt(o.result), v.oldVersion, v.newVersion, tt(o.transaction), v);
    }), a && o.addEventListener("blocked", (v) => a(v.oldVersion, v.newVersion, v)), u.then((v) => {
      i && v.addEventListener("close", () => i()), r && v.addEventListener("versionchange", (b) => r(b.oldVersion, b.newVersion, b));
    }).catch(() => {
    }), u;
  }
  const Ks = [
    "get",
    "getKey",
    "getAll",
    "getAllKeys",
    "count"
  ], Ys = [
    "put",
    "add",
    "delete",
    "clear"
  ], Vt = /* @__PURE__ */ new Map();
  function Ma(t, e) {
    if (!(t instanceof IDBDatabase && !(e in t) && typeof e == "string")) return;
    if (Vt.get(e)) return Vt.get(e);
    const a = e.replace(/FromIndex$/, ""), s = e !== a, r = Ys.includes(a);
    if (!(a in (s ? IDBIndex : IDBObjectStore).prototype) || !(r || Ks.includes(a))) return;
    const i = async function(o, ...u) {
      const v = this.transaction(o, r ? "readwrite" : "readonly");
      let b = v.store;
      return s && (b = b.index(u.shift())), (await Promise.all([
        b[a](...u),
        r && v.done
      ]))[0];
    };
    return Vt.set(e, i), i;
  }
  nn((t) => ({
    ...t,
    get: (e, a, s) => Ma(e, a) || t.get(e, a, s),
    has: (e, a) => !!Ma(e, a) || t.has(e, a)
  }));
  const Zs = [
    "continue",
    "continuePrimaryKey",
    "advance"
  ], Oa = {}, ea = /* @__PURE__ */ new WeakMap(), sn = /* @__PURE__ */ new WeakMap(), Gs = {
    get(t, e) {
      if (!Zs.includes(e)) return t[e];
      let a = Oa[e];
      return a || (a = Oa[e] = function(...s) {
        ea.set(this, sn.get(this)[e](...s));
      }), a;
    }
  };
  async function* Xs(...t) {
    let e = this;
    if (e instanceof IDBCursor || (e = await e.openCursor(...t)), !e) return;
    e = e;
    const a = new Proxy(e, Gs);
    for (sn.set(a, e), Rt.set(a, Qt(e)); e; ) yield a, e = await (ea.get(a) || e.continue()), ea.delete(a);
  }
  function Ta(t, e) {
    return e === Symbol.asyncIterator && Zt(t, [
      IDBIndex,
      IDBObjectStore,
      IDBCursor
    ]) || e === "iterate" && Zt(t, [
      IDBIndex,
      IDBObjectStore
    ]);
  }
  nn((t) => ({
    ...t,
    get(e, a, s) {
      return Ta(e, a) ? Xs : t.get(e, a, s);
    },
    has(e, a) {
      return Ta(e, a) || t.has(e, a);
    }
  }));
  const Qs = "ezclaw", er = 1, _t = "sessions", gt = "config", Pa = "secrets";
  let ta = null;
  async function rn() {
    ta = await Vs(Qs, er, {
      upgrade(t) {
        t.objectStoreNames.contains(_t) || t.createObjectStore(_t, {
          keyPath: "id"
        }).createIndex("updatedAt", "updatedAt"), t.objectStoreNames.contains(gt) || t.createObjectStore(gt, {
          keyPath: "key"
        }), t.objectStoreNames.contains(Pa) || t.createObjectStore(Pa, {
          keyPath: "key"
        });
      }
    });
  }
  function ot() {
    if (!ta) throw new Error("Storage not initialized. Call initStorage() first.");
    return ta;
  }
  async function ua(t) {
    t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await ot().put(_t, t);
  }
  async function on(t) {
    return ot().get(_t, t);
  }
  async function va() {
    return (await ot().getAll(_t)).sort((e, a) => new Date(a.updatedAt).getTime() - new Date(e.updatedAt).getTime());
  }
  async function ze(t, e) {
    await ot().put(gt, {
      key: t,
      value: e
    });
  }
  async function Re(t) {
    return (await ot().get(gt, t))?.value;
  }
  async function ln() {
    const t = await ot().getAll(gt), e = {};
    for (const a of t) e[a.key] = a.value;
    return e;
  }
  async function cn() {
    const t = await va(), e = await ln();
    return JSON.stringify({
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sessions: t,
      config: e
    }, null, 2);
  }
  async function dn(t) {
    const e = JSON.parse(t);
    let a = 0;
    if (e.sessions && Array.isArray(e.sessions)) for (const s of e.sessions) await ua(s), a++;
    if (e.config && typeof e.config == "object") for (const [s, r] of Object.entries(e.config)) await ze(s, r);
    return a;
  }
  const tr = Object.freeze(Object.defineProperty({
    __proto__: null,
    exportAllData: cn,
    getAllConfig: ln,
    getAllSessions: va,
    getConfig: Re,
    getSession: on,
    importData: dn,
    initStorage: rn,
    saveConfig: ze,
    saveSession: ua
  }, Symbol.toStringTag, {
    value: "Module"
  }));
  let Ye = null;
  async function aa() {
    try {
      const t = await un({
        locateFile: (s) => `https://sql.js.org/dist/${s}`
      });
      Ye = new t.Database();
      const a = st().memory_create_table_sql();
      Ye.run(a), console.log("[EZ-Claw] Memory system initialized (sql.js + WASM scoring)");
    } catch (t) {
      console.warn("[EZ-Claw] Memory init failed (non-fatal):", t), Ye = null;
    }
  }
  async function un(t) {
    const e = await Tt(() => import("./sql-wasm-browser-Wh5-jBH4.js").then((a) => a.s), [], import.meta.url);
    if (e.default) return e.default(t);
    if (e.initSqlJs) return e.initSqlJs(t);
    throw new Error("sql.js initialization function not found");
  }
  async function ar(t) {
    const e = await un({
      locateFile: (a) => `https://sql.js.org/dist/${a}`
    });
    Ye = new e.Database(t), console.log("[EZ-Claw] Memory loaded from saved data");
  }
  function nr() {
    return Ye ? Ye.export() : null;
  }
  function vn() {
    if (!Ye) throw new Error("Memory not initialized. Call initMemory() first.");
    return Ye;
  }
  function We(t, e, a = "core", s = "") {
    st();
    const r = crypto.randomUUID(), i = (/* @__PURE__ */ new Date()).toISOString();
    vn().run("INSERT OR REPLACE INTO memories (id, key, content, category, timestamp, session_id) VALUES (?, ?, ?, ?, ?, ?)", [
      r,
      t,
      e,
      a,
      i,
      s || null
    ]);
  }
  function yt(t, e = 5, a = "") {
    const s = st(), r = vn();
    let i;
    if (a) {
      const u = r.exec("SELECT id, key, content, category, timestamp, session_id FROM memories WHERE session_id = ? ORDER BY timestamp DESC", [
        a
      ]);
      i = Da(u);
    } else {
      const u = r.exec("SELECT id, key, content, category, timestamp, session_id FROM memories ORDER BY timestamp DESC");
      i = Da(u);
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
  function Da(t) {
    if (t.length === 0) return [];
    const e = t[0].columns;
    return t[0].values.map((a) => {
      const s = {};
      for (let r = 0; r < e.length; r++) s[e[r]] = a[r];
      return s;
    });
  }
  const fn = "ezclaw_identity", pn = "ezclaw_user", sr = `You're not a chatbot. You're becoming someone.

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
- Not a corporate drone. Not a sycophant. Just\u2026 good.`, na = {
    name: "",
    creature: "AI agent",
    vibe: "warm, curious, helpful",
    emoji: "\u{1F980}",
    personality: sr,
    instructions: "",
    facts: {},
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    bootstrapped: false
  }, sa = {
    name: "",
    callAs: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: ""
  };
  function Pe() {
    try {
      const t = localStorage.getItem(fn);
      if (t) return {
        ...na,
        ...JSON.parse(t)
      };
    } catch {
    }
    return {
      ...na
    };
  }
  function lt(t) {
    t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), localStorage.setItem(fn, JSON.stringify(t));
  }
  function at() {
    try {
      const t = localStorage.getItem(pn);
      if (t) return {
        ...sa,
        ...JSON.parse(t)
      };
    } catch {
    }
    return {
      ...sa
    };
  }
  function fa(t) {
    localStorage.setItem(pn, JSON.stringify(t));
  }
  function ra() {
    const t = Pe();
    return !t.bootstrapped && !t.name;
  }
  function mn() {
    const t = Pe();
    t.bootstrapped = true, lt(t);
  }
  function hn() {
    const t = Pe(), e = at(), a = [];
    t.personality && a.push(t.personality), t.name && (a.push(`
## Your Identity`), a.push(`- Name: ${t.name}`), t.creature && t.creature !== "AI agent" && a.push(`- Creature: ${t.creature}`), t.vibe && a.push(`- Vibe: ${t.vibe}`), t.emoji && a.push(`- Emoji: ${t.emoji}`));
    const s = Object.entries(t.facts);
    if (s.length > 0) {
      a.push(`
## Things You Know About Yourself`);
      for (const [r, i] of s) a.push(`- ${r}: ${i}`);
    }
    return e.name && (a.push(`
## About Your Human`), a.push(`- Name: ${e.name}`), e.callAs && a.push(`- Call them: ${e.callAs}`), e.timezone && a.push(`- Timezone: ${e.timezone}`), e.notes && a.push(`- Notes: ${e.notes}`)), t.instructions && a.push(`
## User Instructions
${t.instructions}`), a.join(`
`);
  }
  function bn() {
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
  const _n = "ezclaw_personas", pa = "ezclaw_active_persona";
  function He() {
    try {
      const t = localStorage.getItem(_n);
      if (t) return JSON.parse(t);
    } catch {
    }
    return [];
  }
  function kt(t) {
    localStorage.setItem(_n, JSON.stringify(t));
  }
  function rt() {
    return localStorage.getItem(pa);
  }
  function ma(t, e = false) {
    const s = {
      id: crypto.randomUUID(),
      label: t,
      identity: e ? {
        ...Pe()
      } : {
        ...na
      },
      user: e ? {
        ...at()
      } : {
        ...sa
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }, r = He();
    return r.push(s), kt(r), s;
  }
  function rr(t) {
    return ma(t, true);
  }
  function gn(t) {
    const e = He(), a = e.find((r) => r.id === t);
    if (!a) return false;
    const s = rt();
    if (s) {
      const r = e.find((i) => i.id === s);
      r && (r.identity = Pe(), r.user = at(), kt(e));
    }
    return lt(a.identity), fa(a.user), localStorage.setItem(pa, t), true;
  }
  function yn(t) {
    const e = He(), a = e.findIndex((s) => s.id === t);
    return a === -1 ? false : (e.splice(a, 1), kt(e), rt() === t && localStorage.removeItem(pa), true);
  }
  function wn(t, e) {
    const a = He(), s = a.find((r) => r.id === t);
    return s ? (s.label = e, kt(a), true) : false;
  }
  function xn() {
    return JSON.stringify({
      version: 1,
      activeIdentity: Pe(),
      activeUser: at(),
      activePersonaId: rt(),
      personas: He(),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2);
  }
  function kn(t) {
    const e = JSON.parse(t);
    if (!e.version || !e.personas) throw new Error("Invalid persona export file");
    const a = He(), s = new Set(a.map((i) => i.id));
    let r = 0;
    for (const i of e.personas) s.has(i.id) || (a.push(i), r++);
    return kt(a), e.activeIdentity && !Pe().name && lt(e.activeIdentity), e.activeUser && !at().name && fa(e.activeUser), r;
  }
  const St = [
    "HOME=/",
    "USER=ezclaw",
    "PATH=/usr/local/bin:/usr/bin:/bin",
    "PWD=/workspace",
    "TERM=xterm-256color"
  ];
  class it {
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
      const a = new it(), s = await fetch(e);
      if (!s.ok) throw new Error(`Failed to fetch WASM: ${s.status} ${s.statusText}`);
      const r = await s.arrayBuffer();
      return a.module = await WebAssembly.compile(r), a;
    }
    static async fromBuffer(e) {
      const a = new it();
      return a.module = await WebAssembly.compile(e), a;
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
      const a = this.textEncoder, s = this.textDecoder, r = {
        wasi_snapshot_preview1: {
          proc_exit: (i) => {
            throw new Error(`Process exited with code ${i}`);
          },
          fd_write: (i, o, u, v) => {
            if (!this.memory) return 1;
            const b = new DataView(this.memory.buffer);
            let _ = 0;
            for (let z = 0; z < u; z++) {
              const T = b.getUint32(o + z * 8, true), L = b.getUint32(o + z * 8 + 4, true), U = new Uint8Array(this.memory.buffer, T, L), S = s.decode(U);
              i === 1 ? this.stdout += S : i === 2 && (this.stderr += S), _ += L;
            }
            return b.setUint32(v, _, true), 0;
          },
          fd_read: (i, o, u, v) => {
            if (!this.memory) return 1;
            if (i !== 0) return 8;
            const b = new DataView(this.memory.buffer), _ = this.stdinBuffer || `
`, z = a.encode(_);
            let T = 0;
            for (let L = 0; L < u && T < z.length; L++) {
              const U = b.getUint32(o + L * 8, true), S = b.getUint32(o + L * 8 + 4, true), p = z.slice(T, T + S);
              new Uint8Array(this.memory.buffer, U, p.length).set(p), T += p.length;
            }
            return b.setUint32(v, T, true), this.stdinBuffer = "", 0;
          },
          environ_get: (i, o) => {
            if (!this.memory) return 1;
            const u = new DataView(this.memory.buffer);
            let v = o;
            for (let b = 0; b < St.length; b++) {
              const _ = a.encode(St[b] + "\0");
              u.setUint32(i + b * 4, v, true), new Uint8Array(this.memory.buffer, v, _.length).set(_), v += _.length;
            }
            return 0;
          },
          environ_sizes_get: (i, o) => {
            if (!this.memory) return 1;
            const u = new DataView(this.memory.buffer);
            u.setUint32(i, St.length, true);
            const v = St.reduce((b, _) => b + _.length + 1, 0);
            return u.setUint32(o, v, true), 0;
          },
          fd_prestat_get: (i, o) => 8,
          fd_prestat_dir_name: (i, o, u) => 8,
          path_open: (i, o, u, v, b, _, z) => 8,
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
    async run(e, a = [], s = {}) {
      if (this.stdout = "", this.stderr = "", !this.ready) throw new Error("Container not initialized");
      const r = [
        e,
        ...a
      ], i = r[0], o = r.slice(1);
      if (!this.instance || !this.memory) return this.fallbackExecute(i, o);
      try {
        const u = this.instance.exports, v = u.memory, b = [
          e,
          ...a
        ], _ = b.join("\0") + "\0", z = Object.entries(s).map(([p, y]) => `${p}=${y}`).join("\0") + "\0", T = u.malloc(_.length), L = u.malloc(z.length);
        new Uint8Array(v.buffer, T, _.length).set(this.textEncoder.encode(_)), new Uint8Array(v.buffer, L, z.length).set(this.textEncoder.encode(z));
        const U = u.malloc(b.length * 4), S = new DataView(v.buffer);
        for (let p = 0; p < b.length; p++) S.setUint32(U + p * 4, T + (p === 0 ? 0 : b.slice(0, p).join("\0").length + 1), true);
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
    fallbackExecute(e, a) {
      let s = "", r = "", i = 0;
      switch (e) {
        case "ls":
          s = this.listMountedDirs();
          break;
        case "pwd":
          s = `/workspace
`;
          break;
        case "echo":
          s = a.join(" ") + `
`;
          break;
        case "whoami":
          s = `ezclaw
`;
          break;
        case "uname":
          s = `EZ-Claw WASI ${this.osInfo}
`;
          break;
        case "date":
          s = (/* @__PURE__ */ new Date()).toISOString() + `
`;
          break;
        case "env":
          s = `HOME=/
USER=ezclaw
PATH=/usr/local/bin:/usr/bin:/bin
PWD=/workspace
TERM=xterm-256color
`;
          break;
        case "cat":
          a.length === 0 ? (r = `cat: missing operand
`, i = 1) : s = `[Use read_file tool for workspace files: ${a[0]}]
`;
          break;
        case "sh":
        case "bash":
          s = a.join(" ") + `
`;
          break;
        case "id":
          s = `uid=0(root) gid=0(root) groups=0(root)
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
    listMountedDirs() {
      if (this.mounts.size === 0) return `drwxr-xr-x   1 ezclaw ezclaw  4096 .
`;
      let e = `drwxr-xr-x   1 ezclaw ezclaw  4096 .
drwxr-xr-x   1 ezclaw ezclaw  4096 ..
`;
      for (const [a] of this.mounts) e += `drwxr-xr-x   1 ezclaw ezclaw  4096 ${a}
`;
      return e;
    }
    getHelp() {
      return `EZ-Claw WASI Container - Available Commands:
  ls, pwd, echo, whoami, uname, date, env, cat, id, hostname, arch, help

  Workspace tools (use instead of shell):
    read_file, write_file, list_dir

  For full shell access, use CheerpX or Native CLI tier.
`;
    }
    async mount(e, a) {
      this.mounts.set(e, a);
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
  async function ir() {
    if ("userAgentData" in navigator) try {
      return (await navigator.userAgentData.getHighEntropyValues([
        "architecture"
      ])).architecture === "arm" ? "arm64" : "amd64";
    } catch {
    }
    const t = navigator.userAgent;
    if (t.includes("aarch64") || t.includes("arm64") || t.includes("Arm64")) return "arm64";
    if (t.includes("Mac") && typeof navigator.platform == "string") try {
      const a = document.createElement("canvas").getContext("webgl");
      if (a) {
        const s = a.getExtension("WEBGL_debug_renderer_info");
        if (s) {
          const r = a.getParameter(s.UNMASKED_RENDERER_WEBGL);
          if (typeof r == "string" && r.includes("Apple")) return "arm64";
        }
      }
    } catch {
    }
    return "amd64";
  }
  let Ct = null;
  async function Sn() {
    return Ct || (Ct = new it(), await Ct.start()), Ct;
  }
  async function or(t, e, a, s) {
    const r = performance.now();
    let i;
    try {
      i = JSON.parse(a.arguments);
    } catch {
      return {
        call_id: a.id,
        success: false,
        output: "",
        error: `Invalid tool arguments: ${a.arguments}`,
        duration_ms: 0
      };
    }
    const o = i.url || "", u = t.check_tool_security(a.name, a.arguments, o), v = JSON.parse(u);
    if (!v.approved && !v.needs_confirmation) return {
      call_id: a.id,
      success: false,
      output: "",
      error: `Security: ${v.rejection_reason || "Denied"}`,
      duration_ms: performance.now() - r
    };
    v.needs_confirmation;
    let b;
    try {
      b = await lr(a.name, i, e, v);
    } catch (T) {
      return {
        call_id: a.id,
        success: false,
        output: "",
        error: T.message || String(T),
        duration_ms: performance.now() - r
      };
    }
    const _ = t.secure_tool_response(a.name, b), z = JSON.parse(_);
    return z.warnings?.length && console.warn("[EZ-Claw Security]", z.warnings), {
      call_id: a.id,
      success: true,
      output: z.output || b,
      duration_ms: performance.now() - r
    };
  }
  async function lr(t, e, a, s) {
    switch (t) {
      case "web_search":
        return await cr(e.query, e.max_results || 5, s);
      case "web_fetch":
        return await dr(e.url, s);
      case "read_file":
        return ur(a, e.path);
      case "write_file":
        return vr(a, e.path, e.content);
      case "list_dir":
        return fr(a, e.path || "/");
      case "memory_store": {
        const r = e.key || `mem-${Date.now()}`, i = e.content || e.value || "", o = e.category || "core";
        try {
          return We(r, i, o), `Memory stored: key="${r}", category="${o}", content="${i.slice(0, 100)}..."}`;
        } catch (u) {
          return `Memory store failed: ${u.message}`;
        }
      }
      case "memory_recall": {
        const r = e.query || "", i = e.limit || 5;
        try {
          const o = yt(r, i);
          return o.length === 0 ? `No memories found for: "${r}"` : o.map((u) => `[${u.category}] ${u.key}: ${u.content} (score: ${(u.score || 0).toFixed(2)})`).join(`
`);
        } catch (o) {
          return `Memory recall failed: ${o.message}`;
        }
      }
      case "update_identity": {
        const r = Pe();
        e.name && (r.name = e.name, r.facts.name = e.name), e.personality && (r.personality = e.personality), e.instructions && (r.instructions = e.instructions), e.fact_key && e.fact_value && (r.facts[e.fact_key] = e.fact_value), lt(r);
        try {
          e.name && We("identity_name", `My name is ${e.name}`, "identity"), e.fact_key && We(`identity_${e.fact_key}`, e.fact_value, "identity");
        } catch {
        }
        return `Identity updated: ${JSON.stringify(r, null, 2)}`;
      }
      case "shell_exec":
        return await pr(e.command, e.args, e.cwd);
      case "run_shell_command":
        return await mr(e.command, e.args, e.env);
      default:
        throw new Error(`Unknown tool: ${t}`);
    }
  }
  async function cr(t, e, a) {
    const s = `https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`;
    a.credential_mapping && a.credential_mapping.inject_type;
    const r = await fetch(s);
    if (!r.ok) throw new Error(`Search failed: ${r.status} ${r.statusText}`);
    const i = await r.json(), o = [];
    if (i.Abstract && o.push(`**Summary**: ${i.Abstract}
Source: ${i.AbstractURL}`), i.RelatedTopics) for (const u of i.RelatedTopics.slice(0, e)) u.Text && o.push(`- ${u.Text}${u.FirstURL ? ` (${u.FirstURL})` : ""}`);
    return o.length === 0 ? `No results found for: "${t}"` : o.join(`

`);
  }
  async function dr(t, e) {
    const a = {};
    e.credential_mapping && e.credential_mapping.inject_type;
    const s = await fetch(t, {
      headers: a
    });
    if (!s.ok) throw new Error(`Fetch failed: ${s.status} ${s.statusText}`);
    if ((s.headers.get("content-type") || "").includes("application/json")) {
      const u = await s.json();
      return JSON.stringify(u, null, 2).slice(0, 1e4);
    }
    return (await s.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1e4);
  }
  function ur(t, e) {
    try {
      return t.read_file(e);
    } catch (a) {
      throw new Error(`read_file: ${a.message || a}`);
    }
  }
  function vr(t, e, a) {
    try {
      return t.write_file(e, a), `File written: ${e} (${a.length} bytes)`;
    } catch (s) {
      throw new Error(`write_file: ${s.message || s}`);
    }
  }
  function fr(t, e) {
    const a = t.list_dir(e), s = JSON.parse(a);
    if (s.error) throw new Error(`list_dir: ${s.error}`);
    return s.length === 0 ? "(empty directory)" : s.map((r) => `${r.is_dir ? "\u{1F4C1}" : "\u{1F4C4}"} ${r.name}${r.is_dir ? "/" : ` (${r.size}b)`}`).join(`
`);
  }
  async function pr(t, e = [], a = "/workspace") {
    try {
      const r = await (await Sn()).run(t, e);
      return Cn(r);
    } catch (s) {
      return `Shell execution error: ${s.message}`;
    }
  }
  async function mr(t, e = [], a = {}) {
    try {
      const s = await Sn(), r = e.length > 0 ? `${t} ${e.join(" ")}` : t, i = await s.run(t, e, a);
      return Cn(i);
    } catch (s) {
      return `Shell execution error: ${s.message}`;
    }
  }
  function Cn(t) {
    let e = "";
    return t.stdout && (e += t.stdout), t.stderr && (e += (e ? `
` : "") + `[stderr] ${t.stderr}`), e += (e ? `
` : "") + `[exit code: ${t.exit_code}]`, e;
  }
  const hr = {
    tier: "wasi",
    enabled: false,
    timeoutMs: 3e4,
    maxOutputBytes: 1e5,
    cwd: "/"
  };
  class br {
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
      const e = await ir(), a = new it();
      try {
        const s = `/containers/alpine-${e}.wasm`, r = await it.load(s);
        return await r.start(), console.log("[WASI] Container loaded successfully"), r;
      } catch (s) {
        return console.warn("[WASI] Failed to load WASM, using fallback shell:", s), await a.start(), a;
      }
    }
    async execute(e) {
      const a = performance.now();
      try {
        const r = await (await this.getContainer()).run(e);
        return {
          exitCode: r.exit_code,
          stdout: r.stdout.slice(0, this.config.maxOutputBytes),
          stderr: r.stderr.slice(0, this.config.maxOutputBytes),
          durationMs: performance.now() - a,
          timedOut: false,
          truncated: r.stdout.length > this.config.maxOutputBytes
        };
      } catch (s) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: s.message,
          durationMs: performance.now() - a,
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
  class _r {
    config;
    vm = null;
    constructor(e) {
      this.config = e;
    }
    async initialize() {
      try {
        console.log("[EZ-Claw] CheerpX sandbox initialized (placeholder)");
      } catch (e) {
        throw console.error("[EZ-Claw] CheerpX not available:", e), new Error("CheerpX not available on this platform");
      }
    }
    async execute(e) {
      const a = performance.now();
      if (!this.vm) return {
        exitCode: 1,
        stdout: "",
        stderr: `CheerpX VM not initialized. Run initialize() first.
Note: CheerpX requires desktop browser (no iOS JIT support).
`,
        durationMs: performance.now() - a,
        timedOut: false,
        truncated: false
      };
      try {
        return {
          exitCode: 0,
          stdout: `[CheerpX] Would execute: ${e}
`,
          stderr: "",
          durationMs: performance.now() - a,
          timedOut: false,
          truncated: false
        };
      } catch (s) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: s.message,
          durationMs: performance.now() - a,
          timedOut: false,
          truncated: false
        };
      }
    }
  }
  class gr {
    config;
    ws = null;
    pendingCommands = /* @__PURE__ */ new Map();
    constructor(e) {
      this.config = e;
    }
    async connect() {
      const e = this.config.companionUrl || "ws://localhost:9229";
      return new Promise((a, s) => {
        this.ws = new WebSocket(e), this.ws.onopen = () => {
          console.log("[EZ-Claw] Connected to native CLI companion"), a();
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
      const a = crypto.randomUUID();
      return new Promise((s) => {
        const r = window.setTimeout(() => {
          this.pendingCommands.delete(a), s({
            exitCode: 124,
            stdout: "",
            stderr: `Command timed out after ${this.config.timeoutMs}ms`,
            durationMs: this.config.timeoutMs,
            timedOut: true,
            truncated: false
          });
        }, this.config.timeoutMs);
        this.pendingCommands.set(a, {
          resolve: s,
          timeout: r
        }), this.ws.send(JSON.stringify({
          id: a,
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
  class ha {
    config;
    wasi;
    cheerpx;
    native;
    outputListeners = [];
    constructor(e = {}) {
      this.config = {
        ...hr,
        ...e
      }, this.wasi = new br(this.config), this.cheerpx = new _r(this.config), this.native = new gr(this.config);
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
    emit(e) {
      for (const a of this.outputListeners) a(e);
    }
    async execute(e) {
      this.emit(`$ ${e}
`);
      let a;
      switch (this.config.tier) {
        case "wasi":
          a = await this.wasi.execute(e);
          break;
        case "cheerpx":
          a = await this.cheerpx.execute(e);
          break;
        case "native":
          a = await this.native.execute(e);
          break;
      }
      return a.stdout && this.emit(a.stdout), a.stderr && this.emit(`\x1B[31m${a.stderr}\x1B[0m`), a;
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
    async initCheerpX() {
      await this.cheerpx.initialize();
    }
    getStatus() {
      switch (this.config.tier) {
        case "wasi":
          return {
            tier: "wasi",
            available: true,
            info: "WASI sandbox (basic commands)"
          };
        case "cheerpx":
          return {
            tier: "cheerpx",
            available: false,
            info: "CheerpX (desktop only, requires init)"
          };
        case "native":
          return {
            tier: "native",
            available: this.native.isConnected,
            info: this.native.isConnected ? "Connected to companion" : "Not connected"
          };
      }
    }
    async mountWorkspace(e) {
      this.config.tier === "wasi" && await this.wasi.mountWorkspace(e);
    }
    getContainerInfo() {
      return this.config.tier === "wasi" ? this.wasi.getContainerInfo?.() : null;
    }
  }
  var yr = E('<div class="empty-state svelte-xdaci2"><div class="empty-icon svelte-xdaci2">\u{1F980}</div> <h2 class="svelte-xdaci2">Welcome to EZ-Claw</h2> <p class="svelte-xdaci2">ZeroClaw running in your browser via WebAssembly</p> <div class="quick-prompts svelte-xdaci2"><button class="quick-prompt svelte-xdaci2">\u{1F4A1} Write a Python function</button> <button class="quick-prompt svelte-xdaci2">\u{1F4DA} Explain WASM</button> <button class="quick-prompt svelte-xdaci2">\u{1F50D} Debug code</button></div></div>'), wr = E('<div class="tool-activity svelte-xdaci2"><span class="tool-spinner svelte-xdaci2"></span> <span> </span></div>'), xr = E('<div class="spinner svelte-xdaci2"></div>'), kr = ls('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'), Sr = E('<div class="chat-area svelte-xdaci2"><div class="messages-container svelte-xdaci2"><!> <!> <!> <!></div> <div class="input-area glass-elevated svelte-xdaci2"><div class="input-wrapper svelte-xdaci2"><textarea class="chat-input svelte-xdaci2" placeholder="Message EZ-Claw..." rows="1"></textarea> <button class="send-btn svelte-xdaci2" aria-label="Send message"><!></button></div> <div class="input-footer svelte-xdaci2"><span> </span></div></div></div>');
  function Cr(t, e) {
    qe(e, true);
    let a = null;
    function s() {
      return a || (a = new ha({
        tier: "wasi",
        enabled: true
      })), a;
    }
    let r = null;
    function i() {
      return r || (r = new (st()).WasmWorkspace()), r;
    }
    let o = O(Ce([])), u = O(""), v = O(false), b = O(""), _ = O(""), z = O(void 0), T = O(void 0);
    da(() => {
      e.sessionId ? (c(b, ""), c(v, false), c(_, ""), L(e.sessionId)) : c(o, [], true);
    });
    async function L(f) {
      try {
        const m = await on(f);
        m && m.messages ? (c(o, m.messages, true), await U()) : c(o, [], true);
      } catch {
        c(o, [], true);
      }
    }
    async function U() {
      await ca(), n(z) && (n(z).scrollTop = n(z).scrollHeight);
    }
    async function S() {
      const f = n(u).trim();
      if (!(!f || n(v))) {
        if (!e.apiKey && !et.includes(e.provider)) {
          c(o, [
            ...n(o),
            {
              role: "assistant",
              content: "\u26A0\uFE0F **No API key configured.** Please open Settings and enter your API key to start chatting."
            }
          ], true);
          return;
        }
        c(o, [
          ...n(o),
          {
            role: "user",
            content: f
          }
        ], true), c(u, ""), c(v, true), c(b, ""), c(_, ""), await U();
        try {
          const m = st();
          let k = hn();
          ra() && (k += `

` + bn());
          let M = [];
          try {
            M = yt(f, 5).map((j) => `[${j.category}] ${j.key}: ${j.content}`);
          } catch {
          }
          const B = n(o).filter((A) => A && A.role && A.content), K = new m.WasmAgent(JSON.stringify({
            default_provider: e.provider,
            default_model: e.model,
            default_temperature: e.temperature
          })), H = K.build_messages(JSON.stringify(B), JSON.stringify(M), k, (/* @__PURE__ */ new Date()).toLocaleString());
          K.free();
          const ue = new m.WasmToolRegistry(), he = ue.to_llm_json();
          console.log("[EZ-Claw] Tools JSON:", he.slice(0, 500)), ue.free();
          const be = {
            provider: e.provider,
            apiKey: e.apiKey,
            model: e.model,
            temperature: e.temperature,
            apiUrl: e.apiUrl || void 0
          };
          let ge = JSON.parse(H), de = 10;
          for (let A = 0; A < de; A++) {
            c(_, A > 0 ? "Thinking..." : "", true);
            const j = m.build_provider_request_with_tools(JSON.stringify(ge), e.model, e.temperature, false, he), ie = `${e.apiUrl || m.provider_base_url(e.provider)}/chat/completions`, ve = an(e.provider, e.apiKey), ye = await fetch(ie, {
              method: "POST",
              headers: ve,
              body: j
            });
            if (!ye.ok) {
              const G = await ye.text();
              throw new Error(`API error ${ye.status}: ${G}`);
            }
            const C = (await ye.json()).choices?.[0];
            if (!C) throw new Error("No response from model");
            const Y = C.message;
            if (console.log("[EZ-Claw] Response:", JSON.stringify(Y)), Y.tool_calls && Y.tool_calls.length > 0) {
              console.log("[EZ-Claw] Tool calls detected:", Y.tool_calls), ge.push(Y);
              for (const G of Y.tool_calls) {
                const _e = G.function?.name || G.name || "unknown", Ae = G.function?.arguments || G.arguments || "{}", xe = G.id || crypto.randomUUID();
                c(_, `\u{1F527} Running: ${_e}...`), await U();
                let Le;
                try {
                  const $e = JSON.parse(Ae);
                  console.log("[EZ-Claw] Executing tool:", _e, $e), Le = await p(_e, $e), console.log("[EZ-Claw] Tool result:", Le.slice(0, 200));
                } catch ($e) {
                  Le = `Error: ${$e.message}`;
                }
                ge.push({
                  role: "tool",
                  tool_call_id: xe,
                  content: Le
                });
              }
              continue;
            }
            const fe = Y.content || "";
            if (c(o, [
              ...n(o),
              {
                role: "assistant",
                content: fe
              }
            ], true), c(_, ""), c(v, false), c(b, ""), e.sessionId) {
              const G = {
                id: e.sessionId,
                title: y(n(o)),
                messages: n(o).map((_e) => ({
                  role: _e.role,
                  content: _e.content
                })),
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
                model: e.model,
                provider: e.provider
              };
              await ua(G), e.onSessionUpdate(G);
            }
            try {
              We(`chat-${Date.now()}`, `User: ${f}
Assistant: ${fe.slice(0, 200)}`, "conversation", e.sessionId || "");
            } catch {
            }
            await U();
            return;
          }
          c(_, ""), c(v, false), c(o, [
            ...n(o),
            {
              role: "assistant",
              content: "\u26A0\uFE0F Reached maximum tool execution depth. Please try again."
            }
          ], true);
        } catch (m) {
          c(o, [
            ...n(o),
            {
              role: "assistant",
              content: `\u274C **Error:** ${m instanceof Error ? m.message : String(m)}`
            }
          ], true), c(v, false), c(b, ""), c(_, "");
        }
      }
    }
    async function p(f, m) {
      switch (f) {
        case "web_search": {
          const k = m.query || "", P = `https://api.duckduckgo.com/?q=${encodeURIComponent(k)}&format=json&no_html=1&skip_disambig=1`, B = await (await fetch(P)).json(), K = [];
          if (B.Abstract && K.push(`**Summary**: ${B.Abstract}
Source: ${B.AbstractURL}`), B.RelatedTopics) for (const H of B.RelatedTopics.slice(0, 5)) H.Text && K.push(`- ${H.Text}${H.FirstURL ? ` (${H.FirstURL})` : ""}`);
          return K.length > 0 ? K.join(`

`) : `No results for: "${k}"`;
        }
        case "web_fetch":
          return (await (await fetch(m.url)).text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1e4);
        case "memory_store": {
          const k = m.key || `mem-${Date.now()}`, P = m.content || m.value || "", M = m.category || "core";
          try {
            return We(k, P, M), `Memory stored: key="${k}", category="${M}"`;
          } catch (B) {
            return `Memory store failed: ${B.message}`;
          }
        }
        case "memory_recall":
          try {
            const k = yt(m.query || "", m.limit || 5);
            return k.length === 0 ? `No memories found for: "${m.query}"` : k.map((P) => `[${P.category}] ${P.key}: ${P.content}`).join(`
`);
          } catch (k) {
            return `Memory recall failed: ${k.message}`;
          }
        case "update_identity": {
          const k = Pe();
          m.name && (k.name = m.name, k.facts.name = m.name), m.personality && (k.personality = m.personality), m.instructions && (k.instructions = m.instructions), m.creature && (k.creature = m.creature), m.vibe && (k.vibe = m.vibe), m.emoji && (k.emoji = m.emoji), m.fact_key && m.fact_value && (k.facts[m.fact_key] = m.fact_value), lt(k), m.name && !k.bootstrapped && mn();
          try {
            m.name && We("identity_name", `My name is ${m.name}`, "identity"), m.personality && We("identity_personality", m.personality, "identity"), m.creature && We("identity_creature", m.creature, "identity"), m.fact_key && We(`identity_${m.fact_key}`, m.fact_value, "identity");
          } catch {
          }
          return `Identity updated successfully: ${JSON.stringify(k, null, 2)}`;
        }
        case "read_file":
          try {
            return i().read_file(m.path || "");
          } catch (k) {
            return `read_file error: ${k.message}`;
          }
        case "write_file":
          try {
            return i().write_file(m.path || "", m.content || ""), `File written: ${m.path} (${(m.content || "").length} bytes)`;
          } catch (k) {
            return `write_file error: ${k.message}`;
          }
        case "list_dir":
          try {
            const P = i().list_dir(m.path || "/"), M = JSON.parse(P);
            return M.length === 0 ? "(empty directory)" : M.map((B) => `${B.is_dir ? "\u{1F4C1}" : "\u{1F4C4}"} ${B.name}${B.is_dir ? "/" : ` (${B.size}b)`}`).join(`
`);
          } catch (k) {
            return `list_dir error: ${k.message}`;
          }
        case "shell_exec": {
          const P = await s().execute(m.command || "");
          let M = "";
          return P.stdout && (M += P.stdout), P.stderr && (M += (M ? `
` : "") + `STDERR: ${P.stderr}`), P.timedOut && (M += `
(command timed out)`), M || "(no output)";
        }
        default:
          return `Unknown tool: ${f}`;
      }
    }
    function y(f) {
      const m = f.find((P) => P.role === "user");
      if (!m) return "New Chat";
      const k = m.content.slice(0, 50);
      return k.length < m.content.length ? k + "..." : k;
    }
    function h(f) {
      f.key === "Enter" && !f.shiftKey && (f.preventDefault(), S());
    }
    function w(f) {
      f.style.height = "auto", f.style.height = Math.min(f.scrollHeight, 150) + "px";
    }
    var D = Sr(), V = l(D), I = l(V);
    {
      var R = (f) => {
        var m = yr(), k = d(l(m), 6), P = l(k), M = d(P, 2), B = d(M, 2);
        x("click", P, () => {
          c(u, "Help me write a Python function");
        }), x("click", M, () => {
          c(u, "Explain WASM to me");
        }), x("click", B, () => {
          c(u, "Debug this code for me");
        }), g(f, m);
      };
      $(I, (f) => {
        n(o).length === 0 && !n(v) && f(R);
      });
    }
    var X = d(I, 2);
    Ie(X, 17, () => n(o), Te, (f, m) => {
      Aa(f, {
        get role() {
          return n(m).role;
        },
        get content() {
          return n(m).content;
        }
      });
    });
    var se = d(X, 2);
    {
      var Q = (f) => {
        Aa(f, {
          role: "assistant",
          get content() {
            return n(b);
          },
          isStreaming: true
        });
      };
      $(se, (f) => {
        n(v) && n(b) && f(Q);
      });
    }
    var pe = d(se, 2);
    {
      var Z = (f) => {
        var m = wr(), k = d(l(m), 2), P = l(k);
        ae(() => q(P, n(_))), g(f, m);
      };
      $(pe, (f) => {
        n(_) && f(Z);
      });
    }
    Pt(V, (f) => c(z, f), () => n(z));
    var W = d(V, 2), oe = l(W), ce = l(oe);
    Pt(ce, (f) => c(T, f), () => n(T));
    var me = d(ce, 2), te = l(me);
    {
      var J = (f) => {
        var m = xr();
        g(f, m);
      }, N = (f) => {
        var m = kr();
        g(f, m);
      };
      $(te, (f) => {
        n(v) ? f(J) : f(N, -1);
      });
    }
    var ne = d(oe, 2), le = l(ne), re = l(le);
    ae((f) => {
      ce.disabled = n(v), me.disabled = f, q(re, `Shift+Enter for new line \u2022 ${e.provider ?? ""}/${e.model ?? ""}`);
    }, [
      () => !n(u).trim() || n(v)
    ]), x("keydown", ce, h), x("input", ce, (f) => w(f.currentTarget)), Se(ce, () => n(u), (f) => c(u, f)), x("click", me, S), g(t, D), Ne();
  }
  De([
    "click",
    "keydown",
    "input"
  ]);
  var Er = E("<option> </option>"), Ar = E("<option> </option>"), zr = E('<span class="field-hint svelte-1u3w06f">Authentication handled locally</span>'), Ir = E('<span class="field-hint svelte-1u3w06f"> </span>'), Mr = E('<label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <input class="input" type="text"/> <!></label>'), Or = E('<p class="export-status svelte-1u3w06f"> </p>'), Tr = E('<div class="modal-overlay"><div class="modal-content"><div class="modal-header svelte-1u3w06f"><h2 class="svelte-1u3w06f">\u2699\uFE0F Settings</h2> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="settings-section svelte-1u3w06f"><h3 class="svelte-1u3w06f">AI Provider</h3> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f">Provider</span> <select class="input"></select></label> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f">Model</span> <input class="input" type="text" placeholder="Model name" list="model-suggestions"/> <datalist id="model-suggestions"></datalist> <span class="field-hint svelte-1u3w06f"> </span></label> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <div class="api-key-wrapper svelte-1u3w06f"><input class="input svelte-1u3w06f"/> <button class="btn btn-ghost btn-sm"> </button></div> <!></label> <!> <label class="field svelte-1u3w06f"><span class="field-label svelte-1u3w06f"> </span> <input type="range" min="0" max="2" step="0.1" class="slider svelte-1u3w06f"/> <div class="slider-labels svelte-1u3w06f"><span>Precise</span><span>Creative</span></div></label></div> <div class="divider"></div> <div class="settings-section svelte-1u3w06f"><h3 class="svelte-1u3w06f">Data</h3> <div class="data-actions svelte-1u3w06f"><button class="btn btn-secondary">\u{1F4E4} Export Data</button> <button class="btn btn-secondary">\u{1F4E5} Import Data</button></div> <!></div> <div class="divider"></div> <div class="modal-footer svelte-1u3w06f"><button class="btn btn-secondary">Cancel</button> <button class="btn btn-primary">Save Changes</button></div></div></div>');
  function Pr(t, e) {
    qe(e, true);
    let a = O(Ce(e.provider)), s = O(Ce(e.model)), r = O(Ce(e.apiKey)), i = O(Ce(e.temperature)), o = O(Ce(e.apiUrl)), u = O(false), v = O("");
    const b = Nt;
    function _() {
      const A = b.find((j) => j.id === n(a));
      A && (c(s, A.defaultModel, true), c(r, ""), c(o, pt(n(a)), true));
    }
    function z() {
      e.onSave({
        provider: n(a),
        model: n(s),
        apiKey: n(r),
        temperature: n(i),
        apiUrl: n(o)
      });
    }
    async function T() {
      try {
        const A = await cn(), j = new Blob([
          A
        ], {
          type: "application/json"
        }), F = URL.createObjectURL(j), ie = document.createElement("a");
        ie.href = F, ie.download = `ezclaw-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, ie.click(), URL.revokeObjectURL(F), c(v, "\u2705 Exported!"), setTimeout(() => c(v, ""), 3e3);
      } catch {
        c(v, "\u274C Export failed");
      }
    }
    async function L() {
      const A = document.createElement("input");
      A.type = "file", A.accept = ".json", A.onchange = async () => {
        const j = A.files?.[0];
        if (!j) return;
        const F = await j.text();
        try {
          const ie = await dn(F);
          c(v, `\u2705 Imported ${ie} sessions`), setTimeout(() => c(v, ""), 3e3);
        } catch {
          c(v, "\u274C Import failed");
        }
      }, A.click();
    }
    var U = Tr(), S = l(U), p = l(S), y = d(l(p), 2), h = d(p, 2), w = d(l(h), 2), D = d(l(w), 2);
    Ie(D, 21, () => b, (A) => A.id, (A, j) => {
      var F = Er(), ie = l(F), ve = {};
      ae(() => {
        q(ie, `${n(j).name ?? ""}
              ${n(j).free ? "(Free)" : ""}`), ve !== (ve = n(j).id) && (F.value = (F.__value = n(j).id) ?? "");
      }), g(A, F);
    });
    var V = d(w, 2), I = d(l(V), 2), R = d(I, 2);
    Ie(R, 21, () => b, Te, (A, j) => {
      var F = Be(), ie = Ee(F);
      {
        var ve = (ye) => {
          var ee = Be(), C = Ee(ee);
          Ie(C, 17, () => n(j).models, Te, (Y, fe, G) => {
            var _e = Ar(), Ae = l(_e), xe = {};
            ae(() => {
              q(Ae, n(j).modelLabels?.[G] || n(fe)), xe !== (xe = n(fe)) && (_e.value = (_e.__value = n(fe)) ?? "");
            }), g(Y, _e);
          }), g(ye, ee);
        };
        $(ie, (ye) => {
          n(j).id === n(a) && ye(ve);
        });
      }
      g(A, F);
    });
    var X = d(R, 2), se = l(X), Q = d(V, 2), pe = l(Q), Z = l(pe), W = d(pe, 2), oe = l(W), ce = d(oe, 2), me = l(ce), te = d(W, 2);
    {
      var J = (A) => {
        var j = zr();
        g(A, j);
      }, N = zt(() => et.includes(n(a)));
      $(te, (A) => {
        n(N) && A(J);
      });
    }
    var ne = d(Q, 2);
    {
      var le = (A) => {
        var j = Mr(), F = l(j), ie = l(F), ve = d(F, 2), ye = d(ve, 2);
        {
          var ee = (C) => {
            const Y = zt(() => pt(n(a)));
            var fe = Be(), G = Ee(fe);
            {
              var _e = (Ae) => {
                var xe = Ir(), Le = l(xe);
                ae(() => q(Le, `Using default: ${n(Y) ?? ""}`)), g(Ae, xe);
              };
              $(G, (Ae) => {
                n(Y) && Ae(_e);
              });
            }
            g(C, fe);
          };
          $(ye, (C) => {
            !n(o) && n(a) !== "custom" && C(ee);
          });
        }
        ae((C) => {
          q(ie, `API URL ${n(a) !== "custom" ? "(optional)" : ""}`), Ke(ve, "placeholder", C);
        }, [
          () => pt(n(a)) || "Leave empty to use default"
        ]), Se(ve, () => n(o), (C) => c(o, C)), g(A, j);
      }, re = zt(() => n(a) === "custom" || pt(n(a)) || n(a) === "deepseek" || n(a) === "openrouter" || n(a) === "openai" || n(a) === "anthropic");
      $(ne, (A) => {
        n(re) && A(le);
      });
    }
    var f = d(ne, 2), m = l(f), k = l(m), P = d(m, 2), M = d(h, 4), B = d(l(M), 2), K = l(B), H = d(K, 2), ue = d(B, 2);
    {
      var he = (A) => {
        var j = Or(), F = l(j);
        ae(() => q(F, n(v))), g(A, j);
      };
      $(ue, (A) => {
        n(v) && A(he);
      });
    }
    var be = d(M, 4), ge = l(be), de = d(ge, 2);
    ae((A, j, F) => {
      q(se, `Type or select a model. Provider: ${n(a) ?? ""}`), q(Z, `API Key ${A ?? ""}`), Ke(oe, "type", n(u) ? "text" : "password"), Ke(oe, "placeholder", j), q(me, n(u) ? "\u{1F648}" : "\u{1F441}\uFE0F"), q(k, `Temperature: ${F ?? ""}`);
    }, [
      () => et.includes(n(a)) ? "(optional)" : "",
      () => et.includes(n(a)) ? "Not required" : "Enter your API key",
      () => n(i).toFixed(1)
    ]), x("click", U, function(...A) {
      e.onClose?.apply(this, A);
    }), x("click", S, (A) => A.stopPropagation()), x("click", y, function(...A) {
      e.onClose?.apply(this, A);
    }), x("change", D, _), Yt(D, () => n(a), (A) => c(a, A)), Se(I, () => n(s), (A) => c(s, A)), Se(oe, () => n(r), (A) => c(r, A)), x("click", ce, () => c(u, !n(u))), Se(P, () => n(i), (A) => c(i, A)), x("click", K, T), x("click", H, L), x("click", ge, function(...A) {
      e.onClose?.apply(this, A);
    }), x("click", de, z), g(t, U), Ne();
  }
  De([
    "click",
    "change"
  ]);
  var Dr = E(`<div class="onboarding-step fade-in svelte-iscxm"><div class="onboarding-header svelte-iscxm"><span class="big-icon svelte-iscxm">\u{1F980}</span> <h1 class="svelte-iscxm">Welcome to EZ-Claw</h1> <p class="svelte-iscxm">ZeroClaw's AI engine, running locally in your browser via WebAssembly.</p></div> <div class="features svelte-iscxm"><div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u26A1</span> <div><strong>WASM Powered</strong> <p class="svelte-iscxm">Core engine compiled from Rust \u2014 fast & efficient</p></div></div> <div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u{1F512}</span> <div><strong>Your Data Stays Local</strong> <p class="svelte-iscxm">Everything stored in your browser \u2014 nothing on servers</p></div></div> <div class="feature svelte-iscxm"><span class="feature-icon svelte-iscxm">\u{1F9E0}</span> <div><strong>Smart Memory</strong> <p class="svelte-iscxm">Remembers context across sessions via local database</p></div></div></div> <button class="btn btn-primary btn-lg svelte-iscxm">Get Started \u2192</button></div>`), qr = E('<span class="badge badge-success">Free</span>'), Nr = E('<button><span class="provider-icon svelte-iscxm"> </span> <strong class="svelte-iscxm"> </strong> <p class="svelte-iscxm"> </p> <!></button>'), Ur = E('<div class="onboarding-step fade-in svelte-iscxm"><h2 class="svelte-iscxm">Choose Your AI Provider</h2> <p class="step-subtitle svelte-iscxm">You can change this anytime in Settings</p> <div class="provider-grid svelte-iscxm"></div> <div class="step-actions svelte-iscxm"><button class="btn btn-secondary">\u2190 Back</button> <button class="btn btn-primary">Continue \u2192</button></div></div>'), Rr = E('<label class="field svelte-iscxm"><span class="field-label svelte-iscxm">API Key</span> <input class="input" type="password" placeholder="sk-..."/></label> <a class="signup-link svelte-iscxm" target="_blank" rel="noopener"> </a>', 1), Br = E('<div class="onboarding-step fade-in svelte-iscxm"><h2 class="svelte-iscxm">Enter Your API Key</h2> <p class="step-subtitle svelte-iscxm"><!></p> <!> <label class="field svelte-iscxm"><span class="field-label svelte-iscxm">Model</span> <input class="input" type="text"/></label> <div class="step-actions svelte-iscxm"><button class="btn btn-secondary">\u2190 Back</button> <button class="btn btn-primary">Start Chatting \u{1F680}</button></div></div>'), Lr = E('<div class="modal-overlay"><div class="modal-content onboarding svelte-iscxm"><!></div></div>');
  function Wr(t, e) {
    qe(e, true);
    let a = O(1), s = O("deepseek"), r = O(""), i = O("deepseek-chat");
    const o = [
      {
        id: "deepseek",
        name: "DeepSeek",
        icon: "\u{1F9E0}",
        description: "Free, powerful AI model. Great default choice.",
        defaultModel: "deepseek-chat",
        free: true,
        signupUrl: "https://platform.deepseek.com/"
      },
      {
        id: "openrouter",
        name: "OpenRouter",
        icon: "\u{1F310}",
        description: "Access 100+ models through one API. Free tier available.",
        defaultModel: "deepseek/deepseek-chat",
        free: true,
        signupUrl: "https://openrouter.ai/"
      },
      {
        id: "ollama",
        name: "Ollama",
        icon: "\u{1F999}",
        description: "Run models locally on your machine. Completely free & private.",
        defaultModel: "llama3",
        free: true,
        signupUrl: "https://ollama.ai/"
      },
      {
        id: "openai",
        name: "OpenAI",
        icon: "\u{1F49A}",
        description: "GPT-4o and more. Paid API.",
        defaultModel: "gpt-4o-mini",
        free: false,
        signupUrl: "https://platform.openai.com/"
      }
    ];
    function u(S) {
      c(s, S, true);
      const p = o.find((y) => y.id === S);
      p && c(i, p.defaultModel, true);
    }
    function v() {
      e.onComplete({
        provider: n(s),
        model: n(i),
        apiKey: n(r)
      });
    }
    var b = Lr(), _ = l(b), z = l(_);
    {
      var T = (S) => {
        var p = Dr(), y = d(l(p), 4);
        x("click", y, () => c(a, 2)), g(S, p);
      }, L = (S) => {
        var p = Ur(), y = d(l(p), 4);
        Ie(y, 21, () => o, (V) => V.id, (V, I) => {
          var R = Nr();
          let X;
          var se = l(R), Q = l(se), pe = d(se, 2), Z = l(pe), W = d(pe, 2), oe = l(W), ce = d(W, 2);
          {
            var me = (te) => {
              var J = qr();
              g(te, J);
            };
            $(ce, (te) => {
              n(I).free && te(me);
            });
          }
          ae(() => {
            X = we(R, 1, "provider-card svelte-iscxm", null, X, {
              selected: n(s) === n(I).id
            }), q(Q, n(I).icon), q(Z, n(I).name), q(oe, n(I).description);
          }), x("click", R, () => u(n(I).id)), g(V, R);
        });
        var h = d(y, 2), w = l(h), D = d(w, 2);
        x("click", w, () => c(a, 1)), x("click", D, () => c(a, 3)), g(S, p);
      }, U = (S) => {
        var p = Br(), y = d(l(p), 2), h = l(y);
        {
          var w = (Z) => {
            var W = Qe("Ollama runs locally \u2014 no API key needed! Just make sure Ollama is running.");
            g(Z, W);
          }, D = (Z) => {
            var W = Qe("Get your key from the provider's dashboard. Your key is stored locally and never sent to our servers.");
            g(Z, W);
          };
          $(h, (Z) => {
            n(s) === "ollama" ? Z(w) : Z(D, -1);
          });
        }
        var V = d(y, 2);
        {
          var I = (Z) => {
            var W = Rr(), oe = Ee(W), ce = d(l(oe), 2), me = d(oe, 2), te = l(me);
            ae((J, N) => {
              Ke(me, "href", J), q(te, `Don't have a key? Sign up at ${N ?? ""} \u2192`);
            }, [
              () => o.find((J) => J.id === n(s))?.signupUrl,
              () => o.find((J) => J.id === n(s))?.name
            ]), Se(ce, () => n(r), (J) => c(r, J)), g(Z, W);
          };
          $(V, (Z) => {
            n(s) !== "ollama" && Z(I);
          });
        }
        var R = d(V, 2), X = d(l(R), 2), se = d(R, 2), Q = l(se), pe = d(Q, 2);
        ae((Z) => pe.disabled = Z, [
          () => n(s) !== "ollama" && !n(r).trim()
        ]), Se(X, () => n(i), (Z) => c(i, Z)), x("click", Q, () => c(a, 2)), x("click", pe, v), g(S, p);
      };
      $(z, (S) => {
        n(a) === 1 ? S(T) : n(a) === 2 ? S(L, 1) : n(a) === 3 && S(U, 2);
      });
    }
    g(t, b), Ne();
  }
  De([
    "click"
  ]);
  var jr = E('<span class="crumb-sep svelte-qwbtpz">/</span> <button class="crumb svelte-qwbtpz"> </button>', 1), Fr = E('<div class="file-entry svelte-qwbtpz"><span class="file-icon svelte-qwbtpz">\u2B06\uFE0F</span> <span class="file-name svelte-qwbtpz">..</span></div>'), $r = E('<span class="file-size svelte-qwbtpz"> </span>'), Jr = E('<div><span class="file-icon svelte-qwbtpz"> </span> <span class="file-name svelte-qwbtpz"> </span> <!></div>'), Hr = E('<div class="empty-dir svelte-qwbtpz"><p>Empty directory</p></div>'), Vr = E('<button class="btn btn-sm btn-secondary">Edit</button>'), Kr = E('<div class="edit-actions svelte-qwbtpz"><button class="btn btn-sm btn-primary">Save</button> <button class="btn btn-sm btn-ghost">Cancel</button></div>'), Yr = E('<textarea class="file-editor svelte-qwbtpz"></textarea>'), Zr = E('<pre class="file-content svelte-qwbtpz"> </pre>'), Gr = E('<div class="file-preview svelte-qwbtpz"><div class="preview-header svelte-qwbtpz"><span class="preview-title svelte-qwbtpz"> </span> <!></div> <!></div>'), Xr = E('<div class="workspace-overlay svelte-qwbtpz"><div class="workspace-panel glass-elevated svelte-qwbtpz"><div class="panel-header svelte-qwbtpz"><h3 class="svelte-qwbtpz">\u{1F4C2} Workspace</h3> <button class="btn btn-ghost btn-icon" aria-label="Close workspace"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="panel-body svelte-qwbtpz"><div class="breadcrumb svelte-qwbtpz"><button class="crumb svelte-qwbtpz">~</button> <!></div> <div class="panel-content svelte-qwbtpz"><div class="file-list svelte-qwbtpz"><!> <!> <!></div> <!></div></div> <div class="panel-footer svelte-qwbtpz"><button class="btn btn-sm btn-secondary">\u{1F4E5} Export</button> <button class="btn btn-sm btn-secondary">\u{1F4E4} Import</button></div></div></div>');
  function Qr(t, e) {
    qe(e, true);
    let a = null, s = O("/"), r = O(Ce([])), i = O(""), o = O(""), u = O(false), v = O(""), b = O(Ce([
      "/"
    ]));
    function _() {
      if (!a) {
        const I = st();
        a = new I.WasmWorkspace();
      }
    }
    da(() => {
      e.isOpen && (_(), z(n(s)));
    });
    function z(I) {
      if (!a) {
        c(r, [], true);
        return;
      }
      try {
        const R = a.list_dir(I), X = JSON.parse(R);
        X.error ? (console.error("[WorkspacePanel] Error:", X.error), c(r, [], true)) : c(r, X.map((se) => ({
          name: se.name,
          is_dir: se.is_dir,
          size: se.size || 0
        })), true);
      } catch (R) {
        console.error("[WorkspacePanel] Failed to load directory:", R), c(r, [], true);
      }
      c(i, ""), c(o, ""), c(u, false);
    }
    function T(I) {
      c(s, I, true), c(b, [
        ...n(b),
        I
      ], true), z(I);
    }
    function L() {
      const I = n(s).split("/").filter(Boolean);
      I.pop();
      const R = "/" + I.join("/");
      T(R || "/");
    }
    function U(I) {
      if (I.is_dir) {
        const R = n(s) === "/" ? `/${I.name}` : `${n(s)}/${I.name}`;
        T(R);
      } else if (c(i, I.name, true), a) {
        const R = n(s) === "/" ? `/${I.name}` : `${n(s)}/${I.name}`;
        try {
          c(o, a.read_file(R), true);
        } catch {
          c(o, "");
        }
      }
    }
    function S() {
      c(v, n(o), true), c(u, true);
    }
    function p() {
      if (a && n(i)) {
        const I = n(s) === "/" ? `/${n(i)}` : `${n(s)}/${n(i)}`;
        try {
          a.write_file(I, n(v)), c(o, n(v), true);
        } catch (R) {
          console.error("[WorkspacePanel] Failed to save:", R);
        }
      }
      c(u, false);
    }
    function y() {
      c(v, ""), c(u, false);
    }
    function h(I) {
      return I < 1024 ? `${I}B` : I < 1024 * 1024 ? `${(I / 1024).toFixed(1)}KB` : `${(I / (1024 * 1024)).toFixed(1)}MB`;
    }
    var w = Be(), D = Ee(w);
    {
      var V = (I) => {
        var R = Xr(), X = l(R), se = l(X), Q = d(l(se), 2), pe = d(se, 2), Z = l(pe), W = l(Z), oe = d(W, 2);
        Ie(oe, 17, () => n(s).split("/").filter(Boolean), Te, (M, B, K) => {
          var H = jr(), ue = d(Ee(H), 2), he = l(ue);
          ae(() => q(he, n(B))), x("click", ue, () => T("/" + n(s).split("/").filter(Boolean).slice(0, K + 1).join("/"))), g(M, H);
        });
        var ce = d(Z, 2), me = l(ce), te = l(me);
        {
          var J = (M) => {
            var B = Fr();
            x("click", B, L), g(M, B);
          };
          $(te, (M) => {
            n(s) !== "/" && M(J);
          });
        }
        var N = d(te, 2);
        Ie(N, 17, () => n(r), Te, (M, B) => {
          var K = Jr();
          let H;
          var ue = l(K), he = l(ue), be = d(ue, 2), ge = l(be), de = d(be, 2);
          {
            var A = (j) => {
              var F = $r(), ie = l(F);
              ae((ve) => q(ie, ve), [
                () => h(n(B).size)
              ]), g(j, F);
            };
            $(de, (j) => {
              n(B).is_dir || j(A);
            });
          }
          ae(() => {
            H = we(K, 1, "file-entry svelte-qwbtpz", null, H, {
              active: n(i) === n(B).name
            }), q(he, n(B).is_dir ? "\u{1F4C1}" : "\u{1F4C4}"), q(ge, n(B).name);
          }), x("click", K, () => U(n(B))), g(M, K);
        });
        var ne = d(N, 2);
        {
          var le = (M) => {
            var B = Hr();
            g(M, B);
          };
          $(ne, (M) => {
            n(r).length === 0 && M(le);
          });
        }
        var re = d(me, 2);
        {
          var f = (M) => {
            var B = Gr(), K = l(B), H = l(K), ue = l(H), he = d(H, 2);
            {
              var be = (F) => {
                var ie = Vr();
                x("click", ie, S), g(F, ie);
              }, ge = (F) => {
                var ie = Kr(), ve = l(ie), ye = d(ve, 2);
                x("click", ve, p), x("click", ye, y), g(F, ie);
              };
              $(he, (F) => {
                n(u) ? F(ge, -1) : F(be);
              });
            }
            var de = d(K, 2);
            {
              var A = (F) => {
                var ie = Yr();
                Se(ie, () => n(v), (ve) => c(v, ve)), g(F, ie);
              }, j = (F) => {
                var ie = Zr(), ve = l(ie);
                ae(() => q(ve, n(o))), g(F, ie);
              };
              $(de, (F) => {
                n(u) ? F(A) : F(j, -1);
              });
            }
            ae(() => q(ue, n(i))), g(M, B);
          };
          $(re, (M) => {
            n(i) && M(f);
          });
        }
        var m = d(pe, 2), k = l(m), P = d(k, 2);
        x("click", R, function(...M) {
          e.onClose?.apply(this, M);
        }), x("click", X, (M) => M.stopPropagation()), x("click", Q, function(...M) {
          e.onClose?.apply(this, M);
        }), x("click", W, () => T("/")), x("click", k, () => {
        }), x("click", P, () => {
        }), g(I, R);
      };
      $(D, (I) => {
        e.isOpen && I(V);
      });
    }
    g(t, w), Ne();
  }
  De([
    "click"
  ]);
  var ei = E('<div class="overview-grid svelte-rqzng6"><div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F510}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Stored Credentials</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F310}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Allowed Domains</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F6AB}</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Leaks Blocked</span></div> <div class="stat-card svelte-rqzng6"><span class="stat-icon svelte-rqzng6">\u{1F6E1}\uFE0F</span> <span class="stat-value svelte-rqzng6"> </span> <span class="stat-label svelte-rqzng6">Injections Blocked</span></div></div> <div class="policy-section svelte-rqzng6"><h4 class="svelte-rqzng6">Active Policies</h4> <div class="policy-row svelte-rqzng6"><span class="policy-label svelte-rqzng6">Sandbox Policy</span> <select class="input policy-select svelte-rqzng6"><option>\u{1F512} Read Only</option><option>\u{1F4DD} Workspace Write</option><option>\u26A1 Full Access</option></select></div> <div class="policy-row svelte-rqzng6"><span class="policy-label svelte-rqzng6">Autonomy Level</span> <select class="input policy-select svelte-rqzng6"><option>\u{1F590}\uFE0F Manual (confirm all)</option><option>\u2696\uFE0F Semi (confirm destructive)</option><option>\u{1F916} Auto (no confirmation)</option></select></div></div> <div class="pipeline-info svelte-rqzng6"><h4 class="svelte-rqzng6">Security Pipeline</h4> <div class="pipeline-steps svelte-rqzng6"><span class="pipe-step svelte-rqzng6">Permission</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Allowlist</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Leak Scan</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step svelte-rqzng6">Credential Inject</span> <span class="pipe-arrow svelte-rqzng6">\u2192</span> <span class="pipe-step active-step svelte-rqzng6">Execute</span></div></div>', 1), ti = E('<span class="badge badge-primary">Built-in</span>'), ai = E('<button class="btn btn-ghost btn-icon btn-sm">\u2715</button>'), ni = E('<div><div class="domain-info svelte-rqzng6"><span class="domain-name svelte-rqzng6"> </span> <span class="domain-label svelte-rqzng6"> </span></div> <!></div>'), si = E('<div class="allowlist-section"><div class="add-domain svelte-rqzng6"><input class="input" placeholder="Domain (e.g. api.example.com)"/> <input class="input label-input svelte-rqzng6" placeholder="Label"/> <button class="btn btn-primary btn-sm">Add</button></div> <div class="domain-list svelte-rqzng6"></div></div>'), ri = E('<div class="perm-row svelte-rqzng6"><span class="perm-tool svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span> <span class="perm-val svelte-rqzng6"> </span></div>'), ii = E('<div class="permissions-section"><div class="perm-matrix svelte-rqzng6"><div class="perm-header-row svelte-rqzng6"><span class="perm-header svelte-rqzng6">Tool</span> <span class="perm-header svelte-rqzng6">HTTP</span> <span class="perm-header svelte-rqzng6">FS</span> <span class="perm-header svelte-rqzng6">Shell</span> <span class="perm-header svelte-rqzng6">MCP</span></div> <!></div> <p class="perm-legend svelte-rqzng6">\u2705 Allowed &nbsp; \u26A0\uFE0F Ask &nbsp; \u274C Denied</p></div>'), oi = E('<p class="empty-audit svelte-rqzng6">No audit entries yet</p>'), li = E('<div class="audit-entry svelte-rqzng6"><span class="audit-tool svelte-rqzng6"> </span> <span> </span> <span class="audit-details svelte-rqzng6"> </span> <span class="audit-time svelte-rqzng6"> </span></div>'), ci = E('<div class="audit-section"><!></div>'), di = E('<div class="sec-overlay svelte-rqzng6"><div class="sec-panel glass-elevated svelte-rqzng6"><div class="sec-header svelte-rqzng6"><div class="sec-title svelte-rqzng6"><span class="sec-icon svelte-rqzng6">\u{1F6E1}\uFE0F</span> <h3 class="svelte-rqzng6">IronClaw Security</h3></div> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="sec-tabs svelte-rqzng6"><button>Overview</button> <button>Allowlist</button> <button>Permissions</button> <button>Audit Log</button></div> <div class="sec-body svelte-rqzng6"><!></div></div></div>');
  function ui(t, e) {
    let a = O("overview"), s = O(""), r = O(""), i = Ce({
      credentialsCount: 0,
      allowlistCount: 12,
      leakBlocksCount: 0,
      promptBlocksCount: 0,
      sandboxPolicy: "WorkspaceWrite",
      autonomyLevel: "Semi"
    }), o = O(Ce([
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
    ])), u = Ce([
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
      n(s).trim() && (c(o, [
        ...n(o),
        {
          domain: n(s).trim(),
          path: "/*",
          label: n(r).trim() || n(s).trim(),
          builtin: false
        }
      ], true), c(s, ""), c(r, ""));
    }
    function b(L) {
      n(o)[L].builtin || c(o, n(o).filter((U, S) => S !== L), true);
    }
    var _ = Be(), z = Ee(_);
    {
      var T = (L) => {
        var U = di(), S = l(U), p = l(S), y = d(l(p), 2), h = d(p, 2), w = l(h);
        let D;
        var V = d(w, 2);
        let I;
        var R = d(V, 2);
        let X;
        var se = d(R, 2);
        let Q;
        var pe = d(h, 2), Z = l(pe);
        {
          var W = (te) => {
            var J = ei(), N = Ee(J), ne = l(N), le = d(l(ne), 2), re = l(le), f = d(ne, 2), m = d(l(f), 2), k = l(m), P = d(f, 2), M = d(l(P), 2), B = l(M), K = d(P, 2), H = d(l(K), 2), ue = l(H), he = d(N, 2), be = d(l(he), 2), ge = d(l(be), 2), de = l(ge);
            de.value = de.__value = "ReadOnly";
            var A = d(de);
            A.value = A.__value = "WorkspaceWrite";
            var j = d(A);
            j.value = j.__value = "FullAccess";
            var F = d(be, 2), ie = d(l(F), 2), ve = l(ie);
            ve.value = ve.__value = "Manual";
            var ye = d(ve);
            ye.value = ye.__value = "Semi";
            var ee = d(ye);
            ee.value = ee.__value = "Auto", ae(() => {
              q(re, i.credentialsCount), q(k, i.allowlistCount), q(B, i.leakBlocksCount), q(ue, i.promptBlocksCount);
            }), Yt(ge, () => i.sandboxPolicy, (C) => i.sandboxPolicy = C), Yt(ie, () => i.autonomyLevel, (C) => i.autonomyLevel = C), g(te, J);
          }, oe = (te) => {
            var J = si(), N = l(J), ne = l(N), le = d(ne, 2), re = d(le, 2), f = d(N, 2);
            Ie(f, 21, () => n(o), Te, (m, k, P) => {
              var M = ni();
              let B;
              var K = l(M), H = l(K), ue = l(H), he = d(H, 2), be = l(he), ge = d(K, 2);
              {
                var de = (j) => {
                  var F = ti();
                  g(j, F);
                }, A = (j) => {
                  var F = ai();
                  x("click", F, () => b(P)), g(j, F);
                };
                $(ge, (j) => {
                  n(k).builtin ? j(de) : j(A, -1);
                });
              }
              ae(() => {
                B = we(M, 1, "domain-entry svelte-rqzng6", null, B, {
                  builtin: n(k).builtin
                }), q(ue, `${n(k).domain ?? ""}${n(k).path ?? ""}`), q(be, n(k).label);
              }), g(m, M);
            }), Se(ne, () => n(s), (m) => c(s, m)), Se(le, () => n(r), (m) => c(r, m)), x("click", re, v), g(te, J);
          }, ce = (te) => {
            var J = ii(), N = l(J), ne = d(l(N), 2);
            Ie(ne, 16, () => [
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
            ], Te, (le, re) => {
              var f = ri(), m = l(f), k = l(m), P = d(m, 2), M = l(P), B = d(P, 2), K = l(B), H = d(B, 2), ue = l(H), he = d(H, 2), be = l(he);
              ae(() => {
                q(k, re.name), q(M, re.http), q(K, re.fs), q(ue, re.shell), q(be, re.mcp);
              }), g(le, f);
            }), g(te, J);
          }, me = (te) => {
            var J = ci(), N = l(J);
            {
              var ne = (re) => {
                var f = oi();
                g(re, f);
              }, le = (re) => {
                var f = Be(), m = Ee(f);
                Ie(m, 17, () => u, Te, (k, P) => {
                  var M = li(), B = l(M), K = l(B), H = d(B, 2);
                  let ue;
                  var he = l(H), be = d(H, 2), ge = l(be), de = d(be, 2), A = l(de);
                  ae(() => {
                    q(K, n(P).tool), ue = we(H, 1, "audit-action svelte-rqzng6", null, ue, {
                      approved: n(P).action === "approved",
                      denied: n(P).action === "denied"
                    }), q(he, n(P).action), q(ge, n(P).details), q(A, n(P).time);
                  }), g(k, M);
                }), g(re, f);
              };
              $(N, (re) => {
                u.length === 0 ? re(ne) : re(le, -1);
              });
            }
            g(te, J);
          };
          $(Z, (te) => {
            n(a) === "overview" ? te(W) : n(a) === "allowlist" ? te(oe, 1) : n(a) === "permissions" ? te(ce, 2) : n(a) === "audit" && te(me, 3);
          });
        }
        ae(() => {
          D = we(w, 1, "tab svelte-rqzng6", null, D, {
            active: n(a) === "overview"
          }), I = we(V, 1, "tab svelte-rqzng6", null, I, {
            active: n(a) === "allowlist"
          }), X = we(R, 1, "tab svelte-rqzng6", null, X, {
            active: n(a) === "permissions"
          }), Q = we(se, 1, "tab svelte-rqzng6", null, Q, {
            active: n(a) === "audit"
          });
        }), x("click", U, function(...te) {
          e.onClose?.apply(this, te);
        }), x("click", S, (te) => te.stopPropagation()), x("click", y, function(...te) {
          e.onClose?.apply(this, te);
        }), x("click", w, () => c(a, "overview")), x("click", V, () => c(a, "allowlist")), x("click", R, () => c(a, "permissions")), x("click", se, () => c(a, "audit")), g(L, U);
      };
      $(z, (L) => {
        e.isOpen && L(T);
      });
    }
    g(t, _);
  }
  De([
    "click"
  ]);
  var vi = E('<div class="create-form svelte-czmyr8"><textarea class="skill-editor svelte-czmyr8" rows="12"></textarea> <button class="btn btn-primary">Register Skill</button></div>'), fi = E('<button class="btn btn-ghost btn-icon btn-sm">\u{1F5D1}\uFE0F</button>'), pi = E('<span class="tag svelte-czmyr8"> </span>'), mi = E('<span class="tool-chip svelte-czmyr8"> </span>'), hi = E('<div><div class="skill-header svelte-czmyr8"><div class="skill-meta svelte-czmyr8"><span class="skill-name svelte-czmyr8"> </span> <span class="trust-badge svelte-czmyr8"> </span> <span class="source-badge svelte-czmyr8"> </span></div> <div class="skill-actions svelte-czmyr8"><label class="toggle svelte-czmyr8"><input type="checkbox" class="svelte-czmyr8"/> <span class="slider svelte-czmyr8"></span></label> <!></div></div> <p class="skill-desc svelte-czmyr8"> </p> <div class="skill-footer svelte-czmyr8"><div class="skill-tags svelte-czmyr8"></div> <div class="skill-tools svelte-czmyr8"></div></div></div>'), bi = E('<div class="skills-overlay svelte-czmyr8"><div class="skills-panel glass-elevated svelte-czmyr8"><div class="panel-header svelte-czmyr8"><div class="header-title svelte-czmyr8"><span>\u26A1</span> <h3 class="svelte-czmyr8">Skills Engine</h3> <span class="skill-count svelte-czmyr8"> </span></div> <div class="header-actions svelte-czmyr8"><button class="btn btn-sm btn-primary"> </button> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></div> <!> <div class="skills-list svelte-czmyr8"></div></div></div>');
  function _i(t, e) {
    qe(e, true);
    let a = O(Ce([])), s = O(false), r = O(`---
name: my-skill
description: What this skill does
version: 1.0.0
trust: untrusted
tags: [tag1, tag2]
activation_keywords: [keyword1, keyword2]
required_tools: []
---
Your skill instructions here.`);
    function i(U) {
      c(a, n(a).map((S) => S.name === U ? {
        ...S,
        enabled: !S.enabled
      } : S), true);
    }
    function o(U) {
      n(a).find((S) => S.name === U)?.source !== "bundled" && c(a, n(a).filter((S) => S.name !== U), true);
    }
    function u() {
      c(s, false);
    }
    const v = {
      trusted: "var(--success)",
      verified: "var(--accent-primary)",
      untrusted: "var(--warning)"
    }, b = {
      trusted: "\u{1F512}",
      verified: "\u2713",
      untrusted: "\u26A0\uFE0F"
    }, _ = {
      bundled: "Built-in",
      managed: "Installed",
      workspace: "Custom"
    };
    var z = Be(), T = Ee(z);
    {
      var L = (U) => {
        var S = bi(), p = l(S), y = l(p), h = l(y), w = d(l(h), 4), D = l(w), V = d(h, 2), I = l(V), R = l(I), X = d(I, 2), se = d(y, 2);
        {
          var Q = (Z) => {
            var W = vi(), oe = l(W), ce = d(oe, 2);
            Se(oe, () => n(r), (me) => c(r, me)), x("click", ce, u), g(Z, W);
          };
          $(se, (Z) => {
            n(s) && Z(Q);
          });
        }
        var pe = d(se, 2);
        Ie(pe, 21, () => n(a), Te, (Z, W) => {
          var oe = hi();
          let ce;
          var me = l(oe), te = l(me), J = l(te), N = l(J), ne = d(J, 2);
          let le;
          var re = l(ne), f = d(ne, 2), m = l(f), k = d(te, 2), P = l(k), M = l(P), B = d(P, 2);
          {
            var K = (de) => {
              var A = fi();
              x("click", A, () => o(n(W).name)), g(de, A);
            };
            $(B, (de) => {
              n(W).source !== "bundled" && de(K);
            });
          }
          var H = d(me, 2), ue = l(H), he = d(H, 2), be = l(he);
          Ie(be, 21, () => n(W).tags, Te, (de, A) => {
            var j = pi(), F = l(j);
            ae(() => q(F, n(A))), g(de, j);
          });
          var ge = d(be, 2);
          Ie(ge, 21, () => n(W).required_tools, Te, (de, A) => {
            var j = mi(), F = l(j);
            ae(() => q(F, n(A))), g(de, j);
          }), ae(() => {
            ce = we(oe, 1, "skill-card svelte-czmyr8", null, ce, {
              disabled: !n(W).enabled
            }), q(N, n(W).name), le = It(ne, "", le, {
              color: v[n(W).trust]
            }), q(re, `${b[n(W).trust] ?? ""}
                                    ${n(W).trust ?? ""}`), q(m, _[n(W).source] || n(W).source), gs(M, n(W).enabled), q(ue, n(W).description);
          }), x("change", M, () => i(n(W).name)), g(Z, oe);
        }), ae((Z) => {
          q(D, `${Z ?? ""}/${n(a).length ?? ""}`), q(R, n(s) ? "\u2715 Cancel" : "+ New Skill");
        }, [
          () => n(a).filter((Z) => Z.enabled).length
        ]), x("click", S, function(...Z) {
          e.onClose?.apply(this, Z);
        }), x("click", p, (Z) => Z.stopPropagation()), x("click", I, () => c(s, !n(s))), x("click", X, function(...Z) {
          e.onClose?.apply(this, Z);
        }), g(U, S);
      };
      $(T, (U) => {
        e.isOpen && U(L);
      });
    }
    g(t, z), Ne();
  }
  De([
    "click",
    "change"
  ]);
  var gi = E('<div class="add-form svelte-h7zsx2"><input class="input" placeholder="Server name (e.g. Local Tools)"/> <input class="input" placeholder="URL (e.g. http://localhost:3001/sse)"/> <div class="transport-row svelte-h7zsx2"><label class="radio-label svelte-h7zsx2"><input type="radio"/> SSE (Streamable HTTP)</label> <label class="radio-label svelte-h7zsx2"><input type="radio"/> WebSocket</label></div> <button class="btn btn-primary">Add Server</button></div>'), yi = E(`<div class="empty-state svelte-h7zsx2"><span class="empty-icon svelte-h7zsx2">\u{1F50C}</span> <p>No MCP servers configured</p> <p class="empty-hint svelte-h7zsx2">Add an MCP server to extend EZ-Claw with external
                            tools.</p> <p class="empty-hint svelte-h7zsx2">MCP servers expose tools, resources, and prompts
                            that your agent can use autonomously.</p></div>`), wi = E('<span class="mini-spinner svelte-h7zsx2"></span>'), xi = E('<div class="server-stats svelte-h7zsx2"><span class="stat svelte-h7zsx2"> </span></div>'), ki = E('<div><div class="server-header svelte-h7zsx2"><div class="server-info svelte-h7zsx2"><span></span> <span class="server-name svelte-h7zsx2"> </span> <span class="transport-tag svelte-h7zsx2"> </span></div> <div class="server-actions svelte-h7zsx2"><button><!></button> <button class="btn btn-ghost btn-icon btn-sm">\u{1F5D1}\uFE0F</button></div></div> <div class="server-url svelte-h7zsx2"> </div> <!></div>'), Si = E(`<div class="mcp-overlay svelte-h7zsx2"><div class="mcp-panel glass-elevated svelte-h7zsx2"><div class="panel-header svelte-h7zsx2"><div class="header-title svelte-h7zsx2"><span>\u{1F50C}</span> <h3 class="svelte-h7zsx2">MCP Servers</h3> <span class="server-count svelte-h7zsx2"> </span></div> <div class="header-actions svelte-h7zsx2"><button class="btn btn-sm btn-primary"> </button> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></div> <!> <div class="server-list svelte-h7zsx2"><!></div> <div class="panel-footer svelte-h7zsx2"><span class="footer-note svelte-h7zsx2">MCP servers run externally. EZ-Claw connects from the
                    browser.</span></div></div></div>`);
  function Ci(t, e) {
    qe(e, true);
    const a = [];
    let s = O(Ce([])), r = O(false), i = O(""), o = O(""), u = O("sse"), v = O(null);
    const b = "ezclaw_mcp_servers";
    async function _() {
      try {
        const h = await Re(b);
        h && c(s, JSON.parse(h), true);
      } catch (h) {
        console.error("[MCP] Failed to load servers:", h);
      }
    }
    async function z() {
      try {
        await ze(b, JSON.stringify(n(s)));
      } catch (h) {
        console.error("[MCP] Failed to save servers:", h);
      }
    }
    xt(() => {
      _();
    });
    function T() {
      if (!n(i).trim() || !n(o).trim()) return;
      const h = {
        id: crypto.randomUUID().slice(0, 8),
        name: n(i).trim(),
        url: n(o).trim(),
        transport: n(u),
        enabled: true,
        connected: false,
        tools: 0
      };
      c(s, [
        ...n(s),
        h
      ], true), c(i, ""), c(o, ""), c(r, false), z();
    }
    function L(h) {
      c(s, n(s).filter((w) => w.id !== h), true), z();
    }
    async function U(h) {
      const w = n(s).find((D) => D.id === h);
      if (w) if (w.connected) c(s, n(s).map((D) => D.id === h ? {
        ...D,
        connected: false,
        tools: 0
      } : D), true), z();
      else {
        c(v, h, true);
        try {
          await new Promise((D) => setTimeout(D, 1500)), c(s, n(s).map((D) => D.id === h ? {
            ...D,
            connected: true,
            tools: Math.floor(Math.random() * 5) + 1
          } : D), true), z();
        } catch (D) {
          console.error("[MCP] Connection failed:", D);
        }
        c(v, null);
      }
    }
    var S = Be(), p = Ee(S);
    {
      var y = (h) => {
        var w = Si(), D = l(w), V = l(D), I = l(V), R = d(l(I), 4), X = l(R), se = d(I, 2), Q = l(se), pe = l(Q), Z = d(Q, 2), W = d(V, 2);
        {
          var oe = (N) => {
            var ne = gi(), le = l(ne), re = d(le, 2), f = d(re, 2), m = l(f), k = l(m);
            k.value = k.__value = "sse";
            var P = d(m, 2), M = l(P);
            M.value = M.__value = "websocket";
            var B = d(f, 2);
            Se(le, () => n(i), (K) => c(i, K)), Se(re, () => n(o), (K) => c(o, K)), Ca(a, [], k, () => n(u), (K) => c(u, K)), Ca(a, [], M, () => n(u), (K) => c(u, K)), x("click", B, T), g(N, ne);
          };
          $(W, (N) => {
            n(r) && N(oe);
          });
        }
        var ce = d(W, 2), me = l(ce);
        {
          var te = (N) => {
            var ne = yi();
            g(N, ne);
          }, J = (N) => {
            var ne = Be(), le = Ee(ne);
            Ie(le, 17, () => n(s), Te, (re, f) => {
              var m = ki();
              let k;
              var P = l(m), M = l(P), B = l(M);
              let K;
              var H = d(B, 2), ue = l(H), he = d(H, 2), be = l(he), ge = d(M, 2), de = l(ge);
              let A;
              var j = l(de);
              {
                var F = (G) => {
                  var _e = wi();
                  g(G, _e);
                }, ie = (G) => {
                  var _e = Qe("Disconnect");
                  g(G, _e);
                }, ve = (G) => {
                  var _e = Qe("Connect");
                  g(G, _e);
                };
                $(j, (G) => {
                  n(v) === n(f).id ? G(F) : n(f).connected ? G(ie, 1) : G(ve, -1);
                });
              }
              var ye = d(de, 2), ee = d(P, 2), C = l(ee), Y = d(ee, 2);
              {
                var fe = (G) => {
                  var _e = xi(), Ae = l(_e), xe = l(Ae);
                  ae(() => q(xe, `\u{1F527} ${n(f).tools ?? ""} tools`)), g(G, _e);
                };
                $(Y, (G) => {
                  n(f).connected && G(fe);
                });
              }
              ae((G) => {
                k = we(m, 1, "server-card svelte-h7zsx2", null, k, {
                  connected: n(f).connected
                }), K = we(B, 1, "status-dot svelte-h7zsx2", null, K, {
                  active: n(f).connected
                }), q(ue, n(f).name), q(be, G), A = we(de, 1, "btn btn-sm", null, A, {
                  "btn-primary": !n(f).connected,
                  "btn-secondary": n(f).connected
                }), de.disabled = n(v) === n(f).id, q(C, n(f).url);
              }, [
                () => n(f).transport.toUpperCase()
              ]), x("click", de, () => U(n(f).id)), x("click", ye, () => L(n(f).id)), g(re, m);
            }), g(N, ne);
          };
          $(me, (N) => {
            n(s).length === 0 ? N(te) : N(J, -1);
          });
        }
        ae((N) => {
          q(X, `${N ?? ""} connected`), q(pe, n(r) ? "\u2715 Cancel" : "+ Add Server");
        }, [
          () => n(s).filter((N) => N.connected).length
        ]), x("click", w, function(...N) {
          e.onClose?.apply(this, N);
        }), x("click", D, (N) => N.stopPropagation()), x("click", Q, () => c(r, !n(r))), x("click", Z, function(...N) {
          e.onClose?.apply(this, N);
        }), g(h, w);
      };
      $(p, (h) => {
        e.isOpen && h(y);
      });
    }
    g(t, S), Ne();
  }
  De([
    "click"
  ]);
  var Ei = E('<div class="tier-menu svelte-k4so18"><button><span class="tier-icon">\u{1F310}</span> WASI <span class="tier-desc svelte-k4so18">Basic (all platforms)</span></button> <button><span class="tier-icon">\u{1F427}</span> CheerpX <span class="tier-desc svelte-k4so18">Full Linux (desktop)</span></button> <button><span class="tier-icon">\u{1F4BB}</span> Native CLI <span class="tier-desc svelte-k4so18">Host shell (companion)</span></button></div>'), Ai = E("<div> </div>"), zi = E('<div class="terminal-line info svelte-k4so18">\u23F3 Executing...</div>'), Ii = E('<div class="terminal-overlay svelte-k4so18" role="presentation"><div class="terminal-panel glass-elevated svelte-k4so18" role="dialog"><div class="terminal-header svelte-k4so18"><div class="header-left svelte-k4so18"><span class="terminal-title svelte-k4so18">\u{1F5A5}\uFE0F Terminal</span> <div class="tier-selector svelte-k4so18"><button class="tier-btn svelte-k4so18"> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button> <!></div></div> <button class="close-btn svelte-k4so18" aria-label="Close">\u2715</button></div> <div class="terminal-body svelte-k4so18"><!> <!></div> <div class="terminal-input-area svelte-k4so18"><span class="prompt svelte-k4so18">$</span> <input type="text" class="terminal-input svelte-k4so18" placeholder="Type a command..."/></div></div></div>');
  function Mi(t, e) {
    qe(e, true);
    let a = O(Ce([])), s = O(""), r = O("wasi"), i = O(false), o = "ws://localhost:9229", u = O(false), v = O(void 0), b = O(void 0), _ = null;
    xt(() => {
      _ = new ha({
        tier: "wasi",
        enabled: true
      }), _.onOutput((h) => {
        h.includes("\x1B[31m") ? c(a, [
          ...n(a),
          {
            text: h.replace(/\x1b\[\d+m/g, ""),
            type: "stderr"
          }
        ], true) : c(a, [
          ...n(a),
          {
            text: h,
            type: "stdout"
          }
        ], true);
      }), c(a, [
        {
          text: "\u{1F980} EZ-Claw Terminal \u2014 WASI Sandbox",
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
    function z() {
      ca().then(() => {
        n(v) && (n(v).scrollTop = n(v).scrollHeight);
      });
    }
    async function T() {
      const h = n(s).trim();
      if (!(!h || n(i) || !_)) {
        if (c(a, [
          ...n(a),
          {
            text: `$ ${h}`,
            type: "input"
          }
        ], true), c(s, ""), c(i, true), h === "clear") {
          c(a, [], true), c(i, false);
          return;
        }
        try {
          (await _.execute(h)).timedOut && c(a, [
            ...n(a),
            {
              text: "\u23F1 Command timed out",
              type: "stderr"
            }
          ], true);
        } catch (w) {
          c(a, [
            ...n(a),
            {
              text: `Error: ${w.message}`,
              type: "stderr"
            }
          ], true);
        }
        c(i, false), z(), n(b)?.focus();
      }
    }
    async function L(h) {
      if (!_) return;
      c(r, h, true), _.setTier(h), c(u, false);
      const w = _.getStatus();
      if (c(a, [
        ...n(a),
        {
          text: `Switched to ${w.info}`,
          type: "info"
        }
      ], true), h === "native" && !_.isNativeConnected) {
        c(a, [
          ...n(a),
          {
            text: "Connecting to native CLI companion...",
            type: "info"
          }
        ], true);
        try {
          await _.connectNative(o), c(a, [
            ...n(a),
            {
              text: "\u2705 Connected to native CLI companion!",
              type: "info"
            }
          ], true);
        } catch {
          c(a, [
            ...n(a),
            {
              text: "\u274C Failed to connect. Install: npm i -g ezclaw-node && ezclaw-node",
              type: "stderr"
            }
          ], true);
        }
      }
    }
    function U(h) {
      h.key === "Enter" && (h.preventDefault(), T());
    }
    var S = Be(), p = Ee(S);
    {
      var y = (h) => {
        var w = Ii(), D = l(w), V = l(D), I = l(V), R = d(l(I), 2), X = l(R), se = l(X), Q = d(X, 2);
        {
          var pe = (N) => {
            var ne = Ei(), le = l(ne);
            let re;
            var f = d(le, 2);
            let m;
            var k = d(f, 2);
            let P;
            ae(() => {
              re = we(le, 1, "tier-option svelte-k4so18", null, re, {
                active: n(r) === "wasi"
              }), m = we(f, 1, "tier-option svelte-k4so18", null, m, {
                active: n(r) === "cheerpx"
              }), P = we(k, 1, "tier-option svelte-k4so18", null, P, {
                active: n(r) === "native"
              });
            }), x("click", le, () => L("wasi")), x("click", f, () => L("cheerpx")), x("click", k, () => L("native")), g(N, ne);
          };
          $(Q, (N) => {
            n(u) && N(pe);
          });
        }
        var Z = d(I, 2), W = d(V, 2), oe = l(W);
        Ie(oe, 17, () => n(a), Te, (N, ne) => {
          var le = Ai(), re = l(le);
          ae(() => {
            we(le, 1, `terminal-line ${n(ne).type ?? ""}`, "svelte-k4so18"), q(re, n(ne).text);
          }), g(N, le);
        });
        var ce = d(oe, 2);
        {
          var me = (N) => {
            var ne = zi();
            g(N, ne);
          };
          $(ce, (N) => {
            n(i) && N(me);
          });
        }
        Pt(W, (N) => c(v, N), () => n(v));
        var te = d(W, 2), J = d(l(te), 2);
        Pt(J, (N) => c(b, N), () => n(b)), ae((N) => {
          q(se, `${N ?? ""} `), J.disabled = n(i);
        }, [
          () => n(r).toUpperCase()
        ]), x("click", w, function(...N) {
          e.onClose?.apply(this, N);
        }), x("click", D, (N) => N.stopPropagation()), x("click", X, () => c(u, !n(u))), x("click", Z, function(...N) {
          e.onClose?.apply(this, N);
        }), x("keydown", J, U), Se(J, () => n(s), (N) => c(s, N)), g(h, w);
      };
      $(p, (h) => {
        e.isOpen && h(y);
      });
    }
    g(t, S), Ne();
  }
  De([
    "click",
    "keydown"
  ]);
  var Oi = E('<div class="empty-state svelte-1hbucu"><div class="empty-icon svelte-1hbucu">\u{1F4E1}</div> <p>No channels configured</p> <button class="add-btn primary svelte-1hbucu">+ Add Channel</button></div>'), Ti = E('<span class="detail svelte-1hbucu"> </span>'), Pi = E('<div class="channel-card svelte-1hbucu"><div class="channel-header svelte-1hbucu"><span class="channel-icon svelte-1hbucu"> </span> <div class="channel-info svelte-1hbucu"><span class="channel-name svelte-1hbucu"> </span> <span class="channel-type svelte-1hbucu"> </span></div> <div class="channel-status svelte-1hbucu"><span class="status-dot svelte-1hbucu"></span> </div></div> <div class="channel-details svelte-1hbucu"><!> <span class="detail svelte-1hbucu"> </span></div> <div class="channel-actions svelte-1hbucu"><button> </button> <button class="action-btn danger svelte-1hbucu">Remove</button></div></div>'), Di = E('<div class="channels-list svelte-1hbucu"></div> <button class="add-btn svelte-1hbucu">+ Add Another Channel</button>', 1), qi = E('<div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Bot OAuth Token (xoxb-...)</label> <input type="password" placeholder="xoxb-..." class="svelte-1hbucu"/></div>'), Ni = E('<p class="svelte-1hbucu">1. Open Telegram, search for <strong>@BotFather</strong></p> <p class="svelte-1hbucu">2. Send <code class="svelte-1hbucu">/newbot</code> and follow the prompts</p> <p class="svelte-1hbucu">3. Copy the bot token and paste it above</p>', 1), Ui = E(`<p class="svelte-1hbucu">1. Go to <strong>discord.com/developers</strong></p> <p class="svelte-1hbucu">2. Create an Application \u2192 Bot \u2192 Copy Token</p> <p class="svelte-1hbucu">3. Enable MESSAGE CONTENT intent</p> <p class="svelte-1hbucu">4. Invite bot to your server with Messages
                                    permission</p>`, 1), Ri = E(`<p class="svelte-1hbucu">1. Go to <strong>api.slack.com/apps</strong></p> <p class="svelte-1hbucu">2. Create App \u2192 Enable Socket Mode \u2192 Copy
                                    App Token</p> <p class="svelte-1hbucu">3. Install to workspace \u2192 Copy Bot OAuth
                                    Token</p>`, 1), Bi = E('<div class="add-form svelte-1hbucu"><h3 class="svelte-1hbucu">Add Channel</h3> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Platform</label> <div class="platform-selector svelte-1hbucu"><button>\u2708\uFE0F Telegram</button> <button>\u{1F3AE} Discord</button> <button>\u{1F4BC} Slack</button></div></div> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu">Bot Name</label> <input type="text" class="svelte-1hbucu"/></div> <div class="form-group svelte-1hbucu"><label class="svelte-1hbucu"><!></label> <input type="password" class="svelte-1hbucu"/></div> <!> <div class="setup-help svelte-1hbucu"><!></div> <div class="form-actions svelte-1hbucu"><button class="cancel-btn svelte-1hbucu">Cancel</button> <button class="save-btn svelte-1hbucu">Add Channel</button></div></div>'), Li = E(`<div class="channels-overlay svelte-1hbucu" role="presentation"><div class="channels-panel glass-elevated svelte-1hbucu" role="dialog"><div class="panel-header svelte-1hbucu"><h2 class="svelte-1hbucu">\u{1F4E1} Messaging Channels</h2> <button class="close-btn svelte-1hbucu" aria-label="Close">\u2715</button></div> <div class="panel-body svelte-1hbucu"><div class="section-info svelte-1hbucu"><p class="svelte-1hbucu">Connect EZ-Claw to messaging platforms. Your agent will
                        respond to messages automatically.</p> <p class="info-note svelte-1hbucu">All connections are 100% client-side \u2014 no server
                        required.</p></div> <!> <!></div></div></div>`);
  function Wi(t, e) {
    qe(e, true);
    let a = O(Ce([])), s = O(false), r = O("telegram"), i = O(""), o = O(""), u = O("");
    xt(() => {
      try {
        const h = localStorage.getItem("ezclaw_channels");
        h && c(a, JSON.parse(h), true);
      } catch {
      }
    });
    function v() {
      const h = n(a).map((w) => ({
        type: w.type,
        name: w.name,
        enabled: w.enabled,
        status: "disconnected",
        token: w.token ? "***" : "",
        botName: w.botName,
        messageCount: w.messageCount
      }));
      localStorage.setItem("ezclaw_channels", JSON.stringify(h));
    }
    function b() {
      if (!n(i).trim()) return;
      const h = {
        type: n(r),
        name: n(u).trim() || `My ${n(r)} Bot`,
        enabled: false,
        status: "disconnected",
        token: n(i).trim(),
        botToken: n(r) === "slack" ? n(o).trim() : void 0,
        messageCount: 0
      };
      c(a, [
        ...n(a),
        h
      ], true), c(s, false), c(i, ""), c(o, ""), c(u, ""), v();
    }
    function _(h) {
      c(a, n(a).filter((w, D) => D !== h), true), v();
    }
    async function z(h) {
      const w = n(a)[h];
      w.status === "connected" ? n(a)[h] = {
        ...w,
        status: "disconnected",
        enabled: false
      } : (n(a)[h] = {
        ...w,
        status: "connecting",
        enabled: true
      }, setTimeout(() => {
        n(a)[h] = {
          ...n(a)[h],
          status: "connected",
          botName: `${w.name} Bot`
        }, c(a, [
          ...n(a)
        ], true);
      }, 1500)), c(a, [
        ...n(a)
      ], true), v();
    }
    function T(h) {
      switch (h) {
        case "telegram":
          return "\u2708\uFE0F";
        case "discord":
          return "\u{1F3AE}";
        case "slack":
          return "\u{1F4BC}";
      }
    }
    function L(h) {
      switch (h) {
        case "telegram":
          return "#0088cc";
        case "discord":
          return "#5865F2";
        case "slack":
          return "#4A154B";
      }
    }
    function U(h) {
      switch (h) {
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
    var S = Be(), p = Ee(S);
    {
      var y = (h) => {
        var w = Li(), D = l(w), V = l(D), I = d(l(V), 2), R = d(V, 2), X = d(l(R), 2);
        {
          var se = (W) => {
            var oe = Oi(), ce = d(l(oe), 4);
            x("click", ce, () => c(s, true)), g(W, oe);
          }, Q = (W) => {
            var oe = Di(), ce = Ee(oe);
            Ie(ce, 21, () => n(a), Te, (te, J, N) => {
              var ne = Pi(), le = l(ne), re = l(le), f = l(re), m = d(re, 2), k = l(m), P = l(k), M = d(k, 2), B = l(M), K = d(m, 2), H = l(K), ue = d(H), he = d(le, 2), be = l(he);
              {
                var ge = (ee) => {
                  var C = Ti(), Y = l(C);
                  ae(() => q(Y, `\u{1F916} ${n(J).botName ?? ""}`)), g(ee, C);
                };
                $(be, (ee) => {
                  n(J).botName && ee(ge);
                });
              }
              var de = d(be, 2), A = l(de), j = d(he, 2), F = l(j);
              let ie;
              var ve = l(F), ye = d(F, 2);
              ae((ee, C, Y, fe) => {
                It(ne, `--ch-color: ${ee ?? ""}`), q(f, C), q(P, n(J).name), q(B, n(J).type), It(K, `color: ${Y ?? ""}`), It(H, `background: ${fe ?? ""}`), q(ue, ` ${n(J).status ?? ""}`), q(A, `\u{1F4AC} ${n(J).messageCount ?? ""} messages`), ie = we(F, 1, "action-btn svelte-1hbucu", null, ie, {
                  connected: n(J).status === "connected"
                }), q(ve, n(J).status === "connected" ? "Disconnect" : n(J).status === "connecting" ? "Connecting..." : "Connect");
              }, [
                () => L(n(J).type),
                () => T(n(J).type),
                () => U(n(J).status),
                () => U(n(J).status)
              ]), x("click", F, () => z(N)), x("click", ye, () => _(N)), g(te, ne);
            });
            var me = d(ce, 2);
            x("click", me, () => c(s, true)), g(W, oe);
          };
          $(X, (W) => {
            n(a).length === 0 ? W(se) : W(Q, -1);
          });
        }
        var pe = d(X, 2);
        {
          var Z = (W) => {
            var oe = Bi(), ce = d(l(oe), 2), me = d(l(ce), 2), te = l(me);
            let J;
            var N = d(te, 2);
            let ne;
            var le = d(N, 2);
            let re;
            var f = d(ce, 2), m = d(l(f), 2), k = d(f, 2), P = l(k), M = l(P);
            {
              var B = (ee) => {
                var C = Qe(`Bot Token (from
                                    @BotFather)`);
                g(ee, C);
              }, K = (ee) => {
                var C = Qe(`Bot Token (from
                                    Discord Developer Portal)`);
                g(ee, C);
              }, H = (ee) => {
                var C = Qe("App-Level Token (xapp-...)");
                g(ee, C);
              };
              $(M, (ee) => {
                n(r) === "telegram" ? ee(B) : n(r) === "discord" ? ee(K, 1) : ee(H, -1);
              });
            }
            var ue = d(P, 2), he = d(k, 2);
            {
              var be = (ee) => {
                var C = qi(), Y = d(l(C), 2);
                Se(Y, () => n(o), (fe) => c(o, fe)), g(ee, C);
              };
              $(he, (ee) => {
                n(r) === "slack" && ee(be);
              });
            }
            var ge = d(he, 2), de = l(ge);
            {
              var A = (ee) => {
                var C = Ni();
                g(ee, C);
              }, j = (ee) => {
                var C = Ui();
                g(ee, C);
              }, F = (ee) => {
                var C = Ri();
                g(ee, C);
              };
              $(de, (ee) => {
                n(r) === "telegram" ? ee(A) : n(r) === "discord" ? ee(j, 1) : ee(F, -1);
              });
            }
            var ie = d(ge, 2), ve = l(ie), ye = d(ve, 2);
            ae((ee) => {
              J = we(te, 1, "platform-btn svelte-1hbucu", null, J, {
                active: n(r) === "telegram"
              }), ne = we(N, 1, "platform-btn svelte-1hbucu", null, ne, {
                active: n(r) === "discord"
              }), re = we(le, 1, "platform-btn svelte-1hbucu", null, re, {
                active: n(r) === "slack"
              }), Ke(m, "placeholder", `My ${n(r)} Bot`), Ke(ue, "placeholder", n(r) === "slack" ? "xapp-1-..." : "Bot token"), ye.disabled = ee;
            }, [
              () => !n(i).trim()
            ]), x("click", te, () => c(r, "telegram")), x("click", N, () => c(r, "discord")), x("click", le, () => c(r, "slack")), Se(m, () => n(u), (ee) => c(u, ee)), Se(ue, () => n(i), (ee) => c(i, ee)), x("click", ve, () => {
              c(s, false), c(i, "");
            }), x("click", ye, b), g(W, oe);
          };
          $(pe, (W) => {
            n(s) && W(Z);
          });
        }
        x("click", w, function(...W) {
          e.onClose?.apply(this, W);
        }), x("click", D, (W) => W.stopPropagation()), x("click", I, function(...W) {
          e.onClose?.apply(this, W);
        }), g(h, w);
      };
      $(p, (h) => {
        e.isOpen && h(y);
      });
    }
    g(t, S), Ne();
  }
  De([
    "click"
  ]);
  var ji = E('<span class="identity-badge svelte-1ay4w4h"> </span>'), Fi = E('<div class="create-form svelte-1ay4w4h"><input class="input" type="text" placeholder="Persona name..."/> <label class="checkbox-label svelte-1ay4w4h"><input type="checkbox"/> Clone current identity</label> <button class="btn btn-primary btn-sm">Create</button></div>'), $i = E('<p class="empty-msg svelte-1ay4w4h">No personas saved yet. Create one to get started!</p>'), Ji = E('<input class="input input-sm svelte-1ay4w4h"/>'), Hi = E('<strong class="svelte-1ay4w4h"> </strong>'), Vi = E('<span class="active-badge svelte-1ay4w4h">Active</span>'), Ki = E('<button class="btn btn-sm btn-primary">\u25B6 Use</button>'), Yi = E('<button class="btn btn-sm btn-secondary">\u2713</button>'), Zi = E('<button class="btn btn-sm btn-ghost">\u270F\uFE0F</button>'), Gi = E('<div><div class="persona-main svelte-1ay4w4h"><span class="persona-emoji svelte-1ay4w4h"> </span> <div class="persona-info svelte-1ay4w4h"><!> <span class="persona-sub svelte-1ay4w4h"> </span></div> <!></div> <div class="persona-actions svelte-1ay4w4h"><!> <!> <button class="btn btn-sm btn-danger svelte-1ay4w4h">\u{1F5D1}\uFE0F</button></div></div>'), Xi = E('<div class="persona-list svelte-1ay4w4h"></div>'), Qi = E('<div class="delete-confirm svelte-1ay4w4h"><h3 class="svelte-1ay4w4h"> </h3> <p>Type <code class="svelte-1ay4w4h"></code> to confirm. <strong> </strong> confirmations.</p> <div class="delete-input-row svelte-1ay4w4h"><input class="input svelte-1ay4w4h" type="text"/> <button class="btn btn-danger btn-sm svelte-1ay4w4h"> </button></div> <button class="btn btn-ghost btn-sm">Cancel</button></div>'), eo = E('<p class="status-msg svelte-1ay4w4h"> </p>'), to = E('<div class="modal-overlay"><div class="panel"><div class="panel-header svelte-1ay4w4h"><h2 class="svelte-1ay4w4h">\u{1F3AD} Personas</h2> <button class="btn btn-ghost btn-icon" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="section svelte-1ay4w4h"><h3 class="svelte-1ay4w4h">Active Identity</h3> <div class="active-identity svelte-1ay4w4h"><span class="identity-emoji svelte-1ay4w4h"> </span> <div class="identity-info svelte-1ay4w4h"><strong class="svelte-1ay4w4h"> </strong> <span class="identity-vibe svelte-1ay4w4h"> </span></div> <!></div></div> <div class="divider"></div> <div class="section svelte-1ay4w4h"><div class="section-header svelte-1ay4w4h"><h3 class="svelte-1ay4w4h"> </h3> <button class="btn btn-sm btn-secondary"> </button></div> <!> <!></div> <!> <div class="divider"></div> <div class="section svelte-1ay4w4h"><h3 class="svelte-1ay4w4h">Import / Export</h3> <div class="io-row svelte-1ay4w4h"><button class="btn btn-secondary">\u{1F4E4} Export All</button> <button class="btn btn-secondary">\u{1F4E5} Import</button></div> <!></div></div></div>');
  function ao(t, e) {
    qe(e, true);
    let a = O(Ce(He())), s = O(Ce(rt())), r = O(Ce(Pe())), i = O(""), o = O(false), u = O(true), v = O(null), b = O(""), _ = O(0);
    const z = "DELETE THIS PERSONA", T = 3;
    let L = O(null), U = O(""), S = O("");
    function p() {
      c(a, He(), true), c(s, rt(), true), c(r, Pe(), true);
    }
    function y() {
      n(i).trim() && (n(u) ? rr(n(i).trim()) : ma(n(i).trim(), false), c(i, ""), c(o, false), p());
    }
    function h(C) {
      gn(C), p(), e.onPersonaSwitch?.();
    }
    function w(C) {
      c(v, C, true), c(b, ""), c(_, 0);
    }
    function D() {
      n(b).trim().toUpperCase() === z && (ss(_), c(b, ""), n(_) >= T && n(v) && (yn(n(v).id), c(v, null), c(_, 0), p()));
    }
    function V(C) {
      c(L, C.id, true), c(U, C.label, true);
    }
    function I() {
      n(L) && n(U).trim() && (wn(n(L), n(U).trim()), c(L, null), c(U, ""), p());
    }
    function R() {
      try {
        const C = xn(), Y = new Blob([
          C
        ], {
          type: "application/json"
        }), fe = URL.createObjectURL(Y), G = document.createElement("a");
        G.href = fe, G.download = `ezclaw-personas-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, G.click(), URL.revokeObjectURL(fe), c(S, "\u2705 Exported!"), setTimeout(() => c(S, ""), 3e3);
      } catch {
        c(S, "\u274C Export failed");
      }
    }
    function X() {
      const C = document.createElement("input");
      C.type = "file", C.accept = ".json", C.onchange = async () => {
        const Y = C.files?.[0];
        if (Y) try {
          const fe = await Y.text(), G = kn(fe);
          c(S, `\u2705 Imported ${G} persona(s)`), p(), setTimeout(() => c(S, ""), 3e3);
        } catch {
          c(S, "\u274C Import failed \u2014 invalid file");
        }
      }, C.click();
    }
    var se = to(), Q = l(se), pe = l(Q), Z = d(l(pe), 2), W = d(pe, 2), oe = d(l(W), 2), ce = l(oe), me = l(ce), te = d(ce, 2), J = l(te), N = l(J), ne = d(J, 2), le = l(ne), re = d(te, 2);
    {
      var f = (C) => {
        var Y = ji(), fe = l(Y);
        ae(() => q(fe, n(r).creature)), g(C, Y);
      };
      $(re, (C) => {
        n(r).creature && n(r).creature !== "AI agent" && C(f);
      });
    }
    var m = d(W, 4), k = l(m), P = l(k), M = l(P), B = d(P, 2), K = l(B), H = d(k, 2);
    {
      var ue = (C) => {
        var Y = Fi(), fe = l(Y), G = d(fe, 2), _e = l(G), Ae = d(G, 2);
        ae((xe) => Ae.disabled = xe, [
          () => !n(i).trim()
        ]), x("keydown", fe, (xe) => xe.key === "Enter" && y()), Se(fe, () => n(i), (xe) => c(i, xe)), ws(_e, () => n(u), (xe) => c(u, xe)), x("click", Ae, y), g(C, Y);
      };
      $(H, (C) => {
        n(o) && C(ue);
      });
    }
    var he = d(H, 2);
    {
      var be = (C) => {
        var Y = $i();
        g(C, Y);
      }, ge = (C) => {
        var Y = Xi();
        Ie(Y, 21, () => n(a), (fe) => fe.id, (fe, G) => {
          var _e = Gi();
          let Ae;
          var xe = l(_e), Le = l(xe), $e = l(Le), Ze = d(Le, 2), ct = l(Ze);
          {
            var Bt = (ke) => {
              var Me = Ji();
              x("keydown", Me, (ut) => ut.key === "Enter" && I()), Se(Me, () => n(U), (ut) => c(U, ut)), g(ke, Me);
            }, Lt = (ke) => {
              var Me = Hi(), ut = l(Me);
              ae(() => q(ut, n(G).label)), g(ke, Me);
            };
            $(ct, (ke) => {
              n(L) === n(G).id ? ke(Bt) : ke(Lt, -1);
            });
          }
          var dt = d(ct, 2), En = l(dt), An = d(Ze, 2);
          {
            var zn = (ke) => {
              var Me = Vi();
              g(ke, Me);
            };
            $(An, (ke) => {
              n(G).id === n(s) && ke(zn);
            });
          }
          var In = d(xe, 2), ba = l(In);
          {
            var Mn = (ke) => {
              var Me = Ki();
              x("click", Me, () => h(n(G).id)), g(ke, Me);
            };
            $(ba, (ke) => {
              n(G).id !== n(s) && ke(Mn);
            });
          }
          var _a = d(ba, 2);
          {
            var On = (ke) => {
              var Me = Yi();
              x("click", Me, I), g(ke, Me);
            }, Tn = (ke) => {
              var Me = Zi();
              x("click", Me, () => V(n(G))), g(ke, Me);
            };
            $(_a, (ke) => {
              n(L) === n(G).id ? ke(On) : ke(Tn, -1);
            });
          }
          var Pn = d(_a, 2);
          ae(() => {
            Ae = we(_e, 1, "persona-card svelte-1ay4w4h", null, Ae, {
              active: n(G).id === n(s)
            }), q($e, n(G).identity.emoji || "\u{1F980}"), q(En, `${(n(G).identity.name || "(unnamed)") ?? ""} \xB7 ${(n(G).identity.vibe || "no vibe") ?? ""}`);
          }), x("click", Pn, () => w(n(G))), g(fe, _e);
        }), g(C, Y);
      };
      $(he, (C) => {
        n(a).length === 0 ? C(be) : C(ge, -1);
      });
    }
    var de = d(m, 2);
    {
      var A = (C) => {
        var Y = Qi(), fe = l(Y), G = l(fe), _e = d(fe, 2), Ae = d(l(_e));
        Ae.textContent = "DELETE THIS PERSONA";
        var xe = d(Ae, 2), Le = l(xe), $e = d(_e, 2), Ze = l($e);
        Ke(Ze, "placeholder", z);
        var ct = d(Ze, 2), Bt = l(ct), Lt = d($e, 2);
        ae(() => {
          q(G, `\u26A0\uFE0F Delete "${n(v).label ?? ""}"?`), q(Le, `${n(_) ?? ""}/3`), q(Bt, `Confirm (${n(_) ?? ""}/3)`);
        }), x("keydown", Ze, (dt) => dt.key === "Enter" && D()), Se(Ze, () => n(b), (dt) => c(b, dt)), x("click", ct, D), x("click", Lt, () => {
          c(v, null), c(_, 0);
        }), g(C, Y);
      };
      $(de, (C) => {
        n(v) && C(A);
      });
    }
    var j = d(de, 4), F = d(l(j), 2), ie = l(F), ve = d(ie, 2), ye = d(F, 2);
    {
      var ee = (C) => {
        var Y = eo(), fe = l(Y);
        ae(() => q(fe, n(S))), g(C, Y);
      };
      $(ye, (C) => {
        n(S) && C(ee);
      });
    }
    ae(() => {
      q(me, n(r).emoji || "\u{1F980}"), q(N, n(r).name || "(unnamed)"), q(le, n(r).vibe || "not set"), q(M, `Saved Personas (${n(a).length ?? ""})`), q(K, n(o) ? "\u2715 Cancel" : "+ New");
    }), x("click", se, function(...C) {
      e.onClose?.apply(this, C);
    }), x("click", Q, (C) => C.stopPropagation()), x("click", Z, function(...C) {
      e.onClose?.apply(this, C);
    }), x("click", B, () => c(o, !n(o))), x("click", ie, R), x("click", ve, X), g(t, se), Ne();
  }
  De([
    "click",
    "keydown"
  ]);
  let Ue = null, Mt = null, Et = /* @__PURE__ */ new Map(), Oe = {
    provider: "deepseek",
    model: "deepseek-chat",
    apiKey: "",
    temperature: 0.7,
    apiUrl: ""
  };
  function no() {
    if (!Ue) throw new Error("EZClaw not initialized");
    return Mt || (Mt = new Ue.WasmWorkspace()), Mt;
  }
  async function qa() {
    try {
      const t = await Re("provider"), e = await Re("model"), a = await Re("apiKey"), s = await Re("temperature"), r = await Re("apiUrl");
      t && (Oe.provider = t), e && (Oe.model = e), a && (Oe.apiKey = a), s && (Oe.temperature = parseFloat(s)), r && (Oe.apiUrl = r);
    } catch {
    }
  }
  const so = {
    async init() {
      if (Ue) return;
      const { initStorage: t } = await Tt(async () => {
        const { initStorage: e } = await Promise.resolve().then(() => tr);
        return {
          initStorage: e
        };
      }, void 0, import.meta.url);
      await t(), await qa(), Ue = await Xa();
      try {
        await aa();
      } catch {
      }
      new ha({
        tier: "wasi",
        enabled: true
      }), Mt = new Ue.WasmWorkspace(), console.log("[EZClaw] Initialized");
    },
    isReady() {
      return Ue !== null && Bs();
    },
    getVersion() {
      if (!Ue) throw new Error("EZClaw not initialized. Call init() first.");
      return Ue.version();
    },
    async chat(t, e) {
      if (!Ue) throw new Error("EZClaw not initialized. Call init() first.");
      if (!et.includes(Oe.provider) && !Oe.apiKey) throw new Error("No API key configured. Call setConfig() first.");
      const a = {
        temperature: e?.temperature ?? Oe.temperature,
        model: e?.model ?? Oe.model,
        stream: e?.stream ?? false,
        onToolCall: e?.onToolCall,
        onChunk: e?.onChunk
      }, s = [
        {
          role: "user",
          content: t
        }
      ];
      let r = hn();
      ra() && (r += `

` + bn());
      let i = [];
      try {
        i = yt(t, 5).map((y) => `[${y.category}] ${y.key}: ${y.content}`);
      } catch {
      }
      const o = new Ue.WasmAgent(JSON.stringify({
        default_provider: Oe.provider,
        default_model: a.model,
        default_temperature: a.temperature
      })), u = o.build_messages(JSON.stringify(s), JSON.stringify(i), r, (/* @__PURE__ */ new Date()).toLocaleString());
      let v = JSON.parse(u);
      const b = 10;
      let _ = "";
      const z = no(), { buildProviderHeaders: T } = await Tt(async () => {
        const { buildProviderHeaders: p } = await Promise.resolve().then(() => Ls);
        return {
          buildProviderHeaders: p
        };
      }, void 0, import.meta.url), U = `${Oe.apiUrl || Ue.provider_base_url(Oe.provider)}/chat/completions`, S = T(Oe.provider, Oe.apiKey);
      for (let p = 0; p < b; p++) {
        const y = Ue.build_provider_request(JSON.stringify(v), a.model, a.temperature, false), h = await fetch(U, {
          method: "POST",
          headers: S,
          body: y
        });
        if (!h.ok) {
          const I = await h.text();
          throw new Error(`API error ${h.status}: ${I}`);
        }
        const D = (await h.json()).choices?.[0];
        if (!D) throw new Error("No response from model");
        const V = D.message;
        if (V.tool_calls?.length > 0) {
          v.push(V);
          for (const I of V.tool_calls) {
            const R = {
              id: I.id || crypto.randomUUID(),
              name: I.function?.name || I.name || "unknown",
              arguments: I.function?.arguments || I.arguments || "{}"
            };
            let X;
            e?.onToolCall ? X = await e.onToolCall(R) : X = await or(o, z, R), v.push({
              role: "tool",
              tool_call_id: R.id,
              content: X.output || X.error || ""
            });
          }
          continue;
        }
        _ = V.content || "";
        break;
      }
      return o.free(), ra() && _.includes("bootstrapped") && mn(), _;
    },
    getIdentity() {
      return Pe();
    },
    setIdentity(t) {
      const a = {
        ...Pe(),
        ...t,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return lt(a), a;
    },
    getUser() {
      return at();
    },
    setUser(t) {
      const a = {
        ...at(),
        ...t
      };
      return fa(a), a;
    },
    listPersonas() {
      return He();
    },
    getActivePersonaId() {
      return rt();
    },
    switchPersona(t) {
      return gn(t);
    },
    createPersona(t, e = false) {
      return ma(t, e);
    },
    deletePersona(t) {
      return yn(t);
    },
    renamePersona(t, e) {
      return wn(t, e);
    },
    exportPersonas() {
      return xn();
    },
    importPersonas(t) {
      return kn(t);
    },
    async getConfig() {
      return await qa(), {
        ...Oe
      };
    },
    async setConfig(t) {
      Oe = {
        ...Oe,
        ...t
      }, t.provider !== void 0 && await ze("provider", t.provider), t.model !== void 0 && await ze("model", t.model), t.apiKey !== void 0 && await ze("apiKey", t.apiKey), t.temperature !== void 0 && await ze("temperature", String(t.temperature)), t.apiUrl !== void 0 && await ze("apiUrl", t.apiUrl || "");
    },
    recallMemories(t, e = 5) {
      return yt(t, e);
    },
    storeMemory(t, e, a = "general") {
      We(t, e, a);
    },
    on(t, e) {
      Et.has(t) || Et.set(t, /* @__PURE__ */ new Set()), Et.get(t).add(e);
    },
    off(t, e) {
      Et.get(t)?.delete(e);
    }
  };
  typeof window < "u" && (window.EZClaw = so);
  var ro = E('<div class="loading-screen svelte-1n46o8q"><div class="loading-logo svelte-1n46o8q"><div class="loading-claw svelte-1n46o8q">\u{1F980}</div> <h1 class="svelte-1n46o8q">EZ-Claw</h1> <p class="svelte-1n46o8q">Loading ZeroClaw engine...</p> <div class="loading-bar svelte-1n46o8q"><div class="loading-progress svelte-1n46o8q"></div></div></div></div>'), io = E('<div class="loading-screen svelte-1n46o8q"><div class="loading-logo svelte-1n46o8q"><div class="loading-claw svelte-1n46o8q">\u{1F980}</div> <h1 class="svelte-1n46o8q">EZ-Claw</h1> <p style="color: var(--error);" class="svelte-1n46o8q">Failed to load WASM engine</p> <p style="font-size: var(--text-xs); color: var(--text-tertiary); max-width: 400px; word-break: break-all;" class="svelte-1n46o8q"> </p> <button class="btn btn-primary svelte-1n46o8q" style="margin-top: 16px;">Retry</button></div></div>'), oo = E('<div><!> <div class="main-area svelte-1n46o8q"><!> <!></div></div> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
  co = function(t, e) {
    qe(e, true);
    let a = O(false), s = O(true), r = O(""), i = O(false), o = O(false), u = O(false), v = O(false), b = O(false), _ = O(false), z = O(false), T = O(false), L = O(false), U = O(false), S = O(Ce([])), p = O(null), y = O("deepseek"), h = O("deepseek-chat"), w = O(""), D = O(0.7), V = O("");
    const I = "ezclaw_memory_db", R = "memory", X = "ezclaw_memory";
    let se;
    function Q() {
      return new Promise((f, m) => {
        const k = indexedDB.open(I, 1);
        k.onupgradeneeded = () => {
          const P = k.result;
          P.objectStoreNames.contains(R) || P.createObjectStore(R);
        }, k.onsuccess = () => f(k.result), k.onerror = () => m(k.error);
      });
    }
    async function pe() {
      try {
        const f = await Q(), P = f.transaction(R, "readonly").objectStore(R).get(X), M = await new Promise((B, K) => {
          P.onsuccess = () => B(P.result), P.onerror = () => K(P.error);
        });
        return f.close(), M || null;
      } catch {
        return null;
      }
    }
    async function Z() {
      try {
        const f = nr();
        if (f) {
          const m = await Q(), k = m.transaction(R, "readwrite");
          k.objectStore(R).put(f, X), await new Promise((P, M) => {
            k.oncomplete = () => P(), k.onerror = () => M(k.error);
          }), m.close();
        }
      } catch {
      }
    }
    typeof window < "u" && window.addEventListener("beforeunload", () => {
      Z();
    }), Ss(() => {
      se && clearInterval(se);
    }), xt(async () => {
      try {
        await rn();
        try {
          await Xa(), c(a, true);
          try {
            const H = await pe();
            H ? (await ar(H), console.log("[EZ-Claw] Memory restored from IndexedDB")) : await aa(), se = setInterval(Z, 3e4);
          } catch (H) {
            console.warn("[EZ-Claw] Memory init failed:", H);
            try {
              await aa();
            } catch {
            }
          }
        } catch (H) {
          console.warn("[EZ-Claw] WASM load failed, running in degraded mode:", H), c(r, `WASM load failed: ${H instanceof Error ? H.message : String(H)}`);
        }
        const f = await Re("provider"), m = await Re("model"), k = await Re("apiKey"), P = await Re("temperature"), M = await Re("apiUrl");
        f && (!tn(f) || f === "novita") ? (console.warn(`[EZ-Claw] Invalid/unavailable provider "${f}", resetting to openrouter`), c(y, "openrouter"), await ze("provider", n(y))) : f && c(y, f, true), m && c(h, m, true), k && c(w, k, true), P && c(D, parseFloat(P), true), M && c(V, M, true);
        const B = en(n(y));
        !(B.length === 0 || B.some((H) => n(h)?.includes(H.split("/").pop() || H))) && n(h) && (console.warn(`[EZ-Claw] Invalid model "${n(h)}" for provider "${n(y)}", resetting to default`), c(h, Qa(n(y)), true), await ze("model", n(h))), c(S, await va(), true), n(S).length > 0 && c(p, n(S)[0].id, true), n(w) || c(u, true), c(s, false);
      } catch (f) {
        console.error("[EZ-Claw] Init failed:", f), c(r, `Init failed: ${f instanceof Error ? f.message : String(f)}`), c(s, false);
      }
    });
    function W() {
      const f = crypto.randomUUID(), m = {
        id: f,
        title: "New Chat",
        messages: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        model: n(h),
        provider: n(y)
      };
      c(S, [
        m,
        ...n(S)
      ], true), c(p, f, true), c(i, false);
    }
    function oe(f) {
      c(p, f, true), c(i, false);
    }
    function ce(f) {
      c(S, n(S).filter((m) => m.id !== f), true), n(p) === f && c(p, n(S).length > 0 ? n(S)[0].id : null, true);
    }
    function me(f) {
      c(S, n(S).map((m) => m.id === f.id ? f : m), true);
    }
    async function te(f) {
      c(y, f.provider, true), c(h, f.model, true), c(w, f.apiKey, true), await ze("provider", f.provider), await ze("model", f.model), await ze("apiKey", f.apiKey), c(u, false), n(S).length === 0 && W();
    }
    var J = Be(), N = Ee(J);
    {
      var ne = (f) => {
        var m = ro();
        g(f, m);
      }, le = (f) => {
        var m = io(), k = l(m), P = d(l(k), 6), M = l(P), B = d(P, 2);
        ae(() => q(M, n(r))), x("click", B, () => location.reload()), g(f, m);
      }, re = (f) => {
        var m = oo(), k = Ee(m);
        let P;
        var M = l(k);
        Ts(M, {
          get sessions() {
            return n(S);
          },
          get activeSessionId() {
            return n(p);
          },
          get isOpen() {
            return n(i);
          },
          onNewSession: W,
          onSelectSession: oe,
          onDeleteSession: ce,
          onClose: () => c(i, false)
        });
        var B = d(M, 2), K = l(B);
        {
          let C = zt(() => n(S).find((Y) => Y.id === n(p))?.title || "EZ-Claw");
          As(K, {
            get sessionTitle() {
              return n(C);
            },
            get model() {
              return n(h);
            },
            get provider() {
              return n(y);
            },
            get wasmStatus() {
              return n(a);
            },
            onToggleSidebar: () => c(i, !n(i)),
            onOpenSettings: () => c(o, true),
            onOpenWorkspace: () => c(v, true),
            onOpenSecurity: () => c(b, true),
            onOpenSkills: () => c(_, true),
            onOpenMCP: () => c(z, true),
            onOpenTerminal: () => c(T, true),
            onOpenChannels: () => c(L, true),
            onOpenPersonas: () => c(U, true)
          });
        }
        var H = d(K, 2);
        Cr(H, {
          get sessionId() {
            return n(p);
          },
          get provider() {
            return n(y);
          },
          get model() {
            return n(h);
          },
          get apiKey() {
            return n(w);
          },
          get temperature() {
            return n(D);
          },
          get apiUrl() {
            return n(V);
          },
          onSessionUpdate: me
        });
        var ue = d(k, 2);
        {
          var he = (C) => {
            Pr(C, {
              get provider() {
                return n(y);
              },
              get model() {
                return n(h);
              },
              get apiKey() {
                return n(w);
              },
              get temperature() {
                return n(D);
              },
              get apiUrl() {
                return n(V);
              },
              onClose: () => c(o, false),
              onSave: async (Y) => {
                c(y, Y.provider, true), c(h, Y.model, true), c(w, Y.apiKey, true), c(D, Y.temperature, true), c(V, Y.apiUrl, true), await ze("provider", Y.provider), await ze("model", Y.model), await ze("apiKey", Y.apiKey), await ze("temperature", String(Y.temperature)), await ze("apiUrl", Y.apiUrl), c(o, false);
              }
            });
          };
          $(ue, (C) => {
            n(o) && C(he);
          });
        }
        var be = d(ue, 2);
        {
          var ge = (C) => {
            Wr(C, {
              onComplete: te
            });
          };
          $(be, (C) => {
            n(u) && C(ge);
          });
        }
        var de = d(be, 2);
        Qr(de, {
          get isOpen() {
            return n(v);
          },
          onClose: () => c(v, false)
        });
        var A = d(de, 2);
        ui(A, {
          get isOpen() {
            return n(b);
          },
          onClose: () => c(b, false)
        });
        var j = d(A, 2);
        _i(j, {
          get isOpen() {
            return n(_);
          },
          onClose: () => c(_, false)
        });
        var F = d(j, 2);
        Ci(F, {
          get isOpen() {
            return n(z);
          },
          onClose: () => c(z, false)
        });
        var ie = d(F, 2);
        Mi(ie, {
          get isOpen() {
            return n(T);
          },
          onClose: () => c(T, false)
        });
        var ve = d(ie, 2);
        Wi(ve, {
          get isOpen() {
            return n(L);
          },
          onClose: () => c(L, false)
        });
        var ye = d(ve, 2);
        {
          var ee = (C) => {
            ao(C, {
              onClose: () => c(U, false)
            });
          };
          $(ye, (C) => {
            n(U) && C(ee);
          });
        }
        ae(() => P = we(k, 1, "app-layout svelte-1n46o8q", null, P, {
          "sidebar-open": n(i)
        })), g(f, m);
      };
      $(N, (f) => {
        n(s) ? f(ne) : n(r) && !n(a) ? f(le, 1) : f(re, -1);
      });
    }
    g(t, J), Ne();
  };
  De([
    "click"
  ]);
});
export {
  __tla,
  co as default
};
