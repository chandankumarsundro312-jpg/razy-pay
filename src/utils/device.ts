/**
 * Device & Environment Detection Utilities
 * Handles compatibility detection for Android WebViews, APK converters, and external browser launch.
 */

export function isRunningInWebViewOrApp(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit query param (e.g. ?isApp=true, ?app=true, ?mode=app, ?apk=true, ?platform=android)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('isApp') === 'true' ||
      params.get('app') === 'true' ||
      params.get('mode') === 'app' ||
      params.get('apk') === 'true' ||
      params.get('env') === 'apk' ||
      params.get('platform') === 'android'
    ) {
      return true;
    }
  } catch {}

  // 2. Standalone display mode (installed APK / TWA / PWA)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // 3. User agent inspection for Android WebView / Cordova / Capacitor / Custom APK wrappers
  const ua = window.navigator.userAgent || '';
  const isWebView =
    /\bwv\b/i.test(ua) ||
    /Version\/[0-9.]+\s+(?:Mobile\s+)?(?:Safari\/[0-9.]+\s+)?Chrome\/[0-9.]+/i.test(ua) ||
    /Android.*Version\/[0-9.]+/i.test(ua) ||
    /ReactNativeWebView|Capacitor|Cordova|RushPayApp|XYRPayApp|XYRPAY|Web2App|Website2APK|Hermit|GoNative|Appgyver/i.test(ua);

  if (isWebView) {
    return true;
  }

  // 4. Android native JavaScript interface
  if (
    (window as any).Android ||
    (window as any).JSBridge ||
    (window as any).isNativeApp ||
    (window as any).isAndroidApp ||
    (window as any).XYRPAY_APP
  ) {
    return true;
  }

  // 5. Android app referrer
  if (document.referrer && (document.referrer.startsWith('android-app://') || document.referrer.includes('upload-apk'))) {
    return true;
  }

  return false;
}

/**
 * Opens a URL in the device's default external browser (e.g. Chrome on Android)
 * Useful for APK converters / WebViews where Google OAuth popups are restricted
 */
export function openInExternalBrowser(url: string = window.location.href): void {
  try {
    const opened = window.open(url, '_system');
    if (opened) return;
  } catch {}

  try {
    const openedBlank = window.open(url, '_blank', 'noopener,noreferrer');
    if (openedBlank) return;
  } catch {}

  // Android Chrome Intent fallback for WebView wrappers
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
  } catch {
    window.location.href = url;
  }
}
