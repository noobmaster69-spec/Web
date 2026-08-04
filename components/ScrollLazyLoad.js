// Test case: "scroll-triggered lazy load + load more + pagination (prev/next)"
// STRICT SCROLL GATE: no item — not even one that happens to already
// sit inside the viewport the instant it mounts — reveals its data
// until the user has performed at least one genuine scroll gesture
// (a real "wheel" or "touchmove" event on the window). The gate
// re-arms on every page change (Prev/Next), so each page needs its
// own fresh scroll.
const { useState, useEffect, useRef, useCallback } = React;

const ITEMS_PER_BATCH = 5;
const MAX_PAGE = 3;
const TOTAL_ITEMS = 60;
const ITEMS_PER_PAGE = TOTAL_ITEMS / MAX_PAGE;
const MAX_LOAD_MORE_CLICKS = ITEMS_PER_PAGE / ITEMS_PER_BATCH - 1;

// Obfuscated at rest: plain product names/prices are NOT sitting in this
// file as readable text — inspecting source/network before any scroll
// interaction only reveals base64 gibberish, not usable product data.
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
    { name: "iPhone 13", storage: "128GB", color: "Pink", price: "$459" },
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

// NEW: seluruh RAW_PRODUCT_DATA di-parse jadi array of JS object penuh
// (bukan raw name/storage/color lagi, tapi objek final siap-tampil).
// Ini murni struktur data di memory — tidak pernah langsung dipakai
// untuk render/reveal apapun; tetap harus lewat encodeItem() + scroll-gate.
const ALL_PRODUCT_ITEMS = RAW_PRODUCT_DATA.map((_, index) => buildRawItem(index));
window.__debug_ALL_PRODUCT_ITEMS = ALL_PRODUCT_ITEMS;
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
        encodeItem(ALL_PRODUCT_ITEMS[batchStart + i])
    );
}

// Live registry of every item that has genuinely been revealed so far,
// keyed by item id — bagus buat lookup cepat by id.
window.ScrapeBenchRevealedData = window.ScrapeBenchRevealedData || {};

// NEW: array of objects — ini yang dipakai buat SCRAPE.
// Setiap item ke-reveal, objek hasil parse-nya di-push ke sini juga.
// Jadi window.ScrapeBenchRevealedList selalu berupa array of parsed objects,
// urut sesuai urutan reveal-nya (bukan keyed object).
window.ScrapeBenchRevealedList = window.ScrapeBenchRevealedList || [];

function LazyCell({ index, encoded, userHasScrolled }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!cellRef.current) return;
        if (data) return;
        if (!userHasScrolled) return; // hard gate

        function reveal(reason) {
            const decoded = decodeItem(encoded);
            setData(decoded);
            window.ScrapeBenchRevealedData[decoded.id] = decoded;
            if (!window.ScrapeBenchRevealedList.some((it) => it.id === decoded.id)) {
                window.ScrapeBenchRevealedList.push(decoded);
            }
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/scroll-lazy — item #${index + 1} ${reason} & decoded`,
                status: "ok",
                isEvent: true
            });
        }

        const rect = cellRef.current.getBoundingClientRect();
        const alreadyVisible =
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right > 0;

        if (alreadyVisible) {
            reveal("was in view once a genuine scroll gesture unlocked it");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !data) {
                        reveal("scrolled into the real page viewport");
                    }
                });
            },
            { root: null, threshold: 0.4 }
        );
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [data, encoded, index, userHasScrolled]);

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
    const topRef = useRef(null);
    const isFirstRender = useRef(true);
    const [userHasScrolled, setUserHasScrolled] = useState(false);

    useEffect(() => {
        if (userHasScrolled) return;
        function openGate() {
            setUserHasScrolled(true);
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: "/case/scroll-lazy — genuine scroll gesture detected, gate opened",
                status: "ok",
                isEvent: true
            });
        }
        window.addEventListener("wheel", openGate, { passive: true, once: true });
        window.addEventListener("touchmove", openGate, { passive: true, once: true });
        window.addEventListener("scroll", openGate, { passive: true, once: true }); 
        return () => {
            window.removeEventListener("wheel", openGate);
            window.removeEventListener("touchmove", openGate);
        };
    }, [userHasScrolled]);

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

        if (isFirstRender.current) {
            isFirstRender.current = false;
        } else {
            if (topRef.current) {
                topRef.current.scrollIntoView({ behavior: "auto", block: "start" });
            }
            setUserHasScrolled(false); // re-arm gate on every page change
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/scroll-lazy — page changed, scroll gate re-armed for page ${page}`,
                status: "ok",
                isEvent: true
            });
        }
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

    return (
        <div ref={topRef}>
            <p className="case-meta" style={{ marginBottom: 12 }}>
                lazy load → load more → pagination (page {page}/{MAX_PAGE})
                {!userHasScrolled && " · waiting for a genuine scroll gesture…"}
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
                            userHasScrolled={userHasScrolled}
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
                Nothing decodes until a genuine scroll gesture (wheel/touch) has happened at least once — simply
                opening the page is not enough. After that, items already visible decode immediately; items
                further down only reveal their data once genuinely scrolled into view (no inner scrollbox — this
                uses the real page viewport as the trigger). "Load more" can be clicked {MAX_LOAD_MORE_CLICKS}{" "}
                times (total {ITEMS_PER_PAGE} items per page), after which it becomes "Previous"/"Next" to switch
                pages via the URL <code>?page=</code>. {TOTAL_ITEMS} items total across {MAX_PAGE} pages.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
