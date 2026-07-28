// Test case: "cookies"
// Set cookie di mount, konten #cookie-gated-content cuma muncul kalau cookie ada.
const { useState, useEffect } = React;
const COOKIE_NAME = "scrapebench_session";

function readCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
}

function CookieDemo() {
    const [cookieValue, setCookieValue] = useState(null);

    useEffect(() => {
        const existing = readCookie(COOKIE_NAME);
        if (existing) {
            setCookieValue(existing);
            return;
        }
        const token = "tok_" + Math.random().toString(36).slice(2, 10);
        document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=3600`;
        setCookieValue(token);
        window.ScrapeBenchConsole.log({
            method: "SET",
            text: `/case/cookie — Set-Cookie: ${COOKIE_NAME}=${token}`,
            status: "ok"
        });
    }, []);

    function clearCookie() {
        document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
        setCookieValue(null);
        window.ScrapeBenchConsole.log({
            method: "DEL",
            text: `/case/cookie — ${COOKIE_NAME} dihapus`,
            status: "bad"
        });
    }

    return (
        <div className="panel">
            <h3>Cookie: {COOKIE_NAME}</h3>
            {cookieValue ? (
                <div>
                    <p className="mono" style={{ fontSize: 13 }}>
                        value: <span style={{ color: "var(--ok)" }}>{cookieValue}</span>
                    </p>
                    <div id="cookie-gated-content" className="product-card" style={{ marginTop: 12 }}>
                        <div className="name">Members price — iPhone 17</div>
                        <div className="price">Rp 13.999.000</div>
                    </div>
                </div>
            ) : (
                <div className="chip warn">no cookie — harga terkunci disembunyikan</div>
            )}
            <button className="btn" style={{ marginTop: 16 }} onClick={clearCookie}>
                Clear cookie
            </button>
            <div className="hint">
                 <code>{COOKIE_NAME}</code> via request, <code>#cookie-gated-content</code>
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.CookieDemo = CookieDemo;
