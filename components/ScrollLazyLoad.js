// Test case: "scroll-triggered lazy load + load more + pagination (prev/next)"
// Renders directly into the page's normal document flow — no bordered
// box, no inner mini-scrollbox — so it visually blends with the rest
// of the page rather than sitting in its own isolated widget.
//
// Items genuinely below the fold only reveal their data once
// scrolled into the real page viewport (IntersectionObserver,
// root: null) — a scraper has to actually scroll down to reach them,
// same as a real user would. Items already visible on initial load
// (like the first batch, sitting at the very top of the page) decode
// immediately via a synchronous check, so there's no false-negative
// timing race against the observer's async callback. "Load more" and
// pagination (Prev/Next via the URL) work as before.
//
// Total data: 60 items across 3 pages (20 items/page).
// Each page: initial batch of 5 items, then "Load more" can be
// clicked 3x (+5 items each) until 20 items are showing.
// Pagination caps at page 3 (Next disappears on the last page).
const { useState, useEffect, useRef, useCallback } = React;

const ITEMS_PER_BATCH = 5;
const MAX_PAGE = 3;
const TOTAL_ITEMS = 60;
const ITEMS_PER_PAGE = TOTAL_ITEMS / MAX_PAGE;
const MAX_LOAD_MORE_CLICKS = ITEMS_PER_PAGE / ITEMS_PER_BATCH - 1;

const RAW_PRODUCT_DATA = [
    { name: "iPhone 17", storage: "128GB", color: "Black", price: "$999" },
    { name: "iPhone 17", storage: "256GB", color: "Black", price: "$1,149" },
    { name: "iPhone 17", storage: "512GB", color: "Black", price: "$1,399" },
    { name: "iPhone 17", storage: "128GB", color: "White", price: "$999" },
    { name: "iPhone 17", storage: "256GB", color: "White", price: "$1,149" },
    { name: "iPhone 17", storage: "512GB", color: "White", price: "$1,399" },
    { name: "iPhone 17 Plus", storage: "128GB", color: "Black", price: "$1,119" },
    { name: "iPhone 17 Plus", storage: "256GB", color: "Black", price: "$1,269" },
    { name: "iPhone 17 Plus", storage: "512GB", color: "Black", price: "$1,519" },
    { name: "iPhone 17 Plus", storage: "128GB", color: "Blue", price: "$1,119" },
    { name: "iPhone 17 Plus", storage: "256GB", color: "Blue", price: "$1,269" },
    { name: "iPhone 17 Plus", storage: "512GB", color: "Blue", price: "$1,519" },
    { name: "iPhone 17 Pro", storage: "256GB", color: "Titanium Blue", price: "$1,499" },
    { name: "iPhone 17 Pro", storage: "512GB", color: "Titanium Blue", price: "$1,749" },
    { name: "iPhone 17 Pro", storage: "1TB", color: "Titanium Blue", price: "$1,999" },
    { name: "iPhone 17 Pro", storage: "256GB", color: "Titanium Gray", price: "$1,499" },
    { name: "iPhone 17 Pro", storage: "512GB", color: "Titanium Gray", price: "$1,749" },
    { name: "iPhone 17 Pro", storage: "1TB", color: "Titanium Gray", price: "$1,999" },
    { name: "iPhone 17 Pro Max", storage: "256GB", color: "Titanium Black", price: "$1,699" },
    { name: "iPhone 17 Pro Max", storage: "512GB", color: "Titanium Black", price: "$1,949" },
    { name: "iPhone 17 Pro Max", storage: "1TB", color: "Titanium Black", price: "$2,199" },
    { name: "iPhone 17 Pro Max", storage: "2TB", color: "Titanium Black", price: "$2,549" },
    { name: "iPhone 17 Pro Max", storage: "256GB", color: "Titanium White", price: "$1,699" },
    { name: "iPhone 17 Pro Max", storage: "512GB", color: "Titanium White", price: "$1,949" },
    { name: "iPhone 17 mini", storage: "128GB", color: "Black", price: "$809" },
    { name: "iPhone 17 mini", storage: "256GB", color: "Black", price: "$929" },
    { name: "iPhone 17 mini", storage: "512GB", color: "Black", price: "$1,169" },
    { name: "iPhone 17 mini", storage: "128GB", color: "Pink", price: "$809" },
    { name: "iPhone 17 mini", storage: "256GB", color: "Pink", price: "$929" },
    { name: "iPhone 17 mini", storage: "512GB", color: "Pink", price: "$1,169" },
    { name: "iPhone 17e", storage: "128GB", color: "Black", price: "$629" },
    { name: "iPhone 17e", storage: "256GB", color: "Black", price: "$749" },
    { name: "iPhone 17e", storage: "128GB", color: "White", price: "$629" },
    { name: "iPhone 17e", storage: "256GB", color: "White", price: "$749" },
    { name: "iPhone 17e", storage: "128GB", color: "Red", price: "$629" },
    { name: "iPhone 17e", storage: "256GB", color: "Red", price: "$749" },
    { name: "iPhone 16", storage: "128GB", color: "Black", price: "$729" },
    { name: "iPhone 16", storage: "256GB", color: "Black", price: "$849" },
    { name: "iPhone 16", storage: "512GB", color: "Black", price: "$1,089" },
    { name: "iPhone 16", storage: "128GB", color: "Teal", price: "$729" },
    { name: "iPhone 16 Plus", storage: "128GB", color: "Black", price: "$829" },
    { name: "iPhone 16 Plus", storage: "256GB", color: "Black", price: "$949" },
    { name: "iPhone 16 Plus", storage: "512GB", color: "Black", price: "$1,189" },
    { name: "iPhone 16 Plus", storage: "128GB", color: "Ultramarine", price: "$829" },
    { name: "iPhone 16 Pro", storage: "128GB", color: "Titanium Natural", price: "$1,209" },
    { name: "iPhone 16 Pro", storage: "256GB", color: "Titanium Natural", price: "$1,329" },
    { name: "iPhone 16 Pro", storage: "512GB", color: "Titanium Natural", price: "$1,569" },
    { name: "iPhone 16 Pro", storage: "128GB", color: "Titanium Desert", price: "$1,209" },
    { name: "iPhone 16 Pro Max", storage: "256GB", color: "Titanium Black", price: "$1,449" },
    { name: "iPhone 16 Pro Max", storage: "512GB", color: "Titanium Black", price: "$1,689" },
    { name: "iPhone 16 Pro Max", storage: "1TB", color: "Titanium Black", price: "$1,929" },
    { name: "iPhone 16e", storage: "128GB", color: "Black", price: "$549" },
    { name: "iPhone 16e", storage: "256GB", color: "Black", price: "$669" },
    { name: "iPhone 15", storage: "128GB", color: "Black", price: "$609" },
    { name: "iPhone 15", storage: "256GB", color: "Black", price: "$729" },
    { name: "iPhone 15 Plus", storage: "128GB", color: "Blue", price: "$699" },
    { name: "iPhone 15 Pro", storage: "256GB", color: "Titanium Blue", price: "$1,129" },
    { name: "iPhone 15 Pro Max", storage: "256GB", color: "Titanium Black", price: "$1,309" },
    { name: "iPhone 14", storage: "128GB", color: "Midnight", price: "$519" },
    { name: "iPhone 14 Plus", storage: "128GB", color: "Starlight", price: "$579" },
    { name: "iPhone 13", storage: "128GB", color: "Pink", price: "$459" }
];

