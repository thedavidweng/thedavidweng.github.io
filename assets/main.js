const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const h = (tag, props, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const prefersDark = matchMedia("(prefers-color-scheme: dark)");
const user = "thedavidweng";
const mail = $(".contact-email");

const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : prefersDark.matches);

function toggleTheme(x = innerWidth / 2, y = 0) {
  const apply = () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch {}
    dispatchEvent(new Event("themechange"));
  };
  if (!document.startViewTransition || reducedMotion.matches) return apply();
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document
    .startViewTransition(apply)
    .ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: "cubic-bezier(0.2, 0, 0, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(mail.textContent);
    return true;
  } catch {
    return false;
  }
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const units = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function ago(iso) {
  const seconds = Math.min(0, (Date.parse(iso) - Date.now()) / 1000);
  const [unit, size] = units.find(([, size]) => -seconds >= size) ?? [];
  return unit ? rtf.format(Math.round(seconds / size), unit) : "just now";
}

function renderTimes() {
  for (const time of $$("time[datetime]")) time.textContent = `updated ${ago(time.dateTime)}`;
}

const github = (path) =>
  fetch(`https://api.github.com/${path}`).then((res) => (res.ok ? res.json() : Promise.reject(res.status)));

function showRepos({ total_count, incomplete_results, items }) {
  const repos = new Map(items.map((repo) => [repo.name, repo]));
  for (const row of $$("[data-repo]")) {
    const repo = repos.get(row.dataset.repo);
    if (!repo) continue;
    const stars = $("[data-stars]", row);
    $("span", stars).textContent = repo.stargazers_count;
    stars.toggleAttribute("data-zero", repo.stargazers_count === 0);
    const time = $("time", row);
    if (time) time.dateTime = repo.pushed_at;
  }
  renderTimes();

  const latest = items.reduce((a, b) => (a.pushed_at > b.pushed_at ? a : b));
  $("[data-activity]").textContent = `Pushed to ${latest.name} ${ago(latest.pushed_at)}`;

  if (incomplete_results || items.length < total_count) return;
  $('[data-stat="repos"]').textContent = total_count;
  $('[data-stat="stars"]').textContent = items.reduce((sum, repo) => sum + repo.stargazers_count, 0);
}

function spotlight(grid) {
  grid.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
}

