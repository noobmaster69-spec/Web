// Test case: "content loaded when scrolled"
// #lazy-target baru terisi saat sentinel masuk viewport (IntersectionObserver).
// Sebelum trigger: DOM benar-benar kosong dari data (cuma skeleton placeholder).
const { useState, useEffect, useRef } = React;

// Generate 30 produk — array of objects, dipisah dari layout
const lazyProducts = Array.from({ length: 30 }, (_, i) => ({
    id: `lazy-item-${i + 1}`,
    name: `iPhone 17 · lazy card #${i + 1}`,
    price: `Rp ${(16 + i * 0.05).toFixed(2).replace(".", ".")}.000.000`
}));

function ScrollLazyLoad() {
    const sentinelRef = useRef(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !loaded) {
                        setLoaded(true);
                        window.ScrapeBenchConsole.log({
                            method: "EVT",
                            text: "/case/scroll-lazy — sentinel intersected, 30 item terisi",
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
                            {lazyProducts.map((product) => (
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
            <div className="hint">
                30 produk baru muncul di grid 3×10 setelah scroll sampai sentinel.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
