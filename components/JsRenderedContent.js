const { useState, useEffect } = React;

function JsRenderedContent() {
    const [products, setProducts] = useState(null);

    useEffect(() => {
        const built = [
            {
                id: 1,
                name: "iPhone 17 128GB",
                price: "Rp 15.199.000"
            },
            {
                id: 2,
                name: "iPhone 17 Pro 256GB",
                price: "Rp 21.799.000"
            }
        ];
        setProducts(built);
        if (window.ScrapeBenchConsole) {
            window.ScrapeBenchConsole.log({
                method: "JS",
                text: "/case/js-rendered — DOM diisi oleh client-side render",
                status: "ok"
            });
        }
    }, []);
    return (
        <div className="panel">
            <h3>Target: #js-rendered-target</h3>

            <div id="js-rendered-target">
                {products === null ? (
                    <div
                        className="skeleton"
                        style={{ width: "60%" }}
                    />
                ) : (
                    <div className="product-grid">
                        {products.map((item) => (
                            <div
                                className="product-card"
                                key={item.id}
                            >
                                <div className="name">{item.name}</div>
                                <div className="price">{item.price}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="hint">
                <code>curl</code> hanya melihat HTML awal.
                Produk baru muncul setelah JavaScript dijalankan.
            </div>
        </div>
    );
}
window.ScrapeBenchComponents =
    window.ScrapeBenchComponents || {};

window.ScrapeBenchComponents.JsRenderedContent =
    JsRenderedContent;
