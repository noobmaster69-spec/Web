// Test case: "content loaded simply dari curl"
// Catatan: dashboard ini React SPA, jadi HTML-nya kosong sampai JS jalan.
// Fixture asli yang bisa dibaca curl ada di index.html (#curl-fixture),
// di luar #root. Komponen ini cuma cerminan visualnya di browser.
const { useEffect } = React;

function StaticContent() {
    const products = [
        { name: "iPhone 17 128GB", price: "Rp 14.999.000" },
        { name: "iPhone 17 Pro 256GB", price: "Rp 21.499.000" },
        { name: "iPhone 17 Pro Max 512GB", price: "Rp 27.999.000" }
    ];

    useEffect(() => {
        window.ScrapeBenchConsole.log({
            method: "GET",
            text: "/case/static — rendered dari markup awal, tanpa fetch",
            status: "ok"
        });
    }, []);

    return (
        <div>
            <div className="panel">
                <h3>Live mirror (React)</h3>
                <div className="product-grid">
                    {products.map((item, index) => (
                        <div className="product-card" key={index}>
                            <div className="name">{item.name}</div>
                            <div className="price">{item.price}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hint">
                Real target for test <code>curl</code> is a block <code>#curl-fixture</code> in <code>index.html</code>,
                <code>curl -s http://your-host/latihan_1.html</code>
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.StaticContent = StaticContent;
