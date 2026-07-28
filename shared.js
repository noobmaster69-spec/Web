/* ============================================================
   shared.js — tiny global utilities loaded BEFORE the components.
   Plain JS (not Babel/JSX) so it can load first as a normal <script>.

   Provides:
     window.ScrapeBenchComponents  -> registry each component attaches itself to
     window.ScrapeBenchConsole     -> pub/sub log bus feeding the bottom console
   ============================================================ */

window.ScrapeBenchComponents = window.ScrapeBenchComponents || {};

window.ScrapeBenchConsole = (function () {
  var subscribers = [];
  return {
    subscribe: function (fn) {
      subscribers.push(fn);
      return function unsubscribe() {
        subscribers = subscribers.filter(function (s) { return s !== fn; });
      };
    },
    log: function (entry) {
      // entry: { method, text, status ('ok' | 'bad' | undefined), isEvent }
      var withTime = Object.assign({ time: new Date() }, entry);
      subscribers.forEach(function (fn) { fn(withTime); });
    }
  };
})();
