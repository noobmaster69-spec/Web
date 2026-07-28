// Test case: "network calls"
const { useState, useEffect } = React;
const ENDPOINT = "https://jsonplaceholder.typicode.com/posts?_limit=3";

function NetworkCallDemo() {
    const [state, setState] = useState("idle"); // idle | loading | done | error
    const [items, setItems] = useState([]);

    function runFetch() {
        setState("loading");
        window.ScrapeBenchConsole.log({ method: "GET", text: `/case/network — request ke ${ENDPOINT}` });
        fetch(ENDPOINT)
            .then((res) => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then((data) => {
                setItems(data);
                setState("done");
                window.ScrapeBenchConsole.log({ method: "GET", text: `/case/network — 200 OK, ${data.length} baris`, status: "ok" });
            })
            .catch((err) => {
                setState("error");
                window.ScrapeBenchConsole.log({ method: "GET", text: `/case/network — gagal: ${err.message}`, status: "bad" });
            });
    }

    useEffect(() => {
        runFetch();
    }, []);

    return (
        <div className="panel">
            <h3>Target: #network-target</h3>
            <div id="network-target">
                {state === "loading" && <div className="skeleton" style={{ width: "50%" }} />}
                {state === "error" && <div className="chip danger">request gagal</div>}
                {state === "done" && (
                    <div className="product-grid">
                        {items.map((item) => (
                            <div className="product-card" key={item.id}>
                                <div className="name">{item.title.slice(0, 28)}…</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button className="btn" style={{ marginTop: 16 }} onClick={runFetch} disabled={state === "loading"}>
                Re-run fetch
            </button>
            <div className="hint">
             <code>ENDPOINT</code>
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.NetworkCallDemo = NetworkCallDemo;
