// Test case: "load more button"
// Each click on #load-more-btn pushes a NEW URL onto the same domain
// via history.pushState (e.g. ?load-more-page=2), instead of only
// updating in-memory state. This mirrors real catalog sites where
// "load more" / pagination changes the address bar, so the current
// page is shareable, bookmarkable, and survives a reload.
const { useState, useEffect } = React;

const CATALOG = [
    { name: "iPhone 17 128GB", price: "$999" },
    { name: "iPhone 17 256GB", price: "$1,099" },
    { name: "iPhone 17 512GB", price: "$1,299" },
    { name: "iPhone 17 1TB", price: "$1,499" },
    { name: "iPhone 17 Plus 128GB", price: "$1,099" },
    { name: "iPhone 17 Plus 256GB", price: "$1,199" },
    { name: "iPhone 17 Plus 512GB", price: "$1,399" },
    { name: "iPhone 17 Plus 1TB", price: "$1,599" },
    { name: "iPhone 17 Pro 128GB", price: "$1,199" },
    { name: "iPhone 17 Pro 256GB", price: "$1,299" },
    { name: "iPhone 17 Pro 512GB", price: "$1,499" },
    { name: "iPhone 17 Pro 1TB", price: "$1,699" },
    { name: "iPhone 17 Pro Max 128GB", price: "$1,399" },
    { name: "iPhone 17 Pro Max 256GB", price: "$1,499" },
    { name: "iPhone 17 Pro Max 512GB", price: "$1,699" },
    { name: "iPhone 17 Pro Max 1TB", price: "$1,899" },
    { name: "iPhone 17 Air 128GB", price: "$1,249" },
    { name: "iPhone 17 Air 256GB", price: "$1,349" },
    { name: "iPhone 17 Air 512GB", price: "$1,549" },
    { name: "iPhone 17 Air 1TB", price: "$1,749" },
    { name: "iPhone 17 128GB Midnight", price: "$999" },
    { name: "iPhone 17 Plus 256GB Starlight", price: "$1,206" },
    { name: "iPhone 17 Pro 512GB Titanium", price: "$1,513" },
    { name: "iPhone 17 Pro Max 1TB Deep Blue", price: "$1,920" },
    { name: "iPhone 17 Air 128GB Rose Gold", price: "$1,277" },
    { name: "iPhone 17 256GB Graphite", price: "$1,134" },
    { name: "iPhone 17 Plus 512GB Silver", price: "$1,441" },
    { name: "iPhone 17 Pro 1TB Space Black", price: "$1,748" },
    { name: "iPhone 17 Pro Max 128GB Sunset", price: "$1,405" },
    { name: "iPhone 17 Air 256GB Slate", price: "$1,362" }
];
const PAGE_SIZE = 5;
const QUERY_PARAM = "load-more-page";

// reads the current page number from the URL's query string,
// defaulting to 1 if it's missing, invalid, or less than 1
function getPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = parseInt(params.get(QUERY_PARAM), 10);
    return !raw || raw < 1 ? 1 : raw;
}

function LoadMoreDemo() {
    // initial state is read straight from the URL, so a page loaded
    // directly at ?load-more-page=3 starts already showing 3 pages
    const [page, setPage] = useState(getPageFromUrl);

    const visibleCount = Math.min(page * PAGE_SIZE, CATALOG.length);
    const done = visibleCount >= CATALOG.length;

    // keep the address bar in sync with `page` — pushes a brand-new
    // URL (same domain, new query string) onto browser history every
    // time page changes, instead of silently replacing state in place
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set(QUERY_PARAM, String(page));
        window.history.pushState({ [QUERY_PARAM]: page }, "", url);
    }, [page]);

    // support the browser's Back/Forward buttons: if the user
    // navigates through history, re-sync React state from the URL
    useEffect(() => {
        function onPopState() {
            setPage(getPageFromUrl());
        }
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    function loadMore() {
        const next = page + 1;
        const newVisible = Math.min(next * PAGE_SIZE, CATALOG.length);
        setPage(next);
        window.ScrapeBenchConsole.log({
            method: "NAV",
            text: `/case/load-more — pushed new URL ?${QUERY_PARAM}=${next}, showing ${newVisible}/${CATALOG.length} items`,
            status: "ok"
        });
    }

    return (
        <div className="panel">
            <h3>Target: #load-more-list</h3>
            <div id="load-more-list" className="product-grid">
                {CATALOG.slice(0, visibleCount).map((item, index) => (
                    <div className="product-card" key={index}>
                    <div className="name">{item.name}</div>
                     <div className="price">{item.price}</div>
                    </div>
                ))}
            </div>
            <button
                id="load-more-btn"
                className="btn primary"
                style={{ marginTop: 16 }}
                onClick={loadMore}
                disabled={done}
            >
                {done ? "All items loaded" : `Load more (${visibleCount}/${CATALOG.length})`}
            </button>
            <div className="hint">
                Every click pushes a real new URL on the same domain — e.g. <code>?{QUERY_PARAM}=2</code>,
                then <code>?{QUERY_PARAM}=3</code> — via <code>history.pushState</code>, 5 items per page,
                {CATALOG.length} items total across {Math.ceil(CATALOG.length / PAGE_SIZE)} pages. Reloading
                or sharing that URL restores the same page of items. Your scraper needs to locate
                <code>#load-more-btn</code>, click it repeatedly until it disables, and accumulate results
                from <code>#load-more-list</code> across clicks (or alternatively, just iterate the
                <code>?{QUERY_PARAM}=N</code> URLs directly).
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.LoadMoreDemo = LoadMoreDemo;
