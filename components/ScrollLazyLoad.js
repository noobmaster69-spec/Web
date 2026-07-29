const { useState, useEffect, useRef } = React;

function ScrollLazyLoad() {
    const sentinelRef = useRef(null);

    // Awalnya kosong
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && products.length === 0) {

                        // Data baru dibuat ketika discroll
                        const built = [
                            {
                                id: 1,
                                name: "iPhone 17",
                                price: "Rp 16.299.000"
                            },
                            {
                                id: 2,
                                name: "iPhone 17 Pro",
                                price: "Rp 21.999.000"
                            },
                            {
                                id: 3,
                                name: "iPhone 17 Air",
                                price: "Rp 18.499.000"
                            }
                        ];

                        setProducts(built);

                        window.ScrapeBenchConsole.log({
                            method: "EVT",
                            text: "/case/scroll-lazy — sentinel intersected, data loaded",
                            status: "ok",
                            isEvent: true
                        });

                        observer.disconnect();
                    }
                });
            },
            {
                root: sentinelRef.current.closest(".lazy-track"),
                threshold: 0.5
            }
        );

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [products]);

    return (
        <div className="panel">

            <h3>Target: #lazy-target</h3>

            <div className="lazy-track">

                <div className="lazy-spacer">
                    ↓ scroll here ↓
                </div>

                <div ref={sentinelRef}>

                    {products.length === 0 ? (

                        <div className="skeleton" style={{ width: "50%" }} />

                    ) : (

                        <div id="lazy-target">

                            {products.map((product) => (

                                <div
                                    key={product.id}
                                    className="product-card"
                                >
                                    <div className="name">
                                        {product.name}
                                    </div>

                                    <div className="price">
                                        {product.price}
                                    </div>
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

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
