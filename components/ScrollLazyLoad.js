// Test case: "scroll-triggered lazy load + load more + pagination (prev/next)"
// Total data: 60 item, dibagi 3 halaman (20 item/halaman).
// Tiap halaman: batch awal 5 item, lalu "Load more" bisa diklik 3x (masing-masing +5 item)
// sampai 20 item penuh. Pagination mentok di page 3 (Next hilang di page terakhir).
const { useState, useEffect, useRef, useCallback } = React;

const ITEMS_PER_BATCH = 5;          
const MAX_PAGE = 3;               
const TOTAL_ITEMS = 60;           
const ITEMS_PER_PAGE = TOTAL_ITEMS / MAX_PAGE;     
const MAX_LOAD_MORE_CLICKS = ITEMS_PER_PAGE / ITEMS_PER_BATCH - 1; 

const RAW_PRODUCT_DATA = [
    { name: "iPhone 17", storage: "128GB", color: "Black", price: "Rp 16.299.000" },
    { name: "iPhone 17", storage: "256GB", color: "Black", price: "Rp 18.799.000" },
    { name: "iPhone 17", storage: "512GB", color: "Black", price: "Rp 22.799.000" },
    { name: "iPhone 17", storage: "128GB", color: "White", price: "Rp 16.299.000" },
    { name: "iPhone 17", storage: "256GB", color: "White", price: "Rp 18.799.000" },
    { name: "iPhone 17", storage: "512GB", color: "White", price: "Rp 22.799.000" },
    { name: "iPhone 17 Plus", storage: "128GB", color: "Black", price: "Rp 18.299.000" },
    { name: "iPhone 17 Plus", storage: "256GB", color: "Black", price: "Rp 20.799.000" },
    { name: "iPhone 17 Plus", storage: "512GB", color: "Black", price: "Rp 24.799.000" },
    { name: "iPhone 17 Plus", storage: "128GB", color: "Blue", price: "Rp 18.299.000" },
    { name: "iPhone 17 Plus", storage: "256GB", color: "Blue", price: "Rp 20.799.000" },
    { name: "iPhone 17 Plus", storage: "512GB", color: "Blue", price: "Rp 24.799.000" },
    { name: "iPhone 17 Pro", storage: "256GB", color: "Titanium Blue", price: "Rp 24.499.000" },
    { name: "iPhone 17 Pro", storage: "512GB", color: "Titanium Blue", price: "Rp 28.499.000" },
    { name: "iPhone 17 Pro", storage: "1TB", color: "Titanium Blue", price: "Rp 32.499.000" },
    { name: "iPhone 17 Pro", storage: "256GB", color: "Titanium Gray", price: "Rp 24.499.000" },
    { name: "iPhone 17 Pro", storage: "512GB", color: "Titanium Gray", price: "Rp 28.499.000" },
    { name: "iPhone 17 Pro", storage: "1TB", color: "Titanium Gray", price: "Rp 32.499.000" },
    { name: "iPhone 17 Pro Max", storage: "256GB", color: "Titanium Black", price: "Rp 27.999.000" },
    { name: "iPhone 17 Pro Max", storage: "512GB", color: "Titanium Black", price: "Rp 31.999.000" },
    { name: "iPhone 17 Pro Max", storage: "1TB", color: "Titanium Black", price: "Rp 35.999.000" },
    { name: "iPhone 17 Pro Max", storage: "2TB", color: "Titanium Black", price: "Rp 41.999.000" },
    { name: "iPhone 17 Pro Max", storage: "256GB", color: "Titanium White", price: "Rp 27.999.000" },
    { name: "iPhone 17 Pro Max", storage: "512GB", color: "Titanium White", price: "Rp 31.999.000" },
    { name: "iPhone 17 mini", storage: "128GB", color: "Black", price: "Rp 13.299.000" },
    { name: "iPhone 17 mini", storage: "256GB", color: "Black", price: "Rp 15.299.000" },
    { name: "iPhone 17 mini", storage: "512GB", color: "Black", price: "Rp 19.299.000" },
    { name: "iPhone 17 mini", storage: "128GB", color: "Pink", price: "Rp 13.299.000" },
    { name: "iPhone 17 mini", storage: "256GB", color: "Pink", price: "Rp 15.299.000" },
    { name: "iPhone 17 mini", storage: "512GB", color: "Pink", price: "Rp 19.299.000" },
    { name: "iPhone 17e", storage: "128GB", color: "Black", price: "Rp 10.299.000" },
    { name: "iPhone 17e", storage: "256GB", color: "Black", price: "Rp 12.299.000" },
    { name: "iPhone 17e", storage: "128GB", color: "White", price: "Rp 10.299.000" },
    { name: "iPhone 17e", storage: "256GB", color: "White", price: "Rp 12.299.000" },
    { name: "iPhone 17e", storage: "128GB", color: "Red", price: "Rp 10.299.000" },
    { name: "iPhone 17e", storage: "256GB", color: "Red", price: "Rp 12.299.000" },
    { name: "iPhone 16", storage: "128GB", color: "Black", price: "Rp 11.999.000" },
    { name: "iPhone 16", storage: "256GB", color: "Black", price: "Rp 13.999.000" },
    { name: "iPhone 16", storage: "512GB", color: "Black", price: "Rp 17.999.000" },
    { name: "iPhone 16", storage: "128GB", color: "Teal", price: "Rp 11.999.000" },
    { name: "iPhone 16 Plus", storage: "128GB", color: "Black", price: "Rp 13.699.000" },
    { name: "iPhone 16 Plus", storage: "256GB", color: "Black", price: "Rp 15.699.000" },
    { name: "iPhone 16 Plus", storage: "512GB", color: "Black", price: "Rp 19.699.000" },
    { name: "iPhone 16 Plus", storage: "128GB", color: "Ultramarine", price: "Rp 13.699.000" },
    { name: "iPhone 16 Pro", storage: "128GB", color: "Titanium Natural", price: "Rp 19.999.000" },
    { name: "iPhone 16 Pro", storage: "256GB", color: "Titanium Natural", price: "Rp 21.999.000" },
    { name: "iPhone 16 Pro", storage: "512GB", color: "Titanium Natural", price: "Rp 25.999.000" },
    { name: "iPhone 16 Pro", storage: "128GB", color: "Titanium Desert", price: "Rp 19.999.000" },
    { name: "iPhone 16 Pro Max", storage: "256GB", color: "Titanium Black", price: "Rp 23.999.000" },
    { name: "iPhone 16 Pro Max", storage: "512GB", color: "Titanium Black", price: "Rp 27.999.000" },
    { name: "iPhone 16 Pro Max", storage: "1TB", color: "Titanium Black", price: "Rp 31.999.000" },
    { name: "iPhone 16e", storage: "128GB", color: "Black", price: "Rp 8.999.000" },
    { name: "iPhone 16e", storage: "256GB", color: "Black", price: "Rp 10.999.000" },
    { name: "iPhone 15", storage: "128GB", color: "Black", price: "Rp 9.999.000" },
    { name: "iPhone 15", storage: "256GB", color: "Black", price: "Rp 11.999.000" },
    { name: "iPhone 15 Plus", storage: "128GB", color: "Blue", price: "Rp 11.499.000" },
    { name: "iPhone 15 Pro", storage: "256GB", color: "Titanium Blue", price: "Rp 18.499.000" },
    { name: "iPhone 15 Pro Max", storage: "256GB", color: "Titanium Black", price: "Rp 21.499.000" },
    { name: "iPhone 14", storage: "128GB", color: "Midnight", price: "Rp 8.499.000" },
    { name: "iPhone 14 Plus", storage: "128GB", color: "Starlight", price: "Rp 9.499.000" },
    { name: "iPhone 13", storage: "128GB", color: "Pink", price: "Rp 7.499.000" }
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

function LazyCell({ index, encoded, trackRef }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!cellRef.current || !trackRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // threshold 1.0 -> baru trigger kalau elemen 100% kelihatan penuh
                    if (entry.isIntersecting && entry.intersectionRatio >= 1 && !data) {
                        setData(decodeItem(encoded));
                        window.ScrapeBenchConsole.log({
                            method: "EVT",
                            text: `/case/scroll-lazy — item #${index + 1} 100% visible & ter-decode`,
                            status: "ok",
                            isEvent: true
                        });
                    }
                });
            },
            { root: trackRef.current, threshold: 1.0 }
        );
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [data, encoded, index, trackRef]);

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
    const trackRef = useRef(null);

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
        if (trackRef.current) trackRef.current.scrollTop = 0;
    }, [page]);

    const handleLoadMore = useCallback(() => {
        setLoadMoreClicks((prev) => {
            const next = prev + 1;
            setBatches((b) => [...b, generateBatch(page, next)]);
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/load-more — batch ${next + 1} ditambahkan (page ${page})`,
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
            text: `/case/pagination — ${direction} ke page ${targetPage}, URL diupdate`,
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
        <div className="panel">
            <h3>Target: lazy load → load more → pagination (page {page}/{MAX_PAGE})</h3>
            <div className="lazy-track" ref={trackRef} style={{ maxHeight: 500, overflowY: "auto" }}>
                <div className="lazy-spacer">↓ scroll here ↓</div>

                {batches.map((batch, batchIndex) => (
                    <div
                        key={`${page}-${batchIndex}`}
                        className="lazy-grid"
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
                                trackRef={trackRef}
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

                <div style={{ height: 100 }} />
            </div>
            <div className="hint">
                {ITEMS_PER_BATCH} item awal lazy-load per scroll. "Load more" bisa dipakai {MAX_LOAD_MORE_CLICKS}x
                (total {ITEMS_PER_PAGE} item/halaman), lalu tombol berubah jadi "Previous"/"Next" yang ganti
                halaman lewat URL <code>?page=</code>. Total {TOTAL_ITEMS} item di {MAX_PAGE} halaman.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
