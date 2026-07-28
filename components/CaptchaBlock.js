// Test case: "captcha or blocking keyword"
// A layered anti-bot wall, closer to what a real scraping target does:
//   1. Normal content, request counter increments per simulated request.
//   2. After the threshold, a checkbox challenge appears ("I'm not a robot").
//   3. Checking it reveals ONE randomly-picked challenge type:
//        - a slider puzzle (drag the piece into the notch), or
//        - an odd-one-out challenge (click the icon that doesn't match).
//   4. Failing repeatedly triggers a cooldown lockout with a countdown —
//      mirrors real rate-limit/backoff behavior instead of an infinite-retry UI.
//   5. Block state (stage + fail count + lockout end time) is persisted in
//      sessionStorage, so reloading the page doesn't just bypass the wall —
//      same as a real anti-bot cookie/session flag would behave.
// The goal: your scraper's response classifier should detect this wall and
// back off / rotate session / flag for review — NOT try to auto-solve it.
const { useState, useRef, useCallback, useEffect } = React;

const REQUEST_THRESHOLD = 2;
const SLIDER_TOLERANCE = 4; // percent
const MAX_FAILS_BEFORE_LOCKOUT = 3;
const LOCKOUT_MS = 12000;
const STORAGE_KEY = "scrapebench_captcha_state";

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

