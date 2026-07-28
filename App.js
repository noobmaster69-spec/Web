// App.js — load PALING TERAKHIR. Merakit semua komponen di
// window.ScrapeBenchComponents jadi satu dashboard: sidebar nav
// (13 test case) + panel case + console log di bawah.
const { useState, useEffect, useRef } = React;

const CASES = [
    { id: "01", key: "static", title: "Static HTML (curl)", chip: "ok", chipText: "no-js", desc: "Konten ada di raw HTML response — tidak butuh JavaScript untuk dibaca.", getComponent: () => window.ScrapeBenchComponents.StaticContent },
    { id: "02", key: "js-rendered", title: "JS-rendered content", chip: "info", chipText: "needs js", desc: "Container kosong saat load; konten disuntikkan sepenuhnya oleh JS di client setelah mount.", getComponent: () => window.ScrapeBenchComponents.JsRenderedContent },
    { id: "03", key: "delayed", title: "Delayed selector", chip: "warn", chipText: "wait ~4s", desc: "Elemen target belum ada sampai beberapa detik setelah load — test wait_for_selector.", getComponent: () => window.ScrapeBenchComponents.DelayedContent },
    { id: "04", key: "scroll-lazy", title: "Scroll-triggered lazy load", chip: "info", chipText: "needs scroll", desc: "Konten cuma render kalau container-nya di-scroll ke viewport (IntersectionObserver).", getComponent: () => window.ScrapeBenchComponents.ScrollLazyLoad },
    { id: "05", key: "cookie", title: "Cookies", chip: "info", chipText: "session", desc: "Set session cookie, konten muncul kalau cookie itu ada.", getComponent: () => window.ScrapeBenchComponents.CookieDemo },
    { id: "06", key: "network", title: "Network calls", chip: "info", chipText: "fetch", desc: "Konten bergantung pada fetch()/XHR round trip yang selesai setelah page load.", getComponent: () => window.ScrapeBenchComponents.NetworkCallDemo },
    { id: "07", key: "assets", title: "Images, fonts, stylesheets", chip: "ok", chipText: "sub-resources", desc: "Cek gambar remote, web font, dan visual berbasis CSS semua ke-load dengan benar.", getComponent: () => window.ScrapeBenchComponents.AssetsDemo },
    { id: "08", key: "prompt-injection", title: "Non-rendered prompt injection", chip: "danger", chipText: "hidden dom", desc: "Node DOM dengan teks yang tidak pernah terlihat manusia — cek apakah AI summarizer kamu ikut membacanya.", getComponent: () => window.ScrapeBenchComponents.PromptInjectionHidden },
    { id: "09", key: "captcha", title: "Captcha / blocking keyword", chip: "danger", chipText: "anti-bot", desc: "Simulasi anti-bot wall setelah beberapa request, dengan keyword yang harus tertangkap classifier.", getComponent: () => window.ScrapeBenchComponents.CaptchaBlock },
    { id: "10", key: "load-more", title: "Load more button", chip: "info", chipText: "click to append", desc: "Klik tombol nambahin item ke list yang sama — harus diklik berulang buat dapat semuanya.", getComponent: () => window.ScrapeBenchComponents.LoadMoreDemo },
    { id: "11", key: "pagination", title: "Next button / pagination", chip: "info", chipText: "click to replace", desc: "Klik Next mengganti list yang tampil dengan halaman hasil baru.", getComponent: () => window.ScrapeBenchComponents.PaginationDemo },
    { id: "12", key: "live-counter", title: "Live-updating data", chip: "warn", chipText: "ticks 1/s", desc: "Nilai yang berubah tiap detik — cek pipeline kamu anggap volatility ini wajar, bukan data mismatch.", getComponent: () => window.ScrapeBenchComponents.LiveCounter },
    { id: "13", key: "creepjs", title: "creep.js fingerprint probe", chip: "danger", chipText: "external", desc: "Embed report creep.js buat bandingkan detectability automation vs browser normal.", getComponent: () => window.ScrapeBenchComponents.CreepJsDemo }
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
                    <span className="t">{r.time.toLocaleTimeString("id-ID")}</span>
                    <span className="method">{r.method}</span>
                    <span className={r.status === "ok" ? "status-ok" : r.status === "bad" ? "status-bad" : ""}>{r.text}</span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}

function App() {
    const [activeKey, setActiveKey] = useState(CASES[0].key);
    const active = CASES.find((c) => c.key === activeKey);
    const ActiveComponent = active.getComponent();

    return (
        <div className="shell">
            <nav className="sidebar">
                <div className="brand">
                    <h1><span className="dot">● </span>scrape-bench</h1>
                    <p>latihan_1 · MrScraper test fixtures</p>
                </div>
                <div className="nav-group-label">13 test cases</div>
                <ul className="nav-list">
                    {CASES.map((c) => (
                        <li key={c.key}>
                            <button
                                className={`nav-item${c.key === activeKey ? " active" : ""}`}
                                onClick={() => setActiveKey(c.key)}
                            >
                                <span className="id mono">{c.id}</span>
                                <span>{c.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="main">
                <div className="case-header">
                    <div>
                        <p className="case-meta">case #{active.id} — {active.key}</p>
                        <h2>{active.title}</h2>
                    </div>
                    <span className={`chip ${active.chip}`}>{active.chipText}</span>
                </div>
                <p className="case-desc">{active.desc}</p>
                {ActiveComponent ? (
                    <ActiveComponent />
                ) : (
                    <div className="chip danger">the component wasnt load yet</div>
                )}
            </main>
            <ConsoleLog />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
