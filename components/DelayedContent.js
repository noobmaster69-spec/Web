const { useState, useEffect } = React;
const DELAY_MS = 4000;

function DelayedContent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setReady(true);
      window.ScrapeBenchConsole.log({
        method: "JS",
        text: `/case/delayed — #delayed-target muncul setelah ${DELAY_MS}ms`,
        status: "ok",
      });
    }, DELAY_MS);

    return () => clearTimeout(timeout);
  }, []);

  // Sebelum ready: return null murni.
  // Tidak ada .panel, tidak ada <h3>, tidak ada skeleton, tidak ada .hint —
  // benar-benar tidak ada node apa pun di DOM untuk fitur ini.
  if (!ready) {
    return null;
  }

  // Setelah ready: seluruh struktur (luar + dalam) baru di-mount sekaligus.
  return (
    <div className="panel">
      <h3>Target: #delayed-target</h3>
      <div id="delayed-target" className="product-card">
        <div className="name">iPhone 17 Pro Max 1TB</div>
        <div className="price">Rp 32.499.000</div>
      </div>
      <div className="hint">
        <code>wait_for_selector: "#delayed-target"</code>
      </div>
    </div>
  );
}

window.ScrapeBenchComponents.DelayedContent = DelayedContent;
