// Test case: "next button"
// Unlike load-more, this REPLACES the visible list per page instead
// of appending — and now each Next/Prev click pushes a real new URL
// on the same domain (e.g. ?pagination-page=2) via history.pushState,
// so a fresh visit to that URL loads straight into the right page
// with the correct replaced list, not just page 1.
const { useState, useEffect } = React;

const PAGES = [
    [
        { name: "iPhone 17 128GB", price: "$999" },
        { name: "iPhone 17 256GB", price: "$1,099" }
    ],
    [
        { name: "iPhone 17 Pro 128GB", price: "$1,199" },
        { name: "iPhone 17 Pro 256GB", price: "$1,299" }
    ],
    [
        { name: "iPhone 17 Pro Max 256GB", price: "$1,499" },
        { name: "iPhone 17 Pro Max 512GB", price: "$1,699" }
    ]
];
const QUERY_PARAM = "pagination-page";

// reads the current page INDEX (0-based) from the URL's query string,
// defaulting to 0 if missing, invalid, or out of range
function getPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = parseInt(params.get(QUERY_PARAM), 10);
    if (!raw || raw < 1 || raw > PAGES.length) return 0;
    return raw - 1; // URL is 1-indexed for humans, state is 0-indexed
}

function PaginationDemo() {
    // initial page comes straight from the URL — visiting
    // ?pagination-page=3 directly lands on page 3's replaced list
    const [page, setPage] = useState(getPageFromUrl);
    const isLast = page >= PAGES.length - 1;
    const isFirst = page === 0;

    // push a brand-new URL (same domain, new query string) every time
    // the page changes, instead of only updating in-memory state
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set(QUERY_PARAM, String(page + 1));
        window.history.pushState({ [QUERY_PARAM]: page + 1 }, "", url);
    }, [page]);

    // keep the browser's Back/Forward buttons working correctly
    useEffect(() => {
        function onPopState() {
            setPage(getPageFromUrl());
        }
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    function goTo(next) {
        setPage(next);
        window.ScrapeBenchConsole.log({
            method: "NAV",
            text: `/case/pagination — pushed new URL ?${QUERY_PARAM}=${next + 1}, list replaced`,
            status: "ok"
        });
    }

    return (
        <div className="panel">
            <h3>Target: #pagination-list (page {page + 1} of {PAGES.length})</h3>
            <div id="pagination-list" className="product-grid">
                {PAGES[page].map((item, index) => (
                    <div className="product-card" key={index}>
                        <div className="name">{item.name}</div>
                        <div className="price">{item.price}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
                <button className="btn" id="prev-page-btn" onClick={() => goTo(page - 1)} disabled={isFirst}>
                    ← Prev
                </button>
                <span className="case-meta">page {page + 1}/{PAGES.length}</span>
                <button className="btn primary" id="next-page-btn" onClick={() => goTo(page + 1)} disabled={isLast}>
                    Next →
                </button>
            </div>
            <div className="hint">
                Each click pushes a real new URL on the same domain — e.g. <code>?{QUERY_PARAM}=2</code>,
                then <code>?{QUERY_PARAM}=3</code> — and <code>#pagination-list</code> is fully replaced
                (not appended) each time. Reloading or sharing that URL lands directly on the matching
                page. Click <code>#next-page-btn</code> until it disables, scraping
                <code>#pagination-list</code> fresh on every page — or iterate the
                <code>?{QUERY_PARAM}=N</code> URLs directly.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.PaginationDemo = PaginationDemo;
