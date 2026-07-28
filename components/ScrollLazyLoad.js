// Test case: "content loaded when scrolled"
// #lazy-target baru terisi saat sentinel masuk viewport (IntersectionObserver).
const { useState, useEffect, useRef } = React;

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
                            text: "/case/scroll-lazy — sentinel intersected, #lazy-target terisi",
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
            <h3>Target: #lazy-target </h3>
            <div className="lazy-track">
                <div className="lazy-spacer">↓ scroll here ↓</div>
                <div ref={sentinelRef}>
                    {loaded ? (
                        <div id="lazy-target" className="product-card">
                            <div className="name">iPhone 17 · lazy-loaded card</div>
                            <div className="price">Rp 16.299.000</div>
                        </div>
                    ) : (
                        <div className="skeleton" style={{ width: "50%" }} />
                    )}
                </div>
                <div style={{ height: 300 }} />
            </div>
            <div className="hint">
                 <code>#lazy-target</code>.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
