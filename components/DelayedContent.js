// Test case: "wait for a few seconds" (wait_for_selector)
// #delayed-target belum ada sama sekali sampai DELAY_MS lewat.
const { useState, useEffect } = React;
const DELAY_MS = 4000;

function DelayedContent() {
    const [ready, setReady] = useState(false);
    const [remaining, setRemaining] = useState(Math.ceil(DELAY_MS / 1000));

    useEffect(() => {
        const start = Date.now();
        const tick = setInterval(() => {
            const left = Math.max(0, Math.ceil((DELAY_MS - (Date.now() - start)) / 1000));
            setRemaining(left);
        }, 250);

        const timeout = setTimeout(() => {
            setReady(true);
            clearInterval(tick);
            window.ScrapeBenchConsole.log({
                method: "JS",
                text: `/case/delayed — #delayed-target muncul setelah ${DELAY_MS}ms`,
                status: "ok"
            });
        }, DELAY_MS);

        return () => {
            clearTimeout(timeout);
            clearInterval(tick);
        };
    }, []);

    return (
        <div className="panel">
            <h3>Target: #delayed-target</h3>
            {!ready ? (
                <div>
                    <div className="skeleton" style={{ width: "40%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: "70%" }} />
                    <p className="case-meta" style={{ marginTop: 16 }}>muncul dalam {remaining}s</p>
                </div>
            ) : (
                <div id="delayed-target" className="product-card">
                    <div className="name">iPhone 17 Pro Max 1TB</div>
                    <div className="price">Rp 32.499.000</div>
                </div>
            )}
            <div className="hint">
            <code>wait_for_selector: "#delayed-target"</code>
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.DelayedContent = DelayedContent;
