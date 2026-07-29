// Test case: "wait for a few seconds" (wait_for_selector)
// Before DELAY_MS elapses, NOTHING related to this fixture exists in
// the DOM at all — not #delayed-target, not its card, not the hint
// text below it. There's no skeleton placeholder standing in either;
// document.querySelector("#delayed-target") genuinely returns null
// the whole time. Only after the timeout fires does the entire block
// — the target element, its content, AND the hint — get inserted at
// once, in a single render. This makes wait_for_selector testing
// honest: a scraper checking for #delayed-target too early gets a
// real "not found", not a stand-in element with the wrong contents.
const { useState, useEffect } = React;
const DELAY_MS = 4000;

function DelayedContent() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setReady(true);
            window.ScrapeBenchConsole.log({
                method: "JS",
                text: `/case/delayed — #delayed-target inserted after ${DELAY_MS}ms (did not exist before this)`,
                status: "ok"
            });
        }, DELAY_MS);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="panel">
            <h3>Target: #delayed-target</h3>
            {ready && (
                <>
                    <div id="delayed-target" className="product-card">
                        <div className="name">iPhone 17 Pro Max 1TB</div>
                        <div className="price">$1,899</div>
                    </div>
                    <div className="hint">
                        Nothing above this point existed in the DOM before {DELAY_MS}ms had passed —
                        no skeleton, no placeholder, no empty <code>#delayed-target</code> waiting to be filled.
                        Configure your scraper with <code>wait_for_selector: "#delayed-target"</code>
                        (or a fixed wait ≥ {DELAY_MS / 1000}s) — checking for it any earlier will
                        correctly find nothing at all.
                    </div>
                </>
            )}
        </div>
    );
}

window.ScrapeBenchComponents.DelayedContent = DelayedContent;
