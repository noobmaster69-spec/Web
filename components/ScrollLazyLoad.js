// Test case: "scroll-triggered lazy load + load more + pagination (prev/next)"
// Skema per halaman:
//  1) 30 item awal lazy-load per-item saat discroll.
//  2) Tombol "Load more" bisa diklik maks 2x, tiap klik nambah 30 item (lazy juga).
//  3) Setelah limit load-more kena, area tombol berubah jadi "Previous" + "Next"
//     yang masing-masing ubah ?page= di URL dan reset halaman ke 30 item awal.
const { useState, useEffect, useRef, useCallback } = React;

const ITEMS_PER_BATCH = 30;
const MAX_LOAD_MORE_CLICKS = 2; // total batch per halaman = 1 (awal) + 2 (load more) = 3

function encodeItem(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeItem(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function generateBatch(page, batchIndex) {
    const startNum = (page - 1) * (ITEMS_PER_BATCH * (MAX_LOAD_MORE_CLICKS + 1)) + batchIndex * ITEMS_PER_BATCH;
    return Array.from({ length: ITEMS_PER_BATCH }, (_, i) => {
        const n = startNum + i + 1;
        return encodeItem({
            id: `p${page}-item-${n}`,
            name: `iPhone 17 · page ${page} card #${n}`,
            price: `Rp ${(16 + (n % 50) * 0.05).toFixed(2)}.000.000`
        });
    });
}

function LazyCell({ index, encoded, trackRef }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!cellRef.current || !trackRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !data) {
                        setData(decodeItem(encoded));
                        window.ScrapeBenchConsole.log({
                            method: "EVT",
                            text: `/case/scroll-lazy — item #${index + 1} intersected & ter-decode`,
                            status: "ok",
                            isEvent: true
                        });
                    }
                });
            },
            { root: trackRef.current, threshold: 0.5 }
        );
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [data, encoded, index, trackRef]);

    if (!data) {
        return <div ref={cellRef} className="skeleton" style={{ height: 80, width: "100%" }} />;
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
        return Number.isFinite(p) && p > 0 ? p : 1;
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

    // ganti halaman + update URL, dipakai bareng oleh Next & Previous
    const goToPage = useCallback((targetPage, direction) => {
        if (targetPage < 1) return;
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

    return (
        <div className="panel">
            <h3>Target: lazy load → load more → pagination (page {page})</h3>
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
                            <button className="btn" onClick={handleNext}>
                                Next →
                            </button>
                        </>
                    )}
                </div>

                <div style={{ height: 100 }} />
            </div>
            <div className="hint">
                30 item awal lazy-load per scroll. "Load more" bisa dipakai {MAX_LOAD_MORE_CLICKS}x
                (total {ITEMS_PER_BATCH * (MAX_LOAD_MORE_CLICKS + 1)} item), lalu tombol berubah jadi
                "Previous" / "Next" yang ganti halaman lewat URL <code>?page=</code>.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
