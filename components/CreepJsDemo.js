// Test case: "creep.js"
// Embed report publik creepjs.github.io untuk bandingkan trust score /
// tanda-tanda headless browser scraper kamu vs browser normal.
const { useState, useEffect } = React;

function CreepJsDemo() {
    const [embedded, setEmbedded] = useState(false);

    useEffect(() => {
        window.ScrapeBenchConsole.log({
            method: "INFO",
            text: "/case/creepjs — siap embed fingerprint probe eksternal"
        });
    }, []);

    function loadProbe() {
        setEmbedded(true);
        window.ScrapeBenchConsole.log({ method: "GET", text: "/case/creepjs — load report creepjs.github.io di iframe", status: "ok" });
    }

    return (
        <div className="panel">
            <h3>External probe: creepjs.github.io</h3>
            <p className="case-desc" style={{ margin: "0 0 16px" }}>
               This is a public load report from creep.js, which fingerprints the browser and automation stack currently in use
                (canvas, WebGL, audio context, navigator properties, headless indicators) and assigns a trust score.
                Run it once in a normal browser, once more through your browser context scraper, and then compare the results.
            </p>
            {!embedded ? (
                <button className="btn primary" onClick={loadProbe}>
                    Load creep.js report
                </button>
            ) : (
                <iframe
                    id="creepjs-frame"
                    src="https://abrahamjuliot.github.io/creepjs/"
                    title="creep.js fingerprint report"
                    style={{ width: "100%", height: 480, border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}
                    loading="lazy"
                />
            )}
            <div className="hint">
                Load the original third-party website (<code>abrahamjuliot.github.io/creepjs</code>) --need a active internet.               
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.CreepJsDemo = CreepJsDemo;
