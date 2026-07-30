const { useState, useEffect } = React;

function LiveCounter() {
    const [now, setNow] = useState(new Date());
    const [ticks, setTicks] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setNow(new Date());
            setTicks((t) => t + 1);
        }, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (ticks > 0 && ticks % 5 === 0) {
            window.ScrapeBenchConsole.log({ method: "EVT", text: `/case/live-counter — tick #${ticks}`, isEvent: true });
        }
    }, [ticks]);

    return (
        <div className="panel">
            <h3>Target: #live-counter</h3>
            <div id="live-counter" className="counter-display">
                {now.toLocaleTimeString("id-ID")}
            </div>
            <p className="case-meta" style={{ marginTop: 8 }}>{ticks} ticks sejak halaman dimuat</p>
            <div className="hint">
             <code>#live-counter</code>
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.LiveCounter = LiveCounter;
