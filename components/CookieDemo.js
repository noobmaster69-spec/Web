// Test case: "cookies"
// Sets a cookie on mount; #cookie-gated-content only shows up if the cookie exists.
(function () {
    const { useState, useEffect, useCallback } = React;
    const COOKIE_NAME = "scrapebench_session";
    const MAX_AGE_SECONDS = 3600; // 1 hour
    // Escape regex special characters so the cookie name is safe to use inside a RegExp.
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    // Read a cookie by name. Returns null if missing, or if document.cookie
    // can't be accessed (e.g. strict privacy mode / sandboxed iframe).
    function readCookie(name) {
        try {
            const pattern = new RegExp("(?:^|; )" + escapeRegExp(name) + "=([^;]*)");
            const match = document.cookie.match(pattern);
            return match ? decodeURIComponent(match[1]) : null;
        } catch (err) {
            console.warn("ScrapeBench: failed to read cookie", err);
            return null;
        }
    }
    // Generate a token using the crypto API when available (more random),
    // falling back to Math.random otherwise.
    function generateToken() {
        if (window.crypto && typeof window.crypto.getRandomValues === "function") {
            const bytes = window.crypto.getRandomValues(new Uint8Array(12));
            return "tok_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        }
        return "tok_" + Math.random().toString(36).slice(2, 10);
    }

    // Set the cookie with sensible attributes: SameSite=Lax, and Secure
    // automatically enabled when the page is served over HTTPS.
    function writeCookie(name, value, maxAgeSeconds) {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie =
            `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; path=/; max-age=0`;
    }

    function CookieDemo() {
        const [cookieValue, setCookieValue] = useState(null);

        useEffect(() => {
            const existing = readCookie(COOKIE_NAME);
            if (existing) {
                setCookieValue(existing);
                window.ScrapeBenchConsole.log({
                    method: "GET",
                    text: `/case/cookie — cookie ${COOKIE_NAME} found, reusing it`,
                    status: "ok"
                });
                return;
            }

            const token = generateToken();
            writeCookie(COOKIE_NAME, token, MAX_AGE_SECONDS);
            setCookieValue(token);
            window.ScrapeBenchConsole.log({
                method: "SET",
                text: `/case/cookie — Set-Cookie: ${COOKIE_NAME}=${token}`,
                status: "ok"
            });
        }, []);

        const clearCookie = useCallback(() => {
            deleteCookie(COOKIE_NAME);
            setCookieValue(null);
            window.ScrapeBenchConsole.log({
                method: "DEL",
                text: `/case/cookie — ${COOKIE_NAME} deleted`,
                status: "bad"
            });
        }, []);

        return (
            <div className="panel">
                <h3>Cookie: {COOKIE_NAME}</h3>
                {cookieValue ? (
                    <div>
                        <p className="mono" style={{ fontSize: 13 }}>
                            value: <span style={{ color: "var(--ok)" }}>{cookieValue}</span>
                        </p>
                        <div
                            id="cookie-gated-content"
                            className="product-card"
                            style={{ marginTop: 12 }}
                            aria-live="polite"
                        >
                            <div className="name">Members price — iPhone 17</div>
                            <div className="price">Rp 13.999.000</div>
                        </div>
                    </div>
                ) : (
                    <div className="chip warn" role="status">
                        no cookie — locked price is hidden
                    </div>
                )}
                <button
                    className="btn"
                    style={{ marginTop: 16 }}
                    onClick={clearCookie}
                    disabled={!cookieValue}
                >
                    Clear cookie
                </button>
                <div className="hint">
                    Resend the <code>{COOKIE_NAME}</code> cookie via request to see{" "}
                    <code>#cookie-gated-content</code>.
                </div>
            </div>
        );
    }

    window.ScrapeBenchComponents.CookieDemo = CookieDemo;
})();
