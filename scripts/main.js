/* ===== Schneefall ===== */
(function () {
  const canvas = document.getElementById("tropical");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  let w, h, flakes = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(160, Math.floor(w / 9));
    flakes = Array.from({ length: count }, () => newFlake(true));
  }
  function newFlake(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: Math.random() * 2.2 + .8,
      v: Math.random() * .9 + .4,
      drift: Math.random() * Math.PI * 2,
      o: Math.random() * .5 + .4,
    };
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.y += f.v;
      f.drift += .012;
      f.x += Math.sin(f.drift) * .5;
      if (f.y > h + 10) Object.assign(f, newFlake(false));
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + f.o + ")";
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", resize);
  resize();
  tick();
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
