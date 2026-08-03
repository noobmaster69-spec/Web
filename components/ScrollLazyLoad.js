// Test case: "scroll-triggered lazy load + load more + pagination (prev/next)"
// STRICT SCROLL GATE: no item — not even one that happens to already
// sit inside the viewport the instant it mounts — reveals its data
// until the user has performed at least one genuine scroll gesture
// (a real "wheel" or "touchmove" event on the window). The gate
// re-arms on every page change (Prev/Next), so each page needs its
// own fresh scroll.
const { useState, useEffect, useRef, useCallback } = React;

const ITEMS_PER_BATCH = 5;
const MAX_PAGE = 3;
const TOTAL_ITEMS = 60;
const ITEMS_PER_PAGE = TOTAL_ITEMS / MAX_PAGE;
const MAX_LOAD_MORE_CLICKS = ITEMS_PER_PAGE / ITEMS_PER_BATCH - 1;

// Obfuscated at rest: plain product names/prices are NOT sitting in this
// file as readable text — inspecting source/network before any scroll
// interaction only reveals base64 gibberish, not usable product data.
const RAW_PRODUCT_DATA_ENCODED =
    "W3sibmFtZSI6ImlQaG9uZSAxNyIsInN0b3JhZ2UiOiIxMjhHQiIsImNvbG9yIjoiQmxhY2siLCJwcmljZSI6IiQ5OTkifSx7Im5hbWUiOiJpUGhvbmUgMTciLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkMSwxNDkifSx7Im5hbWUiOiJpUGhvbmUgMTciLCJzdG9yYWdlIjoiNTEyR0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkMSwzOTkifSx7Im5hbWUiOiJpUGhvbmUgMTciLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IldoaXRlIiwicHJpY2UiOiIkOTk5In0seyJuYW1lIjoiaVBob25lIDE3Iiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJXaGl0ZSIsInByaWNlIjoiJDEsMTQ5In0seyJuYW1lIjoiaVBob25lIDE3Iiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJXaGl0ZSIsInByaWNlIjoiJDEsMzk5In0seyJuYW1lIjoiaVBob25lIDE3IFBsdXMiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkMSwxMTkifSx7Im5hbWUiOiJpUGhvbmUgMTcgUGx1cyIsInN0b3JhZ2UiOiIyNTZHQiIsImNvbG9yIjoiQmxhY2siLCJwcmljZSI6IiQxLDI2OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQbHVzIiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDEsNTE5In0seyJuYW1lIjoiaVBob25lIDE3IFBsdXMiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IkJsdWUiLCJwcmljZSI6IiQxLDExOSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQbHVzIiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJCbHVlIiwicHJpY2UiOiIkMSwyNjkifSx7Im5hbWUiOiJpUGhvbmUgMTcgUGx1cyIsInN0b3JhZ2UiOiI1MTJHQiIsImNvbG9yIjoiQmx1ZSIsInByaWNlIjoiJDEsNTE5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyIsInN0b3JhZ2UiOiIyNTZHQiIsImNvbG9yIjoiVGl0YW5pdW0gQmx1ZSIsInByaWNlIjoiJDEsNDk5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyIsInN0b3JhZ2UiOiI1MTJHQiIsImNvbG9yIjoiVGl0YW5pdW0gQmx1ZSIsInByaWNlIjoiJDEsNzQ5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyIsInN0b3JhZ2UiOiIxVEIiLCJjb2xvciI6IlRpdGFuaXVtIEJsdWUiLCJwcmljZSI6IiQxLDk5OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQcm8iLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IlRpdGFuaXVtIEdyYXkiLCJwcmljZSI6IiQxLDQ5OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQcm8iLCJzdG9yYWdlIjoiNTEyR0IiLCJjb2xvciI6IlRpdGFuaXVtIEdyYXkiLCJwcmljZSI6IiQxLDc0OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQcm8iLCJzdG9yYWdlIjoiMVRCIiwiY29sb3IiOiJUaXRhbml1bSBHcmF5IiwicHJpY2UiOiIkMSw5OTkifSx7Im5hbWUiOiJpUGhvbmUgMTcgUHJvIE1heCIsInN0b3JhZ2UiOiIyNTZHQiIsImNvbG9yIjoiVGl0YW5pdW0gQmxhY2siLCJwcmljZSI6IiQxLDY5OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBQcm8gTWF4Iiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJUaXRhbml1bSBCbGFjayIsInByaWNlIjoiJDEsOTQ5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyBNYXgiLCJzdG9yYWdlIjoiMVRCIiwiY29sb3IiOiJUaXRhbml1bSBCbGFjayIsInByaWNlIjoiJDIsMTk5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyBNYXgiLCJzdG9yYWdlIjoiMlRCIiwiY29sb3IiOiJUaXRhbml1bSBCbGFjayIsInByaWNlIjoiJDIsNTQ5In0seyJuYW1lIjoiaVBob25lIDE3IFBybyBNYXgiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IlRpdGFuaXVtIFdoaXRlIiwicHJpY2UiOiIkMSw2OTkifSx7Im5hbWUiOiJpUGhvbmUgMTcgUHJvIE1heCIsInN0b3JhZ2UiOiI1MTJHQiIsImNvbG9yIjoiVGl0YW5pdW0gV2hpdGUiLCJwcmljZSI6IiQxLDk0OSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBtaW5pIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDgwOSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBtaW5pIiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDkyOSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBtaW5pIiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDEsMTY5In0seyJuYW1lIjoiaVBob25lIDE3IG1pbmkiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IlBpbmsiLCJwcmljZSI6IiQ4MDkifSx7Im5hbWUiOiJpUGhvbmUgMTcgbWluaSIsInN0b3JhZ2UiOiIyNTZHQiIsImNvbG9yIjoiUGluayIsInByaWNlIjoiJDkyOSJ9LHsibmFtZSI6ImlQaG9uZSAxNyBtaW5pIiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJQaW5rIiwicHJpY2UiOiIkMSwxNjkifSx7Im5hbWUiOiJpUGhvbmUgMTdlIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDYyOSJ9LHsibmFtZSI6ImlQaG9uZSAxN2UiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkNzQ5In0seyJuYW1lIjoiaVBob25lIDE3ZSIsInN0b3JhZ2UiOiIxMjhHQiIsImNvbG9yIjoiV2hpdGUiLCJwcmljZSI6IiQ2MjkifSx7Im5hbWUiOiJpUGhvbmUgMTdlIiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJXaGl0ZSIsInByaWNlIjoiJDc0OSJ9LHsibmFtZSI6ImlQaG9uZSAxN2UiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IlJlZCIsInByaWNlIjoiJDYyOSJ9LHsibmFtZSI6ImlQaG9uZSAxN2UiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IlJlZCIsInByaWNlIjoiJDc0OSJ9LHsibmFtZSI6ImlQaG9uZSAxNiIsInN0b3JhZ2UiOiIxMjhHQiIsImNvbG9yIjoiQmxhY2siLCJwcmljZSI6IiQ3MjkifSx7Im5hbWUiOiJpUGhvbmUgMTYiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkODQ5In0seyJuYW1lIjoiaVBob25lIDE2Iiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDEsMDg5In0seyJuYW1lIjoiaVBob25lIDE2Iiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJUZWFsIiwicHJpY2UiOiIkNzI5In0seyJuYW1lIjoiaVBob25lIDE2IFBsdXMiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkODI5In0seyJuYW1lIjoiaVBob25lIDE2IFBsdXMiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkOTQ5In0seyJuYW1lIjoiaVBob25lIDE2IFBsdXMiLCJzdG9yYWdlIjoiNTEyR0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkMSwxODkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUGx1cyIsInN0b3JhZ2UiOiIxMjhHQiIsImNvbG9yIjoiVWx0cmFtYXJpbmUiLCJwcmljZSI6IiQ4MjkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUHJvIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJUaXRhbml1bSBOYXR1cmFsIiwicHJpY2UiOiIkMSwyMDkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUHJvIiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJUaXRhbml1bSBOYXR1cmFsIiwicHJpY2UiOiIkMSwzMjkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUHJvIiwic3RvcmFnZSI6IjUxMkdCIiwiY29sb3IiOiJUaXRhbml1bSBOYXR1cmFsIiwicHJpY2UiOiIkMSw1NjkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUHJvIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJUaXRhbml1bSBEZXNlcnQiLCJwcmljZSI6IiQxLDIwOSJ9LHsibmFtZSI6ImlQaG9uZSAxNiBQcm8gTWF4Iiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJUaXRhbml1bSBCbGFjayIsInByaWNlIjoiJDEsNDQ5In0seyJuYW1lIjoiaVBob25lIDE2IFBybyBNYXgiLCJzdG9yYWdlIjoiNTEyR0IiLCJjb2xvciI6IlRpdGFuaXVtIEJsYWNrIiwicHJpY2UiOiIkMSw2ODkifSx7Im5hbWUiOiJpUGhvbmUgMTYgUHJvIE1heCIsInN0b3JhZ2UiOiIxVEIiLCJjb2xvciI6IlRpdGFuaXVtIEJsYWNrIiwicHJpY2UiOiIkMSw5MjkifSx7Im5hbWUiOiJpUGhvbmUgMTZlIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDU0OSJ9LHsibmFtZSI6ImlQaG9uZSAxNmUiLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IkJsYWNrIiwicHJpY2UiOiIkNjY5In0seyJuYW1lIjoiaVBob25lIDE1Iiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJCbGFjayIsInByaWNlIjoiJDYwOSJ9LHsibmFtZSI6ImlQaG9uZSAxNSIsInN0b3JhZ2UiOiIyNTZHQiIsImNvbG9yIjoiQmxhY2siLCJwcmljZSI6IiQ3MjkifSx7Im5hbWUiOiJpUGhvbmUgMTUgUGx1cyIsInN0b3JhZ2UiOiIxMjhHQiIsImNvbG9yIjoiQmx1ZSIsInByaWNlIjoiJDY5OSJ9LHsibmFtZSI6ImlQaG9uZSAxNSBQcm8iLCJzdG9yYWdlIjoiMjU2R0IiLCJjb2xvciI6IlRpdGFuaXVtIEJsdWUiLCJwcmljZSI6IiQxLDEyOSJ9LHsibmFtZSI6ImlQaG9uZSAxNSBQcm8gTWF4Iiwic3RvcmFnZSI6IjI1NkdCIiwiY29sb3IiOiJUaXRhbml1bSBCbGFjayIsInByaWNlIjoiJDEsMzA5In0seyJuYW1lIjoiaVBob25lIDE0Iiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJNaWRuaWdodCIsInByaWNlIjoiJDUxOSJ9LHsibmFtZSI6ImlQaG9uZSAxNCBQbHVzIiwic3RvcmFnZSI6IjEyOEdCIiwiY29sb3IiOiJTdGFybGlnaHQiLCJwcmljZSI6IiQ1NzkifSx7Im5hbWUiOiJpUGhvbmUgMTMiLCJzdG9yYWdlIjoiMTI4R0IiLCJjb2xvciI6IlBpbmsiLCJwcmljZSI6IiQ0NTkifV0=";
