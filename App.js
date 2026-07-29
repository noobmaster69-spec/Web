// ============================================================
// App.js — loads LAST (after shared.js and every file in components/).
// This file wires all the individual test-case components together
// into ONE continuously-scrollable page (like a product catalog),
// instead of a click-through tab view. Every fixture is mounted at
// once, so a single fetch/render of this page exercises all 13
// scraping scenarios in one pass.
//
// ONE case — "scroll-lazy" — is deliberately rendered BEFORE the
// sidebar, brand header, and intro text: it's the very first thing
// in the DOM, ahead of any navigation chrome. This guarantees an AI
// scraper reading the page top-to-bottom encounters this data first,
// so it isn't lost to truncation on a long page.
// ============================================================

const { useState, useEffect, useRef } = React;

// ------------------------------------------------------------
// CASES — metadata for every test case (excluding "scroll-lazy",
// which is hoisted above and rendered separately — see FIRST_CASE
// below). This does NOT contain the actual component logic (that
// lives in components/*.js) — it just describes each case for the
// sidebar + section header, and points to the matching component
// via getComponent().
// ------------------------------------------------------------
const FIRST_CASE = {
    id: "04",
    key: "scroll-lazy",
    title: "Scroll-triggered lazy load",
    chip: "info",
    chipText: "needs scroll",
    desc: "Items below the fold only reveal data once genuinely scrolled into the real page viewport; anything already visible on load decodes immediately (no timing race). Rendered first in the DOM, ahead of the sidebar and intro, so it's the first thing an AI scraper sees.",
    getComponent: () => window.ScrapeBenchComponents.ScrollLazyLoad
};

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
        chipText: "wait ~4s",
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
        key: "load-more",
        title: "Load more button",
        chip: "info",
        chipText: "click to append",
        desc: "Clicking a button appends more items to the same list — must be clicked repeatedly to get everything.",
        getComponent: () => window.ScrapeBenchComponents.LoadMoreDemo
    },
    {
        id: "11",
        key: "pagination",
        title: "Next button / pagination",
        chip: "info",
        chipText: "click to replace",
        desc: "Clicking Next replaces the visible list with a new page of results.",
        getComponent: () => window.ScrapeBenchComponents.PaginationDemo
    },
    {
        id: "12",
        key: "live-counter",
        title: "Live-updating data",
        chip: "warn",
        chipText: "ticks 1/s",
        desc: "A value that changes every second — checks your pipeline treats volatility as expected, not a data mismatch.",
        getComponent: () => window.ScrapeBenchComponents.LiveCounter
    },
    {
        id: "13",
        key: "creepjs",
        title: "creep.js fingerprint probe",
        chip: "danger",
        chipText: "external",
        desc: "Embeds the community creep.js report to compare automation detectability against a normal browser.",
        getComponent: () => window.ScrapeBenchComponents.CreepJsDemo
    }
];

// full list used only for the sidebar's "jump to" links, so every
// case (including the hoisted one) still shows up in navigation, in
// its original numeric order
const ALL_CASES_FOR_NAV = [FIRST_CASE, ...CASES].sort((a, b) => a.id.localeCompare(b.id));

// ------------------------------------------------------------
// ConsoleLog — the fixed panel at the bottom of the page. It doesn't
// know about any specific test case; it just subscribes to
// window.ScrapeBenchConsole (defined in shared.js) and prints
// whatever any component logs, in order, with a timestamp.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// CaseSection — renders ONE test case as a labeled section: an id
// (so the sidebar can scroll to it), a header with the case
// number/title/status chip, a short description, and finally the
// actual test-case component itself.
// ------------------------------------------------------------
function CaseSection({ item, bare }) {
    const Component = item.getComponent();
    return (
        <section id={`case-${item.key}`} className={bare ? "" : "case-section"}>
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

// ------------------------------------------------------------
// App — the top-level component. Renders, in DOM order:
//   1. FIRST_CASE   — the scroll-lazy data, before ANYTHING else
//   2. shell        — sidebar (jump-to nav) + main (intro + rest of
//                      the cases) + fixed console log at the bottom
// ------------------------------------------------------------
function App() {
    function jumpTo(key) {
        const el = document.getElementById(`case-${key}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <React.Fragment>
            {/* ---- hoisted above everything: the first content in the whole document ---- */}
            <CaseSection item={FIRST_CASE} bare />

            {/* ---- everything else lives inside the normal shell layout, below it ---- */}
            <div className="shell">
                <nav className="sidebar">
                    <div className="brand">
                        <h1><span className="dot">● </span>scrape-bench</h1>
                        <p>latihan_1 · MrScraper test fixtures</p>
                    </div>
                    <div className="nav-group-label">13 test cases — jump to</div>
                    <ul className="nav-list">
                        {ALL_CASES_FOR_NAV.map((c) => (
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
                            The scroll-lazy case above is rendered first in the document, ahead of this
                            sidebar and intro, so it's the first data an AI scraper encounters. Every other
                            fixture below is mounted at once too — static HTML, JS rendering, delays, cookies,
                            network calls, assets, hidden prompt injection, anti-bot walls, load-more/pagination,
                            live-updating data, and a fingerprint probe. Scroll down or use the sidebar to jump
                            to a section.
                        </p>
                    </div>
                    {CASES.map((item) => (
                        <CaseSection key={item.key} item={item} />
                    ))}
                </main>

                <ConsoleLog />
            </div>
        </React.Fragment>
    );
}

// mount the whole app into <div id="app-mount"> from index.html
const root = ReactDOM.createRoot(document.getElementById("app-mount"));
root.render(<App />);