function buildRawItem(index) {
    const base = RAW_PRODUCT_DATA[index];
    const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
    return {
        id: `item-${index + 1}`,
        name: `${base.name} · ${base.storage} · ${base.color}`,
        price: base.price,
        page
    };
}

function encodeItem(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decodeItem(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function generateBatch(page, batchIndex) {
    const pageStart = (page - 1) * ITEMS_PER_PAGE;
    const batchStart = pageStart + batchIndex * ITEMS_PER_BATCH;
    return Array.from({ length: ITEMS_PER_BATCH }, (_, i) =>
        encodeItem(buildRawItem(batchStart + i))
    );
}

// Each cell only reveals its data once it's genuinely been scrolled
// into the real page viewport (root: null — the actual document
// viewport, not a bounded mini scrollbox). A scraper has to actually
// scroll the page to reach items further down, same as a real user.
//
// IntersectionObserver callbacks are asynchronous by spec — they
// don't fire the instant an element mounts, only on a later
// layout/idle pass. If a scraper's headless browser snapshots the
// DOM extremely quickly after load (before that first async callback
// runs), an item that's ALREADY inside the viewport on page load —
// like the very first batch at the top of the page — could still be
// caught mid-skeleton, purely due to that timing race, not because
// the scraper failed to scroll. To avoid that false negative, this
// does one synchronous getBoundingClientRect() check right on mount:
// if the cell is already visible at that instant, it decodes
// immediately, no async wait involved. Items genuinely below the
// fold still rely on the observer firing once they're scrolled into
// view for real — so the scroll requirement stays genuine for those.
function LazyCell({ index, encoded }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!cellRef.current) return;

        function reveal(reason) {
            setData(decodeItem(encoded));
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/scroll-lazy — item #${index + 1} ${reason} & decoded`,
                status: "ok",
                isEvent: true
            });
        }

        // synchronous check first — catches anything already in the
        // viewport on the very first paint, no async delay involved
        const rect = cellRef.current.getBoundingClientRect();
        const alreadyVisible =
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right > 0;

        if (alreadyVisible) {
            reveal("was already in the initial viewport on mount");
            return; // no need to set up an observer for this one
        }

        // otherwise, this item is genuinely below the fold — wait for
        // a real scroll to bring it into view before revealing it
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !data) {
                        reveal("scrolled into the real page viewport");
                    }
                });
            },
            { root: null, threshold: 0.4 } // root: null = the actual page/document viewport
        );
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [data, encoded, index]);

    if (!data) {
        return (
            <div ref={cellRef} className="skeleton" style={{ height: 80, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Loading…</span>
            </div>
        );
    }
    return (
        <div ref={cellRef} id={data.id} className="product-card">
            <div className="name">{data.name}</div>
            <div className="price">{data.price}</div>
        </div>
    );
}

function ScrollLazyLoad() {
    const getPageFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const p = parseInt(params.get("page"), 10);
        return Number.isFinite(p) && p >= 1 && p <= MAX_PAGE ? p : 1;
    };

    const [page, setPage] = useState(getPageFromUrl);
    const [loadMoreClicks, setLoadMoreClicks] = useState(0);
    const [batches, setBatches] = useState(() => [generateBatch(getPageFromUrl(), 0)]);

    useEffect(() => {
        setBatches([generateBatch(page, 0)]);
        setLoadMoreClicks(0);
    }, [page]);

    const handleLoadMore = useCallback(() => {
        setLoadMoreClicks((prev) => {
            const next = prev + 1;
            setBatches((b) => [...b, generateBatch(page, next)]);
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/load-more — batch ${next + 1} added (page ${page})`,
                status: "ok",
                isEvent: true
            });
            return next;
        });
    }, [page]);

    const goToPage = useCallback((targetPage, direction) => {
        if (targetPage < 1 || targetPage > MAX_PAGE) return;
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(targetPage));
        const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
        window.history.pushState({ page: targetPage }, "", newUrl);
        setPage(targetPage);
        window.ScrapeBenchConsole.log({
            method: "EVT",
            text: `/case/pagination — ${direction} to page ${targetPage}, URL updated`,
            status: "ok",
            isEvent: true
        });
    }, []);

    const handleNext = useCallback(() => goToPage(page + 1, "next"), [page, goToPage]);
    const handlePrevious = useCallback(() => goToPage(page - 1, "previous"), [page, goToPage]);

    useEffect(() => {
        const onPopState = () => setPage(getPageFromUrl());
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const canLoadMore = loadMoreClicks < MAX_LOAD_MORE_CLICKS;
    const canGoPrevious = page > 1;
    const canGoNext = page < MAX_PAGE;

    // NOTE: no ".panel" wrapper, no bordered/boxed container. This
    // renders straight into the normal page flow — the grid below is
    // just regular content on the page, not a self-contained widget.
    return (
        <div>
            <p className="case-meta" style={{ marginBottom: 12 }}>
                lazy load → load more → pagination (page {page}/{MAX_PAGE})
            </p>

            {batches.map((batch, batchIndex) => (
                <div
                    key={`${page}-${batchIndex}`}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginBottom: "12px"
                    }}
                >
                    {batch.map((encoded, i) => (
                        <LazyCell
                            key={i}
                            index={batchIndex * ITEMS_PER_BATCH + i}
                            encoded={encoded}
                        />
                    ))}
                </div>
            ))}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", padding: "16px 0" }}>
                {canLoadMore ? (
                    <button className="btn" onClick={handleLoadMore}>
                        Load more ({loadMoreClicks}/{MAX_LOAD_MORE_CLICKS})
                    </button>
                ) : (
                    <>
                        {canGoPrevious && (
                            <button className="btn" onClick={handlePrevious}>
                                ← Previous
                            </button>
                        )}
                        {canGoNext && (
                            <button className="btn" onClick={handleNext}>
                                Next →
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="hint">
                Items already visible on load decode immediately; items further down only reveal their data once
                genuinely scrolled into view (no inner scrollbox — this uses the real page viewport as the
                trigger). "Load more" can be clicked {MAX_LOAD_MORE_CLICKS} times (total {ITEMS_PER_PAGE} items
                per page), after which it becomes "Previous"/"Next" to switch pages via the URL <code>?page=</code>.
                {TOTAL_ITEMS} items total across {MAX_PAGE} pages.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