const RAW_PRODUCT_DATA = JSON.parse(
    decodeURIComponent(escape(atob(RAW_PRODUCT_DATA_ENCODED)))
);

function buildRawItem(index) {
    const base = RAW_PRODUCT_DATA[index];
    const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
    return {
        id: `item-${index + 1}`,
        name: `${base.name} · ${base.storage} · ${base.color}`,
        price: base.price,
        page
    };
}

// NEW: seluruh RAW_PRODUCT_DATA di-parse jadi array of JS object penuh
// (bukan raw name/storage/color lagi, tapi objek final siap-tampil).
// Ini murni struktur data di memory — tidak pernah langsung dipakai
// untuk render/reveal apapun; tetap harus lewat encodeItem() + scroll-gate.
const ALL_PRODUCT_ITEMS = RAW_PRODUCT_DATA.map((_, index) => buildRawItem(index));
window.__debug_ALL_PRODUCT_ITEMS = ALL_PRODUCT_ITEMS;
function encodeItem(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decodeItem(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function generateBatch(page, batchIndex) {
    const pageStart = (page - 1) * ITEMS_PER_PAGE;
    const batchStart = pageStart + batchIndex * ITEMS_PER_BATCH;
    return Array.from({ length: ITEMS_PER_BATCH }, (_, i) =>
        encodeItem(ALL_PRODUCT_ITEMS[batchStart + i])
    );
}

// Live registry of every item that has genuinely been revealed so far,
// keyed by item id — bagus buat lookup cepat by id.
window.ScrapeBenchRevealedData = window.ScrapeBenchRevealedData || {};

// NEW: array of objects — ini yang dipakai buat SCRAPE.
// Setiap item ke-reveal, objek hasil parse-nya di-push ke sini juga.
// Jadi window.ScrapeBenchRevealedList selalu berupa array of parsed objects,
// urut sesuai urutan reveal-nya (bukan keyed object).
window.ScrapeBenchRevealedList = window.ScrapeBenchRevealedList || [];

function LazyCell({ index, encoded, userHasScrolled }) {
    const cellRef = useRef(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!cellRef.current) return;
        if (data) return;
        if (!userHasScrolled) return; // hard gate

        function reveal(reason) {
            const decoded = decodeItem(encoded);
            setData(decoded);
            window.ScrapeBenchRevealedData[decoded.id] = decoded;
            if (!window.ScrapeBenchRevealedList.some((it) => it.id === decoded.id)) {
                window.ScrapeBenchRevealedList.push(decoded);
            }
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/scroll-lazy — item #${index + 1} ${reason} & decoded`,
                status: "ok",
                isEvent: true
            });
        }

        const rect = cellRef.current.getBoundingClientRect();
        const alreadyVisible =
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right > 0;

        if (alreadyVisible) {
            reveal("was in view once a genuine scroll gesture unlocked it");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !data) {
                        reveal("scrolled into the real page viewport");
                    }
                });
            },
            { root: null, threshold: 0.4 }
        );
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [data, encoded, index, userHasScrolled]);

    if (!data) {
        return (
            <div ref={cellRef} className="skeleton" style={{ height: 80, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Loading…</span>
            </div>
        );
    }
    return (
        <div ref={cellRef} id={data.id} className="product-card">
            <div className="name">{data.name}</div>
            <div className="price">{data.price}</div>
        </div>
    );
}

function ScrollLazyLoad() {
    const topRef = useRef(null);
    const isFirstRender = useRef(true);
    const [userHasScrolled, setUserHasScrolled] = useState(false);

    useEffect(() => {
        if (userHasScrolled) return;
        function openGate() {
            setUserHasScrolled(true);
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: "/case/scroll-lazy — genuine scroll gesture detected, gate opened",
                status: "ok",
                isEvent: true
            });
        }
        window.addEventListener("wheel", openGate, { passive: true, once: true });
        window.addEventListener("touchmove", openGate, { passive: true, once: true });
        window.addEventListener("scroll", openGate, { passive: true, once: true }); 
        return () => {
            window.removeEventListener("wheel", openGate);
            window.removeEventListener("touchmove", openGate);
        };
    }, [userHasScrolled]);

    const getPageFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const p = parseInt(params.get("page"), 10);
        return Number.isFinite(p) && p >= 1 && p <= MAX_PAGE ? p : 1;
    };

    const [page, setPage] = useState(getPageFromUrl);
    const [loadMoreClicks, setLoadMoreClicks] = useState(0);
    const [batches, setBatches] = useState(() => [generateBatch(getPageFromUrl(), 0)]);

    useEffect(() => {
        setBatches([generateBatch(page, 0)]);
        setLoadMoreClicks(0);

        if (isFirstRender.current) {
            isFirstRender.current = false;
        } else {
            if (topRef.current) {
                topRef.current.scrollIntoView({ behavior: "auto", block: "start" });
            }
            setUserHasScrolled(false); // re-arm gate on every page change
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/scroll-lazy — page changed, scroll gate re-armed for page ${page}`,
                status: "ok",
                isEvent: true
            });
        }
    }, [page]);

    const handleLoadMore = useCallback(() => {
        setLoadMoreClicks((prev) => {
            const next = prev + 1;
            setBatches((b) => [...b, generateBatch(page, next)]);
            window.ScrapeBenchConsole.log({
                method: "EVT",
                text: `/case/load-more — batch ${next + 1} added (page ${page})`,
                status: "ok",
                isEvent: true
            });
            return next;
        });
    }, [page]);

    const goToPage = useCallback((targetPage, direction) => {
        if (targetPage < 1 || targetPage > MAX_PAGE) return;
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(targetPage));
        const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
        window.history.pushState({ page: targetPage }, "", newUrl);
        setPage(targetPage);
        window.ScrapeBenchConsole.log({
            method: "EVT",
            text: `/case/pagination — ${direction} to page ${targetPage}, URL updated`,
            status: "ok",
            isEvent: true
        });
    }, []);

    const handleNext = useCallback(() => goToPage(page + 1, "next"), [page, goToPage]);
    const handlePrevious = useCallback(() => goToPage(page - 1, "previous"), [page, goToPage]);

    useEffect(() => {
        const onPopState = () => setPage(getPageFromUrl());
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const canLoadMore = loadMoreClicks < MAX_LOAD_MORE_CLICKS;
    const canGoPrevious = page > 1;
    const canGoNext = page < MAX_PAGE;

    return (
        <div ref={topRef}>
            <p className="case-meta" style={{ marginBottom: 12 }}>
                lazy load → load more → pagination (page {page}/{MAX_PAGE})
                {!userHasScrolled && " · waiting for a genuine scroll gesture…"}
            </p>

            {batches.map((batch, batchIndex) => (
                <div
                    key={`${page}-${batchIndex}`}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginBottom: "12px"
                    }}
                >
                    {batch.map((encoded, i) => (
                        <LazyCell
                            key={i}
                            index={batchIndex * ITEMS_PER_BATCH + i}
                            encoded={encoded}
                            userHasScrolled={userHasScrolled}
                        />
                    ))}
                </div>
            ))}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", padding: "16px 0" }}>
                {canLoadMore ? (
                    <button className="btn" onClick={handleLoadMore}>
                        Load more ({loadMoreClicks}/{MAX_LOAD_MORE_CLICKS})
                    </button>
                ) : (
                    <>
                        {canGoPrevious && (
                            <button className="btn" onClick={handlePrevious}>
                                ← Previous
                            </button>
                        )}
                        {canGoNext && (
                            <button className="btn" onClick={handleNext}>
                                Next →
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="hint">
                Nothing decodes until a genuine scroll gesture (wheel/touch) has happened at least once — simply
                opening the page is not enough. After that, items already visible decode immediately; items
                further down only reveal their data once genuinely scrolled into view (no inner scrollbox — this
                uses the real page viewport as the trigger). "Load more" can be clicked {MAX_LOAD_MORE_CLICKS}{" "}
                times (total {ITEMS_PER_PAGE} items per page), after which it becomes "Previous"/"Next" to switch
                pages via the URL <code>?page=</code>. {TOTAL_ITEMS} items total across {MAX_PAGE} pages.
            </div>
        </div>
    );
}

window.ScrapeBenchComponents.ScrollLazyLoad = ScrollLazyLoad;
