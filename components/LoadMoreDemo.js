// Test case: "load more button"
const { useState } = React;

const CATALOG = [
    { name: "iPhone 17 128GB", price: "Rp 14.999.000" },
    { name: "iPhone 17 256GB", price: "Rp 16.499.000" },
    { name: "iPhone 17 Pro 128GB", price: "Rp 19.999.000" },
    { name: "iPhone 17 Pro 256GB", price: "Rp 21.499.000" },
    { name: "iPhone 17 Pro Max 256GB", price: "Rp 24.999.000" },
    { name: "iPhone 17 Pro Max 512GB", price: "Rp 27.999.000" },
    { name: "iPhone 17 Pro Max 1TB", price: "Rp 32.499.000" },
    { name: "iPhone 17 Air 256GB", price: "Rp 22.999.000" }
];
const PAGE_SIZE = 2;

function LoadMoreDemo() {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const done = visibleCount >= CATALOG.length;

    function loadMore() {
        const next = Math.min(visibleCount + PAGE_SIZE, CATALOG.length);
        setVisibleCount(next);
        window.ScrapeBenchConsole.log({ method: "CLK", text: `/case/load-more — menampilkan ${next}/${CATALOG.length} item`, status: "ok" });
    }

    return (
        <div className="panel">
            <h3>Target: #load-more-list</h3>
            <div id="load-more-list" className="product-grid">
                {CATALOG.slice(0, visibleCount).map((item, index) => (
                    <div className="product-card" key={index}>
                        <div className="name">{item.name}</div>
                        <div className="price">{item.price}</div>
                    </div>
                ))}
            </div>
            <button id="load-more-btn" className="btn primary" style={{ marginTop: 16 }} onClick={loadMore} disabled={done}>
                {done ? "All items loaded" : `Load more (${visibleCount}/${CATALOG.length})`}
            </button>
            <div className="hint">
            <code>#load-more-btn</code>, 
            <code>#load-more-list</code> 
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.LoadMoreDemo = LoadMoreDemo;
