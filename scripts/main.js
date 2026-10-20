/* ===== Anlass-Auswahl (Thema) + Partikel-Effekte ===== */
(function () {
  const THEMES = { weihnachtsfeier: "Weihnachtsfeier", sommerparty: "Sommerparty", teamevent: "Teamevent" };
  const DEFAULT_THEME = "teamevent";
  const canvas = document.getElementById("fx");
  const select = document.getElementById("event-select");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CONFETTI = ["#ff4d6d", "#ffd166", "#06d6a0", "#4da3ff", "#b388ff", "#ff9f1c"];
  const TAU = Math.PI * 2;
  const rnd = (a, b) => Math.random() * (b - a) + a;
  let w = 0, h = 0, parts = [], effect = null;

  const EFFECTS = {
    // Schnee 
    weihnachtsfeier: {
      count: () => Math.min(160, Math.floor(w / 9)),
      make: (any) => ({ x: rnd(0, w), y: any ? rnd(0, h) : -10, r: rnd(.8, 3), v: rnd(.4, 1.3), d: rnd(0, TAU), o: rnd(.4, .9) }),
      step(p) { p.y += p.v; p.d += .012; p.x += Math.sin(p.d) * .5; return p.y > h + 10; },
      draw(p) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fillStyle = "rgba(255,255,255," + p.o + ")"; ctx.fill(); },
    },
    // Konfetti
    teamevent: {
      count: () => Math.min(130, Math.floor(w / 11)),
      make: (any) => ({
        x: rnd(0, w), y: any ? rnd(0, h) : rnd(-30, -8), w: rnd(6, 11), h: rnd(3, 6),
        v: rnd(1, 2.4), d: rnd(0, TAU), s: rnd(.02, .06), rot: rnd(0, TAU), vr: rnd(-.08, .08),
        c: CONFETTI[(Math.random() * CONFETTI.length) | 0], round: Math.random() < .25,
      }),
      step(p) { p.y += p.v; p.d += p.s; p.x += Math.sin(p.d) * .9; p.rot += p.vr; return p.y > h + 14; },
      draw(p) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.d * 2));
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * .8, 0, TAU); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      },
    },
    // Sommer: aufsteigende, schimmernde Seifenblasen (dazu leuchtet per CSS eine Sonne oben rechts)
    sommerparty: {
      count: () => Math.min(60, Math.floor(w / 22)),
      make: (any) => ({
        x: rnd(0, w), y: any ? rnd(0, h) : h + rnd(10, 40), r: rnd(3, 13), v: rnd(.35, 1), d: rnd(0, TAU),
        hue: Math.random() < .5 ? rnd(35, 55) : rnd(175, 200),
      }),
      step(p) { p.y -= p.v; p.d += .015; p.x += Math.sin(p.d) * .6; return p.y < -20; },
      draw(p) {
        const g = ctx.createRadialGradient(p.x - p.r * .35, p.y - p.r * .35, p.r * .1, p.x, p.y, p.r);
        g.addColorStop(0, "hsla(" + p.hue + ",100%,92%,.8)");
        g.addColorStop(1, "hsla(" + p.hue + ",100%,75%,.22)");
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "hsla(" + p.hue + ",100%,95%,.7)"; ctx.stroke();
      },
    },
  };

  function storedTheme() {
    try { const t = localStorage.getItem("event-theme"); if (THEMES[t]) return t; } catch (e) {}
    return DEFAULT_THEME;
  }
  function fill() {
    parts = [];
    if (ctx && effect) for (let i = 0, n = effect.count(); i < n; i++) parts.push(effect.make(true));
  }
  function resize() {
    if (!ctx) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    fill();
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    if (effect) {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (effect.step(p)) parts[i] = effect.make(false); else effect.draw(p);
      }
    }
    requestAnimationFrame(tick);
  }
  function setTheme(name, save) {
    if (!THEMES[name]) name = DEFAULT_THEME;
    document.documentElement.dataset.theme = name;
    if (select) select.value = name;
    document.title = document.title.replace(/Weihnachtsfeier|Sommerparty|Teamevent/, THEMES[name]);
    effect = reduced ? null : EFFECTS[name];
    fill();
    if (save) { try { localStorage.setItem("event-theme", name); } catch (e) {} }
  }

  resize();
  setTheme(storedTheme(), false);
  window.addEventListener("resize", resize);
  window.addEventListener("storage", (e) => { if (e.key === "event-theme") setTheme(storedTheme(), false); });
  if (select) select.addEventListener("change", () => setTheme(select.value, true));
  if (ctx && !reduced) tick();
})();

/* ===== Formulare → Tabelle (Google Sheets / Excel-kompatibel) ===== */
// Schickt die Daten an die Webhook-Adresse aus config.js.
// "no-cors" + text/plain: kein Preflight nötig; die Antwort ist dabei nicht lesbar,
// ein Netzwerkfehler wird aber erkannt.
async function sendToSheet(sheet, data) {
  const cfg = window.CONFIG || {};
  if (!cfg.ENDPOINT) throw new Error("Die Tabelle ist noch nicht verbunden (scripts/config.js).");
  await fetch(cfg.ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ sheet, token: cfg.TOKEN, ...data }),
  });
}

function bindForm(formId, sheet, okText, extra) {
  const form = document.getElementById(formId);
  if (!form) return;
  const msg = document.getElementById("form-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const btn = e.submitter;
    const data = Object.fromEntries(new FormData(form).entries());
    if (btn && btn.value) data.status = btn.value;

    // Strichmännchen-Animation im geklickten Button
    if (btn && btn.classList.contains("action")) {
      btn.classList.remove("playing");
      void btn.offsetWidth;
      btn.classList.add("playing");
      setTimeout(() => btn.classList.remove("playing"), 3500);
    }

    // Honeypot: Bots füllen das versteckte Feld aus -> still verwerfen
    if (data.website2) { msg.className = "msg ok"; msg.textContent = okText(data); form.reset(); return; }
    delete data.website2;

    msg.className = "msg";
    msg.textContent = "Wird gesendet …";
    try {
      await sendToSheet(sheet, data);
      msg.className = "msg ok";
      msg.textContent = okText(data);
      form.reset();
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message === "Failed to fetch" ? "Keine Verbindung. Bitte später erneut versuchen." : err.message;
    }
  });
}

bindForm("teilnahme-form", "Teilnehmer", (d) =>
  d.status === "Absage" ? "Schade! Deine Absage ist notiert." : "Danke, du bist dabei! 🎉");
bindForm("vorschlag-form", "Vorschlaege", () => "Danke für deinen Vorschlag! 🎁");
