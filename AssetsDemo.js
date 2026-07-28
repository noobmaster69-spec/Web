// Test case: "images, fonts, and stylesheets"
const { useState, useEffect } = React;

function AssetsDemo() {
    const [imgStatus, setImgStatus] = useState("loading");

    useEffect(() => {
        window.ScrapeBenchConsole.log({ method: "GET", text: "/case/assets — request sub-resource img/font/css" });
    }, []);

    return (
        <div className="panel">
            <h3>Sub-resources: img / font / css</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <div>
                    <p className="case-meta" style={{ marginBottom: 8 }}>remote &lt;img&gt;</p>
                    <img
                        id="asset-image"
                        src="https://picsum.photos/seed/iphone17/300/180"
                        alt="Sample product image"
                        style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)" }}
                        onLoad={() => {
                            setImgStatus("loaded");
                            window.ScrapeBenchConsole.log({ method: "GET", text: "/case/assets — image 200 OK", status: "ok" });
                        }}
                        onError={() => {
                            setImgStatus("error");
                            window.ScrapeBenchConsole.log({ method: "GET", text: "/case/assets — image gagal", status: "bad" });
                        }}
                    />
                    <span className={`chip ${imgStatus === "loaded" ? "ok" : imgStatus === "error" ? "danger" : "info"}`} style={{ marginTop: 8, display: "inline-block" }}>
                        {imgStatus}
                    </span>
                </div>
                <div>
                    <p className="case-meta" style={{ marginBottom: 8 }}>web font (JetBrains Mono)</p>
                    <div id="asset-font" className="mono" style={{ fontSize: 20, border: "1px solid var(--border)", borderRadius: 8, padding: "20px 12px", textAlign: "center" }}>
                        Rp 14.999.000
                    </div>
                </div>
                <div>
                    <p className="case-meta" style={{ marginBottom: 8 }}>CSS background-image</p>
                    <div
                        id="asset-bg"
                        style={{
                            height: 100,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            backgroundImage: "linear-gradient(135deg, rgba(88,166,255,0.25), rgba(63,185,80,0.15))"
                        }}
                    />
                </div>
            </div>
            <div className="hint">
             <code>picsum.photos</code> 
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.AssetsDemo = AssetsDemo;
