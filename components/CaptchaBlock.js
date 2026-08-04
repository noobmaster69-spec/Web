// Test case: "captcha or blocking keyword" — HARDENED VERSION (v3)
// Goal: make automated bypass genuinely hard (Cloudflare-style layered defense)
// without being literally impossible for a real human user.
//
// Defense layers (v2 baseline + v3 additions):
//   1. Environment fingerprint check   — navigator.webdriver, plugin count, headless tells
//   2. Behavioral trajectory analysis  — mouse path entropy on the slider drag
//   3. Timing gate                     — reject impossibly fast solves
//   4. Honeypot fields                 — invisible elements only a DOM-scraping bot would touch
//   5. Proof-of-work delay             — cheap for one human, expensive at scale for a bot
//   6. Exponential backoff lockout     — cost scales with repeated failure, session AND device level
//   7. Randomized DOM ids/classes      — defeats hardcoded CSS/XPath selectors
//   8. Canvas fingerprint heuristic    — flags suspiciously low-entropy (software-rendered) canvases
//   9. WebGL renderer sniffing         — flags SwiftShader/llvmpipe/Mesa (common headless GPU stacks)
//  10. Pre-interaction mouse presence  — no page-level mouse movement before solving = red flag
//  11. Click precision analysis        — pixel-perfect repeated center clicks = red flag
//  12. Adaptive difficulty             — higher risk score = harder challenge, more rounds required
//  13. Device-level backoff            — a lockout streak stored in localStorage, survives reloads
//
// Still not meant to be literally unbeatable — a well-built scraper running a real
// Chromium instance with human-paced, human-shaped input can get through, same as it
// can against actual Cloudflare Turnstile. The point of the benchmark is to see whether
// your pipeline detects the wall and backs off/rotates instead of blindly retrying.

const { useState, useRef, useCallback, useEffect, useMemo } = React;

const REQUEST_THRESHOLD = 2;
const SLIDER_TOLERANCE = 4; // percent, baseline (non-hardened)
const MAX_FAILS_BEFORE_LOCKOUT = 3;
const BASE_LOCKOUT_MS = 8000;
const MIN_HUMAN_SOLVE_MS = 350; // anything faster than this is treated as scripted
const POW_ITERATIONS = 250000; // tune for a ~150-400ms delay on a normal laptop
const RISK_HIGH_THRESHOLD = 50; // score at/above this triggers adaptive hardening
const CLICK_PRECISION_EPSILON = 0.75; // px; repeated clicks tighter than this look scripted
const STORAGE_KEY = "scrapebench_captcha_state_v3";
const SESSION_STREAK_KEY = "scrapebench_lockout_streak";
const DEVICE_STREAK_KEY = "scrapebench_device_lockout_streak";

function randomTarget() {
    return Math.floor(Math.random() * 60) + 20;
}

function randomChallengeType() {
    return Math.random() < 0.5 ? "slider" : "odd-one-out";
}

const ICON_SETS = [
    { normal: "📱", odd: "💻" },
    { normal: "🔒", odd: "🔓" },
    { normal: "🟦", odd: "🟥" },
    { normal: "⭐", odd: "🌙" }
];

function buildOddOneOutRound() {
    const set = ICON_SETS[Math.floor(Math.random() * ICON_SETS.length)];
    const oddIndex = Math.floor(Math.random() * 9);
    const icons = Array.from({ length: 9 }, (_, i) => (i === oddIndex ? set.odd : set.normal));
    return { icons, oddIndex };
}

function loadPersisted() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function savePersisted(state) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore quota/privacy-mode errors */ }
}

function clearPersisted() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
}

function getStreak(key) {
    try {
        return parseInt(sessionStorage.getItem(key) || "0", 10);
    } catch (e) { return 0; }
}

function bumpSessionStreak() {
    const next = getStreak(SESSION_STREAK_KEY) + 1;
    try { sessionStorage.setItem(SESSION_STREAK_KEY, String(next)); } catch (e) { /* ignore */ }
    return next;
}

function resetSessionStreak() {
    try { sessionStorage.removeItem(SESSION_STREAK_KEY); } catch (e) { /* ignore */ }
}

// device-level streak lives in localStorage, so unlike the session streak it
// survives a plain reload — closer to how a real anti-bot vendor's device/
// cookie-based reputation would behave.
function getDeviceStreak() {
    try {
        return parseInt(localStorage.getItem(DEVICE_STREAK_KEY) || "0", 10);
    } catch (e) { return 0; }
}

