// App.js — loads LAST (after shared.js and every file in components/).
// This file wires all the individual test-case components together
// into ONE continuously-scrollable page (like a product catalog),
// instead of a click-through tab view. Every fixture is mounted at
// once, so a single fetch/render of this page exercises all 13
// scraping scenarios in one pass.
const { useState, useEffect, useRef } = React;
const CASES = [
    {
        id: "01",
        key: "static",
        title: "Static HTML (curl)",
        chip: "ok",
        chipText: "no-js",
        desc: "Content present in the raw HTML response — no JavaScript execution required to read it.",
        getComponent: () => window.ScrapeBenchComponents.StaticContent
    },
    {
        id: "02",
        key: "js-rendered",
        title: "JS-rendered content",
        chip: "info",
        chipText: "needs js",
        desc: "Container is empty on load; content is injected entirely by client-side JavaScript after mount.",
        getComponent: () => window.ScrapeBenchComponents.JsRenderedContent
    },
    {
        id: "03",
        key: "delayed",
        title: "Delayed selector",
        chip: "warn",
        chipText: "wait ~25s",
        desc: "Target element does not exist until several seconds after load — tests wait_for_selector handling.",
        getComponent: () => window.ScrapeBenchComponents.DelayedContent
    },
    {
        id: "05",
        key: "cookie",
        title: "Cookies",
        chip: "info",
        chipText: "session",
        desc: "Sets a session cookie and gates a content block behind its presence.",
        getComponent: () => window.ScrapeBenchComponents.CookieDemo
    },
    {
        id: "06",
        key: "network",
        title: "Network calls",
        chip: "info",
        chipText: "fetch",
        desc: "Content depends on a live fetch()/XHR round trip completing after page load.",
        getComponent: () => window.ScrapeBenchComponents.NetworkCallDemo
    },
    {
        id: "07",
        key: "assets",
        title: "Images, fonts, stylesheets",
        chip: "ok",
        chipText: "sub-resources",
        desc: "Checks that remote images, a web font, and CSS-driven visuals all load correctly.",
        getComponent: () => window.ScrapeBenchComponents.AssetsDemo
    },
    {
        id: "08",
        key: "prompt-injection",
        title: "Non-rendered prompt injection",
        chip: "danger",
        chipText: "hidden dom",
        desc: "A DOM node with text content that is never visible to a human — checks whether your AI summarizer ingests hidden text.",
        getComponent: () => window.ScrapeBenchComponents.PromptInjectionHidden
    },
    {
        id: "09",
        key: "captcha",
        title: "Captcha / blocking keyword",
        chip: "danger",
        chipText: "anti-bot",
        desc: "A layered wall (checkbox → random puzzle type → lockout on repeat failure) that persists across reloads — checks that your pipeline detects and backs off instead of trying to solve it.",
        getComponent: () => window.ScrapeBenchComponents.CaptchaBlock
    },
    {
        id: "10",
        key: "live-counter",
        title: "Live-updating data",
        chip: "warn",
        chipText: "ticks 1/s",
        desc: "A value that changes every second — checks your pipeline treats volatility as expected, not a data mismatch.",
        getComponent: () => window.ScrapeBenchComponents.LiveCounter
    },
    {
        id: "11",
        key: "creepjs",
        title: "creep.js fingerprint probe",
        chip: "danger",
        chipText: "external",
        desc: "Embeds the community creep.js report to compare automation detectability against a normal browser.",
        getComponent: () => window.ScrapeBenchComponents.CreepJsDemo
    },
    {
        id: "04",
        key: "scroll-lazy",
        title: "Scroll-triggered lazy load + load more + pagination",
        chip: "info",
        chipText: "needs scroll",
        desc: "Items below the fold only reveal data once genuinely scrolled into the real page viewport; anything already visible on load decodes immediately (no timing race). Also includes a Load more button and Prev/Next pagination via the URL — all three interactions combined in one fixture.",
        getComponent: () => window.ScrapeBenchComponents.ScrollLazyLoad
    }
];

function ConsoleLog() {
    const [rows, setRows] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        const unsubscribe = window.ScrapeBenchConsole.subscribe((entry) => {
            setRows((prev) => [...prev.slice(-49), entry]);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ block: "end" });
    }, [rows]);

    return (
        <div className="console">
            {rows.length === 0 && (
                <div className="console-row">
                    <span className="t">—</span>waiting for activity…
                </div>
            )}
            {rows.map((r, i) => (
                <div className={`console-row${r.isEvent ? " evt" : ""}`} key={i}>
                    <span className="t">{r.time.toLocaleTimeString("en-US")}</span>
                    <span className="method">{r.method}</span>
                    <span className={r.status === "ok" ? "status-ok" : r.status === "bad" ? "status-bad" : ""}>{r.text}</span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
function CaseSection({ item }) {
    const Component = item.getComponent();
    return (
        <section id={`case-${item.key}`} className="case-section">
            <div className="case-header">
                <div>
                    <p className="case-meta">case #{item.id} — {item.key}</p>
                    <h2>{item.title}</h2>
                </div>
                <span className={`chip ${item.chip}`}>{item.chipText}</span>
            </div>
            <p className="case-desc">{item.desc}</p>
            {Component ? (
                <Component />
            ) : (
                <div className="chip danger">component failed to load — check script order in index.html</div>
            )}
        </section>
    );
}

function App() {
    function jumpTo(key) {
        const el = document.getElementById(`case-${key}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return (
        <div className="shell">
            <nav className="sidebar">
                <div className="brand">
                    <h1><span className="dot">● </span>scrape-bench</h1>
                    <p>latihan_1 · MrScraper test fixtures</p>
                </div>
                <div className="nav-group-label">13 test cases — jump to</div>
                <ul className="nav-list">
                    {CASES.map((c) => (
                        <li key={c.key}>
                            <button className="nav-item" onClick={() => jumpTo(c.key)}>
                                <span className="id mono">{c.id}</span>
                                <span>{c.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="main">
                <div className="page-intro">
                    <p className="case-meta">scrape-bench · all test cases on one page</p>
                    <h2>13 scraping test fixtures</h2>
                    <p className="case-desc">
                        Every fixture below is mounted at once, so a single fetch/render of this page exercises
                        all 13 scenarios in one pass — static HTML, JS rendering, delays, cookies, network calls,
                        assets, hidden prompt injection, anti-bot walls, load-more/pagination, live-updating data,
                        a fingerprint probe, and scroll-triggered lazy load at the very bottom. Scroll down or use
                        the sidebar to jump to a section.
                    </p>
                </div>
                {CASES.map((item) => (
                    <CaseSection key={item.key} item={item} />
                ))}
            </main>
            <ConsoleLog />
        </div>
    );
}
// mount the whole app into <div id="app-mount"> from index.html
const root = ReactDOM.createRoot(document.getElementById("app-mount"));
root.render(<App />);
