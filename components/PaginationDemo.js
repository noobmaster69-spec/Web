// Test case: "next button"
// Beda dari load-more: ini GANTI list yang tampil per halaman (bukan nambah).
const { useState } = React;

const PAGES = [
    [
        { name: "iPhone 17 128GB", price: "Rp 14.999.000" },
        { name: "iPhone 17 256GB", price: "Rp 16.499.000" }
    ],
    [
        { name: "iPhone 17 Pro 128GB", price: "Rp 19.999.000" },
        { name: "iPhone 17 Pro 256GB", price: "Rp 21.499.000" }
    ],
    [
        { name: "iPhone 17 Pro Max 256GB", price: "Rp 24.999.000" },
        { name: "iPhone 17 Pro Max 512GB", price: "Rp 27.999.000" }
    ]
];

function PaginationDemo() {
    const [page, setPage] = useState(0);
    const isLast = page >= PAGES.length - 1;
    const isFirst = page === 0;

    function goTo(next) {
        setPage(next);
        window.ScrapeBenchConsole.log({ method: "NAV", text: `/case/pagination?page=${next + 1} — list diganti`, status: "ok" });
    }

    return (
        <div className="panel">
            <h3>Target: #pagination-list (page {page + 1} dari {PAGES.length})</h3>
            <div id="pagination-list" className="product-grid">
                {PAGES[page].map((item, index) => (
                    <div className="product-card" key={index}>
                        <div className="name">{item.name}</div>
                        <div className="price">{item.price}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
                <button className="btn" id="prev-page-btn" onClick={() => goTo(page - 1)} disabled={isFirst}>
                    ← Prev
                </button>
                <span className="case-meta">page {page + 1}/{PAGES.length}</span>
                <button className="btn primary" id="next-page-btn" onClick={() => goTo(page + 1)} disabled={isLast}>
                    Next →
                </button>
            </div>
            <div className="hint">
               click <code>#next-page-btn</code> until disable, scrape <code>#pagination-list</code> 
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.PaginationDemo = PaginationDemo;
