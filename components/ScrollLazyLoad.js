// Test case: "content loaded when scrolled — per item"
// Setiap item punya sentinel-nya sendiri. Data per-item baru di-decode & dirender
// SAAT item itu sendiri masuk viewport — bukan sekali trigger buat semua.
const { useState, useEffect, useRef } = React;

// Setiap item di-encode terpisah (base64 per item), bukan satu blob gabungan.
// Jadi item #12 misalnya baru bisa "dibaca" pas #12 sendiri intersect,
// walau item #1-#11 udah ke-load duluan.
function encodeItem(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeItem(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

const ENCODED_ITEMS = Array.from({ length: 30 }, (_, i) =>
    encodeItem({
        id: `lazy-item-${i + 1}`,
        name: `iPhone 17 · lazy card #${i + 1}`,
        price: `Rp ${(16 + i * 0.05).toFixed(2)}.000.000`
    })
);

function LazyCell({ index, encoded, trackRef }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null); // null = belum ke-load

    useEffect(() => {
        if (!cellRef.current || !trackRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !data) {
                        const decoded = decodeItem(encoded);
                        setData(decoded);
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

    return (
        <div className="panel">
            <h3>Target: 30 item, per-item lazy load</h3>
            <div className="lazy-track" ref={trackRef} style={{ maxHeight: 500, overflowY: "auto" }}>
                <div className="lazy-spacer">↓ scroll here ↓</div>

                <div
                    className="lazy-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px"
                    }}
                >
                    {ENCODED_ITEMS.map((encoded, i) => (
                        <LazyCell key={i} index={i} encoded={encoded} trackRef={trackRef} />
                    ))}
                </div>

                <div style={{ height: 300 }} />
            </div>
            <div className="hint">
                Tiap card baru terbaca satu-satu saat posisinya sendiri masuk viewport — bukan langsung 30 sekaligus.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
