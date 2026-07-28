// Test case: "content loaded with render javascript"
// Tidak ada apa pun di markup awal — list produk dibangun total
// di dalam useEffect setelah mount.
const { useState, useEffect } = React;

function JsRenderedContent() {
    const [products, setProducts] = useState(null);

    useEffect(() => {
        const built = [
            { name: "iPhone 17 128GB", price: "Rp 15.199.000" },
            { name: "iPhone 17 Pro 256GB", price: "Rp 21.799.000" }
        ];
        setProducts(built);
        window.ScrapeBenchConsole.log({
            method: "JS",
            text: "/case/js-rendered — DOM diisi oleh client-side render",
            status: "ok"
        });
    }, []);

    return (
        <div className="panel">
            <h3>Target: #js-rendered-target</h3>
            <div id="js-rendered-target">
                {!products ? (
                    <div className="skeleton" style={{ width: "60%" }} />
                ) : (
                    <div className="product-grid">
                        {products.map((item, index) => (
                            <div className="product-card" key={index}>
                                <div className="name">{item.name}</div>
                                <div className="price">{item.price}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="hint">
                 <code>curl</code> for this page will show <code>#js-rendered-target</code> 
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.JsRenderedContent = JsRenderedContent;
