(function() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
    });
  }
  var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true
    || /ShebaNativeAndroid/i.test(navigator.userAgent || '');
  if (isStandalone) return;
  if (sessionStorage.getItem('sheba_app_bar_dismissed_politicalpayola') === '1') return;

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function injectBar() {
    if (document.getElementById('sheba-mobile-app-bar')) return;
    // Reserve page-bottom space so the last content (footer) scrolls clear of the fixed strip.
    var clear = document.createElement('style');
    clear.id = 'sheba-bar-clearance';
    clear.textContent = 'body{padding-bottom:72px !important;}';
    document.head.appendChild(clear);
    var bar = document.createElement('div');
    bar.id = 'sheba-mobile-app-bar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff8e7;color:#1c1917;border-top:2px solid #d4af37;padding:8px 12px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.2;';
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream;

    var installBtn = document.createElement('button');
    installBtn.type = 'button';
    installBtn.textContent = isIOS ? '📱 Install iOS App' : '📱 Install App';
    installBtn.style.cssText = 'background:#b45309;color:#fff;border:none;border-radius:999px;padding:0 16px;min-height:44px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;';
    installBtn.onclick = function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function() { deferredPrompt = null; });
      } else if (isIOS) {
        alert('To install Political Payola on iPhone/iPad:\n\n1. Tap the Share button (⬆️) at the bottom of Safari.\n2. Scroll down and tap "Add to Home Screen" (➕).');
      } else {
        window.location.href = '/downloads/politicalpayola.apk';
      }
    };

    var apkLink = document.createElement('a');
    apkLink.href = '/downloads/politicalpayola.apk';
    apkLink.setAttribute('download', 'politicalpayola.apk');
    apkLink.textContent = '⬇ Android APK';
    apkLink.style.cssText = 'color:#1c1917;text-decoration:none;font-weight:600;font-size:13px;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border-radius:999px;border:1px solid #78716c;white-space:nowrap;';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss mobile app bar');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:transparent;color:#57534e;border:none;font-size:18px;cursor:pointer;min-width:44px;min-height:44px;padding:0;';
    closeBtn.onclick = function() {
      sessionStorage.setItem('sheba_app_bar_dismissed_politicalpayola', '1');
      bar.remove();
    };

    bar.appendChild(installBtn);
    bar.appendChild(apkLink);
    bar.appendChild(closeBtn);
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBar);
  } else {
    injectBar();
  }
})();