function bumpDeviceStreak() {
    const next = getDeviceStreak() + 1;
    try { localStorage.setItem(DEVICE_STREAK_KEY, String(next)); } catch (e) { /* ignore */ }
    return next;
}

function resetDeviceStreak() {
    try { localStorage.removeItem(DEVICE_STREAK_KEY); } catch (e) { /* ignore */ }
}

// --- Layer 1: environment fingerprint -----------------------------------
// Cheap, client-side heuristics only. Not meant to be forensic-grade —
// real anti-bot vendors combine this with server-side TLS/JA3 fingerprinting
// and IP reputation, which a static-hosted demo page can't do.
function collectEnvironmentSignals() {
    const signals = [];
    let score = 0; // higher = more suspicious

    if (navigator.webdriver === true) {
        signals.push("navigator.webdriver=true");
        score += 40;
    }
    if (!navigator.plugins || navigator.plugins.length === 0) {
        signals.push("zero plugins reported");
        score += 10;
    }
    if (!navigator.languages || navigator.languages.length === 0) {
        signals.push("no navigator.languages");
        score += 10;
    }
    if (window.outerWidth === 0 || window.outerHeight === 0) {
        signals.push("zero outer window dimensions (headless tell)");
        score += 15;
    }
    const automationGlobals = ["__nightmare", "__selenium_unwrapped", "__webdriver_evaluate", "__driver_evaluate", "_phantom", "callPhantom", "Buffer", "emit", "spawn"];
    for (const key of automationGlobals) {
        if (window[key] !== undefined) {
            signals.push(`automation global present: ${key}`);
            score += 20;
            break;
        }
    }
    if (/HeadlessChrome/.test(navigator.userAgent)) {
        signals.push("UA contains HeadlessChrome");
        score += 40;
    }

    return { signals, score };
}

// --- Layer 8: canvas fingerprint heuristic -------------------------------
// Headless/software-rendered browsers frequently produce near-uniform canvas
// output. This isn't proof by itself (some real machines render plainly
// too), so it's weighted moderately rather than treated as a hard block.
function checkCanvasFingerprint() {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 30;
        const ctx = canvas.getContext("2d");
        if (!ctx) return { suspicious: true, reason: "canvas 2d context unavailable", weight: 15 };
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 60, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("scrapebench-fp", 2, 2);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const seen = new Set();
        for (let i = 0; i < data.length; i += 4) {
            seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        }
        if (seen.size < 6) {
            return { suspicious: true, reason: `low canvas color variety (${seen.size} unique colors)`, weight: 15 };
        }
        return { suspicious: false };
    } catch (e) {
        return { suspicious: true, reason: "canvas fingerprint threw an exception", weight: 10 };
    }
}

// --- Layer 9: WebGL renderer sniffing ------------------------------------
function checkWebGLRenderer() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return { suspicious: true, reason: "WebGL unavailable", weight: 10 };
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (!ext) return { suspicious: false };
        const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "");
        const flagged = ["swiftshader", "llvmpipe", "mesa offscreen", "google swiftshader"];
        const lower = renderer.toLowerCase();
        if (flagged.some(f => lower.includes(f))) {
            return { suspicious: true, reason: `software/headless GPU renderer: ${renderer}`, weight: 20 };
        }
        return { suspicious: false };
    } catch (e) {
        return { suspicious: true, reason: "WebGL fingerprint threw an exception", weight: 5 };
    }
}

// combines layers 1, 8, 9 into a single risk score used to scale difficulty
function computeRiskScore() {
    const env = collectEnvironmentSignals();
    const signals = [...env.signals];
    let score = env.score;

    const canvas = checkCanvasFingerprint();
    if (canvas.suspicious) { signals.push(canvas.reason); score += canvas.weight; }

    const webgl = checkWebGLRenderer();
    if (webgl.suspicious) { signals.push(webgl.reason); score += webgl.weight; }

    return { score, signals };
}

// --- Layer 5: lightweight proof-of-work ---------------------------------
function runProofOfWork(iterations) {
    let x = 0;
    for (let i = 0; i < iterations; i++) {
        x = (x + Math.imul(i, 2654435761)) >>> 0;
    }
    return x;
}