function CaptchaBlock() {
    const persisted = loadPersisted();

    const [requestCount, setRequestCount] = useState(persisted?.requestCount || 0);
    const [stage, setStage] = useState(persisted?.stage || "content"); // content | checkbox | challenge | locked
    const [checked, setChecked] = useState(false);
    const [challengeType, setChallengeType] = useState(persisted?.challengeType || randomChallengeType());
    const [failCount, setFailCount] = useState(persisted?.failCount || 0);
    const [lockoutUntil, setLockoutUntil] = useState(persisted?.lockoutUntil || null);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    const [target, setTarget] = useState(randomTarget());
    const [sliderValue, setSliderValue] = useState(0);
    const [puzzleResult, setPuzzleResult] = useState(null); // null | 'ok' | 'fail'
    const [oddRound, setOddRound] = useState(buildOddOneOutRound());

    const dragging = useRef(false);
    const trackRef = useRef(null);

    const blocked = stage !== "content";

    // persist whenever the important bits change
    useEffect(() => {
        savePersisted({ requestCount, stage, challengeType, failCount, lockoutUntil });
    }, [requestCount, stage, challengeType, failCount, lockoutUntil]);

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

    function startChallenge() {
        const type = randomChallengeType();
        setChallengeType(type);
        setPuzzleResult(null);
        if (type === "slider") {
            setTarget(randomTarget());
            setSliderValue(0);
        } else {
            setOddRound(buildOddOneOutRound());
        }
        setStage("challenge");
        window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — checkbox confirmed, "${type}" challenge shown`, isEvent: true });
    }

    function toggleCheckbox() {
        const next = !checked;
        setChecked(next);
        if (next) startChallenge();
    }

    function registerFailure(reason) {
        const nextFails = failCount + 1;
        window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — ${reason}, retry required (${nextFails}/${MAX_FAILS_BEFORE_LOCKOUT})`, status: "bad", isEvent: true });
        if (nextFails >= MAX_FAILS_BEFORE_LOCKOUT) {
            const until = Date.now() + LOCKOUT_MS;
            setFailCount(0);
            setLockoutUntil(until);
            setStage("locked");
            window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/captcha — too many failed attempts, locked out for ${LOCKOUT_MS / 1000}s`, status: "bad", isEvent: true });
        } else {
            setFailCount(nextFails);
        }
    }

    function registerSuccess() {
        window.ScrapeBenchConsole.log({ method: "EVT", text: "/case/captcha — challenge solved, content unlocked", status: "ok", isEvent: true });
        setTimeout(() => {
            setStage("content");
            setChecked(false);
            setRequestCount(0);
            setFailCount(0);
            setPuzzleResult(null);
            clearPersisted();
        }, 900);
    }

    // --- slider puzzle handlers ---
    const updateFromClientX = useCallback((clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setSliderValue(pct);
    }, []);

    function onPointerDown(e) { dragging.current = true; updateFromClientX(e.clientX); }
    function onPointerMove(e) { if (dragging.current) updateFromClientX(e.clientX); }
    function onPointerUp() {
        if (!dragging.current) return;
        dragging.current = false;
        const diff = Math.abs(sliderValue - target);
        if (diff <= SLIDER_TOLERANCE) {
            setPuzzleResult("ok");
            registerSuccess();
        } else {
            setPuzzleResult("fail");
            setTarget(randomTarget());
            setSliderValue(0);
            registerFailure("slider puzzle missed");
        }
    }

    // --- odd-one-out handler ---
    function pickIcon(index) {
        if (index === oddRound.oddIndex) {
            setPuzzleResult("ok");
            registerSuccess();
        } else {
            setPuzzleResult("fail");
            setOddRound(buildOddOneOutRound());
            registerFailure("wrong icon picked");
        }
    }

    function reset() {
        setRequestCount(0);
        setStage("content");
        setChecked(false);
        setFailCount(0);
        setLockoutUntil(null);
        setPuzzleResult(null);
        clearPersisted();
        window.ScrapeBenchConsole.log({ method: "RST", text: "/case/captcha — wall state reset" });
    }

    return (
        <div className="panel">
            <h3>Target: #captcha-wall (detect the wall, don't parse it as data)</h3>

            {stage === "content" && (
                <div className="product-card">
                    <div className="name">iPhone 17 Pro</div>
                    <div className="price">$1,199</div>
                    <p className="case-meta" style={{ marginTop: 8 }}>request count: {requestCount}/{REQUEST_THRESHOLD}</p>
                </div>
            )}

            {stage === "checkbox" && (
                <div id="captcha-wall" className="captcha-box">
                    <div className="lock">🔒</div>
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Access Denied</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Unusual traffic detected from this connection. Please verify you are human to continue.
                    </p>
                    <label className="captcha-checkbox" htmlFor="captcha-checkbox-input">
                        <input id="captcha-checkbox-input" type="checkbox" checked={checked} onChange={toggleCheckbox} />
                        <span>I'm not a robot</span>
                    </label>
                </div>
            )}

            {stage === "challenge" && challengeType === "slider" && (
                <div id="captcha-wall" className="captcha-box">
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>One more step</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Drag the slider so the piece lines up with the notch.
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
                <div id="captcha-wall" className="captcha-box">
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>One more step</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
                        Click the tile that's different from the rest.
                    </p>
                    <div className="odd-grid">
                        {oddRound.icons.map((icon, i) => (
                            <button key={i} className="odd-tile" onClick={() => pickIcon(i)}>{icon}</button>
                        ))}
                    </div>
                    {puzzleResult === "fail" && <p className="chip danger" style={{ marginTop: 12 }}>wrong tile — try again ({failCount}/{MAX_FAILS_BEFORE_LOCKOUT})</p>}
                    {puzzleResult === "ok" && <p className="chip ok" style={{ marginTop: 12 }}>verified — unlocking…</p>}
                </div>
            )}

            {stage === "locked" && (
                <div id="captcha-wall" className="captcha-box">
                    <div className="lock">⏳</div>
                    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Temporarily Locked</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
                        Too many failed attempts. Try again in {lockoutRemaining}s.
                    </p>
                    <p className="case-meta" style={{ marginTop: 12 }}>this state survives a page reload — check sessionStorage</p>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn" onClick={simulateRequest} disabled={blocked}>Simulate request</button>
                <button className="btn" onClick={reset}>Reset</button>
            </div>
            <div className="hint">
                A real classifier should scan the response for keywords like <code>"Access Denied"</code> or
                <code>"verify you are human"</code>, and detect challenge markup (checkbox, puzzle, lockout timer)
                as a block signal — then back off, rotate session/IP, or flag for manual review. It should not try
                to auto-solve the puzzle: defeating an anti-bot challenge is out of scope for a legitimate scraping
                pipeline. Reload the page mid-lockout to see the block persist via <code>sessionStorage</code>,
                same as a real anti-bot session flag would.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.CaptchaBlock = CaptchaBlock;