function stems(canvas) {
  const context = canvas.getContext("2d");
  const timecode = $("#timecode");
  const bar = 3;
  const step = bar + 2;
  const padX = 16;
  const padY = 14;
  const duration = 212;
  const loop = 24000;

  const random = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Same order as the legend: vocals, drums, bass, other.
  const shapes = [
    (u, r) => Math.max(0, Math.sin(u * 23 + 1.2)) ** 0.6 * (u > 0.08 ? 1 : 0.15) * (0.35 + 0.65 * r()),
    (u, r) => (u > 0.05 ? 1 : 0) * (Math.exp(-((u * 64) % 1) * 7) * 0.9 + 0.12 * r()),
    (u, r) => 0.28 + 0.32 * (0.5 + 0.5 * Math.sin(u * 11)) + 0.18 * r(),
    (u, r) => (0.18 + 0.42 * Math.abs(Math.sin(u * 5.3 + 0.7))) * (0.55 + 0.45 * r()),
  ];

  const clock = (seconds) => [Math.floor(seconds / 60), seconds % 60].map((n) => String(n).padStart(2, "0")).join(":");

  let width = 0;
  let height = 0;
  let bars = [];
  let colors = [];
  let rest = "";
  let head = 0.38;
  let scrub = null;
  let visible = false;
  let raf = 0;
  let last = 0;

  function readColors() {
    colors = $$(".legend [data-stem]").map((el) => getComputedStyle(el).color);
    rest = getComputedStyle(canvas).color;
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    ({ width, height } = canvas.getBoundingClientRect());
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(40, Math.floor((width - padX * 2) / step));
    bars = shapes.map((shape, i) => {
      const r = random(1337 + i * 97);
      return Array.from({ length: count }, (_, k) => Math.min(1, shape(k / count, r)));
    });
    draw(performance.now());
  }

  function draw(now) {
    if (!bars.length) return;
    context.clearRect(0, 0, width, height);
    const rowHeight = (height - padY * 2) / bars.length;
    const position = scrub ?? head;
    const playhead = padX + position * bars[0].length * step;
    bars.forEach((row, s) => {
      const middle = padY + rowHeight * (s + 0.5);
      row.forEach((level, k) => {
        const x = padX + k * step;
        const played = x < playhead;
        const near = Math.max(0, 1 - Math.abs(x - playhead) / 60);
        const wobble = played && !reducedMotion.matches ? 1 + 0.18 * near * Math.sin(now / 90 + k * 0.7 + s) : 1;
        const half = Math.max(1.5, level * rowHeight * 0.42 * wobble);
        context.fillStyle = played ? colors[s] : rest;
        context.globalAlpha = played ? 0.55 + 0.45 * Math.max(near, 0.6) : 1;
        context.beginPath();
        context.roundRect(x, middle - half, bar, half * 2, 1.5);
        context.fill();
      });
    });
    context.globalAlpha = 1;
    context.fillStyle = colors[0];
    context.fillRect(playhead - 0.5, 6, 1, height - 12);
    const text = `${clock(Math.floor(position * duration))} / ${clock(duration)}`;
    if (timecode.textContent !== text) timecode.textContent = text;
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (scrub === null && !reducedMotion.matches) head = (head + (now - (last || now)) / loop) % 1;
    last = now;
    draw(now);
    if (!reducedMotion.matches) raf = requestAnimationFrame(frame);
  }

  function play() {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function seek(event) {
    if (!bars.length) return;
    const rect = canvas.getBoundingClientRect();
    scrub = Math.min(1, Math.max(0, (event.clientX - rect.left - padX) / (bars[0].length * step)));
    play();
  }

  canvas.addEventListener("pointermove", seek);
  canvas.addEventListener("pointerdown", seek);
  canvas.addEventListener("pointerleave", () => {
    if (scrub !== null) head = scrub;
    scrub = null;
    play();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    play();
  }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener("visibilitychange", play);
  reducedMotion.addEventListener("change", play);
  addEventListener("themechange", () => {
    readColors();
    draw(performance.now());
  });
  readColors();
}

function palette(dialog) {
  const input = $("#palette-input");
  const list = $("#palette-list");
  let results = [];
  let options = [];
  let active = 0;

  if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
    for (const kbd of $$("[data-shortcut]")) kbd.textContent = "Ctrl K";
  }

  const go = (href) => () => {
    dialog.close();
    if (!href.startsWith("#")) return location.assign(href);
    $(href).scrollIntoView();
    history.replaceState(null, "", href);
  };

  const host = (href) => new URL(href).host.replace(/^www\./, "");

  const commands = [
    ...$$("section[id] h2").map((heading) => {
      const hash = `#${heading.closest("section").id}`;
      return { group: "Sections", title: heading.textContent, hint: hash, run: go(hash) };
    }),
    ...$$("[data-repo]").map((item) => {
      const link = $(".card-link", item);
      return {
        group: $("h2", item.closest("section")).textContent,
        title: link.textContent,
        hint: $(".desc", item).textContent,
        keywords: $$(".lang, .tag", item).map((tag) => tag.textContent).join(" "),
        run: go(link.href),
      };
    }),
    { group: "Links", title: "Resume", hint: "resume.html", run: go("resume.html") },
    { group: "Links", title: "Portfolio", hint: "davidweng.eu.org", run: go("https://davidweng.eu.org/") },
    { group: "Links", title: "Blog", hint: "blog.blahaj.uk", run: go("https://blog.blahaj.uk/") },
    ...$$(".socials a").map((link) => ({
      group: "Social",
      title: link.textContent.trim(),
      hint: host(link.href),
      run: go(link.href),
    })),
    {
      group: "Actions",
      get title() {
        return isDark() ? "Switch to light theme" : "Switch to dark theme";
      },
      hint: "Theme",
      run() {
        dialog.close();
        toggleTheme();
      },
    },
    {
      group: "Actions",
      title: "Copy email address",
      hint: mail.textContent,
      async run(option) {
        if (await copyEmail()) $("small", option).textContent = "Copied";
        setTimeout(() => dialog.close(), 600);
      },
    },
    { group: "Actions", title: "Send an email", hint: mail.textContent, run: go(mail.href) },
    {
      group: "Actions",
      title: "View page source",
      hint: "github.com",
      run: go("https://github.com/thedavidweng/thedavidweng.github.io"),
    },
  ];

  function select(index) {
    if (!options.length) return input.removeAttribute("aria-activedescendant");
    active = (index + options.length) % options.length;
    for (const [i, option] of options.entries()) option.ariaSelected = i === active;
    input.setAttribute("aria-activedescendant", options[active].id);
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    const words = query.split(/\s+/);
    const rank = ({ title }) => {
      const text = title.toLowerCase();
      return text.startsWith(query) ? 0 : text.includes(query) ? 1 : 2;
    };
    results = commands.filter((command) => {
      const text = `${command.title} ${command.hint} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
    if (query) results.sort((a, b) => rank(a) - rank(b));

    options = results.map((command, i) =>
      h(
        "li",
        { className: "option", id: `option-${i}`, role: "option" },
        h("span", { textContent: command.title }),
        h("small", { textContent: command.hint }),
      ),
    );
    const items = options.flatMap((option, i) =>
      !query && results[i].group !== results[i - 1]?.group
        ? [h("li", { className: "group", role: "presentation", textContent: results[i].group }), option]
        : [option],
    );
    list.replaceChildren(...(items.length ? items : [h("li", { className: "empty", role: "presentation", textContent: "No results" })]));
    list.scrollTop = 0;
    select(0);
  }

  function move(delta) {
    select(active + delta);
    if (active === 0) list.scrollTop = 0;
    else options[active]?.scrollIntoView({ block: "nearest" });
  }

  function open() {
    if (dialog.open) return;
    input.value = "";
    render();
    dialog.showModal();
    input.focus();
  }

  const indexOf = (event) => options.indexOf(event.target.closest(".option"));

  input.addEventListener("input", render);
  input.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      results[active].run(options[active]);
    }
  });
  list.addEventListener("pointermove", (event) => {
    const index = indexOf(event);
    if (index !== -1 && index !== active) select(index);
  });
  list.addEventListener("click", (event) => {
    const index = indexOf(event);
    if (index !== -1) results[index].run(options[index]);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  $("#palette-open").addEventListener("click", open);
  addEventListener("keydown", (event) => {
    const typing = event.target.closest?.("input, textarea, select") || event.target.isContentEditable;
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    } else if (event.key === "/" && !typing && !dialog.open) {
      event.preventDefault();
      open();
    }
  });
}

$("#theme-toggle").addEventListener("click", ({ currentTarget }) => {
  const rect = currentTarget.getBoundingClientRect();
  toggleTheme(rect.left + rect.width / 2, rect.top + rect.height / 2);
});
prefersDark.addEventListener("change", () => dispatchEvent(new Event("themechange")));

for (const button of $$("[data-copy]")) {
  const label = $("span", button);
  let timer;
  button.addEventListener("click", async () => {
    if (!(await copyEmail())) return;
    clearTimeout(timer);
    button.dataset.copied = "";
    label.textContent = "Copied";
    timer = setTimeout(() => {
      delete button.dataset.copied;
      label.textContent = "Copy address";
    }, 1600);
  });
}

$$("[data-spotlight]").forEach(spotlight);
stems($("#stems"));
palette($("#palette"));
renderTimes();

github(`search/repositories?q=${encodeURIComponent(`user:${user} fork:false`)}&per_page=100`)
  .then(showRepos)
  .catch(() => {});

github(`search/issues?q=${encodeURIComponent(`author:${user} type:pr is:merged -user:${user}`)}&per_page=1`)
  .then(({ total_count }) => {
    for (const el of $$("[data-prs]")) el.textContent = total_count;
  })
  .catch(() => {});
