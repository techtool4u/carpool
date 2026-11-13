// App-only behaviour, linked into the page by scripts/build-web.mjs. Does nothing in a normal browser.
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  document.documentElement.classList.add('in-app');
  var App = (C.Plugins && C.Plugins.App) || (C.registerPlugin && C.registerPlugin('App'));
  if (!App) return;
  console.log('app-shell ready index.html'); // the CI smoke test looks for this line in logcat
  // Android back button: the page closes sheets and goes back itself (window.onAppBack); otherwise leave the app.
  App.addListener('backButton', function () {
    if (typeof window.onAppBack === 'function' && window.onAppBack()) return;
    App.exitApp();
  });
})();