// --- Layer 7: per-mount randomized DOM hooks -----------------------------
function randomSuffix() {
    return Math.random().toString(36).slice(2, 8);
}

function CaptchaBlock() {
    const persisted = loadPersisted();
    const domSuffix = useMemo(() => randomSuffix(), []);
    const risk = useMemo(() => computeRiskScore(), []);
    const hardened = risk.score >= RISK_HIGH_THRESHOLD;
    const roundsRequired = hardened ? 2 : 1;
    const effectiveTolerance = hardened ? Math.max(2, SLIDER_TOLERANCE - 2) : SLIDER_TOLERANCE;

    const [requestCount, setRequestCount] = useState(persisted?.requestCount || 0);
    const [stage, setStage] = useState(persisted?.stage || "content"); // content | checkbox | pow | challenge | locked
    const [checked, setChecked] = useState(false);
    const [challengeType, setChallengeType] = useState(persisted?.challengeType || randomChallengeType());
    const [failCount, setFailCount] = useState(persisted?.failCount || 0);
    const [lockoutUntil, setLockoutUntil] = useState(persisted?.lockoutUntil || null);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);
    const [powBusy, setPowBusy] = useState(false);
    const [roundsPassed, setRoundsPassed] = useState(0);

    const [target, setTarget] = useState(randomTarget());
    const [sliderValue, setSliderValue] = useState(0);
    const [puzzleResult, setPuzzleResult] = useState(null); // null | 'ok' | 'fail'
    const [oddRound, setOddRound] = useState(buildOddOneOutRound());

    const dragging = useRef(false);
    const trackRef = useRef(null);
    const challengeShownAt = useRef(null);
    const movePoints = useRef([]); // {x, t} samples for trajectory analysis
    const pageMouseMoved = useRef(false);
    const clickOffsets = useRef([]);

    const blocked = stage !== "content";

    useEffect(() => {
        savePersisted({ requestCount, stage, challengeType, failCount, lockoutUntil });
    }, [requestCount, stage, challengeType, failCount, lockoutUntil]);

    // log the combined risk score once on mount
    useEffect(() => {
        if (risk.signals.length) {
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/captcha — environment risk score ${risk.score}${hardened ? " (adaptive hardening ON)" : ""} (${risk.signals.join("; ")})`,
                status: risk.score >= 30 ? "bad" : "warn",
                isEvent: true
            });
        }
    }, []);

    // Layer 10: track whether the page has seen any real mouse movement at all,
    // before a challenge is even shown. A script that calls .click()/.dispatchEvent()
    // directly on elements never generates ordinary mousemove traffic first.
    useEffect(() => {
        const handler = () => { pageMouseMoved.current = true; };
        window.addEventListener("mousemove", handler, { passive: true });
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    // countdown ticker while locked out
    useEffect(() => {
        if (stage !== "locked" || !lockoutUntil) return;
        const id = setInterval(() => {
            const left = Math.max(0, lockoutUntil - Date.now());
            setLockoutRemaining(Math.ceil(left / 1000));
            if (left <= 0) {
                clearInterval(id);
                setStage("checkbox");
                setFailCount(0);
                setChecked(false);
                setLockoutUntil(null);
                window.ScrapeBenchConsole.log({ method: "EVT", text: "/case/captcha — lockout expired, challenge available again", isEvent: true });
            }
        }, 250);
        return () => clearInterval(id);
    }, [stage, lockoutUntil]);

    function simulateRequest() {
        const next = requestCount + 1;
        setRequestCount(next);
        if (next >= REQUEST_THRESHOLD) {
            setStage("checkbox");
            window.ScrapeBenchConsole.log({ method: "GET", text: "/case/captcha — 429 blocked, challenge wall served", status: "bad" });
        } else {
            window.ScrapeBenchConsole.log({ method: "GET", text: `/case/captcha — request ${next} OK`, status: "ok" });
        }
    }

    // --- Layer 4: honeypots -------------------------------------------------
    // Real users never interact with a visually-hidden field or link. A bot
    // that enumerates every input/button/link in the DOM and interacts with
    // them blind will trip one of these.
    function honeypotTouched(source) {
        window.ScrapeBenchConsole.log({
            method: "EVT",
            text: `/case/captcha — honeypot "${source}" triggered, treating as automated client`,
            status: "bad",
            isEvent: true
        });
        registerFailure(`honeypot "${source}" triggered`, { instantLockout: true });
    }

    // --- Layer 5: proof-of-work gate before showing the real puzzle -------
    function startProofOfWork() {
        setStage("pow");
        setPowBusy(true);
        window.ScrapeBenchConsole.log({ method: "EVT", text: "/case/captcha — checkbox confirmed, running client challenge", isEvent: true });
        setTimeout(() => {
            const result = runProofOfWork(POW_ITERATIONS);
            window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — proof-of-work complete (checksum ${result})`, isEvent: true });
            setPowBusy(false);
            startChallenge();
        }, 30);
    }

    function startChallenge(roundIndex) {
        // hardened sessions are locked to the slider challenge only — it carries
        // richer behavioral signal (trajectory + timing) than a single click does
        const type = hardened ? "slider" : randomChallengeType();
        setChallengeType(type);
        setPuzzleResult(null);
        movePoints.current = [];
        challengeShownAt.current = Date.now();
        if (type === "slider") {
            setTarget(randomTarget());
            setSliderValue(0);
        } else {
            setOddRound(buildOddOneOutRound());
        }
        setStage("challenge");
        const label = roundIndex !== undefined ? roundIndex : roundsPassed;
        window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — "${type}" challenge shown${hardened ? ` (round ${label + 1}/${roundsRequired})` : ""}`, isEvent: true });
    }

    function toggleCheckbox() {
        const next = !checked;
        setChecked(next);
        if (next) startProofOfWork();
    }

    function currentLockoutMs(streak) {
        return Math.min(BASE_LOCKOUT_MS * Math.pow(2, streak), 120000);
    }

    function registerFailure(reason, opts = {}) {
        const nextFails = failCount + 1;
        setRoundsPassed(0); // any failed attempt restarts the multi-round sequence
        window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — ${reason}, retry required (${nextFails}/${MAX_FAILS_BEFORE_LOCKOUT})`, status: "bad", isEvent: true });
        if (opts.instantLockout || nextFails >= MAX_FAILS_BEFORE_LOCKOUT) {
            const sStreak = bumpSessionStreak();
            const dStreak = bumpDeviceStreak();
            const ms = currentLockoutMs(Math.max(sStreak, dStreak));
            const until = Date.now() + ms;
            setFailCount(0);
            setLockoutUntil(until);
            setStage("locked");
            window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — locked out for ${Math.round(ms / 1000)}s (session streak ${sStreak}, device streak ${dStreak})`, status: "bad", isEvent: true });
        } else {
            setFailCount(nextFails);
        }
    }

    function registerSuccess() {
        resetSessionStreak();
        resetDeviceStreak();
        window.ScrapeBenchConsole.log({ method: "EVT", text: "/case/captcha — challenge solved, content unlocked", status: "ok", isEvent: true });
        setTimeout(() => {
            setStage("content");
            setChecked(false);
            setRequestCount(0);
            setFailCount(0);
            setRoundsPassed(0);
            setPuzzleResult(null);
            clearPersisted();
        }, 900);
    }

    // called after a single round passes its own checks; advances to the next
    // round if adaptive hardening requires more than one, otherwise unlocks
    function advanceOrFinish() {
        const next = roundsPassed + 1;
        if (next < roundsRequired) {
            setRoundsPassed(next);
            setTimeout(() => startChallenge(next), 500);
        } else {
            registerSuccess();
        }
    }

    // --- Layer 2 + 3 + 10: trajectory + timing + mouse-presence analysis ---
    function evaluateHumanlike() {
        const elapsed = challengeShownAt.current ? Date.now() - challengeShownAt.current : 0;
        if (elapsed < MIN_HUMAN_SOLVE_MS) {
            return { ok: false, reason: `solved in ${elapsed}ms — faster than plausible human reaction` };
        }
        if (!pageMouseMoved.current) {
            return { ok: false, reason: "no real pointer movement observed on the page before solving" };
        }
        return { ok: true };
    }

    function evaluateSliderTrajectory() {
        const pts = movePoints.current;
        if (pts.length < 3) {
            return { ok: false, reason: "slider moved with too few motion samples (likely scripted jump)" };
        }
        const deltas = [];
        for (let i = 1; i < pts.length; i++) {
            const dx = pts[i].x - pts[i - 1].x;
            const dt = Math.max(1, pts[i].t - pts[i - 1].t);
            deltas.push(dx / dt);
        }
        const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const variance = deltas.reduce((a, b) => a + (b - mean) * (b - mean), 0) / deltas.length;
        if (variance < 0.0005) {
            return { ok: false, reason: "slider velocity suspiciously constant (no natural jitter)" };
        }
        return { ok: true };
    }

    // Layer 11: has this client landed dead-center on click targets repeatedly?
    // A real hand/trackpad/touch input almost never lands on the exact same
    // sub-pixel offset twice in a row; `element.click()` calls do.
    function hasSuspiciousClickPrecision() {
        const offsets = clickOffsets.current;
        if (offsets.length < 2) return false;
        return offsets.slice(-2).every(o => o < CLICK_PRECISION_EPSILON);
    }

    // --- slider puzzle handlers ---
    const updateFromClientX = useCallback((clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setSliderValue(pct);
        movePoints.current.push({ x: pct, t: Date.now() });
    }, []);

    function onPointerDown(e) { dragging.current = true; updateFromClientX(e.clientX); }
    function onPointerMove(e) { if (dragging.current) updateFromClientX(e.clientX); }
    function onPointerUp() {
        if (!dragging.current) return;
        dragging.current = false;
        const diff = Math.abs(sliderValue - target);

        if (diff > effectiveTolerance) {
            setPuzzleResult("fail");
            setTarget(randomTarget());
            setSliderValue(0);
            registerFailure("slider puzzle missed");
            return;
        }
        const timing = evaluateHumanlike();
        const trajectory = evaluateSliderTrajectory();
        if (!timing.ok || !trajectory.ok) {
            setPuzzleResult("fail");
            setTarget(randomTarget());
            setSliderValue(0);
            registerFailure(!timing.ok ? timing.reason : trajectory.reason);
            return;
        }
        setPuzzleResult("ok");
        advanceOrFinish();
    }

    // --- odd-one-out handler ---
    function pickIcon(index, e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const offset = Math.hypot(e.clientX - cx, e.clientY - cy);
        clickOffsets.current.push(offset);
        if (clickOffsets.current.length > 5) clickOffsets.current.shift();

        const timing = evaluateHumanlike();
        const precisionOk = !hasSuspiciousClickPrecision();

        if (index === oddRound.oddIndex && timing.ok && precisionOk) {
            setPuzzleResult("ok");
            advanceOrFinish();
        } else {
            setPuzzleResult("fail");
            setOddRound(buildOddOneOutRound());
            const reason = !timing.ok ? timing.reason : (!precisionOk ? "click landed on an implausibly exact pixel offset repeatedly" : "wrong icon picked");
            registerFailure(reason);
        }
    }

    function reset() {
        setRequestCount(0);
        setStage("content");
        setChecked(false);
        setFailCount(0);
        setRoundsPassed(0);
        setLockoutUntil(null);
        setPuzzleResult(null);
        clearPersisted();
        resetSessionStreak();
        // note: device streak intentionally NOT cleared by the in-page reset
        // button — that's the point of a device-level signal. See the hint
        // below for the devtools command to clear it while testing.
        window.ScrapeBenchConsole.log({ method: "RST", text: "/case/captcha — wall state reset (device-level backoff persists)" });
    }

    return (
        <div className="panel">
            <h3>Target: #captcha-wall (detect the wall, don't parse it as data)</h3>

            {/* Layer 4: honeypots — visually hidden, only reachable by DOM-walking bots */}
            <div
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
            >
                <label htmlFor={`hp-${domSuffix}`}>Leave this field empty</label>
                <input id={`hp-${domSuffix}`} type="text" tabIndex={-1} autoComplete="off"
                    onChange={() => honeypotTouched("field")} onClick={() => honeypotTouched("field")} />
                <a href="#" tabIndex={-1} onClick={(e) => { e.preventDefault(); honeypotTouched("link"); }}>skip verification</a>
            </div>

            {risk.signals.length > 0 && (
                <p className="case-meta" style={{ color: "var(--text-dim)", marginBottom: 8 }}>
                    client risk signals detected: {risk.signals.length}{hardened ? " — adaptive hardening active" : ""}
                </p>
            )}

            {stage === "content" && (
                <div className="product-card">
                    <div className="name">iPhone 17 Pro</div>
                    <div className="price">$1,199</div>
                    <p className="case-meta" style={{ marginTop: 8 }}>request count: {requestCount}/{REQUEST_THRESHOLD}</p>
                </div>
            )}

            {stage === "checkbox" && (
                <div id={`captcha-wall-${domSuffix}`} className="captcha-box">
                    <div className="lock">🔒</div>
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Access Denied</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Unusual traffic detected from this connection. Please verify you are human to continue.
                    </p>
                    <label className="captcha-checkbox" htmlFor={`captcha-checkbox-input-${domSuffix}`}>
                        <input id={`captcha-checkbox-input-${domSuffix}`} type="checkbox" checked={checked} onChange={toggleCheckbox} />
                        <span>I'm not a robot</span>
                    </label>
                </div>
            )}

            {stage === "pow" && (
                <div id={`captcha-wall-${domSuffix}`} className="captcha-box">
                    <div className="lock">⚙️</div>
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Checking your browser…</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                        {powBusy ? "Running a quick client-side check, this only takes a moment." : "Almost done…"}
                    </p>
                </div>
            )}

            {stage === "challenge" && challengeType === "slider" && (
                <div id={`captcha-wall-${domSuffix}`} className="captcha-box">
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>One more step</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Drag the slider so the piece lines up with the notch.
                        {hardened && <> ({roundsPassed + 1}/{roundsRequired})</>}
                    </p>
                    <div className="slider-track" ref={trackRef} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}>
                        <div className="slider-notch" style={{ left: `${target}%` }} />
                        <div className="slider-piece" style={{ left: `${sliderValue}%` }} onMouseDown={onPointerDown}>⇔</div>
                    </div>
                    {puzzleResult === "fail" && <p className="chip danger" style={{ marginTop: 12 }}>not quite — try again ({failCount}/{MAX_FAILS_BEFORE_LOCKOUT})</p>}
                    {puzzleResult === "ok" && <p className="chip ok" style={{ marginTop: 12 }}>verified — unlocking…</p>}
                </div>
            )}

            {stage === "challenge" && challengeType === "odd-one-out" && (
                <div id={`captcha-wall-${domSuffix}`} className="captcha-box">
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>One more step</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Click the tile that's different from the rest.
                    </p>
                    <div className="odd-grid">
                        {oddRound.icons.map((icon, i) => (
                            <button key={i} className="odd-tile" onClick={(e) => pickIcon(i, e)}>{icon}</button>
                        ))}
                    </div>
                    {puzzleResult === "fail" && <p className="chip danger" style={{ marginTop: 12 }}>wrong tile — try again ({failCount}/{MAX_FAILS_BEFORE_LOCKOUT})</p>}
                    {puzzleResult === "ok" && <p className="chip ok" style={{ marginTop: 12 }}>verified — unlocking…</p>}
                </div>
            )}

            {stage === "locked" && (
                <div id={`captcha-wall-${domSuffix}`} className="captcha-box">
                    <div className="lock">⏳</div>
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Temporarily Locked</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
                        Too many failed attempts. Try again in {lockoutRemaining}s.
                    </p>
                    <p className="case-meta" style={{ marginTop: 12 }}>
                        session streak: {getStreak(SESSION_STREAK_KEY)}, device streak: {getDeviceStreak()} — persists across reloads via localStorage
                    </p>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn" onClick={simulateRequest} disabled={blocked}>Simulate request</button>
                <button className="btn" onClick={reset}>Reset</button>
            </div>
            <div className="hint">
                This wall combines environment fingerprinting (<code>navigator.webdriver</code>, headless UA,
                canvas/WebGL renderer heuristics), interaction signals (timing, page-level mouse presence,
                slider-trajectory entropy, click-precision jitter), two honeypot traps, a small proof-of-work
                delay, and two-tier exponential backoff (per-tab via <code>sessionStorage</code>, per-device via
                <code>localStorage</code>). Clients that trip enough environment signals get an adaptive,
                harder path: slider-only, tighter tolerance, two consecutive rounds. None of this is forensic-grade
                — it's what a static demo page can do client-side — and a scraper running a real, human-paced
                browser can still get through, same as it can against actual Cloudflare Turnstile. A good
                classifier should treat any of these signals as a reason to back off, not try to defeat them.
                To clear the device-level backoff while testing, run <code>localStorage.removeItem("scrapebench_device_lockout_streak")</code> in devtools.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.CaptchaBlock = CaptchaBlock;
