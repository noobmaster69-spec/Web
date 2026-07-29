// Test case: "content loaded when scrolled"
// #lazy-target baru terisi saat sentinel masuk viewport (IntersectionObserver).
// Data disimpan ter-encode (base64), baru di-decode & di-generate SAAT sentinel intersect.
// Sebelum itu: tidak ada teks/nama/harga produk yang bisa dibaca di DOM maupun di source.
const { useState, useEffect, useRef } = React;

// Blob data ter-encode — tidak ada nama/harga produk dalam bentuk plain text di sini.
// Isinya baru "hidup" setelah didecode di dalam callback observer.
function buildEncodedPayload() {
    const raw = Array.from({ length: 30 }, (_, i) => ({
        id: `lazy-item-${i + 1}`,
        name: `iPhone 17 · lazy card #${i + 1}`,
        price: `Rp ${(16 + i * 0.05).toFixed(2)}.000.000`
    }));
    return btoa(unescape(encodeURIComponent(JSON.stringify(raw))));
}
const ENCODED_PAYLOAD = buildEncodedPayload();

function decodePayload(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function ScrollLazyLoad() {
    const sentinelRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [products, setProducts] = useState([]); 

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !loaded) {
                        const decoded = decodePayload(ENCODED_PAYLOAD);
                        setProducts(decoded);
                        setLoaded(true);
                        window.ScrapeBenchConsole.log({
                            method: "EVT",
                            text: "/case/scroll-lazy — sentinel intersected, 30 item ter-decode & terisi",
                            status: "ok",
                            isEvent: true
                        });
                    }
                });
            },
            { root: sentinelRef.current.closest(".lazy-track"), threshold: 0.5 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loaded]);

    return (
        <div className="panel">
            <h3>Target: 30 item lazy-loaded</h3>
            <div className="lazy-track">
                <div className="lazy-spacer">↓ scroll here ↓</div>

                <div ref={sentinelRef}>
                    {!loaded && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px"
                            }}
                        >
                            {Array.from({ length: 30 }, (_, i) => (
                                <div
                                    key={`skeleton-${i}`}
                                    className="skeleton"
                                    style={{ height: 80, width: "100%" }}
                                />
                            ))}
                        </div>
                    )}

                    {loaded && (
                        <div
                            className="lazy-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px"
                            }}
                        >
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    id={product.id}
                                    className="product-card"
                                >
                                    <div className="name">{product.name}</div>
                                    <div className="price">{product.price}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ height: 300 }} />
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;cc
