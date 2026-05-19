(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@openobserve/browser-core/esm/tools/display.js
  var ConsoleApiName, globalConsole, originalConsoleMethods, PREFIX, display, DOCS_ORIGIN, DOCS_TROUBLESHOOTING, MORE_DETAILS;
  var init_display = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/display.js"() {
      ConsoleApiName = {
        log: "log",
        debug: "debug",
        info: "info",
        warn: "warn",
        error: "error"
      };
      globalConsole = console;
      originalConsoleMethods = {};
      Object.keys(ConsoleApiName).forEach((name) => {
        originalConsoleMethods[name] = globalConsole[name];
      });
      PREFIX = "Openobserve Browser SDK:";
      display = {
        debug: originalConsoleMethods.debug.bind(globalConsole, PREFIX),
        log: originalConsoleMethods.log.bind(globalConsole, PREFIX),
        info: originalConsoleMethods.info.bind(globalConsole, PREFIX),
        warn: originalConsoleMethods.warn.bind(globalConsole, PREFIX),
        error: originalConsoleMethods.error.bind(globalConsole, PREFIX)
      };
      DOCS_ORIGIN = "https://openobserve.ai";
      DOCS_TROUBLESHOOTING = `${DOCS_ORIGIN}/docs/user-guide/rum/`;
      MORE_DETAILS = "More details:";
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/catchUserErrors.js
  function catchUserErrors(fn, errorMsg) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (err) {
        display.error(errorMsg, err);
      }
    };
  }
  var init_catchUserErrors = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/catchUserErrors.js"() {
      init_display();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/numberUtils.js
  function performDraw(threshold) {
    return threshold !== 0 && Math.random() * 100 <= threshold;
  }
  function round(num, decimals) {
    return +num.toFixed(decimals);
  }
  function isPercentage(value) {
    return isNumber(value) && value >= 0 && value <= 100;
  }
  function isNumber(value) {
    return typeof value === "number";
  }
  var init_numberUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/numberUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/objectUtils.js
  function shallowClone(object) {
    return { ...object };
  }
  function objectHasValue(object, value) {
    return Object.keys(object).some((key) => object[key] === value);
  }
  function isEmptyObject(object) {
    return Object.keys(object).length === 0;
  }
  function mapValues(object, fn) {
    const newObject = {};
    for (const key of Object.keys(object)) {
      newObject[key] = fn(object[key]);
    }
    return newObject;
  }
  var init_objectUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/objectUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/globalObject.js
  function getGlobalObject() {
    if (typeof globalThis === "object") {
      return globalThis;
    }
    Object.defineProperty(Object.prototype, "_oo_temp_", {
      get() {
        return this;
      },
      configurable: true
    });
    let globalObject2 = _oo_temp_;
    delete Object.prototype._oo_temp_;
    if (typeof globalObject2 !== "object") {
      if (typeof self === "object") {
        globalObject2 = self;
      } else if (typeof window === "object") {
        globalObject2 = window;
      } else {
        globalObject2 = {};
      }
    }
    return globalObject2;
  }
  var globalObject, isWorkerEnvironment;
  var init_globalObject = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/globalObject.js"() {
      globalObject = getGlobalObject();
      isWorkerEnvironment = "WorkerGlobalScope" in globalObject;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/getZoneJsOriginalValue.js
  function getZoneJsOriginalValue(target, name) {
    const browserWindow = getGlobalObject();
    let original;
    if (browserWindow.Zone && typeof browserWindow.Zone.__symbol__ === "function") {
      original = target[browserWindow.Zone.__symbol__(name)];
    }
    if (!original) {
      original = target[name];
    }
    return original;
  }
  var init_getZoneJsOriginalValue = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/getZoneJsOriginalValue.js"() {
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/monitor.js
  function startMonitorErrorCollection(newOnMonitorErrorCollected) {
    onMonitorErrorCollected = newOnMonitorErrorCollected;
  }
  function setDebugMode(newDebugMode) {
    debugMode = newDebugMode;
  }
  function monitored(_, __, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      const decorated = onMonitorErrorCollected ? monitor(originalMethod) : originalMethod;
      return decorated.apply(this, args);
    };
  }
  function monitor(fn) {
    return function() {
      return callMonitored(fn, this, arguments);
    };
  }
  function callMonitored(fn, context, args) {
    try {
      return fn.apply(context, args);
    } catch (e) {
      monitorError(e);
    }
  }
  function monitorError(e) {
    displayIfDebugEnabled(e);
    if (onMonitorErrorCollected) {
      try {
        onMonitorErrorCollected(e);
      } catch (e2) {
        displayIfDebugEnabled(e2);
      }
    }
  }
  function displayIfDebugEnabled(...args) {
    if (debugMode) {
      display.error("[MONITOR]", ...args);
    }
  }
  var onMonitorErrorCollected, debugMode;
  var init_monitor = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/monitor.js"() {
      init_display();
      debugMode = false;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/timer.js
  function setTimeout(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), "setTimeout")(monitor(callback), delay);
  }
  function clearTimeout(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), "clearTimeout")(timeoutId);
  }
  function setInterval(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), "setInterval")(monitor(callback), delay);
  }
  function clearInterval(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), "clearInterval")(timeoutId);
  }
  var init_timer = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/timer.js"() {
      init_getZoneJsOriginalValue();
      init_monitor();
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/queueMicrotask.js
  function queueMicrotask(callback) {
    var _a;
    const nativeImplementation = (_a = globalObject.queueMicrotask) === null || _a === void 0 ? void 0 : _a.bind(globalObject);
    if (typeof nativeImplementation === "function") {
      nativeImplementation(monitor(callback));
    } else {
      Promise.resolve().then(monitor(callback));
    }
  }
  var init_queueMicrotask = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/queueMicrotask.js"() {
      init_monitor();
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/observable.js
  function mergeObservables(...observables) {
    return new Observable((globalObservable) => {
      const subscriptions = observables.map((observable) => observable.subscribe((data) => globalObservable.notify(data)));
      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    });
  }
  var Observable, BufferedObservable;
  var init_observable = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/observable.js"() {
      init_queueMicrotask();
      Observable = class {
        constructor(onFirstSubscribe) {
          this.onFirstSubscribe = onFirstSubscribe;
          this.observers = [];
        }
        subscribe(observer2) {
          this.addObserver(observer2);
          return {
            unsubscribe: () => this.removeObserver(observer2)
          };
        }
        notify(data) {
          this.observers.forEach((observer2) => observer2(data));
        }
        addObserver(observer2) {
          this.observers.push(observer2);
          if (this.observers.length === 1 && this.onFirstSubscribe) {
            this.onLastUnsubscribe = this.onFirstSubscribe(this) || void 0;
          }
        }
        removeObserver(observer2) {
          this.observers = this.observers.filter((other) => observer2 !== other);
          if (!this.observers.length && this.onLastUnsubscribe) {
            this.onLastUnsubscribe();
          }
        }
      };
      BufferedObservable = class extends Observable {
        constructor(maxBufferSize) {
          super();
          this.maxBufferSize = maxBufferSize;
          this.buffer = [];
        }
        notify(data) {
          this.buffer.push(data);
          if (this.buffer.length > this.maxBufferSize) {
            this.buffer.shift();
          }
          super.notify(data);
        }
        subscribe(observer2) {
          let closed = false;
          const subscription = {
            unsubscribe: () => {
              closed = true;
              this.removeObserver(observer2);
            }
          };
          queueMicrotask(() => {
            for (const data of this.buffer) {
              if (closed) {
                return;
              }
              observer2(data);
            }
            if (!closed) {
              this.addObserver(observer2);
            }
          });
          return subscription;
        }
        /**
         * Drop buffered data and don't buffer future data. This is to avoid leaking memory when it's not
         * needed anymore. This can be seen as a performance optimization, and things will work probably
         * even if this method isn't called, but still useful to clarify our intent and lowering our
         * memory impact.
         */
        unbuffer() {
          queueMicrotask(() => {
            this.maxBufferSize = this.buffer.length = 0;
          });
        }
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/timeUtils.js
  function relativeToClocks(relative) {
    return { relative, timeStamp: getCorrectedTimeStamp(relative) };
  }
  function timeStampToClocks(timeStamp) {
    return { relative: getRelativeTime(timeStamp), timeStamp };
  }
  function getCorrectedTimeStamp(relativeTime) {
    const correctedOrigin = dateNow() - performance.now();
    if (correctedOrigin > getNavigationStart()) {
      return Math.round(addDuration(correctedOrigin, relativeTime));
    }
    return getTimeStamp(relativeTime);
  }
  function currentDrift() {
    return Math.round(dateNow() - addDuration(getNavigationStart(), performance.now()));
  }
  function toServerDuration(duration) {
    if (!isNumber(duration)) {
      return duration;
    }
    return round(duration * 1e6, 0);
  }
  function dateNow() {
    return (/* @__PURE__ */ new Date()).getTime();
  }
  function timeStampNow() {
    return dateNow();
  }
  function relativeNow() {
    return performance.now();
  }
  function clocksNow() {
    return { relative: relativeNow(), timeStamp: timeStampNow() };
  }
  function clocksOrigin() {
    return { relative: 0, timeStamp: getNavigationStart() };
  }
  function elapsed(start, end) {
    return end - start;
  }
  function addDuration(a, b) {
    return a + b;
  }
  function getRelativeTime(timestamp) {
    return timestamp - getNavigationStart();
  }
  function getTimeStamp(relativeTime) {
    return Math.round(addDuration(getNavigationStart(), relativeTime));
  }
  function looksLikeRelativeTime(time) {
    return time < ONE_YEAR;
  }
  function getNavigationStart() {
    var _a, _b;
    if (navigationStart === void 0) {
      navigationStart = (_b = (_a = performance.timing) === null || _a === void 0 ? void 0 : _a.navigationStart) !== null && _b !== void 0 ? _b : performance.timeOrigin;
    }
    return navigationStart;
  }
  var ONE_SECOND, ONE_MINUTE, ONE_HOUR, ONE_DAY, ONE_YEAR, navigationStart;
  var init_timeUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/timeUtils.js"() {
      init_numberUtils();
      ONE_SECOND = 1e3;
      ONE_MINUTE = 60 * ONE_SECOND;
      ONE_HOUR = 60 * ONE_MINUTE;
      ONE_DAY = 24 * ONE_HOUR;
      ONE_YEAR = 365 * ONE_DAY;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/functionUtils.js
  function throttle(fn, wait, options) {
    const needLeadingExecution = options && options.leading !== void 0 ? options.leading : true;
    const needTrailingExecution = options && options.trailing !== void 0 ? options.trailing : true;
    let inWaitPeriod = false;
    let pendingExecutionWithParameters;
    let pendingTimeoutId;
    return {
      throttled: (...parameters) => {
        if (inWaitPeriod) {
          pendingExecutionWithParameters = parameters;
          return;
        }
        if (needLeadingExecution) {
          fn(...parameters);
        } else {
          pendingExecutionWithParameters = parameters;
        }
        inWaitPeriod = true;
        pendingTimeoutId = setTimeout(() => {
          if (needTrailingExecution && pendingExecutionWithParameters) {
            fn(...pendingExecutionWithParameters);
          }
          inWaitPeriod = false;
          pendingExecutionWithParameters = void 0;
        }, wait);
      },
      cancel: () => {
        clearTimeout(pendingTimeoutId);
        inWaitPeriod = false;
        pendingExecutionWithParameters = void 0;
      }
    };
  }
  function noop() {
  }
  var init_functionUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/functionUtils.js"() {
      init_timer();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/stringUtils.js
  function generateUUID(placeholder) {
    return placeholder ? (
      // eslint-disable-next-line  no-bitwise
      (parseInt(placeholder, 10) ^ Math.random() * 16 >> parseInt(placeholder, 10) / 4).toString(16)
    ) : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateUUID);
  }
  function findCommaSeparatedValue(rawString, name) {
    COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
    while (true) {
      const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
      if (match) {
        if (match[1] === name) {
          return match[2];
        }
      } else {
        break;
      }
    }
  }
  function findAllCommaSeparatedValues(rawString) {
    const result = /* @__PURE__ */ new Map();
    COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
    while (true) {
      const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
      if (match) {
        const key = match[1];
        const value = match[2];
        if (result.has(key)) {
          result.get(key).push(value);
        } else {
          result.set(key, [value]);
        }
      } else {
        break;
      }
    }
    return result;
  }
  function findCommaSeparatedValues(rawString) {
    const result = /* @__PURE__ */ new Map();
    COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
    while (true) {
      const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
      if (match) {
        result.set(match[1], match[2]);
      } else {
        break;
      }
    }
    return result;
  }
  function safeTruncate(candidate, length, suffix = "") {
    const lastChar = candidate.charCodeAt(length - 1);
    const isLastCharSurrogatePair = lastChar >= 55296 && lastChar <= 56319;
    const correctedLength = isLastCharSurrogatePair ? length + 1 : length;
    if (candidate.length <= correctedLength) {
      return candidate;
    }
    return `${candidate.slice(0, correctedLength)}${suffix}`;
  }
  var COMMA_SEPARATED_KEY_VALUE;
  var init_stringUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/stringUtils.js"() {
      COMMA_SEPARATED_KEY_VALUE = /([\w-]+)\s*=\s*([^;]+)/g;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/browserDetection.js
  function isChromium() {
    return detectBrowserCached() === 0;
  }
  function isSafari() {
    return detectBrowserCached() === 1;
  }
  function detectBrowserCached() {
    return browserCache !== null && browserCache !== void 0 ? browserCache : browserCache = detectBrowser();
  }
  function detectBrowser(browserWindow = window) {
    var _a;
    const userAgent = browserWindow.navigator.userAgent;
    if (browserWindow.chrome || /HeadlessChrome/.test(userAgent)) {
      return 0;
    }
    if (
      // navigator.vendor is deprecated, but it is the most resilient way we found to detect
      // "Apple maintained browsers" (AKA Safari). If one day it gets removed, we still have the
      // useragent test as a semi-working fallback.
      ((_a = browserWindow.navigator.vendor) === null || _a === void 0 ? void 0 : _a.indexOf("Apple")) === 0 || /safari/i.test(userAgent) && !/chrome|android/i.test(userAgent)
    ) {
      return 1;
    }
    return 2;
  }
  var browserCache;
  var init_browserDetection = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/browserDetection.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/urlPolyfill.js
  function normalizeUrl(url) {
    return buildUrl(url, location.href).href;
  }
  function isValidUrl(url) {
    try {
      return !!buildUrl(url);
    } catch (_a) {
      return false;
    }
  }
  function getPathName(url) {
    const pathname = buildUrl(url).pathname;
    return pathname[0] === "/" ? pathname : `/${pathname}`;
  }
  function buildUrl(url, base) {
    const { URL: URL2 } = getPristineWindow();
    try {
      return base !== void 0 ? new URL2(url, base) : new URL2(url);
    } catch (error) {
      throw new Error(`Failed to construct URL: ${String(error)}`);
    }
  }
  function getPristineWindow() {
    if (!getPristineGlobalObjectCache) {
      let iframe;
      let pristineWindow;
      try {
        iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        pristineWindow = iframe.contentWindow;
      } catch (_a) {
        pristineWindow = globalObject;
      }
      getPristineGlobalObjectCache = {
        URL: pristineWindow.URL
      };
      iframe === null || iframe === void 0 ? void 0 : iframe.remove();
    }
    return getPristineGlobalObjectCache;
  }
  var getPristineGlobalObjectCache;
  var init_urlPolyfill = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/urlPolyfill.js"() {
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/cookie.js
  function setCookie(name, value, expireDelay = 0, options) {
    const date = /* @__PURE__ */ new Date();
    date.setTime(date.getTime() + expireDelay);
    const expires = `expires=${date.toUTCString()}`;
    const sameSite = options && options.crossSite ? "none" : "strict";
    const domain = options && options.domain ? `;domain=${options.domain}` : "";
    const secure = options && options.secure ? ";secure" : "";
    const partitioned = options && options.partitioned ? ";partitioned" : "";
    document.cookie = `${name}=${value};${expires};path=/;samesite=${sameSite}${domain}${secure}${partitioned}`;
  }
  function getCookie(name) {
    return findCommaSeparatedValue(document.cookie, name);
  }
  function getCookies(name) {
    return findAllCommaSeparatedValues(document.cookie).get(name) || [];
  }
  function getInitCookie(name) {
    if (!initCookieParsed) {
      initCookieParsed = findCommaSeparatedValues(document.cookie);
    }
    return initCookieParsed.get(name);
  }
  function deleteCookie(name, options) {
    setCookie(name, "", 0, options);
  }
  function areCookiesAuthorized(options) {
    if (document.cookie === void 0 || document.cookie === null) {
      return false;
    }
    try {
      const testCookieName = `oo_cookie_test_${generateUUID()}`;
      const testCookieValue = "test";
      setCookie(testCookieName, testCookieValue, ONE_MINUTE, options);
      const isCookieCorrectlySet = getCookie(testCookieName) === testCookieValue;
      deleteCookie(testCookieName, options);
      return isCookieCorrectlySet;
    } catch (error) {
      display.error(error);
      return false;
    }
  }
  function getCurrentSite(hostname = location.hostname, referrer = document.referrer) {
    if (getCurrentSiteCache === void 0) {
      const defaultHostName = getCookieDefaultHostName(hostname, referrer);
      if (defaultHostName) {
        const testCookieName = `oo_site_test_${generateUUID()}`;
        const testCookieValue = "test";
        const domainLevels = defaultHostName.split(".");
        let candidateDomain = domainLevels.pop();
        while (domainLevels.length && !getCookie(testCookieName)) {
          candidateDomain = `${domainLevels.pop()}.${candidateDomain}`;
          setCookie(testCookieName, testCookieValue, ONE_SECOND, { domain: candidateDomain });
        }
        deleteCookie(testCookieName, { domain: candidateDomain });
        getCurrentSiteCache = candidateDomain;
      }
    }
    return getCurrentSiteCache;
  }
  function getCookieDefaultHostName(hostname, referrer) {
    try {
      return hostname || buildUrl(referrer).hostname;
    } catch (_a) {
    }
  }
  var initCookieParsed, getCurrentSiteCache;
  var init_cookie = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/cookie.js"() {
      init_display();
      init_timeUtils();
      init_stringUtils();
      init_urlPolyfill();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionStoreStrategy.js
  var SESSION_STORE_KEY;
  var init_sessionStoreStrategy = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionStoreStrategy.js"() {
      SESSION_STORE_KEY = "_oo_s";
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/polyfills.js
  function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
      const item = array[i];
      if (predicate(item, i, array)) {
        return item;
      }
    }
    return void 0;
  }
  function objectValues(object) {
    return Object.values(object);
  }
  function objectEntries(object) {
    return Object.entries(object);
  }
  var init_polyfills = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/polyfills.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionConstants.js
  var SESSION_TIME_OUT_DELAY, SESSION_EXPIRATION_DELAY, SESSION_COOKIE_EXPIRATION_DELAY, SESSION_NOT_TRACKED, SessionPersistence;
  var init_sessionConstants = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionConstants.js"() {
      init_timeUtils();
      SESSION_TIME_OUT_DELAY = 4 * ONE_HOUR;
      SESSION_EXPIRATION_DELAY = 15 * ONE_MINUTE;
      SESSION_COOKIE_EXPIRATION_DELAY = ONE_YEAR;
      SESSION_NOT_TRACKED = "0";
      SessionPersistence = {
        COOKIE: "cookie",
        LOCAL_STORAGE: "local-storage"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionStateValidation.js
  function isValidSessionString(sessionString) {
    return !!sessionString && (sessionString.indexOf(SESSION_ENTRY_SEPARATOR) !== -1 || SESSION_ENTRY_REGEXP.test(sessionString));
  }
  var SESSION_ENTRY_REGEXP, SESSION_ENTRY_SEPARATOR;
  var init_sessionStateValidation = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionStateValidation.js"() {
      SESSION_ENTRY_REGEXP = /^([a-zA-Z]+)=([a-z0-9-]+)$/;
      SESSION_ENTRY_SEPARATOR = "&";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionState.js
  function getExpiredSessionState(previousSessionState, configuration) {
    const expiredSessionState = {
      isExpired: EXPIRED
    };
    if (configuration.trackAnonymousUser && (previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId)) {
      expiredSessionState.anonymousId = previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId;
    }
    return expiredSessionState;
  }
  function isSessionInNotStartedState(session) {
    return isEmptyObject(session);
  }
  function isSessionStarted(session) {
    return !isSessionInNotStartedState(session);
  }
  function isSessionInExpiredState(session) {
    return session.isExpired !== void 0 || !isActiveSession(session);
  }
  function isActiveSession(sessionState) {
    return (sessionState.created === void 0 || dateNow() - Number(sessionState.created) < SESSION_TIME_OUT_DELAY) && (sessionState.expire === void 0 || dateNow() < Number(sessionState.expire));
  }
  function expandSessionState(session) {
    session.expire = String(dateNow() + SESSION_EXPIRATION_DELAY);
  }
  function toSessionString(session) {
    return objectEntries(session).map(([key, value]) => key === "anonymousId" ? `aid=${value}` : `${key}=${value}`).join(SESSION_ENTRY_SEPARATOR);
  }
  function toSessionState(sessionString) {
    const session = {};
    if (isValidSessionString(sessionString)) {
      sessionString.split(SESSION_ENTRY_SEPARATOR).forEach((entry) => {
        const matches = SESSION_ENTRY_REGEXP.exec(entry);
        if (matches !== null) {
          const [, key, value] = matches;
          if (key === "aid") {
            session.anonymousId = value;
          } else {
            session[key] = value;
          }
        }
      });
    }
    return session;
  }
  var EXPIRED;
  var init_sessionState = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionState.js"() {
      init_objectUtils();
      init_polyfills();
      init_timeUtils();
      init_sessionConstants();
      init_sessionStateValidation();
      EXPIRED = "1";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/oldCookiesMigration.js
  function tryOldCookiesMigration(cookieStoreStrategy) {
    const sessionString = getInitCookie(SESSION_STORE_KEY);
    if (!sessionString) {
      const oldSessionId = getInitCookie(OLD_SESSION_COOKIE_NAME);
      const oldRumType = getInitCookie(OLD_RUM_COOKIE_NAME);
      const oldLogsType = getInitCookie(OLD_LOGS_COOKIE_NAME);
      const session = {};
      if (oldSessionId) {
        session.id = oldSessionId;
      }
      if (oldLogsType && /^[01]$/.test(oldLogsType)) {
        session[LOGS_SESSION_KEY] = oldLogsType;
      }
      if (oldRumType && /^[012]$/.test(oldRumType)) {
        session[RUM_SESSION_KEY] = oldRumType;
      }
      if (isSessionStarted(session)) {
        expandSessionState(session);
        cookieStoreStrategy.persistSession(session);
      }
    }
  }
  var OLD_SESSION_COOKIE_NAME, OLD_RUM_COOKIE_NAME, OLD_LOGS_COOKIE_NAME, RUM_SESSION_KEY, LOGS_SESSION_KEY;
  var init_oldCookiesMigration = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/oldCookiesMigration.js"() {
      init_cookie();
      init_sessionStoreStrategy();
      init_sessionState();
      OLD_SESSION_COOKIE_NAME = "_oo";
      OLD_RUM_COOKIE_NAME = "_oo_r";
      OLD_LOGS_COOKIE_NAME = "_oo_l";
      RUM_SESSION_KEY = "rum";
      LOGS_SESSION_KEY = "logs";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionInCookie.js
  function selectCookieStrategy(initConfiguration) {
    const cookieOptions = buildCookieOptions(initConfiguration);
    return cookieOptions && areCookiesAuthorized(cookieOptions) ? { type: SessionPersistence.COOKIE, cookieOptions } : void 0;
  }
  function initCookieStrategy(configuration, cookieOptions) {
    const cookieStore2 = {
      /**
       * Lock strategy allows mitigating issues due to concurrent access to cookie.
       * This issue concerns only chromium browsers and enabling this on firefox increases cookie write failures.
       */
      isLockEnabled: isChromium(),
      persistSession: (sessionState) => storeSessionCookie(cookieOptions, configuration, sessionState, SESSION_EXPIRATION_DELAY),
      retrieveSession: () => retrieveSessionCookie(cookieOptions, configuration),
      expireSession: (sessionState) => storeSessionCookie(cookieOptions, configuration, getExpiredSessionState(sessionState, configuration), SESSION_TIME_OUT_DELAY)
    };
    tryOldCookiesMigration(cookieStore2);
    return cookieStore2;
  }
  function storeSessionCookie(options, configuration, sessionState, defaultTimeout) {
    let sessionStateString = toSessionString(sessionState);
    if (configuration.betaEncodeCookieOptions) {
      sessionStateString = toSessionString({
        ...sessionState,
        // deleting a cookie is writing a new cookie with an empty value
        // we don't want to store the cookie options in this case otherwise the cookie will not be deleted
        ...!isEmptyObject(sessionState) ? { c: encodeCookieOptions(options) } : {}
      });
    }
    setCookie(SESSION_STORE_KEY, sessionStateString, configuration.trackAnonymousUser ? SESSION_COOKIE_EXPIRATION_DELAY : defaultTimeout, options);
  }
  function retrieveSessionCookie(cookieOptions, configuration) {
    if (configuration.betaEncodeCookieOptions) {
      return retrieveSessionCookieFromEncodedCookie(cookieOptions);
    }
    const sessionString = getCookie(SESSION_STORE_KEY);
    const sessionState = toSessionState(sessionString);
    return sessionState;
  }
  function buildCookieOptions(initConfiguration) {
    const cookieOptions = {};
    cookieOptions.secure = !!initConfiguration.useSecureSessionCookie || !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    cookieOptions.crossSite = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    cookieOptions.partitioned = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    if (initConfiguration.trackSessionAcrossSubdomains) {
      const currentSite = getCurrentSite();
      if (!currentSite) {
        return;
      }
      cookieOptions.domain = currentSite;
    }
    return cookieOptions;
  }
  function encodeCookieOptions(cookieOptions) {
    const domainCount = cookieOptions.domain ? cookieOptions.domain.split(".").length - 1 : 0;
    let byte = 0;
    byte |= SESSION_COOKIE_VERSION << 5;
    byte |= domainCount << 1;
    byte |= cookieOptions.crossSite ? 1 : 0;
    return byte.toString(16);
  }
  function retrieveSessionCookieFromEncodedCookie(cookieOptions) {
    const cookies = getCookies(SESSION_STORE_KEY);
    const opts = encodeCookieOptions(cookieOptions);
    let sessionState;
    for (const cookie of cookies.reverse()) {
      sessionState = toSessionState(cookie);
      if (sessionState.c === opts) {
        break;
      }
    }
    sessionState === null || sessionState === void 0 ? true : delete sessionState.c;
    return sessionState !== null && sessionState !== void 0 ? sessionState : {};
  }
  var SESSION_COOKIE_VERSION;
  var init_sessionInCookie = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionInCookie.js"() {
      init_objectUtils();
      init_browserDetection();
      init_cookie();
      init_oldCookiesMigration();
      init_sessionConstants();
      init_sessionState();
      init_sessionStoreStrategy();
      SESSION_COOKIE_VERSION = 0;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionInLocalStorage.js
  function selectLocalStorageStrategy() {
    try {
      const id = generateUUID();
      const testKey = `${LOCAL_STORAGE_TEST_KEY}${id}`;
      localStorage.setItem(testKey, id);
      const retrievedId = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return id === retrievedId ? { type: SessionPersistence.LOCAL_STORAGE } : void 0;
    } catch (_a) {
      return void 0;
    }
  }
  function initLocalStorageStrategy(configuration) {
    return {
      isLockEnabled: false,
      persistSession: persistInLocalStorage,
      retrieveSession: retrieveSessionFromLocalStorage,
      expireSession: (sessionState) => expireSessionFromLocalStorage(sessionState, configuration)
    };
  }
  function persistInLocalStorage(sessionState) {
    localStorage.setItem(SESSION_STORE_KEY, toSessionString(sessionState));
  }
  function retrieveSessionFromLocalStorage() {
    const sessionString = localStorage.getItem(SESSION_STORE_KEY);
    return toSessionState(sessionString);
  }
  function expireSessionFromLocalStorage(previousSessionState, configuration) {
    persistInLocalStorage(getExpiredSessionState(previousSessionState, configuration));
  }
  var LOCAL_STORAGE_TEST_KEY;
  var init_sessionInLocalStorage = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/storeStrategies/sessionInLocalStorage.js"() {
      init_stringUtils();
      init_sessionConstants();
      init_sessionState();
      init_sessionStoreStrategy();
      LOCAL_STORAGE_TEST_KEY = "_oo_test_";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionStoreOperations.js
  function processSessionStoreOperations(operations, sessionStoreStrategy, numberOfRetries = 0) {
    var _a;
    const { isLockEnabled, persistSession, expireSession } = sessionStoreStrategy;
    const persistWithLock = (session) => persistSession({ ...session, lock: currentLock });
    const retrieveStore = () => {
      const { lock, ...session } = sessionStoreStrategy.retrieveSession();
      return {
        session,
        lock: lock && !isLockExpired(lock) ? lock : void 0
      };
    };
    if (!ongoingOperations) {
      ongoingOperations = operations;
    }
    if (operations !== ongoingOperations) {
      bufferedOperations.push(operations);
      return;
    }
    if (isLockEnabled && numberOfRetries >= LOCK_MAX_TRIES) {
      next(sessionStoreStrategy);
      return;
    }
    let currentLock;
    let currentStore = retrieveStore();
    if (isLockEnabled) {
      if (currentStore.lock) {
        retryLater(operations, sessionStoreStrategy, numberOfRetries);
        return;
      }
      currentLock = createLock();
      persistWithLock(currentStore.session);
      currentStore = retrieveStore();
      if (currentStore.lock !== currentLock) {
        retryLater(operations, sessionStoreStrategy, numberOfRetries);
        return;
      }
    }
    let processedSession = operations.process(currentStore.session);
    if (isLockEnabled) {
      currentStore = retrieveStore();
      if (currentStore.lock !== currentLock) {
        retryLater(operations, sessionStoreStrategy, numberOfRetries);
        return;
      }
    }
    if (processedSession) {
      if (isSessionInExpiredState(processedSession)) {
        expireSession(processedSession);
      } else {
        expandSessionState(processedSession);
        if (isLockEnabled) {
          persistWithLock(processedSession);
        } else {
          persistSession(processedSession);
        }
      }
    }
    if (isLockEnabled) {
      if (!(processedSession && isSessionInExpiredState(processedSession))) {
        currentStore = retrieveStore();
        if (currentStore.lock !== currentLock) {
          retryLater(operations, sessionStoreStrategy, numberOfRetries);
          return;
        }
        persistSession(currentStore.session);
        processedSession = currentStore.session;
      }
    }
    (_a = operations.after) === null || _a === void 0 ? void 0 : _a.call(operations, processedSession || currentStore.session);
    next(sessionStoreStrategy);
  }
  function retryLater(operations, sessionStore, currentNumberOfRetries) {
    setTimeout(() => {
      processSessionStoreOperations(operations, sessionStore, currentNumberOfRetries + 1);
    }, LOCK_RETRY_DELAY);
  }
  function next(sessionStore) {
    ongoingOperations = void 0;
    const nextOperations = bufferedOperations.shift();
    if (nextOperations) {
      processSessionStoreOperations(nextOperations, sessionStore);
    }
  }
  function createLock() {
    return generateUUID() + LOCK_SEPARATOR + timeStampNow();
  }
  function isLockExpired(lock) {
    const [, timeStamp] = lock.split(LOCK_SEPARATOR);
    return !timeStamp || elapsed(Number(timeStamp), timeStampNow()) > LOCK_EXPIRATION_DELAY;
  }
  var LOCK_RETRY_DELAY, LOCK_MAX_TRIES, LOCK_EXPIRATION_DELAY, LOCK_SEPARATOR, bufferedOperations, ongoingOperations;
  var init_sessionStoreOperations = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionStoreOperations.js"() {
      init_timer();
      init_stringUtils();
      init_timeUtils();
      init_sessionState();
      LOCK_RETRY_DELAY = 10;
      LOCK_MAX_TRIES = 100;
      LOCK_EXPIRATION_DELAY = ONE_SECOND;
      LOCK_SEPARATOR = "--";
      bufferedOperations = [];
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionStore.js
  function selectSessionStoreStrategyType(initConfiguration) {
    switch (initConfiguration.sessionPersistence) {
      case SessionPersistence.COOKIE:
        return selectCookieStrategy(initConfiguration);
      case SessionPersistence.LOCAL_STORAGE:
        return selectLocalStorageStrategy();
      case void 0: {
        let sessionStoreStrategyType = selectCookieStrategy(initConfiguration);
        if (!sessionStoreStrategyType && initConfiguration.allowFallbackToLocalStorage) {
          sessionStoreStrategyType = selectLocalStorageStrategy();
        }
        return sessionStoreStrategyType;
      }
      default:
        display.error(`Invalid session persistence '${String(initConfiguration.sessionPersistence)}'`);
    }
  }
  function getSessionStoreStrategy(sessionStoreStrategyType, configuration) {
    return sessionStoreStrategyType.type === SessionPersistence.COOKIE ? initCookieStrategy(configuration, sessionStoreStrategyType.cookieOptions) : initLocalStorageStrategy(configuration);
  }
  function startSessionStore(sessionStoreStrategyType, configuration, productKey, computeTrackingType3, sessionStoreStrategy = getSessionStoreStrategy(sessionStoreStrategyType, configuration)) {
    const renewObservable = new Observable();
    const expireObservable = new Observable();
    const sessionStateUpdateObservable = new Observable();
    const watchSessionTimeoutId = setInterval(watchSession, STORAGE_POLL_DELAY);
    let sessionCache;
    startSession();
    const { throttled: throttledExpandOrRenewSession, cancel: cancelExpandOrRenewSession } = throttle(() => {
      processSessionStoreOperations({
        process: (sessionState) => {
          if (isSessionInNotStartedState(sessionState)) {
            return;
          }
          const synchronizedSession = synchronizeSession(sessionState);
          expandOrRenewSessionState(synchronizedSession);
          return synchronizedSession;
        },
        after: (sessionState) => {
          if (isSessionStarted(sessionState) && !hasSessionInCache()) {
            renewSessionInCache(sessionState);
          }
          sessionCache = sessionState;
        }
      }, sessionStoreStrategy);
    }, STORAGE_POLL_DELAY);
    function expandSession() {
      processSessionStoreOperations({
        process: (sessionState) => hasSessionInCache() ? synchronizeSession(sessionState) : void 0
      }, sessionStoreStrategy);
    }
    function watchSession() {
      const sessionState = sessionStoreStrategy.retrieveSession();
      if (isSessionInExpiredState(sessionState)) {
        processSessionStoreOperations({
          process: (sessionState2) => isSessionInExpiredState(sessionState2) ? getExpiredSessionState(sessionState2, configuration) : void 0,
          after: synchronizeSession
        }, sessionStoreStrategy);
      } else {
        synchronizeSession(sessionState);
      }
    }
    function synchronizeSession(sessionState) {
      if (isSessionInExpiredState(sessionState)) {
        sessionState = getExpiredSessionState(sessionState, configuration);
      }
      if (hasSessionInCache()) {
        if (isSessionInCacheOutdated(sessionState)) {
          expireSessionInCache();
        } else {
          sessionStateUpdateObservable.notify({ previousState: sessionCache, newState: sessionState });
          sessionCache = sessionState;
        }
      }
      return sessionState;
    }
    function startSession() {
      processSessionStoreOperations({
        process: (sessionState) => {
          if (isSessionInNotStartedState(sessionState)) {
            sessionState.anonymousId = generateUUID();
            return getExpiredSessionState(sessionState, configuration);
          }
        },
        after: (sessionState) => {
          sessionCache = sessionState;
        }
      }, sessionStoreStrategy);
    }
    function expandOrRenewSessionState(sessionState) {
      if (isSessionInNotStartedState(sessionState)) {
        return false;
      }
      const trackingType = computeTrackingType3(sessionState[productKey]);
      sessionState[productKey] = trackingType;
      delete sessionState.isExpired;
      if (trackingType !== SESSION_NOT_TRACKED && !sessionState.id) {
        sessionState.id = generateUUID();
        sessionState.created = String(dateNow());
      }
    }
    function hasSessionInCache() {
      return (sessionCache === null || sessionCache === void 0 ? void 0 : sessionCache[productKey]) !== void 0;
    }
    function isSessionInCacheOutdated(sessionState) {
      return sessionCache.id !== sessionState.id || sessionCache[productKey] !== sessionState[productKey];
    }
    function expireSessionInCache() {
      sessionCache = getExpiredSessionState(sessionCache, configuration);
      expireObservable.notify();
    }
    function renewSessionInCache(sessionState) {
      sessionCache = sessionState;
      renewObservable.notify();
    }
    function updateSessionState(partialSessionState) {
      processSessionStoreOperations({
        process: (sessionState) => ({ ...sessionState, ...partialSessionState }),
        after: synchronizeSession
      }, sessionStoreStrategy);
    }
    return {
      expandOrRenewSession: throttledExpandOrRenewSession,
      expandSession,
      getSession: () => sessionCache,
      renewObservable,
      expireObservable,
      sessionStateUpdateObservable,
      restartSession: startSession,
      expire: (hasConsent) => {
        cancelExpandOrRenewSession();
        if (hasConsent === false && sessionCache) {
          delete sessionCache.anonymousId;
        }
        sessionStoreStrategy.expireSession(sessionCache);
        synchronizeSession(getExpiredSessionState(sessionCache, configuration));
      },
      stop: () => {
        clearInterval(watchSessionTimeoutId);
      },
      updateSessionState
    };
  }
  var STORAGE_POLL_DELAY;
  var init_sessionStore = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionStore.js"() {
      init_timer();
      init_observable();
      init_timeUtils();
      init_functionUtils();
      init_stringUtils();
      init_display();
      init_sessionInCookie();
      init_sessionState();
      init_sessionInLocalStorage();
      init_sessionStoreOperations();
      init_sessionConstants();
      STORAGE_POLL_DELAY = ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/trackingConsent.js
  function createTrackingConsentState(currentConsent) {
    const observable = new Observable();
    return {
      tryToInit(trackingConsent) {
        if (!currentConsent) {
          currentConsent = trackingConsent;
        }
      },
      update(trackingConsent) {
        currentConsent = trackingConsent;
        observable.notify();
      },
      isGranted() {
        return currentConsent === TrackingConsent.GRANTED;
      },
      observable
    };
  }
  var TrackingConsent;
  var init_trackingConsent = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/trackingConsent.js"() {
      init_observable();
      TrackingConsent = {
        GRANTED: "granted",
        NOT_GRANTED: "not-granted"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/typeUtils.js
  function getType(value) {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    return typeof value;
  }
  var init_typeUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/typeUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/matchOption.js
  function isMatchOption(item) {
    const itemType = getType(item);
    return itemType === "string" || itemType === "function" || item instanceof RegExp;
  }
  function matchList(list, value, useStartsWith = false) {
    return list.some((item) => {
      try {
        if (typeof item === "function") {
          return item(value);
        } else if (item instanceof RegExp) {
          return item.test(value);
        } else if (typeof item === "string") {
          return useStartsWith ? value.startsWith(item) : item === value;
        }
      } catch (e) {
        display.error(e);
      }
      return false;
    });
  }
  var init_matchOption = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/matchOption.js"() {
      init_display();
      init_typeUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/extension/extensionUtils.js
  function containsExtensionUrl(str) {
    return EXTENSION_PREFIXES.some((prefix) => str.includes(prefix));
  }
  function isUnsupportedExtensionEnvironment(windowLocation, stack = "") {
    if (containsExtensionUrl(windowLocation)) {
      return false;
    }
    const frameLines = stack.split("\n").filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine.length && /^at\s+|@/.test(trimmedLine);
    });
    const target = frameLines[1] || "";
    return containsExtensionUrl(target);
  }
  var EXTENSION_PREFIXES;
  var init_extensionUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/extension/extensionUtils.js"() {
      EXTENSION_PREFIXES = ["chrome-extension://", "moz-extension://"];
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/allowedTrackingOrigins.js
  function isAllowedTrackingOrigins(configuration, errorStack, windowOrigin = typeof location !== "undefined" ? location.origin : "") {
    const allowedTrackingOrigins = configuration.allowedTrackingOrigins;
    if (!allowedTrackingOrigins) {
      if (isUnsupportedExtensionEnvironment(windowOrigin, errorStack)) {
        display.error(ERROR_DOES_NOT_HAVE_ALLOWED_TRACKING_ORIGIN);
        return false;
      }
      return true;
    }
    const isAllowed = matchList(allowedTrackingOrigins, windowOrigin);
    if (!isAllowed) {
      display.error(ERROR_NOT_ALLOWED_TRACKING_ORIGIN);
    }
    return isAllowed;
  }
  var ERROR_DOES_NOT_HAVE_ALLOWED_TRACKING_ORIGIN, ERROR_NOT_ALLOWED_TRACKING_ORIGIN;
  var init_allowedTrackingOrigins = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/allowedTrackingOrigins.js"() {
      init_display();
      init_matchOption();
      init_extensionUtils();
      ERROR_DOES_NOT_HAVE_ALLOWED_TRACKING_ORIGIN = "Running the Browser SDK in a Web extension content script is forbidden unless the `allowedTrackingOrigins` option is provided.";
      ERROR_NOT_ALLOWED_TRACKING_ORIGIN = "SDK initialized on a non-allowed domain.";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/intakeSites.js
  var INTAKE_SITE_STAGING, INTAKE_SITE_FED_STAGING, INTAKE_SITE_US1, INTAKE_SITE_EU1, INTAKE_SITE_US1_FED, PCI_INTAKE_HOST_US1, INTAKE_URL_PARAMETERS;
  var init_intakeSites = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/intakeSites.js"() {
      INTAKE_SITE_STAGING = "datad0g.com";
      INTAKE_SITE_FED_STAGING = "dd0g-gov.com";
      INTAKE_SITE_US1 = "datadoghq.com";
      INTAKE_SITE_EU1 = "datadoghq.eu";
      INTAKE_SITE_US1_FED = "ddog-gov.com";
      PCI_INTAKE_HOST_US1 = "pci.browser-intake-datadoghq.com";
      INTAKE_URL_PARAMETERS = ["ddsource", "dd-api-key", "dd-request-id"];
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/configuration/endpointBuilder.js
  function createEndpointBuilder(initConfiguration, trackType, extraParameters) {
    const buildUrlWithParameters = createEndpointUrlWithParametersBuilder(initConfiguration, trackType);
    return {
      build(api, payload) {
        const parameters = buildEndpointParameters(initConfiguration, trackType, api, payload, extraParameters);
        return buildUrlWithParameters(parameters);
      },
      trackType
    };
  }
  function createEndpointUrlWithParametersBuilder(initConfiguration, trackType) {
    const { proxy, apiVersion, organizationIdentifier, insecureHTTP } = initConfiguration;
    const path = `/rum/${apiVersion}/${organizationIdentifier}/${trackType}`;
    if (typeof proxy === "string") {
      const normalizedProxyUrl = normalizeUrl(proxy);
      return (parameters) => `${normalizedProxyUrl}?o2forward=${encodeURIComponent(`${path}?${parameters}`)}`;
    }
    if (typeof proxy === "function") {
      return (parameters) => proxy({ path, parameters });
    }
    const host = buildEndpointHost(trackType, initConfiguration);
    const protocol = insecureHTTP ? "http" : "https";
    return (parameters) => `${protocol}://${host}${path}?${parameters}`;
  }
  function buildEndpointHost(trackType, initConfiguration) {
    const { site = INTAKE_SITE_US1, internalAnalyticsSubdomain } = initConfiguration;
    return site;
    if (trackType === "logs" && initConfiguration.usePciIntake && site === INTAKE_SITE_US1) {
      return PCI_INTAKE_HOST_US1;
    }
    if (internalAnalyticsSubdomain && site === INTAKE_SITE_US1) {
      return `${internalAnalyticsSubdomain}.${INTAKE_SITE_US1}`;
    }
    if (site === INTAKE_SITE_FED_STAGING) {
      return `http-intake.logs.${site}`;
    }
    const domainParts = site.split(".");
    const extension = domainParts.pop();
    return `browser-intake-${domainParts.join("-")}.${extension}`;
  }
  function buildEndpointParameters({ clientToken, internalAnalyticsSubdomain, source = "browser" }, trackType, api, { retry, encoding }, extraParameters = []) {
    const parameters = [
      `o2source=${source}`,
      `o2-api-key=${clientToken}`,
      `o2-evp-origin-version=${encodeURIComponent("0.3.1")}`,
      "o2-evp-origin=browser",
      `o2-request-id=${generateUUID()}`
    ].concat(extraParameters);
    if (encoding) {
      parameters.push(`o2-evp-encoding=${encoding}`);
    }
    if (trackType === "rum") {
      parameters.push(`batch_time=${timeStampNow()}`, `_o2.api=${api}`);
      if (retry) {
        parameters.push(`_o2.retry_count=${retry.count}`, `_o2.retry_after=${retry.lastFailureStatus}`);
      }
    }
    if (internalAnalyticsSubdomain) {
      parameters.reverse();
    }
    return parameters.join("&");
  }
  var init_endpointBuilder = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/configuration/endpointBuilder.js"() {
      init_timeUtils();
      init_urlPolyfill();
      init_stringUtils();
      init_intakeSites();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/configuration/transportConfiguration.js
  function computeTransportConfiguration(initConfiguration) {
    const site = initConfiguration.site || INTAKE_SITE_US1;
    const source = validateSource(initConfiguration.source);
    const endpointBuilders = computeEndpointBuilders({ ...initConfiguration, site, source });
    const replicaConfiguration = computeReplicaConfiguration({ ...initConfiguration, site, source });
    return {
      replica: replicaConfiguration,
      site,
      source,
      ...endpointBuilders
    };
  }
  function validateSource(source) {
    if (source === "flutter" || source === "unity") {
      return source;
    }
    return "browser";
  }
  function computeEndpointBuilders(initConfiguration) {
    return {
      logsEndpointBuilder: createEndpointBuilder(initConfiguration, "logs"),
      rumEndpointBuilder: createEndpointBuilder(initConfiguration, "rum"),
      profilingEndpointBuilder: createEndpointBuilder(initConfiguration, "profile"),
      sessionReplayEndpointBuilder: createEndpointBuilder(initConfiguration, "replay"),
      exposuresEndpointBuilder: createEndpointBuilder(initConfiguration, "exposures")
    };
  }
  function computeReplicaConfiguration(initConfiguration) {
    if (!initConfiguration.replica) {
      return;
    }
    const replicaConfiguration = {
      ...initConfiguration,
      site: INTAKE_SITE_US1,
      clientToken: initConfiguration.replica.clientToken
    };
    return {
      logsEndpointBuilder: createEndpointBuilder(replicaConfiguration, "logs"),
      rumEndpointBuilder: createEndpointBuilder(replicaConfiguration, "rum", [
        `application.id=${initConfiguration.replica.applicationId}`
      ])
    };
  }
  function isIntakeUrl(url) {
    return INTAKE_URL_PARAMETERS.every((param) => url.includes(param));
  }
  var init_transportConfiguration = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/configuration/transportConfiguration.js"() {
      init_intakeSites();
      init_endpointBuilder();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/configuration/configuration.js
  function isString(tag, tagName) {
    if (tag !== void 0 && tag !== null && typeof tag !== "string") {
      display.error(`${tagName} must be defined as a string`);
      return false;
    }
    return true;
  }
  function isDatadogSite(site) {
    return true;
  }
  function isSampleRate(sampleRate, name) {
    if (sampleRate !== void 0 && !isPercentage(sampleRate)) {
      display.error(`${name} Sample Rate should be a number between 0 and 100`);
      return false;
    }
    return true;
  }
  function validateAndBuildConfiguration(initConfiguration, errorStack) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!initConfiguration || !initConfiguration.clientToken) {
      display.error("Client Token is not configured, we will not send any data.");
      return;
    }
    if (initConfiguration.allowedTrackingOrigins !== void 0 && !Array.isArray(initConfiguration.allowedTrackingOrigins)) {
      display.error("Allowed Tracking Origins must be an array");
      return;
    }
    if (!isDatadogSite(initConfiguration.site) || !isSampleRate(initConfiguration.sessionSampleRate, "Session") || !isSampleRate(initConfiguration.telemetrySampleRate, "Telemetry") || !isSampleRate(initConfiguration.telemetryConfigurationSampleRate, "Telemetry Configuration") || !isSampleRate(initConfiguration.telemetryUsageSampleRate, "Telemetry Usage") || !isString(initConfiguration.version, "Version") || !isString(initConfiguration.env, "Env") || !isString(initConfiguration.service, "Service") || !isAllowedTrackingOrigins(initConfiguration, errorStack !== null && errorStack !== void 0 ? errorStack : "")) {
      return;
    }
    if (initConfiguration.trackingConsent !== void 0 && !objectHasValue(TrackingConsent, initConfiguration.trackingConsent)) {
      display.error('Tracking Consent should be either "granted" or "not-granted"');
      return;
    }
    return {
      beforeSend: initConfiguration.beforeSend && catchUserErrors(initConfiguration.beforeSend, "beforeSend threw an error:"),
      sessionStoreStrategyType: isWorkerEnvironment ? void 0 : selectSessionStoreStrategyType(initConfiguration),
      sessionSampleRate: (_a = initConfiguration.sessionSampleRate) !== null && _a !== void 0 ? _a : 100,
      telemetrySampleRate: (_b = initConfiguration.telemetrySampleRate) !== null && _b !== void 0 ? _b : 20,
      telemetryConfigurationSampleRate: (_c = initConfiguration.telemetryConfigurationSampleRate) !== null && _c !== void 0 ? _c : 5,
      telemetryUsageSampleRate: (_d = initConfiguration.telemetryUsageSampleRate) !== null && _d !== void 0 ? _d : 5,
      service: (_e = initConfiguration.service) !== null && _e !== void 0 ? _e : void 0,
      env: (_f = initConfiguration.env) !== null && _f !== void 0 ? _f : void 0,
      version: (_g = initConfiguration.version) !== null && _g !== void 0 ? _g : void 0,
      datacenter: (_h = initConfiguration.datacenter) !== null && _h !== void 0 ? _h : void 0,
      silentMultipleInit: !!initConfiguration.silentMultipleInit,
      allowUntrustedEvents: !!initConfiguration.allowUntrustedEvents,
      trackingConsent: (_j = initConfiguration.trackingConsent) !== null && _j !== void 0 ? _j : TrackingConsent.GRANTED,
      trackAnonymousUser: (_k = initConfiguration.trackAnonymousUser) !== null && _k !== void 0 ? _k : true,
      storeContextsAcrossPages: !!initConfiguration.storeContextsAcrossPages,
      betaEncodeCookieOptions: !!initConfiguration.betaEncodeCookieOptions,
      /**
       * The source of the SDK, used for support plugins purposes.
       */
      variant: initConfiguration.variant,
      sdkVersion: initConfiguration.sdkVersion,
      apiVersion: (_l = initConfiguration.apiVersion) !== null && _l !== void 0 ? _l : "v1",
      organizationIdentifier: initConfiguration.organizationIdentifier,
      insecureHTTP: initConfiguration.insecureHTTP,
      ...computeTransportConfiguration(initConfiguration)
    };
  }
  function serializeConfiguration(initConfiguration) {
    return {
      session_sample_rate: initConfiguration.sessionSampleRate,
      telemetry_sample_rate: initConfiguration.telemetrySampleRate,
      telemetry_configuration_sample_rate: initConfiguration.telemetryConfigurationSampleRate,
      telemetry_usage_sample_rate: initConfiguration.telemetryUsageSampleRate,
      use_before_send: !!initConfiguration.beforeSend,
      use_partitioned_cross_site_session_cookie: initConfiguration.usePartitionedCrossSiteSessionCookie,
      use_secure_session_cookie: initConfiguration.useSecureSessionCookie,
      use_proxy: !!initConfiguration.proxy,
      silent_multiple_init: initConfiguration.silentMultipleInit,
      track_session_across_subdomains: initConfiguration.trackSessionAcrossSubdomains,
      track_anonymous_user: initConfiguration.trackAnonymousUser,
      session_persistence: initConfiguration.sessionPersistence,
      allow_fallback_to_local_storage: !!initConfiguration.allowFallbackToLocalStorage,
      store_contexts_across_pages: !!initConfiguration.storeContextsAcrossPages,
      allow_untrusted_events: !!initConfiguration.allowUntrustedEvents,
      tracking_consent: initConfiguration.trackingConsent,
      use_allowed_tracking_origins: Array.isArray(initConfiguration.allowedTrackingOrigins),
      beta_encode_cookie_options: initConfiguration.betaEncodeCookieOptions,
      source: initConfiguration.source,
      sdk_version: initConfiguration.sdkVersion,
      variant: initConfiguration.variant
    };
  }
  var DefaultPrivacyLevel, TraceContextInjection;
  var init_configuration = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/configuration/configuration.js"() {
      init_catchUserErrors();
      init_display();
      init_numberUtils();
      init_objectUtils();
      init_sessionStore();
      init_trackingConsent();
      init_allowedTrackingOrigins();
      init_globalObject();
      init_transportConfiguration();
      DefaultPrivacyLevel = {
        ALLOW: "allow",
        MASK: "mask",
        MASK_USER_INPUT: "mask-user-input",
        MASK_UNLESS_ALLOWLISTED: "mask-unless-allowlisted"
      };
      TraceContextInjection = {
        ALL: "all",
        SAMPLED: "sampled"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/configuration/index.js
  var init_configuration2 = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/configuration/index.js"() {
      init_configuration();
      init_endpointBuilder();
      init_transportConfiguration();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/experimentalFeatures.js
  function initFeatureFlags(enableExperimentalFeatures) {
    if (Array.isArray(enableExperimentalFeatures)) {
      addExperimentalFeatures(enableExperimentalFeatures.filter((flag) => objectHasValue(ExperimentalFeature, flag)));
    }
  }
  function addExperimentalFeatures(enabledFeatures) {
    enabledFeatures.forEach((flag) => {
      enabledExperimentalFeatures.add(flag);
    });
  }
  function isExperimentalFeatureEnabled(featureName) {
    return enabledExperimentalFeatures.has(featureName);
  }
  function getExperimentalFeatures() {
    return enabledExperimentalFeatures;
  }
  var ExperimentalFeature, enabledExperimentalFeatures;
  var init_experimentalFeatures = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/experimentalFeatures.js"() {
      init_objectUtils();
      (function(ExperimentalFeature2) {
        ExperimentalFeature2["TRACK_INTAKE_REQUESTS"] = "track_intake_requests";
        ExperimentalFeature2["USE_TREE_WALKER_FOR_ACTION_NAME"] = "use_tree_walker_for_action_name";
        ExperimentalFeature2["FEATURE_OPERATION_VITAL"] = "feature_operation_vital";
        ExperimentalFeature2["SHORT_SESSION_INVESTIGATION"] = "short_session_investigation";
        ExperimentalFeature2["AVOID_FETCH_KEEPALIVE"] = "avoid_fetch_keepalive";
      })(ExperimentalFeature || (ExperimentalFeature = {}));
      enabledExperimentalFeatures = /* @__PURE__ */ new Set();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/stackTrace/computeStackTrace.js
  function computeStackTrace(ex) {
    var _a, _b;
    const stack = [];
    let stackProperty = tryToGetString(ex, "stack");
    const exString = String(ex);
    if (stackProperty && stackProperty.startsWith(exString)) {
      stackProperty = stackProperty.slice(exString.length);
    }
    if (stackProperty) {
      stackProperty.split("\n").forEach((line) => {
        const stackFrame = parseChromeLine(line) || parseChromeAnonymousLine(line) || parseWinLine(line) || parseGeckoLine(line);
        if (stackFrame) {
          if (!stackFrame.func && stackFrame.line) {
            stackFrame.func = UNKNOWN_FUNCTION;
          }
          stack.push(stackFrame);
        }
      });
    }
    if (stack.length > 0 && isWronglyReportingCustomErrors() && ex instanceof Error) {
      const constructors = [];
      let currentPrototype = ex;
      while ((currentPrototype = Object.getPrototypeOf(currentPrototype)) && isNonNativeClassPrototype(currentPrototype)) {
        const constructorName = ((_a = currentPrototype.constructor) === null || _a === void 0 ? void 0 : _a.name) || UNKNOWN_FUNCTION;
        constructors.push(constructorName);
      }
      for (let i = constructors.length - 1; i >= 0 && ((_b = stack[0]) === null || _b === void 0 ? void 0 : _b.func) === constructors[i]; i--) {
        stack.shift();
      }
    }
    return {
      message: tryToGetString(ex, "message"),
      name: tryToGetString(ex, "name"),
      stack
    };
  }
  function parseChromeLine(line) {
    const parts = CHROME_LINE_RE.exec(line);
    if (!parts) {
      return;
    }
    const isNative = parts[2] && parts[2].indexOf("native") === 0;
    const isEval = parts[2] && parts[2].indexOf("eval") === 0;
    const submatch = CHROME_EVAL_RE.exec(parts[2]);
    if (isEval && submatch) {
      parts[2] = submatch[1];
      parts[3] = submatch[2];
      parts[4] = submatch[3];
    }
    return {
      args: isNative ? [parts[2]] : [],
      column: parts[4] ? +parts[4] : void 0,
      func: parts[1] || UNKNOWN_FUNCTION,
      line: parts[3] ? +parts[3] : void 0,
      url: !isNative ? parts[2] : void 0
    };
  }
  function parseChromeAnonymousLine(line) {
    const parts = CHROME_ANONYMOUS_FUNCTION_RE.exec(line);
    if (!parts) {
      return;
    }
    return {
      args: [],
      column: parts[3] ? +parts[3] : void 0,
      func: UNKNOWN_FUNCTION,
      line: parts[2] ? +parts[2] : void 0,
      url: parts[1]
    };
  }
  function parseWinLine(line) {
    const parts = WINJS_LINE_RE.exec(line);
    if (!parts) {
      return;
    }
    return {
      args: [],
      column: parts[4] ? +parts[4] : void 0,
      func: parts[1] || UNKNOWN_FUNCTION,
      line: +parts[3],
      url: parts[2]
    };
  }
  function parseGeckoLine(line) {
    const parts = GECKO_LINE_RE.exec(line);
    if (!parts) {
      return;
    }
    const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
    const submatch = GECKO_EVAL_RE.exec(parts[3]);
    if (isEval && submatch) {
      parts[3] = submatch[1];
      parts[4] = submatch[2];
      parts[5] = void 0;
    }
    return {
      args: parts[2] ? parts[2].split(",") : [],
      column: parts[5] ? +parts[5] : void 0,
      func: parts[1] || UNKNOWN_FUNCTION,
      line: parts[4] ? +parts[4] : void 0,
      url: parts[3]
    };
  }
  function tryToGetString(candidate, property) {
    if (typeof candidate !== "object" || !candidate || !(property in candidate)) {
      return void 0;
    }
    const value = candidate[property];
    return typeof value === "string" ? value : void 0;
  }
  function computeStackTraceFromOnErrorMessage(messageObj, url, line, column) {
    if (url === void 0) {
      return;
    }
    const { name, message } = tryToParseMessage(messageObj);
    return {
      name,
      message,
      stack: [{ url, column, line }]
    };
  }
  function tryToParseMessage(messageObj) {
    let name;
    let message;
    if ({}.toString.call(messageObj) === "[object String]") {
      ;
      [, name, message] = ERROR_TYPES_RE.exec(messageObj);
    }
    return { name, message };
  }
  function isNonNativeClassPrototype(prototype) {
    return String(prototype.constructor).startsWith("class ");
  }
  function isWronglyReportingCustomErrors() {
    if (isWronglyReportingCustomErrorsCache !== void 0) {
      return isWronglyReportingCustomErrorsCache;
    }
    class DatadogTestCustomError extends Error {
      constructor() {
        super();
        this.name = "Error";
      }
    }
    const [customError, nativeError] = [DatadogTestCustomError, Error].map((errConstructor) => new errConstructor());
    isWronglyReportingCustomErrorsCache = // If customError is not a class, it means that this was built with ES5 as target, converting the class to a normal object.
    // Thus, error constructors will be reported on all browsers, which is the expected behavior.
    isNonNativeClassPrototype(Object.getPrototypeOf(customError)) && // If the browser is correctly reporting the stacktrace, the normal error stacktrace should be the same as the custom error stacktrace
    nativeError.stack !== customError.stack;
    return isWronglyReportingCustomErrorsCache;
  }
  var UNKNOWN_FUNCTION, fileUrl, filePosition, CHROME_LINE_RE, CHROME_EVAL_RE, CHROME_ANONYMOUS_FUNCTION_RE, WINJS_LINE_RE, GECKO_LINE_RE, GECKO_EVAL_RE, ERROR_TYPES_RE, isWronglyReportingCustomErrorsCache;
  var init_computeStackTrace = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/stackTrace/computeStackTrace.js"() {
      UNKNOWN_FUNCTION = "?";
      fileUrl = "((?:file|https?|blob|chrome-extension|electron|native|eval|webpack|snippet|<anonymous>|\\w+\\.|\\/).*?)";
      filePosition = "(?::(\\d+))";
      CHROME_LINE_RE = new RegExp(`^\\s*at (.*?) ?\\(${fileUrl}${filePosition}?${filePosition}?\\)?\\s*$`, "i");
      CHROME_EVAL_RE = new RegExp(`\\((\\S*)${filePosition}${filePosition}\\)`);
      CHROME_ANONYMOUS_FUNCTION_RE = new RegExp(`^\\s*at ?${fileUrl}${filePosition}?${filePosition}??\\s*$`, "i");
      WINJS_LINE_RE = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
      GECKO_LINE_RE = /^\s*(.*?)(?:\((.*?)\))?(?:(?:(?:^|@)((?:file|https?|blob|chrome|webpack|resource|capacitor|\[native).*?|[^@]*bundle|\[wasm code\])(?::(\d+))?(?::(\d+))?)|@)\s*$/i;
      GECKO_EVAL_RE = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
      ERROR_TYPES_RE = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?([\s\S]*)$/;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/stackTrace/handlingStack.js
  function createHandlingStack(type) {
    const internalFramesToSkip = 2;
    const error = new Error(type);
    error.name = "HandlingStack";
    let formattedStack;
    callMonitored(() => {
      const stackTrace = computeStackTrace(error);
      stackTrace.stack = stackTrace.stack.slice(internalFramesToSkip);
      formattedStack = toStackTraceString(stackTrace);
    });
    return formattedStack;
  }
  function toStackTraceString(stack) {
    let result = formatErrorMessage(stack);
    stack.stack.forEach((frame) => {
      const func = frame.func === "?" ? "<anonymous>" : frame.func;
      const args = frame.args && frame.args.length > 0 ? `(${frame.args.join(", ")})` : "";
      const line = frame.line ? `:${frame.line}` : "";
      const column = frame.line && frame.column ? `:${frame.column}` : "";
      result += `
  at ${func}${args} @ ${frame.url}${line}${column}`;
    });
    return result;
  }
  function formatErrorMessage(stack) {
    return `${stack.name || "Error"}: ${stack.message}`;
  }
  var init_handlingStack = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/stackTrace/handlingStack.js"() {
      init_monitor();
      init_computeStackTrace();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/instrumentMethod.js
  function instrumentMethod(targetPrototype, method, onPreCall, { computeHandlingStack } = {}) {
    let original = targetPrototype[method];
    if (typeof original !== "function") {
      if (method in targetPrototype && method.startsWith("on")) {
        original = noop;
      } else {
        return { stop: noop };
      }
    }
    let stopped = false;
    const instrumentation = function() {
      if (stopped) {
        return original.apply(this, arguments);
      }
      const parameters = Array.from(arguments);
      let postCallCallback;
      callMonitored(onPreCall, null, [
        {
          target: this,
          parameters,
          onPostCall: (callback) => {
            postCallCallback = callback;
          },
          handlingStack: computeHandlingStack ? createHandlingStack("instrumented method") : void 0
        }
      ]);
      const result = original.apply(this, parameters);
      if (postCallCallback) {
        callMonitored(postCallCallback, null, [result]);
      }
      return result;
    };
    targetPrototype[method] = instrumentation;
    return {
      stop: () => {
        stopped = true;
        if (targetPrototype[method] === instrumentation) {
          targetPrototype[method] = original;
        }
      }
    };
  }
  function instrumentSetter(targetPrototype, property, after) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, property);
    if (!originalDescriptor || !originalDescriptor.set || !originalDescriptor.configurable) {
      return { stop: noop };
    }
    const stoppedInstrumentation = noop;
    let instrumentation = (target, value) => {
      setTimeout(() => {
        if (instrumentation !== stoppedInstrumentation) {
          after(target, value);
        }
      }, 0);
    };
    const instrumentationWrapper = function(value) {
      originalDescriptor.set.call(this, value);
      instrumentation(this, value);
    };
    Object.defineProperty(targetPrototype, property, {
      set: instrumentationWrapper
    });
    return {
      stop: () => {
        var _a;
        if (((_a = Object.getOwnPropertyDescriptor(targetPrototype, property)) === null || _a === void 0 ? void 0 : _a.set) === instrumentationWrapper) {
          Object.defineProperty(targetPrototype, property, originalDescriptor);
        }
        instrumentation = stoppedInstrumentation;
      }
    };
  }
  var init_instrumentMethod = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/instrumentMethod.js"() {
      init_timer();
      init_monitor();
      init_functionUtils();
      init_handlingStack();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/byteUtils.js
  function computeBytesCount(candidate) {
    if (!HAS_MULTI_BYTES_CHARACTERS.test(candidate)) {
      return candidate.length;
    }
    if (window.TextEncoder !== void 0) {
      return new TextEncoder().encode(candidate).length;
    }
    return new Blob([candidate]).size;
  }
  function concatBuffers(buffers) {
    if (buffers.length === 1) {
      return buffers[0];
    }
    const length = buffers.reduce((total, buffer) => total + buffer.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    return result;
  }
  var ONE_KIBI_BYTE, ONE_MEBI_BYTE, HAS_MULTI_BYTES_CHARACTERS;
  var init_byteUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/byteUtils.js"() {
      ONE_KIBI_BYTE = 1024;
      ONE_MEBI_BYTE = 1024 * ONE_KIBI_BYTE;
      HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/serialisation/jsonStringify.js
  function jsonStringify(value, replacer, space) {
    if (typeof value !== "object" || value === null) {
      return JSON.stringify(value);
    }
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
    const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
    const restoreValuePrototypeToJson = detachToJsonMethod(Object.getPrototypeOf(value));
    const restoreValueToJson = detachToJsonMethod(value);
    try {
      return JSON.stringify(value, replacer, space);
    } catch (_a) {
      return "<error: unable to serialize object>";
    } finally {
      restoreObjectPrototypeToJson();
      restoreArrayPrototypeToJson();
      restoreValuePrototypeToJson();
      restoreValueToJson();
    }
  }
  function detachToJsonMethod(value) {
    const object = value;
    const objectToJson = object.toJSON;
    if (objectToJson) {
      delete object.toJSON;
      return () => {
        object.toJSON = objectToJson;
      };
    }
    return noop;
  }
  var init_jsonStringify = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/serialisation/jsonStringify.js"() {
      init_functionUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/serialisation/sanitize.js
  function sanitize(source, maxCharacterCount = SANITIZE_DEFAULT_MAX_CHARACTER_COUNT) {
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
    const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
    const containerQueue = [];
    const visitedObjectsWithPath = /* @__PURE__ */ new WeakMap();
    const sanitizedData = sanitizeProcessor(source, JSON_PATH_ROOT_ELEMENT, void 0, containerQueue, visitedObjectsWithPath);
    const serializedSanitizedData = JSON.stringify(sanitizedData);
    let accumulatedCharacterCount = serializedSanitizedData ? serializedSanitizedData.length : 0;
    if (accumulatedCharacterCount > maxCharacterCount) {
      warnOverCharacterLimit(maxCharacterCount, "discarded", source);
      return void 0;
    }
    while (containerQueue.length > 0 && accumulatedCharacterCount < maxCharacterCount) {
      const containerToProcess = containerQueue.shift();
      let separatorLength = 0;
      if (Array.isArray(containerToProcess.source)) {
        for (let key = 0; key < containerToProcess.source.length; key++) {
          const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
          if (targetData !== void 0) {
            accumulatedCharacterCount += JSON.stringify(targetData).length;
          } else {
            accumulatedCharacterCount += 4;
          }
          accumulatedCharacterCount += separatorLength;
          separatorLength = 1;
          if (accumulatedCharacterCount > maxCharacterCount) {
            warnOverCharacterLimit(maxCharacterCount, "truncated", source);
            break;
          }
          ;
          containerToProcess.target[key] = targetData;
        }
      } else {
        for (const key in containerToProcess.source) {
          if (Object.prototype.hasOwnProperty.call(containerToProcess.source, key)) {
            const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
            if (targetData !== void 0) {
              accumulatedCharacterCount += JSON.stringify(targetData).length + separatorLength + key.length + KEY_DECORATION_LENGTH;
              separatorLength = 1;
            }
            if (accumulatedCharacterCount > maxCharacterCount) {
              warnOverCharacterLimit(maxCharacterCount, "truncated", source);
              break;
            }
            ;
            containerToProcess.target[key] = targetData;
          }
        }
      }
    }
    restoreObjectPrototypeToJson();
    restoreArrayPrototypeToJson();
    return sanitizedData;
  }
  function sanitizeProcessor(source, parentPath, key, queue, visitedObjectsWithPath) {
    const sourceToSanitize = tryToApplyToJSON(source);
    if (!sourceToSanitize || typeof sourceToSanitize !== "object") {
      return sanitizePrimitivesAndFunctions(sourceToSanitize);
    }
    const sanitizedSource = sanitizeObjects(sourceToSanitize);
    if (sanitizedSource !== "[Object]" && sanitizedSource !== "[Array]" && sanitizedSource !== "[Error]") {
      return sanitizedSource;
    }
    const sourceAsObject = source;
    if (visitedObjectsWithPath.has(sourceAsObject)) {
      return `[Reference seen at ${visitedObjectsWithPath.get(sourceAsObject)}]`;
    }
    const currentPath = key !== void 0 ? `${parentPath}.${key}` : parentPath;
    const target = Array.isArray(sourceToSanitize) ? [] : {};
    visitedObjectsWithPath.set(sourceAsObject, currentPath);
    queue.push({ source: sourceToSanitize, target, path: currentPath });
    return target;
  }
  function sanitizePrimitivesAndFunctions(value) {
    if (typeof value === "bigint") {
      return `[BigInt] ${value.toString()}`;
    }
    if (typeof value === "function") {
      return `[Function] ${value.name || "unknown"}`;
    }
    if (typeof value === "symbol") {
      return `[Symbol] ${value.description || value.toString()}`;
    }
    return value;
  }
  function sanitizeObjects(value) {
    try {
      if (value instanceof Event) {
        return sanitizeEvent(value);
      }
      if (value instanceof RegExp) {
        return `[RegExp] ${value.toString()}`;
      }
      const result = Object.prototype.toString.call(value);
      const match = result.match(/\[object (.*)\]/);
      if (match && match[1]) {
        return `[${match[1]}]`;
      }
    } catch (_a) {
    }
    return "[Unserializable]";
  }
  function sanitizeEvent(event) {
    return {
      type: event.type,
      isTrusted: event.isTrusted,
      currentTarget: event.currentTarget ? sanitizeObjects(event.currentTarget) : null,
      target: event.target ? sanitizeObjects(event.target) : null
    };
  }
  function tryToApplyToJSON(value) {
    const object = value;
    if (object && typeof object.toJSON === "function") {
      try {
        return object.toJSON();
      } catch (_a) {
      }
    }
    return value;
  }
  function warnOverCharacterLimit(maxCharacterCount, changeType, source) {
    display.warn(`The data provided has been ${changeType} as it is over the limit of ${maxCharacterCount} characters:`, source);
  }
  var SANITIZE_DEFAULT_MAX_CHARACTER_COUNT, JSON_PATH_ROOT_ELEMENT, KEY_DECORATION_LENGTH;
  var init_sanitize = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/serialisation/sanitize.js"() {
      init_display();
      init_byteUtils();
      init_jsonStringify();
      SANITIZE_DEFAULT_MAX_CHARACTER_COUNT = 220 * ONE_KIBI_BYTE;
      JSON_PATH_ROOT_ELEMENT = "$";
      KEY_DECORATION_LENGTH = 3;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/error/error.js
  function computeRawError({ stackTrace, originalError, handlingStack, componentStack, startClocks, nonErrorPrefix, useFallbackStack = true, source, handling }) {
    const isErrorInstance = isError(originalError);
    if (!stackTrace && isErrorInstance) {
      stackTrace = computeStackTrace(originalError);
    }
    return {
      startClocks,
      source,
      handling,
      handlingStack,
      componentStack,
      originalError,
      type: stackTrace ? stackTrace.name : void 0,
      message: computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError),
      stack: stackTrace ? toStackTraceString(stackTrace) : useFallbackStack ? NO_ERROR_STACK_PRESENT_MESSAGE : void 0,
      causes: isErrorInstance ? flattenErrorCauses(originalError, source) : void 0,
      fingerprint: tryToGetFingerprint(originalError),
      context: tryToGetErrorContext(originalError)
    };
  }
  function computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError) {
    return (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.message) && (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.name) ? stackTrace.message : !isErrorInstance ? `${nonErrorPrefix} ${jsonStringify(sanitize(originalError))}` : "Empty message";
  }
  function tryToGetFingerprint(originalError) {
    return isError(originalError) && "oo_fingerprint" in originalError ? String(originalError.oo_fingerprint) : void 0;
  }
  function tryToGetErrorContext(originalError) {
    if (originalError !== null && typeof originalError === "object" && "dd_context" in originalError) {
      return originalError.dd_context;
    }
  }
  function getFileFromStackTraceString(stack) {
    var _a;
    return (_a = /@ (.+)/.exec(stack)) === null || _a === void 0 ? void 0 : _a[1];
  }
  function isError(error) {
    return error instanceof Error || Object.prototype.toString.call(error) === "[object Error]";
  }
  function flattenErrorCauses(error, parentSource) {
    let currentError = error;
    const causes = [];
    while (isError(currentError === null || currentError === void 0 ? void 0 : currentError.cause) && causes.length < 10) {
      const stackTrace = computeStackTrace(currentError.cause);
      causes.push({
        message: currentError.cause.message,
        source: parentSource,
        type: stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.name,
        stack: stackTrace && toStackTraceString(stackTrace)
      });
      currentError = currentError.cause;
    }
    return causes.length ? causes : void 0;
  }
  var NO_ERROR_STACK_PRESENT_MESSAGE;
  var init_error = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/error/error.js"() {
      init_sanitize();
      init_jsonStringify();
      init_computeStackTrace();
      init_handlingStack();
      NO_ERROR_STACK_PRESENT_MESSAGE = "No stack, consider using an instance of Error";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/error/error.types.js
  var ErrorSource;
  var init_error_types = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/error/error.types.js"() {
      ErrorSource = {
        AGENT: "agent",
        CONSOLE: "console",
        CUSTOM: "custom",
        LOGGER: "logger",
        NETWORK: "network",
        SOURCE: "source",
        REPORT: "report"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/error/trackRuntimeError.js
  function trackRuntimeError() {
    return new Observable((observer2) => {
      const handleRuntimeError = (originalError, stackTrace) => {
        const rawError = computeRawError({
          stackTrace,
          originalError,
          startClocks: clocksNow(),
          nonErrorPrefix: "Uncaught",
          source: ErrorSource.SOURCE,
          handling: "unhandled"
        });
        observer2.notify(rawError);
      };
      const { stop: stopInstrumentingOnError } = instrumentOnError(handleRuntimeError);
      const { stop: stopInstrumentingOnUnhandledRejection } = instrumentUnhandledRejection(handleRuntimeError);
      return () => {
        stopInstrumentingOnError();
        stopInstrumentingOnUnhandledRejection();
      };
    });
  }
  function instrumentOnError(callback) {
    return instrumentMethod(getGlobalObject(), "onerror", ({ parameters: [messageObj, url, line, column, errorObj] }) => {
      let stackTrace;
      if (!isError(errorObj)) {
        stackTrace = computeStackTraceFromOnErrorMessage(messageObj, url, line, column);
      }
      callback(errorObj !== null && errorObj !== void 0 ? errorObj : messageObj, stackTrace);
    });
  }
  function instrumentUnhandledRejection(callback) {
    return instrumentMethod(getGlobalObject(), "onunhandledrejection", ({ parameters: [e] }) => {
      callback(e.reason || "Empty reason");
    });
  }
  var init_trackRuntimeError = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/error/trackRuntimeError.js"() {
      init_instrumentMethod();
      init_observable();
      init_timeUtils();
      init_computeStackTrace();
      init_globalObject();
      init_error();
      init_error_types();
    }
  });

  // node_modules/@openobserve/browser-core/esm/boot/init.js
  function makePublicApi(stub) {
    const publicApi = {
      version: "0.3.1",
      // This API method is intentionally not monitored, since the only thing executed is the
      // user-provided 'callback'.  All SDK usages executed in the callback should be monitored, and
      // we don't want to interfere with the user uncaught exceptions.
      onReady(callback) {
        callback();
      },
      ...stub
    };
    Object.defineProperty(publicApi, "_setDebug", {
      get() {
        return setDebugMode;
      },
      enumerable: false
    });
    return publicApi;
  }
  function defineGlobal(global, name, api) {
    const existingGlobalVariable = global[name];
    if (existingGlobalVariable && !existingGlobalVariable.q && existingGlobalVariable.version) {
      display.warn("SDK is loaded more than once. This is unsupported and might have unexpected behavior.");
    }
    global[name] = api;
    if (existingGlobalVariable && existingGlobalVariable.q) {
      existingGlobalVariable.q.forEach((fn) => catchUserErrors(fn, "onReady callback threw an error:")());
    }
  }
  var init_init = __esm({
    "node_modules/@openobserve/browser-core/esm/boot/init.js"() {
      init_catchUserErrors();
      init_monitor();
      init_display();
    }
  });

  // node_modules/@openobserve/browser-core/esm/boot/displayAlreadyInitializedError.js
  function displayAlreadyInitializedError(sdkName, initConfiguration) {
    if (!initConfiguration.silentMultipleInit) {
      display.error(`${sdkName} is already initialized.`);
    }
  }
  var init_displayAlreadyInitializedError = __esm({
    "node_modules/@openobserve/browser-core/esm/boot/displayAlreadyInitializedError.js"() {
      init_display();
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/addEventListener.js
  function addEventListener(configuration, eventTarget, eventName, listener, options) {
    return addEventListeners(configuration, eventTarget, [eventName], listener, options);
  }
  function addEventListeners(configuration, eventTarget, eventNames, listener, { once, capture, passive } = {}) {
    const listenerWithMonitor = monitor((event) => {
      if (!event.isTrusted && !event.__ooIsTrusted && !configuration.allowUntrustedEvents) {
        return;
      }
      if (once) {
        stop();
      }
      listener(event);
    });
    const options = passive ? { capture, passive } : capture;
    const listenerTarget = window.EventTarget && eventTarget instanceof EventTarget ? window.EventTarget.prototype : eventTarget;
    const add = getZoneJsOriginalValue(listenerTarget, "addEventListener");
    eventNames.forEach((eventName) => add.call(eventTarget, eventName, listenerWithMonitor, options));
    function stop() {
      const remove = getZoneJsOriginalValue(listenerTarget, "removeEventListener");
      eventNames.forEach((eventName) => remove.call(eventTarget, eventName, listenerWithMonitor, options));
    }
    return {
      stop
    };
  }
  var init_addEventListener = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/addEventListener.js"() {
      init_monitor();
      init_getZoneJsOriginalValue();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/report/reportObservable.js
  function initReportObservable(configuration, apis) {
    const observables = [];
    if (apis.includes(RawReportType.cspViolation)) {
      observables.push(createCspViolationReportObservable(configuration));
    }
    const reportTypes = apis.filter((api) => api !== RawReportType.cspViolation);
    if (reportTypes.length) {
      observables.push(createReportObservable(reportTypes));
    }
    return mergeObservables(...observables);
  }
  function createReportObservable(reportTypes) {
    return new Observable((observable) => {
      if (!window.ReportingObserver) {
        return;
      }
      const handleReports = monitor((reports, _) => reports.forEach((report) => observable.notify(buildRawReportErrorFromReport(report))));
      const observer2 = new window.ReportingObserver(handleReports, {
        types: reportTypes,
        buffered: true
      });
      observer2.observe();
      return () => {
        observer2.disconnect();
      };
    });
  }
  function createCspViolationReportObservable(configuration) {
    return new Observable((observable) => {
      const { stop } = addEventListener(configuration, document, "securitypolicyviolation", (event) => {
        observable.notify(buildRawReportErrorFromCspViolation(event));
      });
      return stop;
    });
  }
  function buildRawReportErrorFromReport(report) {
    const { type, body } = report;
    return buildRawReportError({
      type: body.id,
      message: `${type}: ${body.message}`,
      originalError: report,
      stack: buildStack(body.id, body.message, body.sourceFile, body.lineNumber, body.columnNumber)
    });
  }
  function buildRawReportErrorFromCspViolation(event) {
    const message = `'${event.blockedURI}' blocked by '${event.effectiveDirective}' directive`;
    return buildRawReportError({
      type: event.effectiveDirective,
      message: `${RawReportType.cspViolation}: ${message}`,
      originalError: event,
      csp: {
        disposition: event.disposition
      },
      stack: buildStack(event.effectiveDirective, event.originalPolicy ? `${message} of the policy "${safeTruncate(event.originalPolicy, 100, "...")}"` : "no policy", event.sourceFile, event.lineNumber, event.columnNumber)
    });
  }
  function buildRawReportError(partial) {
    return {
      startClocks: clocksNow(),
      source: ErrorSource.REPORT,
      handling: "unhandled",
      ...partial
    };
  }
  function buildStack(name, message, sourceFile, lineNumber, columnNumber) {
    return sourceFile ? toStackTraceString({
      name,
      message,
      stack: [
        {
          func: "?",
          url: sourceFile,
          line: lineNumber !== null && lineNumber !== void 0 ? lineNumber : void 0,
          column: columnNumber !== null && columnNumber !== void 0 ? columnNumber : void 0
        }
      ]
    }) : void 0;
  }
  var RawReportType;
  var init_reportObservable = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/report/reportObservable.js"() {
      init_handlingStack();
      init_monitor();
      init_observable();
      init_addEventListener();
      init_stringUtils();
      init_error_types();
      init_timeUtils();
      RawReportType = {
        intervention: "intervention",
        deprecation: "deprecation",
        cspViolation: "csp_violation"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/tags.js
  function buildTags(configuration) {
    const { env, service, version, datacenter, sdkVersion, variant } = configuration;
    const tags = [buildTag("sdk_version", sdkVersion !== null && sdkVersion !== void 0 ? sdkVersion : "0.3.1")];
    if (env) {
      tags.push(buildTag("env", env));
    }
    if (service) {
      tags.push(buildTag("service", service));
    }
    if (version) {
      tags.push(buildTag("version", version));
    }
    if (datacenter) {
      tags.push(buildTag("datacenter", datacenter));
    }
    if (variant) {
      tags.push(buildTag("variant", variant));
    }
    return tags;
  }
  function buildTag(key, rawValue) {
    const tag = rawValue ? `${key}:${rawValue}` : key;
    if (tag.length > TAG_SIZE_LIMIT || hasForbiddenCharacters(tag)) {
      display.warn(`Tag ${tag} doesn't meet tag requirements and will be sanitized. ${MORE_DETAILS} ${DOCS_ORIGIN}/getting_started/tagging/#defining-tags`);
    }
    return sanitizeTag(tag);
  }
  function sanitizeTag(tag) {
    return tag.replace(/,/g, "_");
  }
  function hasForbiddenCharacters(rawValue) {
    if (!supportUnicodePropertyEscapes()) {
      return false;
    }
    return new RegExp("[^\\p{Ll}\\p{Lo}0-9_:./-]", "u").test(rawValue);
  }
  function supportUnicodePropertyEscapes() {
    try {
      new RegExp("[\\p{Ll}]", "u");
      return true;
    } catch (_a) {
      return false;
    }
  }
  var TAG_SIZE_LIMIT;
  var init_tags = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/tags.js"() {
      init_display();
      TAG_SIZE_LIMIT = 200;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/sendToExtension.js
  function sendToExtension(type, payload) {
    const callback = globalObject.__ooBrowserSdkExtensionCallback;
    if (callback) {
      callback({ type, payload });
    }
  }
  var init_sendToExtension = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/sendToExtension.js"() {
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/mergeInto.js
  function mergeInto(destination, source, circularReferenceChecker = createCircularReferenceChecker()) {
    if (source === void 0) {
      return destination;
    }
    if (typeof source !== "object" || source === null) {
      return source;
    } else if (source instanceof Date) {
      return new Date(source.getTime());
    } else if (source instanceof RegExp) {
      const flags = source.flags || // old browsers compatibility
      [
        source.global ? "g" : "",
        source.ignoreCase ? "i" : "",
        source.multiline ? "m" : "",
        source.sticky ? "y" : "",
        source.unicode ? "u" : ""
      ].join("");
      return new RegExp(source.source, flags);
    }
    if (circularReferenceChecker.hasAlreadyBeenSeen(source)) {
      return void 0;
    } else if (Array.isArray(source)) {
      const merged2 = Array.isArray(destination) ? destination : [];
      for (let i = 0; i < source.length; ++i) {
        merged2[i] = mergeInto(merged2[i], source[i], circularReferenceChecker);
      }
      return merged2;
    }
    const merged = getType(destination) === "object" ? destination : {};
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        merged[key] = mergeInto(merged[key], source[key], circularReferenceChecker);
      }
    }
    return merged;
  }
  function deepClone(value) {
    return mergeInto(void 0, value);
  }
  function combine(...sources) {
    let destination;
    for (const source of sources) {
      if (source === void 0 || source === null) {
        continue;
      }
      destination = mergeInto(destination, source);
    }
    return destination;
  }
  function createCircularReferenceChecker() {
    if (typeof WeakSet !== "undefined") {
      const set = /* @__PURE__ */ new WeakSet();
      return {
        hasAlreadyBeenSeen(value) {
          const has = set.has(value);
          if (!has) {
            set.add(value);
          }
          return has;
        }
      };
    }
    const array = [];
    return {
      hasAlreadyBeenSeen(value) {
        const has = array.indexOf(value) >= 0;
        if (!has) {
          array.push(value);
        }
        return has;
      }
    };
  }
  var init_mergeInto = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/mergeInto.js"() {
      init_typeUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/connectivity/connectivity.js
  function getConnectivity() {
    var _a;
    const navigator2 = globalObject.navigator;
    return {
      status: navigator2.onLine ? "connected" : "not_connected",
      interfaces: navigator2.connection && navigator2.connection.type ? [navigator2.connection.type] : void 0,
      effective_type: (_a = navigator2.connection) === null || _a === void 0 ? void 0 : _a.effectiveType
    };
  }
  var init_connectivity = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/connectivity/connectivity.js"() {
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/connectivity/index.js
  var init_connectivity2 = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/connectivity/index.js"() {
      init_connectivity();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/responseUtils.js
  function isServerError(status) {
    return status >= 500;
  }
  function tryToClone(response) {
    try {
      return response.clone();
    } catch (_a) {
      return;
    }
  }
  var init_responseUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/responseUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/sendWithRetryStrategy.js
  function sendWithRetryStrategy(payload, state2, sendStrategy, trackType, reportError, requestObservable) {
    if (state2.transportStatus === 0 && state2.queuedPayloads.size() === 0 && state2.bandwidthMonitor.canHandle(payload)) {
      send(payload, state2, sendStrategy, requestObservable, {
        onSuccess: () => retryQueuedPayloads(0, state2, sendStrategy, trackType, reportError, requestObservable),
        onFailure: () => {
          if (!state2.queuedPayloads.enqueue(payload)) {
            requestObservable.notify({ type: "queue-full", bandwidth: state2.bandwidthMonitor.stats(), payload });
          }
          scheduleRetry(state2, sendStrategy, trackType, reportError, requestObservable);
        }
      });
    } else {
      if (!state2.queuedPayloads.enqueue(payload)) {
        requestObservable.notify({ type: "queue-full", bandwidth: state2.bandwidthMonitor.stats(), payload });
      }
    }
  }
  function scheduleRetry(state2, sendStrategy, trackType, reportError, requestObservable) {
    if (state2.transportStatus !== 2) {
      return;
    }
    setTimeout(() => {
      const payload = state2.queuedPayloads.first();
      send(payload, state2, sendStrategy, requestObservable, {
        onSuccess: () => {
          state2.queuedPayloads.dequeue();
          state2.currentBackoffTime = INITIAL_BACKOFF_TIME;
          retryQueuedPayloads(1, state2, sendStrategy, trackType, reportError, requestObservable);
        },
        onFailure: () => {
          state2.currentBackoffTime = Math.min(MAX_BACKOFF_TIME, state2.currentBackoffTime * 2);
          scheduleRetry(state2, sendStrategy, trackType, reportError, requestObservable);
        }
      });
    }, state2.currentBackoffTime);
  }
  function send(payload, state2, sendStrategy, requestObservable, { onSuccess, onFailure }) {
    state2.bandwidthMonitor.add(payload);
    sendStrategy(payload, (response) => {
      state2.bandwidthMonitor.remove(payload);
      if (!shouldRetryRequest(response)) {
        state2.transportStatus = 0;
        requestObservable.notify({ type: "success", bandwidth: state2.bandwidthMonitor.stats(), payload });
        onSuccess();
      } else {
        state2.transportStatus = state2.bandwidthMonitor.ongoingRequestCount > 0 ? 1 : 2;
        payload.retry = {
          count: payload.retry ? payload.retry.count + 1 : 1,
          lastFailureStatus: response.status
        };
        requestObservable.notify({ type: "failure", bandwidth: state2.bandwidthMonitor.stats(), payload });
        onFailure();
      }
    });
  }
  function retryQueuedPayloads(reason, state2, sendStrategy, trackType, reportError, requestObservable) {
    if (reason === 0 && state2.queuedPayloads.isFull() && !state2.queueFullReported) {
      reportError({
        message: `Reached max ${trackType} events size queued for upload: ${MAX_QUEUE_BYTES_COUNT / ONE_MEBI_BYTE}MiB`,
        source: ErrorSource.AGENT,
        startClocks: clocksNow()
      });
      state2.queueFullReported = true;
    }
    const previousQueue = state2.queuedPayloads;
    state2.queuedPayloads = newPayloadQueue();
    while (previousQueue.size() > 0) {
      sendWithRetryStrategy(previousQueue.dequeue(), state2, sendStrategy, trackType, reportError, requestObservable);
    }
  }
  function shouldRetryRequest(response) {
    return response.type !== "opaque" && (response.status === 0 && !navigator.onLine || response.status === 408 || response.status === 429 || isServerError(response.status));
  }
  function newRetryState() {
    return {
      transportStatus: 0,
      currentBackoffTime: INITIAL_BACKOFF_TIME,
      bandwidthMonitor: newBandwidthMonitor(),
      queuedPayloads: newPayloadQueue(),
      queueFullReported: false
    };
  }
  function newPayloadQueue() {
    const queue = [];
    return {
      bytesCount: 0,
      enqueue(payload) {
        if (this.isFull()) {
          return false;
        }
        queue.push(payload);
        this.bytesCount += payload.bytesCount;
        return true;
      },
      first() {
        return queue[0];
      },
      dequeue() {
        const payload = queue.shift();
        if (payload) {
          this.bytesCount -= payload.bytesCount;
        }
        return payload;
      },
      size() {
        return queue.length;
      },
      isFull() {
        return this.bytesCount >= MAX_QUEUE_BYTES_COUNT;
      }
    };
  }
  function newBandwidthMonitor() {
    return {
      ongoingRequestCount: 0,
      ongoingByteCount: 0,
      canHandle(payload) {
        return this.ongoingRequestCount === 0 || this.ongoingByteCount + payload.bytesCount <= MAX_ONGOING_BYTES_COUNT && this.ongoingRequestCount < MAX_ONGOING_REQUESTS;
      },
      add(payload) {
        this.ongoingRequestCount += 1;
        this.ongoingByteCount += payload.bytesCount;
      },
      remove(payload) {
        this.ongoingRequestCount -= 1;
        this.ongoingByteCount -= payload.bytesCount;
      },
      stats() {
        return {
          ongoingByteCount: this.ongoingByteCount,
          ongoingRequestCount: this.ongoingRequestCount
        };
      }
    };
  }
  var MAX_ONGOING_BYTES_COUNT, MAX_ONGOING_REQUESTS, MAX_QUEUE_BYTES_COUNT, MAX_BACKOFF_TIME, INITIAL_BACKOFF_TIME;
  var init_sendWithRetryStrategy = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/sendWithRetryStrategy.js"() {
      init_timer();
      init_timeUtils();
      init_byteUtils();
      init_responseUtils();
      init_error_types();
      MAX_ONGOING_BYTES_COUNT = 80 * ONE_KIBI_BYTE;
      MAX_ONGOING_REQUESTS = 32;
      MAX_QUEUE_BYTES_COUNT = 20 * ONE_MEBI_BYTE;
      MAX_BACKOFF_TIME = ONE_MINUTE;
      INITIAL_BACKOFF_TIME = ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/httpRequest.js
  function createHttpRequest(endpointBuilders, reportError, bytesLimit = RECOMMENDED_REQUEST_BYTES_LIMIT) {
    const observable = new Observable();
    const retryState = newRetryState();
    return {
      observable,
      send: (payload) => {
        for (const endpointBuilder of endpointBuilders) {
          sendWithRetryStrategy(payload, retryState, (payload2, onResponse) => {
            if (isExperimentalFeatureEnabled(ExperimentalFeature.AVOID_FETCH_KEEPALIVE)) {
              fetchStrategy(endpointBuilder, payload2, onResponse);
            } else {
              fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload2, onResponse);
            }
          }, endpointBuilder.trackType, reportError, observable);
        }
      },
      /**
       * Since fetch keepalive behaves like regular fetch on Firefox,
       * keep using sendBeaconStrategy on exit
       */
      sendOnExit: (payload) => {
        for (const endpointBuilder of endpointBuilders) {
          sendBeaconStrategy(endpointBuilder, bytesLimit, payload);
        }
      }
    };
  }
  function sendBeaconStrategy(endpointBuilder, bytesLimit, payload) {
    const canUseBeacon = !!navigator.sendBeacon && payload.bytesCount < bytesLimit;
    if (canUseBeacon) {
      try {
        const beaconUrl = endpointBuilder.build("beacon", payload);
        const isQueued = navigator.sendBeacon(beaconUrl, payload.data);
        if (isQueued) {
          return;
        }
      } catch (e) {
        reportBeaconError(e);
      }
    }
    fetchStrategy(endpointBuilder, payload);
  }
  function reportBeaconError(e) {
    if (!hasReportedBeaconError) {
      hasReportedBeaconError = true;
      monitorError(e);
    }
  }
  function fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload, onResponse) {
    const canUseKeepAlive = isKeepAliveSupported() && payload.bytesCount < bytesLimit;
    if (canUseKeepAlive) {
      const fetchUrl = endpointBuilder.build("fetch-keepalive", payload);
      fetch(fetchUrl, { method: "POST", body: payload.data, keepalive: true, mode: "cors" }).then(monitor((response) => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: response.status, type: response.type }))).catch(monitor(() => fetchStrategy(endpointBuilder, payload, onResponse)));
    } else {
      fetchStrategy(endpointBuilder, payload, onResponse);
    }
  }
  function fetchStrategy(endpointBuilder, payload, onResponse) {
    const fetchUrl = endpointBuilder.build("fetch", payload);
    fetch(fetchUrl, { method: "POST", body: payload.data, mode: "cors" }).then(monitor((response) => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: response.status, type: response.type }))).catch(monitor(() => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: 0 })));
  }
  function isKeepAliveSupported() {
    try {
      return window.Request && "keepalive" in new Request("http://a");
    } catch (_a) {
      return false;
    }
  }
  var RECOMMENDED_REQUEST_BYTES_LIMIT, hasReportedBeaconError;
  var init_httpRequest = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/httpRequest.js"() {
      init_monitor();
      init_experimentalFeatures();
      init_observable();
      init_byteUtils();
      init_sendWithRetryStrategy();
      RECOMMENDED_REQUEST_BYTES_LIMIT = 16 * ONE_KIBI_BYTE;
      hasReportedBeaconError = false;
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/eventBridge.js
  function getEventBridge() {
    const eventBridgeGlobal = getEventBridgeGlobal();
    if (!eventBridgeGlobal) {
      return;
    }
    return {
      getCapabilities() {
        var _a;
        return JSON.parse(((_a = eventBridgeGlobal.getCapabilities) === null || _a === void 0 ? void 0 : _a.call(eventBridgeGlobal)) || "[]");
      },
      getPrivacyLevel() {
        var _a;
        return (_a = eventBridgeGlobal.getPrivacyLevel) === null || _a === void 0 ? void 0 : _a.call(eventBridgeGlobal);
      },
      getAllowedWebViewHosts() {
        return JSON.parse(eventBridgeGlobal.getAllowedWebViewHosts());
      },
      send(eventType, event, viewId) {
        const view = viewId ? { id: viewId } : void 0;
        eventBridgeGlobal.send(JSON.stringify({ eventType, event, view }));
      }
    };
  }
  function bridgeSupports(capability) {
    const bridge = getEventBridge();
    return !!bridge && bridge.getCapabilities().includes(capability);
  }
  function canUseEventBridge(currentHost) {
    var _a;
    if (currentHost === void 0) {
      currentHost = (_a = getGlobalObject().location) === null || _a === void 0 ? void 0 : _a.hostname;
    }
    const bridge = getEventBridge();
    return !!bridge && bridge.getAllowedWebViewHosts().some((allowedHost) => currentHost === allowedHost || currentHost.endsWith(`.${allowedHost}`));
  }
  function getEventBridgeGlobal() {
    return getGlobalObject().DatadogEventBridge;
  }
  var init_eventBridge = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/eventBridge.js"() {
      init_globalObject();
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/pageMayExitObservable.js
  function createPageMayExitObservable(configuration) {
    return new Observable((observable) => {
      const { stop: stopListeners } = addEventListeners(configuration, window, [
        "visibilitychange",
        "freeze"
        /* DOM_EVENT.FREEZE */
      ], (event) => {
        if (event.type === "visibilitychange" && document.visibilityState === "hidden") {
          observable.notify({ reason: PageExitReason.HIDDEN });
        } else if (event.type === "freeze") {
          observable.notify({ reason: PageExitReason.FROZEN });
        }
      }, { capture: true });
      const stopBeforeUnloadListener = addEventListener(configuration, window, "beforeunload", () => {
        observable.notify({ reason: PageExitReason.UNLOADING });
      }).stop;
      return () => {
        stopListeners();
        stopBeforeUnloadListener();
      };
    });
  }
  function isPageExitReason(reason) {
    return objectValues(PageExitReason).includes(reason);
  }
  var PageExitReason;
  var init_pageMayExitObservable = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/pageMayExitObservable.js"() {
      init_observable();
      init_polyfills();
      init_addEventListener();
      PageExitReason = {
        HIDDEN: "visibility_hidden",
        UNLOADING: "before_unload",
        PAGEHIDE: "page_hide",
        FROZEN: "page_frozen"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/batch.js
  function createBatch({ encoder, request, flushController }) {
    let upsertBuffer = {};
    const flushSubscription = flushController.flushObservable.subscribe((event) => flush(event));
    function push(serializedMessage, estimatedMessageBytesCount, key) {
      flushController.notifyBeforeAddMessage(estimatedMessageBytesCount);
      if (key !== void 0) {
        upsertBuffer[key] = serializedMessage;
        flushController.notifyAfterAddMessage();
      } else {
        encoder.write(encoder.isEmpty ? serializedMessage : `
${serializedMessage}`, (realMessageBytesCount) => {
          flushController.notifyAfterAddMessage(realMessageBytesCount - estimatedMessageBytesCount);
        });
      }
    }
    function hasMessageFor(key) {
      return key !== void 0 && upsertBuffer[key] !== void 0;
    }
    function remove(key) {
      const removedMessage = upsertBuffer[key];
      delete upsertBuffer[key];
      const messageBytesCount = encoder.estimateEncodedBytesCount(removedMessage);
      flushController.notifyAfterRemoveMessage(messageBytesCount);
    }
    function addOrUpdate(message, key) {
      const serializedMessage = jsonStringify(message);
      const estimatedMessageBytesCount = encoder.estimateEncodedBytesCount(serializedMessage);
      if (estimatedMessageBytesCount >= MESSAGE_BYTES_LIMIT) {
        display.warn(`Discarded a message whose size was bigger than the maximum allowed size ${MESSAGE_BYTES_LIMIT / ONE_KIBI_BYTE}KiB. ${MORE_DETAILS} ${DOCS_TROUBLESHOOTING}/#technical-limitations`);
        return;
      }
      if (hasMessageFor(key)) {
        remove(key);
      }
      push(serializedMessage, estimatedMessageBytesCount, key);
    }
    function flush(event) {
      const upsertMessages = objectValues(upsertBuffer).join("\n");
      upsertBuffer = {};
      const pageMightExit = isPageExitReason(event.reason);
      const send2 = pageMightExit ? request.sendOnExit : request.send;
      if (pageMightExit && // Note: checking that the encoder is async is not strictly needed, but it's an optimization:
      // if the encoder is async we need to send two requests in some cases (one for encoded data
      // and the other for non-encoded data). But if it's not async, we don't have to worry about
      // it and always send a single request.
      encoder.isAsync) {
        const encoderResult = encoder.finishSync();
        if (encoderResult.outputBytesCount) {
          send2(formatPayloadFromEncoder(encoderResult));
        }
        const pendingMessages = [encoderResult.pendingData, upsertMessages].filter(Boolean).join("\n");
        if (pendingMessages) {
          send2({
            data: pendingMessages,
            bytesCount: computeBytesCount(pendingMessages)
          });
        }
      } else {
        if (upsertMessages) {
          encoder.write(encoder.isEmpty ? upsertMessages : `
${upsertMessages}`);
        }
        encoder.finish((encoderResult) => {
          send2(formatPayloadFromEncoder(encoderResult));
        });
      }
    }
    return {
      flushController,
      add: addOrUpdate,
      upsert: addOrUpdate,
      stop: flushSubscription.unsubscribe
    };
  }
  function formatPayloadFromEncoder(encoderResult) {
    let data;
    if (typeof encoderResult.output === "string") {
      data = encoderResult.output;
    } else {
      data = new Blob([encoderResult.output], {
        // This will set the 'Content-Type: text/plain' header. Reasoning:
        // * The intake rejects the request if there is no content type.
        // * The browser will issue CORS preflight requests if we set it to 'application/json', which
        // could induce higher intake load (and maybe has other impacts).
        // * Also it's not quite JSON, since we are concatenating multiple JSON objects separated by
        // new lines.
        type: "text/plain"
      });
    }
    return {
      data,
      bytesCount: encoderResult.outputBytesCount,
      encoding: encoderResult.encoding
    };
  }
  var MESSAGE_BYTES_LIMIT;
  var init_batch = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/batch.js"() {
      init_display();
      init_polyfills();
      init_pageMayExitObservable();
      init_jsonStringify();
      init_byteUtils();
      MESSAGE_BYTES_LIMIT = 256 * ONE_KIBI_BYTE;
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/flushController.js
  function createFlushController({ pageMayExitObservable, sessionExpireObservable }) {
    const pageMayExitSubscription = pageMayExitObservable.subscribe((event) => flush(event.reason));
    const sessionExpireSubscription = sessionExpireObservable.subscribe(() => flush("session_expire"));
    const flushObservable = new Observable(() => () => {
      pageMayExitSubscription.unsubscribe();
      sessionExpireSubscription.unsubscribe();
    });
    let currentBytesCount = 0;
    let currentMessagesCount = 0;
    function flush(flushReason) {
      if (currentMessagesCount === 0) {
        return;
      }
      const messagesCount = currentMessagesCount;
      const bytesCount = currentBytesCount;
      currentMessagesCount = 0;
      currentBytesCount = 0;
      cancelDurationLimitTimeout();
      flushObservable.notify({
        reason: flushReason,
        messagesCount,
        bytesCount
      });
    }
    let durationLimitTimeoutId;
    function scheduleDurationLimitTimeout() {
      if (durationLimitTimeoutId === void 0) {
        durationLimitTimeoutId = setTimeout(() => {
          flush("duration_limit");
        }, FLUSH_DURATION_LIMIT);
      }
    }
    function cancelDurationLimitTimeout() {
      clearTimeout(durationLimitTimeoutId);
      durationLimitTimeoutId = void 0;
    }
    return {
      flushObservable,
      get messagesCount() {
        return currentMessagesCount;
      },
      /**
       * Notifies that a message will be added to a pool of pending messages waiting to be flushed.
       *
       * This function needs to be called synchronously, right before adding the message, so no flush
       * event can happen after `notifyBeforeAddMessage` and before adding the message.
       *
       * @param estimatedMessageBytesCount - an estimation of the message bytes count once it is
       * actually added.
       */
      notifyBeforeAddMessage(estimatedMessageBytesCount) {
        if (currentBytesCount + estimatedMessageBytesCount >= RECOMMENDED_REQUEST_BYTES_LIMIT) {
          flush("bytes_limit");
        }
        currentMessagesCount += 1;
        currentBytesCount += estimatedMessageBytesCount;
        scheduleDurationLimitTimeout();
      },
      /**
       * Notifies that a message *was* added to a pool of pending messages waiting to be flushed.
       *
       * This function can be called asynchronously after the message was added, but in this case it
       * should not be called if a flush event occurred in between.
       *
       * @param messageBytesCountDiff - the difference between the estimated message bytes count and
       * its actual bytes count once added to the pool.
       */
      notifyAfterAddMessage(messageBytesCountDiff = 0) {
        currentBytesCount += messageBytesCountDiff;
        if (currentMessagesCount >= MESSAGES_LIMIT) {
          flush("messages_limit");
        } else if (currentBytesCount >= RECOMMENDED_REQUEST_BYTES_LIMIT) {
          flush("bytes_limit");
        }
      },
      /**
       * Notifies that a message was removed from a pool of pending messages waiting to be flushed.
       *
       * This function needs to be called synchronously, right after removing the message, so no flush
       * event can happen after removing the message and before `notifyAfterRemoveMessage`.
       *
       * @param messageBytesCount - the message bytes count that was added to the pool. Should
       * correspond to the sum of bytes counts passed to `notifyBeforeAddMessage` and
       * `notifyAfterAddMessage`.
       */
      notifyAfterRemoveMessage(messageBytesCount) {
        currentBytesCount -= messageBytesCount;
        currentMessagesCount -= 1;
        if (currentMessagesCount === 0) {
          cancelDurationLimitTimeout();
        }
      }
    };
  }
  var FLUSH_DURATION_LIMIT, MESSAGES_LIMIT;
  var init_flushController = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/flushController.js"() {
      init_globalObject();
      init_observable();
      init_timer();
      init_timeUtils();
      init_httpRequest();
      FLUSH_DURATION_LIMIT = 30 * ONE_SECOND;
      MESSAGES_LIMIT = isWorkerEnvironment ? 1 : 50;
    }
  });

  // node_modules/@openobserve/browser-core/esm/transport/index.js
  var init_transport = __esm({
    "node_modules/@openobserve/browser-core/esm/transport/index.js"() {
      init_httpRequest();
      init_eventBridge();
      init_batch();
      init_flushController();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/abstractHooks.js
  function abstractHooks() {
    const callbacks = {};
    return {
      register(hookName, callback) {
        if (!callbacks[hookName]) {
          callbacks[hookName] = [];
        }
        callbacks[hookName].push(callback);
        return {
          unregister: () => {
            callbacks[hookName] = callbacks[hookName].filter((cb) => cb !== callback);
          }
        };
      },
      triggerHook(hookName, param) {
        const hookCallbacks = callbacks[hookName] || [];
        const results = [];
        for (const callback of hookCallbacks) {
          const result = callback(param);
          if (result === DISCARDED) {
            return DISCARDED;
          }
          if (result === SKIPPED) {
            continue;
          }
          results.push(result);
        }
        return combine(...results);
      }
    };
  }
  var DISCARDED, SKIPPED;
  var init_abstractHooks = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/abstractHooks.js"() {
      init_mergeInto();
      DISCARDED = "DISCARDED";
      SKIPPED = "SKIPPED";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/telemetry/rawTelemetryEvent.types.js
  var TelemetryType;
  var init_rawTelemetryEvent_types = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/telemetry/rawTelemetryEvent.types.js"() {
      TelemetryType = {
        LOG: "log",
        CONFIGURATION: "configuration",
        USAGE: "usage"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/telemetry/telemetry.js
  function getTelemetryObservable() {
    if (!telemetryObservable) {
      telemetryObservable = new BufferedObservable(100);
    }
    return telemetryObservable;
  }
  function startTelemetry(telemetryService, configuration, hooks, reportError, pageMayExitObservable, createEncoder) {
    const observable = new Observable();
    const { stop } = startTelemetryTransport(configuration, reportError, pageMayExitObservable, createEncoder, observable);
    const { enabled, metricsEnabled } = startTelemetryCollection(telemetryService, configuration, hooks, observable);
    return {
      stop,
      enabled,
      metricsEnabled
    };
  }
  function startTelemetryCollection(telemetryService, configuration, hooks, observable, metricSampleRate = METRIC_SAMPLE_RATE, maxTelemetryEventsPerPage = MAX_TELEMETRY_EVENTS_PER_PAGE) {
    const alreadySentEventsByKind = {};
    const telemetryEnabled = !TELEMETRY_EXCLUDED_SITES.includes(configuration.site) && performDraw(configuration.telemetrySampleRate);
    const telemetryEnabledPerType = {
      [TelemetryType.LOG]: telemetryEnabled,
      [TelemetryType.CONFIGURATION]: telemetryEnabled && performDraw(configuration.telemetryConfigurationSampleRate),
      [TelemetryType.USAGE]: telemetryEnabled && performDraw(configuration.telemetryUsageSampleRate),
      // not an actual "type" but using a single draw for all metrics
      metric: telemetryEnabled && performDraw(metricSampleRate)
    };
    const runtimeEnvInfo = getRuntimeEnvInfo();
    const telemetryObservable2 = getTelemetryObservable();
    telemetryObservable2.subscribe(({ rawEvent, metricName }) => {
      if (metricName && !telemetryEnabledPerType["metric"] || !telemetryEnabledPerType[rawEvent.type]) {
        return;
      }
      const kind = metricName || rawEvent.status || rawEvent.type;
      let alreadySentEvents = alreadySentEventsByKind[kind];
      if (!alreadySentEvents) {
        alreadySentEvents = alreadySentEventsByKind[kind] = /* @__PURE__ */ new Set();
      }
      if (alreadySentEvents.size >= maxTelemetryEventsPerPage) {
        return;
      }
      const stringifiedEvent = jsonStringify(rawEvent);
      if (alreadySentEvents.has(stringifiedEvent)) {
        return;
      }
      const defaultTelemetryEventAttributes = hooks.triggerHook(1, {
        startTime: clocksNow().relative
      });
      if (defaultTelemetryEventAttributes === DISCARDED) {
        return;
      }
      const event = toTelemetryEvent(defaultTelemetryEventAttributes, telemetryService, rawEvent, runtimeEnvInfo);
      observable.notify(event);
      sendToExtension("telemetry", event);
      alreadySentEvents.add(stringifiedEvent);
    });
    telemetryObservable2.unbuffer();
    startMonitorErrorCollection(addTelemetryError);
    return {
      enabled: telemetryEnabled,
      metricsEnabled: telemetryEnabledPerType["metric"]
    };
    function toTelemetryEvent(defaultTelemetryEventAttributes, telemetryService2, rawEvent, runtimeEnvInfo2) {
      const clockNow = clocksNow();
      const event = {
        type: "telemetry",
        date: clockNow.timeStamp,
        service: telemetryService2,
        version: "0.3.1",
        source: "browser",
        _oo: {
          format_version: 2
        },
        telemetry: combine(rawEvent, {
          runtime_env: runtimeEnvInfo2,
          connectivity: getConnectivity(),
          sdk_setup: "npm"
        }),
        ootags: buildTags(configuration).join(","),
        experimental_features: Array.from(getExperimentalFeatures())
      };
      return combine(event, defaultTelemetryEventAttributes);
    }
  }
  function startTelemetryTransport(configuration, reportError, pageMayExitObservable, createEncoder, telemetryObservable2) {
    const cleanupTasks2 = [];
    if (canUseEventBridge()) {
      const bridge = getEventBridge();
      const telemetrySubscription = telemetryObservable2.subscribe((event) => bridge.send("internal_telemetry", event));
      cleanupTasks2.push(telemetrySubscription.unsubscribe);
    } else {
      const endpoints = [configuration.rumEndpointBuilder];
      if (configuration.replica && isTelemetryReplicationAllowed(configuration)) {
        endpoints.push(configuration.replica.rumEndpointBuilder);
      }
      const telemetryBatch = createBatch({
        encoder: createEncoder(
          4
          /* DeflateEncoderStreamId.TELEMETRY */
        ),
        request: createHttpRequest(endpoints, reportError),
        flushController: createFlushController({
          pageMayExitObservable,
          // We don't use an actual session expire observable here, to make telemetry collection
          // independent of the session. This allows to start and send telemetry events earlier.
          sessionExpireObservable: new Observable()
        })
      });
      cleanupTasks2.push(telemetryBatch.stop);
      const telemetrySubscription = telemetryObservable2.subscribe(telemetryBatch.add);
      cleanupTasks2.push(telemetrySubscription.unsubscribe);
    }
    return {
      stop: () => cleanupTasks2.forEach((task) => task())
    };
  }
  function getRuntimeEnvInfo() {
    var _a;
    return {
      is_local_file: ((_a = globalObject.location) === null || _a === void 0 ? void 0 : _a.protocol) === "file:",
      is_worker: isWorkerEnvironment
    };
  }
  function isTelemetryReplicationAllowed(configuration) {
    return configuration.site === INTAKE_SITE_STAGING;
  }
  function addTelemetryDebug(message, context) {
    displayIfDebugEnabled(ConsoleApiName.debug, message, context);
    getTelemetryObservable().notify({
      rawEvent: {
        type: TelemetryType.LOG,
        message,
        status: "debug",
        ...context
      }
    });
  }
  function addTelemetryError(e, context) {
    getTelemetryObservable().notify({
      rawEvent: {
        type: TelemetryType.LOG,
        status: "error",
        ...formatError(e),
        ...context
      }
    });
  }
  function addTelemetryConfiguration(configuration) {
    getTelemetryObservable().notify({
      rawEvent: {
        type: TelemetryType.CONFIGURATION,
        configuration
      }
    });
  }
  function addTelemetryMetrics(metricName, context) {
    getTelemetryObservable().notify({
      rawEvent: {
        type: TelemetryType.LOG,
        message: metricName,
        status: "debug",
        ...context
      },
      metricName
    });
  }
  function addTelemetryUsage(usage) {
    getTelemetryObservable().notify({
      rawEvent: {
        type: TelemetryType.USAGE,
        usage
      }
    });
  }
  function formatError(e) {
    if (isError(e)) {
      const stackTrace = computeStackTrace(e);
      return {
        error: {
          kind: stackTrace.name,
          stack: toStackTraceString(scrubCustomerFrames(stackTrace))
        },
        message: stackTrace.message
      };
    }
    return {
      error: {
        stack: NO_ERROR_STACK_PRESENT_MESSAGE
      },
      message: `${"Uncaught"} ${jsonStringify(e)}`
    };
  }
  function scrubCustomerFrames(stackTrace) {
    stackTrace.stack = stackTrace.stack.filter((frame) => !frame.url || ALLOWED_FRAME_URLS.some((allowedFrameUrl) => frame.url.startsWith(allowedFrameUrl)));
    return stackTrace;
  }
  var ALLOWED_FRAME_URLS, METRIC_SAMPLE_RATE, TELEMETRY_EXCLUDED_SITES, MAX_TELEMETRY_EVENTS_PER_PAGE, telemetryObservable;
  var init_telemetry = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/telemetry/telemetry.js"() {
      init_display();
      init_error();
      init_handlingStack();
      init_experimentalFeatures();
      init_tags();
      init_intakeSites();
      init_observable();
      init_timeUtils();
      init_monitor();
      init_sendToExtension();
      init_numberUtils();
      init_jsonStringify();
      init_mergeInto();
      init_computeStackTrace();
      init_connectivity2();
      init_transport();
      init_abstractHooks();
      init_globalObject();
      init_rawTelemetryEvent_types();
      ALLOWED_FRAME_URLS = [
        "http://localhost",
        "<anonymous>"
      ];
      METRIC_SAMPLE_RATE = 1;
      TELEMETRY_EXCLUDED_SITES = [INTAKE_SITE_US1_FED];
      MAX_TELEMETRY_EVENTS_PER_PAGE = 15;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/telemetry/index.js
  var init_telemetry2 = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/telemetry/index.js"() {
      init_telemetry();
      init_rawTelemetryEvent_types();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/arrayUtils.js
  function removeDuplicates(array) {
    const set = /* @__PURE__ */ new Set();
    array.forEach((item) => set.add(item));
    return Array.from(set);
  }
  function removeItem(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) {
      array.splice(index, 1);
    }
  }
  function isNonEmptyArray(value) {
    return Array.isArray(value) && value.length > 0;
  }
  var init_arrayUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/arrayUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/valueHistory.js
  function cleanupHistories() {
    cleanupTasks.forEach((task) => task());
  }
  function createValueHistory({ expireDelay, maxEntries }) {
    let entries = [];
    if (!cleanupHistoriesInterval) {
      cleanupHistoriesInterval = setInterval(() => cleanupHistories(), CLEAR_OLD_VALUES_INTERVAL);
    }
    const clearExpiredValues = () => {
      const oldTimeThreshold = relativeNow() - expireDelay;
      while (entries.length > 0 && entries[entries.length - 1].endTime < oldTimeThreshold) {
        entries.pop();
      }
    };
    cleanupTasks.add(clearExpiredValues);
    function add(value, startTime) {
      const entry = {
        value,
        startTime,
        endTime: END_OF_TIMES,
        remove: () => {
          removeItem(entries, entry);
        },
        close: (endTime2) => {
          entry.endTime = endTime2;
        }
      };
      if (maxEntries && entries.length >= maxEntries) {
        entries.pop();
      }
      entries.unshift(entry);
      return entry;
    }
    function find(startTime = END_OF_TIMES, options = { returnInactive: false }) {
      for (const entry of entries) {
        if (entry.startTime <= startTime) {
          if (options.returnInactive || startTime <= entry.endTime) {
            return entry.value;
          }
          break;
        }
      }
    }
    function closeActive(endTime2) {
      const latestEntry = entries[0];
      if (latestEntry && latestEntry.endTime === END_OF_TIMES) {
        latestEntry.close(endTime2);
      }
    }
    function findAll(startTime = END_OF_TIMES, duration = 0) {
      const endTime2 = addDuration(startTime, duration);
      return entries.filter((entry) => entry.startTime <= endTime2 && startTime <= entry.endTime).map((entry) => entry.value);
    }
    function reset() {
      entries = [];
    }
    function stop() {
      cleanupTasks.delete(clearExpiredValues);
      if (cleanupTasks.size === 0 && cleanupHistoriesInterval) {
        clearInterval(cleanupHistoriesInterval);
        cleanupHistoriesInterval = null;
      }
    }
    return { add, find, closeActive, findAll, reset, stop };
  }
  var END_OF_TIMES, CLEAR_OLD_VALUES_INTERVAL, cleanupHistoriesInterval, cleanupTasks;
  var init_valueHistory = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/valueHistory.js"() {
      init_timer();
      init_arrayUtils();
      init_timeUtils();
      END_OF_TIMES = Infinity;
      CLEAR_OLD_VALUES_INTERVAL = ONE_MINUTE;
      cleanupHistoriesInterval = null;
      cleanupTasks = /* @__PURE__ */ new Set();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/synthetics/syntheticsWorkerValues.js
  function willSyntheticsInjectRum() {
    if (isWorkerEnvironment) {
      return false;
    }
    return Boolean(globalObject._OO_SYNTHETICS_INJECTS_RUM || getInitCookie(SYNTHETICS_INJECTS_RUM_COOKIE_NAME));
  }
  function getSyntheticsTestId() {
    const value = window._OO_SYNTHETICS_PUBLIC_ID || getInitCookie(SYNTHETICS_TEST_ID_COOKIE_NAME);
    return typeof value === "string" ? value : void 0;
  }
  function getSyntheticsResultId() {
    const value = window._OO_SYNTHETICS_RESULT_ID || getInitCookie(SYNTHETICS_RESULT_ID_COOKIE_NAME);
    return typeof value === "string" ? value : void 0;
  }
  function isSyntheticsTest() {
    return Boolean(getSyntheticsTestId() && getSyntheticsResultId());
  }
  var SYNTHETICS_TEST_ID_COOKIE_NAME, SYNTHETICS_RESULT_ID_COOKIE_NAME, SYNTHETICS_INJECTS_RUM_COOKIE_NAME;
  var init_syntheticsWorkerValues = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/synthetics/syntheticsWorkerValues.js"() {
      init_cookie();
      init_globalObject();
      SYNTHETICS_TEST_ID_COOKIE_NAME = "openobserve-synthetics-public-id";
      SYNTHETICS_RESULT_ID_COOKIE_NAME = "openobserve-synthetics-result-id";
      SYNTHETICS_INJECTS_RUM_COOKIE_NAME = "openobserve-synthetics-injects-rum";
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/session/sessionManager.js
  function startSessionManager(configuration, productKey, computeTrackingType3, trackingConsentState) {
    const renewObservable = new Observable();
    const expireObservable = new Observable();
    const sessionStore = startSessionStore(configuration.sessionStoreStrategyType, configuration, productKey, computeTrackingType3);
    stopCallbacks.push(() => sessionStore.stop());
    const sessionContextHistory = createValueHistory({
      expireDelay: SESSION_CONTEXT_TIMEOUT_DELAY
    });
    stopCallbacks.push(() => sessionContextHistory.stop());
    sessionStore.renewObservable.subscribe(() => {
      sessionContextHistory.add(buildSessionContext(), relativeNow());
      renewObservable.notify();
    });
    sessionStore.expireObservable.subscribe(() => {
      expireObservable.notify();
      sessionContextHistory.closeActive(relativeNow());
    });
    sessionStore.expandOrRenewSession();
    sessionContextHistory.add(buildSessionContext(), clocksOrigin().relative);
    if (isExperimentalFeatureEnabled(ExperimentalFeature.SHORT_SESSION_INVESTIGATION)) {
      const session = sessionStore.getSession();
      if (session) {
        detectSessionIdChange(configuration, session);
      }
    }
    trackingConsentState.observable.subscribe(() => {
      if (trackingConsentState.isGranted()) {
        sessionStore.expandOrRenewSession();
      } else {
        sessionStore.expire(false);
      }
    });
    trackActivity(configuration, () => {
      if (trackingConsentState.isGranted()) {
        sessionStore.expandOrRenewSession();
      }
    });
    trackVisibility(configuration, () => sessionStore.expandSession());
    trackResume(configuration, () => sessionStore.restartSession());
    function buildSessionContext() {
      const session = sessionStore.getSession();
      if (!session) {
        reportUnexpectedSessionState(configuration).catch(() => void 0);
        return {
          id: "invalid",
          trackingType: SESSION_NOT_TRACKED,
          isReplayForced: false,
          anonymousId: void 0
        };
      }
      return {
        id: session.id,
        trackingType: session[productKey],
        isReplayForced: !!session.forcedReplay,
        anonymousId: session.anonymousId
      };
    }
    return {
      findSession: (startTime, options) => sessionContextHistory.find(startTime, options),
      renewObservable,
      expireObservable,
      sessionStateUpdateObservable: sessionStore.sessionStateUpdateObservable,
      expire: sessionStore.expire,
      updateSessionState: sessionStore.updateSessionState
    };
  }
  function trackActivity(configuration, expandOrRenewSession) {
    const { stop } = addEventListeners(configuration, window, [
      "click",
      "touchstart",
      "keydown",
      "scroll"
      /* DOM_EVENT.SCROLL */
    ], expandOrRenewSession, { capture: true, passive: true });
    stopCallbacks.push(stop);
  }
  function trackVisibility(configuration, expandSession) {
    const expandSessionWhenVisible = () => {
      if (document.visibilityState === "visible") {
        expandSession();
      }
    };
    const { stop } = addEventListener(configuration, document, "visibilitychange", expandSessionWhenVisible);
    stopCallbacks.push(stop);
    const visibilityCheckInterval = setInterval(expandSessionWhenVisible, VISIBILITY_CHECK_DELAY);
    stopCallbacks.push(() => {
      clearInterval(visibilityCheckInterval);
    });
  }
  function trackResume(configuration, cb) {
    const { stop } = addEventListener(configuration, window, "resume", cb, { capture: true });
    stopCallbacks.push(stop);
  }
  async function reportUnexpectedSessionState(configuration) {
    const sessionStoreStrategyType = configuration.sessionStoreStrategyType;
    if (!sessionStoreStrategyType) {
      return;
    }
    let rawSession;
    let cookieContext;
    if (sessionStoreStrategyType.type === SessionPersistence.COOKIE) {
      rawSession = retrieveSessionCookie(sessionStoreStrategyType.cookieOptions, configuration);
      cookieContext = {
        cookie: await getSessionCookies(),
        currentDomain: `${window.location.protocol}//${window.location.hostname}`
      };
    } else {
      rawSession = retrieveSessionFromLocalStorage();
    }
    addTelemetryDebug("Unexpected session state", {
      sessionStoreStrategyType: sessionStoreStrategyType.type,
      session: rawSession,
      isSyntheticsTest: isSyntheticsTest(),
      createdTimestamp: rawSession === null || rawSession === void 0 ? void 0 : rawSession.created,
      expireTimestamp: rawSession === null || rawSession === void 0 ? void 0 : rawSession.expire,
      ...cookieContext
    });
  }
  function detectSessionIdChange(configuration, initialSessionState) {
    if (!window.cookieStore || !initialSessionState.created) {
      return;
    }
    const sessionCreatedTime = Number(initialSessionState.created);
    const sdkInitTime = dateNow();
    const { stop } = addEventListener(configuration, cookieStore, "change", listener);
    stopCallbacks.push(stop);
    function listener(event) {
      const changed = findLast(event.changed, (change) => change.name === SESSION_STORE_KEY);
      if (!changed) {
        return;
      }
      const sessionAge = dateNow() - sessionCreatedTime;
      if (sessionAge > 14 * ONE_MINUTE) {
        stop();
      } else {
        const newSessionState = toSessionState(changed.value);
        if (newSessionState.id && newSessionState.id !== initialSessionState.id) {
          stop();
          const time = dateNow() - sdkInitTime;
          getSessionCookies().then((cookie) => {
            addTelemetryDebug("Session cookie changed", {
              time,
              session_age: sessionAge,
              old: initialSessionState,
              new: newSessionState,
              cookie
            });
          }).catch(monitorError);
        }
      }
    }
  }
  async function getSessionCookies() {
    let sessionCookies;
    if ("cookieStore" in window) {
      sessionCookies = await window.cookieStore.getAll(SESSION_STORE_KEY);
    } else {
      sessionCookies = document.cookie.split(/\s*;\s*/).filter((cookie) => cookie.startsWith(SESSION_STORE_KEY));
    }
    return {
      count: sessionCookies.length,
      domain: getCurrentSite() || "undefined",
      ...sessionCookies
    };
  }
  var VISIBILITY_CHECK_DELAY, SESSION_CONTEXT_TIMEOUT_DELAY, stopCallbacks;
  var init_sessionManager = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/session/sessionManager.js"() {
      init_observable();
      init_valueHistory();
      init_timeUtils();
      init_addEventListener();
      init_timer();
      init_telemetry2();
      init_syntheticsWorkerValues();
      init_cookie();
      init_experimentalFeatures();
      init_polyfills();
      init_monitor();
      init_sessionConstants();
      init_sessionStore();
      init_sessionState();
      init_sessionInCookie();
      init_sessionStoreStrategy();
      init_sessionInLocalStorage();
      VISIBILITY_CHECK_DELAY = ONE_MINUTE;
      SESSION_CONTEXT_TIMEOUT_DELAY = SESSION_TIME_OUT_DELAY;
      stopCallbacks = [];
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/encoder.js
  function createIdentityEncoder() {
    let output = "";
    let outputBytesCount = 0;
    return {
      isAsync: false,
      get isEmpty() {
        return !output;
      },
      write(data, callback) {
        const additionalEncodedBytesCount = computeBytesCount(data);
        outputBytesCount += additionalEncodedBytesCount;
        output += data;
        if (callback) {
          callback(additionalEncodedBytesCount);
        }
      },
      finish(callback) {
        callback(this.finishSync());
      },
      finishSync() {
        const result = {
          output,
          outputBytesCount,
          rawBytesCount: outputBytesCount,
          pendingData: ""
        };
        output = "";
        outputBytesCount = 0;
        return result;
      },
      estimateEncodedBytesCount(data) {
        return data.length;
      }
    };
  }
  var init_encoder = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/encoder.js"() {
      init_byteUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/abstractLifeCycle.js
  var AbstractLifeCycle;
  var init_abstractLifeCycle = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/abstractLifeCycle.js"() {
      AbstractLifeCycle = class {
        constructor() {
          this.callbacks = {};
        }
        notify(eventType, data) {
          const eventCallbacks = this.callbacks[eventType];
          if (eventCallbacks) {
            eventCallbacks.forEach((callback) => callback(data));
          }
        }
        subscribe(eventType, callback) {
          if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
          }
          this.callbacks[eventType].push(callback);
          return {
            unsubscribe: () => {
              this.callbacks[eventType] = this.callbacks[eventType].filter((other) => callback !== other);
            }
          };
        }
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/eventRateLimiter/createEventRateLimiter.js
  function createEventRateLimiter(eventType, onLimitReached, limit = EVENT_RATE_LIMIT) {
    let eventCount = 0;
    let allowNextEvent = false;
    return {
      isLimitReached() {
        if (eventCount === 0) {
          setTimeout(() => {
            eventCount = 0;
          }, ONE_MINUTE);
        }
        eventCount += 1;
        if (eventCount <= limit || allowNextEvent) {
          allowNextEvent = false;
          return false;
        }
        if (eventCount === limit + 1) {
          allowNextEvent = true;
          try {
            onLimitReached({
              message: `Reached max number of ${eventType}s by minute: ${limit}`,
              source: ErrorSource.AGENT,
              startClocks: clocksNow()
            });
          } finally {
            allowNextEvent = false;
          }
        }
        return true;
      }
    };
  }
  var EVENT_RATE_LIMIT;
  var init_createEventRateLimiter = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/eventRateLimiter/createEventRateLimiter.js"() {
      init_timer();
      init_timeUtils();
      init_error_types();
      EVENT_RATE_LIMIT = 3e3;
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/runOnReadyState.js
  function runOnReadyState(configuration, expectedReadyState, callback) {
    if (document.readyState === expectedReadyState || document.readyState === "complete") {
      callback();
      return { stop: noop };
    }
    const eventName = expectedReadyState === "complete" ? "load" : "DOMContentLoaded";
    return addEventListener(configuration, window, eventName, callback, { once: true });
  }
  function asyncRunOnReadyState(configuration, expectedReadyState) {
    return new Promise((resolve) => {
      runOnReadyState(configuration, expectedReadyState, resolve);
    });
  }
  var init_runOnReadyState = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/runOnReadyState.js"() {
      init_functionUtils();
      init_addEventListener();
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/xhrObservable.js
  function initXhrObservable(configuration) {
    if (!xhrObservable) {
      xhrObservable = createXhrObservable(configuration);
    }
    return xhrObservable;
  }
  function createXhrObservable(configuration) {
    return new Observable((observable) => {
      const { stop: stopInstrumentingStart } = instrumentMethod(XMLHttpRequest.prototype, "open", openXhr);
      const { stop: stopInstrumentingSend } = instrumentMethod(XMLHttpRequest.prototype, "send", (call) => {
        sendXhr(call, configuration, observable);
      }, { computeHandlingStack: true });
      const { stop: stopInstrumentingAbort } = instrumentMethod(XMLHttpRequest.prototype, "abort", abortXhr);
      return () => {
        stopInstrumentingStart();
        stopInstrumentingSend();
        stopInstrumentingAbort();
      };
    });
  }
  function openXhr({ target: xhr, parameters: [method, url] }) {
    xhrContexts.set(xhr, {
      state: "open",
      method: String(method).toUpperCase(),
      url: normalizeUrl(String(url))
    });
  }
  function sendXhr({ target: xhr, parameters: [body], handlingStack }, configuration, observable) {
    const context = xhrContexts.get(xhr);
    if (!context) {
      return;
    }
    const startContext = context;
    startContext.state = "start";
    startContext.startClocks = clocksNow();
    startContext.isAborted = false;
    startContext.xhr = xhr;
    startContext.handlingStack = handlingStack;
    startContext.requestBody = body;
    let hasBeenReported = false;
    const { stop: stopInstrumentingOnReadyStateChange } = instrumentMethod(xhr, "onreadystatechange", () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        onEnd();
      }
    });
    const onEnd = () => {
      unsubscribeLoadEndListener();
      stopInstrumentingOnReadyStateChange();
      if (hasBeenReported) {
        return;
      }
      hasBeenReported = true;
      const completeContext = context;
      completeContext.state = "complete";
      completeContext.duration = elapsed(startContext.startClocks.timeStamp, timeStampNow());
      completeContext.status = xhr.status;
      if (typeof xhr.response === "string") {
        completeContext.responseBody = xhr.response;
      }
      observable.notify(shallowClone(completeContext));
    };
    const { stop: unsubscribeLoadEndListener } = addEventListener(configuration, xhr, "loadend", onEnd);
    observable.notify(startContext);
  }
  function abortXhr({ target: xhr }) {
    const context = xhrContexts.get(xhr);
    if (context) {
      context.isAborted = true;
    }
  }
  var xhrObservable, xhrContexts;
  var init_xhrObservable = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/xhrObservable.js"() {
      init_instrumentMethod();
      init_observable();
      init_timeUtils();
      init_urlPolyfill();
      init_objectUtils();
      init_addEventListener();
      xhrContexts = /* @__PURE__ */ new WeakMap();
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/readBytesFromStream.js
  async function readBytesFromStream(stream, options) {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      if (options.collectStreamBody) {
        chunks.push(result.value);
      }
    }
    reader.cancel().catch(
      // we don't care if cancel fails, but we still need to catch the error to avoid reporting it
      // as an unhandled rejection
      noop
    );
    return options.collectStreamBody ? concatBuffers(chunks) : void 0;
  }
  var init_readBytesFromStream = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/readBytesFromStream.js"() {
      init_byteUtils();
      init_functionUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/browser/fetchObservable.js
  function initFetchObservable({ responseBodyAction } = {}) {
    if (responseBodyAction) {
      responseBodyActionGetters.push(responseBodyAction);
    }
    if (!fetchObservable) {
      fetchObservable = createFetchObservable();
    }
    return fetchObservable;
  }
  function createFetchObservable() {
    return new Observable((observable) => {
      if (!globalObject.fetch) {
        return;
      }
      const { stop } = instrumentMethod(globalObject, "fetch", (call) => beforeSend(call, observable), {
        computeHandlingStack: true
      });
      return stop;
    });
  }
  function beforeSend({ parameters, onPostCall, handlingStack }, observable) {
    const [input, init] = parameters;
    let methodFromParams = init && init.method;
    if (methodFromParams === void 0 && input instanceof Request) {
      methodFromParams = input.method;
    }
    const method = methodFromParams !== void 0 ? String(methodFromParams).toUpperCase() : "GET";
    const url = input instanceof Request ? input.url : normalizeUrl(String(input));
    const startClocks = clocksNow();
    const context = {
      state: "start",
      init,
      input,
      method,
      startClocks,
      url,
      handlingStack
    };
    observable.notify(context);
    parameters[0] = context.input;
    parameters[1] = context.init;
    onPostCall((responsePromise) => {
      afterSend(observable, responsePromise, context).catch(monitorError);
    });
  }
  async function afterSend(observable, responsePromise, startContext) {
    var _a, _b;
    const context = startContext;
    context.state = "resolve";
    let response;
    try {
      response = await responsePromise;
    } catch (error) {
      context.status = 0;
      context.isAborted = ((_b = (_a = context.init) === null || _a === void 0 ? void 0 : _a.signal) === null || _b === void 0 ? void 0 : _b.aborted) || error instanceof DOMException && error.code === DOMException.ABORT_ERR;
      context.error = error;
      observable.notify(context);
      return;
    }
    context.response = response;
    context.status = response.status;
    context.responseType = response.type;
    context.isAborted = false;
    const responseBodyCondition = responseBodyActionGetters.reduce(
      (action, getter) => Math.max(action, getter(context)),
      0
      /* ResponseBodyAction.IGNORE */
    );
    if (responseBodyCondition !== 0) {
      const clonedResponse = tryToClone(response);
      if (clonedResponse && clonedResponse.body) {
        try {
          const bytes = await readBytesFromStream(clonedResponse.body, {
            collectStreamBody: responseBodyCondition === 2
          });
          context.responseBody = bytes && new TextDecoder().decode(bytes);
        } catch (_c) {
        }
      }
    }
    observable.notify(context);
  }
  var fetchObservable, responseBodyActionGetters;
  var init_fetchObservable = __esm({
    "node_modules/@openobserve/browser-core/esm/browser/fetchObservable.js"() {
      init_instrumentMethod();
      init_monitor();
      init_observable();
      init_timeUtils();
      init_urlPolyfill();
      init_globalObject();
      init_readBytesFromStream();
      init_responseUtils();
      responseBodyActionGetters = [];
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/requestIdleCallback.js
  function requestIdleCallback(callback, opts) {
    if (window.requestIdleCallback && window.cancelIdleCallback) {
      const id = window.requestIdleCallback(monitor(callback), opts);
      return () => window.cancelIdleCallback(id);
    }
    return requestIdleCallbackShim(callback);
  }
  function requestIdleCallbackShim(callback) {
    const start = dateNow();
    const timeoutId = setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, MAX_TASK_TIME - (dateNow() - start))
      });
    }, 0);
    return () => clearTimeout(timeoutId);
  }
  var MAX_TASK_TIME;
  var init_requestIdleCallback = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/requestIdleCallback.js"() {
      init_timer();
      init_monitor();
      init_timeUtils();
      MAX_TASK_TIME = 50;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/taskQueue.js
  function createTaskQueue() {
    const pendingTasks = [];
    function run(deadline) {
      let executionTimeRemaining;
      if (deadline.didTimeout) {
        const start = performance.now();
        executionTimeRemaining = () => MAX_EXECUTION_TIME_ON_TIMEOUT - (performance.now() - start);
      } else {
        executionTimeRemaining = deadline.timeRemaining.bind(deadline);
      }
      while (executionTimeRemaining() > 0 && pendingTasks.length) {
        pendingTasks.shift()();
      }
      if (pendingTasks.length) {
        scheduleNextRun();
      }
    }
    function scheduleNextRun() {
      requestIdleCallback(run, { timeout: IDLE_CALLBACK_TIMEOUT });
    }
    return {
      push(task) {
        if (pendingTasks.push(task) === 1) {
          scheduleNextRun();
        }
      },
      stop() {
        pendingTasks.length = 0;
      }
    };
  }
  var IDLE_CALLBACK_TIMEOUT, MAX_EXECUTION_TIME_ON_TIMEOUT;
  var init_taskQueue = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/taskQueue.js"() {
      init_timeUtils();
      init_requestIdleCallback();
      IDLE_CALLBACK_TIMEOUT = ONE_SECOND;
      MAX_EXECUTION_TIME_ON_TIMEOUT = 30;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/console/consoleObservable.js
  function initConsoleObservable(apis) {
    const consoleObservables = apis.map((api) => {
      if (!consoleObservablesByApi[api]) {
        consoleObservablesByApi[api] = createConsoleObservable(api);
      }
      return consoleObservablesByApi[api];
    });
    return mergeObservables(...consoleObservables);
  }
  function createConsoleObservable(api) {
    return new Observable((observable) => {
      const originalConsoleApi = globalConsole[api];
      globalConsole[api] = (...params) => {
        originalConsoleApi.apply(console, params);
        const handlingStack = createHandlingStack("console error");
        callMonitored(() => {
          observable.notify(buildConsoleLog(params, api, handlingStack));
        });
      };
      return () => {
        globalConsole[api] = originalConsoleApi;
      };
    });
  }
  function buildConsoleLog(params, api, handlingStack) {
    const message = params.map((param) => formatConsoleParameters(param)).join(" ");
    if (api === ConsoleApiName.error) {
      const firstErrorParam = params.find(isError);
      const rawError = computeRawError({
        originalError: firstErrorParam,
        handlingStack,
        startClocks: clocksNow(),
        source: ErrorSource.CONSOLE,
        handling: "handled",
        nonErrorPrefix: "Provided",
        // if no good stack is computed from the error, let's not use the fallback stack message
        // advising the user to use an instance of Error, as console.error is commonly used without an
        // Error instance.
        useFallbackStack: false
      });
      rawError.message = message;
      return {
        api,
        message,
        handlingStack,
        error: rawError
      };
    }
    return {
      api,
      message,
      error: void 0,
      handlingStack
    };
  }
  function formatConsoleParameters(param) {
    if (typeof param === "string") {
      return sanitize(param);
    }
    if (isError(param)) {
      return formatErrorMessage(computeStackTrace(param));
    }
    return jsonStringify(sanitize(param), void 0, 2);
  }
  var consoleObservablesByApi;
  var init_consoleObservable = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/console/consoleObservable.js"() {
      init_error();
      init_observable();
      init_display();
      init_monitor();
      init_sanitize();
      init_jsonStringify();
      init_error_types();
      init_computeStackTrace();
      init_handlingStack();
      init_timeUtils();
      consoleObservablesByApi = {};
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/boundedBuffer.js
  function createBoundedBuffer() {
    const buffer = [];
    const add = (callback) => {
      const length = buffer.push(callback);
      if (length > BUFFER_LIMIT) {
        buffer.splice(0, 1);
      }
    };
    const remove = (callback) => {
      removeItem(buffer, callback);
    };
    const drain = (arg) => {
      buffer.forEach((callback) => callback(arg));
      buffer.length = 0;
    };
    return {
      add,
      remove,
      drain
    };
  }
  var BUFFER_LIMIT;
  var init_boundedBuffer = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/boundedBuffer.js"() {
      init_arrayUtils();
      BUFFER_LIMIT = 500;
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/context/contextUtils.js
  function checkContext(maybeContext) {
    const isValid = getType(maybeContext) === "object";
    if (!isValid) {
      display.error("Unsupported context:", maybeContext);
    }
    return isValid;
  }
  var init_contextUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/context/contextUtils.js"() {
      init_display();
      init_typeUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/context/contextManager.js
  function ensureProperties(context, propertiesConfig, name) {
    const newContext = { ...context };
    for (const [key, { required, type }] of Object.entries(propertiesConfig)) {
      if (type === "string" && !isDefined(newContext[key])) {
        newContext[key] = String(newContext[key]);
      }
      if (required && isDefined(newContext[key])) {
        display.warn(`The property ${key} of ${name} is required; context will not be sent to the intake.`);
      }
    }
    return newContext;
  }
  function isDefined(value) {
    return value === void 0 || value === null || value === "";
  }
  function createContextManager(name = "", { propertiesConfig = {} } = {}) {
    let context = {};
    const changeObservable = new Observable();
    const contextManager = {
      getContext: () => deepClone(context),
      setContext: (newContext) => {
        if (checkContext(newContext)) {
          context = sanitize(ensureProperties(newContext, propertiesConfig, name));
        } else {
          contextManager.clearContext();
        }
        changeObservable.notify();
      },
      setContextProperty: (key, property) => {
        context = sanitize(ensureProperties({ ...context, [key]: property }, propertiesConfig, name));
        changeObservable.notify();
      },
      removeContextProperty: (key) => {
        delete context[key];
        ensureProperties(context, propertiesConfig, name);
        changeObservable.notify();
      },
      clearContext: () => {
        context = {};
        changeObservable.notify();
      },
      changeObservable
    };
    return contextManager;
  }
  var init_contextManager = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/context/contextManager.js"() {
      init_mergeInto();
      init_sanitize();
      init_observable();
      init_display();
      init_contextUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/context/defineContextMethod.js
  function defineContextMethod(getStrategy, contextName, methodName, usage) {
    return monitor((...args) => {
      if (usage) {
        addTelemetryUsage({ feature: usage });
      }
      return getStrategy()[contextName][methodName](...args);
    });
  }
  function bufferContextCalls(preStartContextManager, name, bufferApiCalls) {
    preStartContextManager.changeObservable.subscribe(() => {
      const context = preStartContextManager.getContext();
      bufferApiCalls.add((startResult) => startResult[name].setContext(context));
    });
  }
  var init_defineContextMethod = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/context/defineContextMethod.js"() {
      init_telemetry2();
      init_monitor();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/context/storeContextManager.js
  function storeContextManager(configuration, contextManager, productKey, customerDataType) {
    const storageKey = buildStorageKey(productKey, customerDataType);
    storageListeners.push(addEventListener(configuration, window, "storage", ({ key }) => {
      if (storageKey === key) {
        synchronizeWithStorage();
      }
    }));
    contextManager.changeObservable.subscribe(dumpToStorage);
    const contextFromStorage = combine(getFromStorage(), contextManager.getContext());
    if (!isEmptyObject(contextFromStorage)) {
      contextManager.setContext(contextFromStorage);
    }
    function synchronizeWithStorage() {
      contextManager.setContext(getFromStorage());
    }
    function dumpToStorage() {
      localStorage.setItem(storageKey, JSON.stringify(contextManager.getContext()));
    }
    function getFromStorage() {
      const rawContext = localStorage.getItem(storageKey);
      return rawContext ? JSON.parse(rawContext) : {};
    }
  }
  function buildStorageKey(productKey, customerDataType) {
    return `${CONTEXT_STORE_KEY_PREFIX}_${productKey}_${customerDataType}`;
  }
  var CONTEXT_STORE_KEY_PREFIX, storageListeners;
  var init_storeContextManager = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/context/storeContextManager.js"() {
      init_addEventListener();
      init_mergeInto();
      init_objectUtils();
      CONTEXT_STORE_KEY_PREFIX = "_oo_c";
      storageListeners = [];
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/contexts/accountContext.js
  function startAccountContext(hooks, configuration, productKey) {
    const accountContextManager = buildAccountContextManager();
    if (configuration.storeContextsAcrossPages) {
      storeContextManager(
        configuration,
        accountContextManager,
        productKey,
        4
        /* CustomerDataType.Account */
      );
    }
    hooks.register(0, () => {
      const account = accountContextManager.getContext();
      if (isEmptyObject(account) || !account.id) {
        return SKIPPED;
      }
      return {
        account
      };
    });
    return accountContextManager;
  }
  function buildAccountContextManager() {
    return createContextManager("account", {
      propertiesConfig: {
        id: { type: "string", required: true },
        name: { type: "string" }
      }
    });
  }
  var init_accountContext = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/contexts/accountContext.js"() {
      init_storeContextManager();
      init_abstractHooks();
      init_objectUtils();
      init_contextManager();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/contexts/globalContext.js
  function startGlobalContext(hooks, configuration, productKey, useContextNamespace) {
    const globalContextManager = buildGlobalContextManager();
    if (configuration.storeContextsAcrossPages) {
      storeContextManager(
        configuration,
        globalContextManager,
        productKey,
        2
        /* CustomerDataType.GlobalContext */
      );
    }
    hooks.register(0, () => {
      const context = globalContextManager.getContext();
      return useContextNamespace ? { context } : context;
    });
    return globalContextManager;
  }
  function buildGlobalContextManager() {
    return createContextManager("global context");
  }
  var init_globalContext = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/contexts/globalContext.js"() {
      init_storeContextManager();
      init_contextManager();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/contexts/userContext.js
  function startUserContext(hooks, configuration, sessionManager, productKey) {
    const userContextManager = buildUserContextManager();
    if (configuration.storeContextsAcrossPages) {
      storeContextManager(
        configuration,
        userContextManager,
        productKey,
        1
        /* CustomerDataType.User */
      );
    }
    hooks.register(0, ({ eventType, startTime }) => {
      const user = userContextManager.getContext();
      const session = sessionManager.findTrackedSession(startTime);
      if (session && session.anonymousId && !user.anonymous_id && !!configuration.trackAnonymousUser) {
        user.anonymous_id = session.anonymousId;
      }
      if (isEmptyObject(user)) {
        return SKIPPED;
      }
      return {
        type: eventType,
        usr: user
      };
    });
    hooks.register(1, ({ startTime }) => {
      var _a;
      return {
        anonymous_id: (_a = sessionManager.findTrackedSession(startTime)) === null || _a === void 0 ? void 0 : _a.anonymousId
      };
    });
    return userContextManager;
  }
  function buildUserContextManager() {
    return createContextManager("user", {
      propertiesConfig: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" }
      }
    });
  }
  var init_userContext = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/contexts/userContext.js"() {
      init_storeContextManager();
      init_abstractHooks();
      init_contextManager();
      init_objectUtils();
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/context/contextConstants.js
  var CustomerContextKey, ContextManagerMethod;
  var init_contextConstants = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/context/contextConstants.js"() {
      CustomerContextKey = {
        userContext: "userContext",
        globalContext: "globalContext",
        accountContext: "accountContext"
      };
      ContextManagerMethod = {
        getContext: "getContext",
        setContext: "setContext",
        setContextProperty: "setContextProperty",
        removeContextProperty: "removeContextProperty",
        clearContext: "clearContext"
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/resourceUtils.js
  var ResourceType, RequestType;
  var init_resourceUtils = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/resourceUtils.js"() {
      ResourceType = {
        DOCUMENT: "document",
        XHR: "xhr",
        BEACON: "beacon",
        FETCH: "fetch",
        CSS: "css",
        JS: "js",
        IMAGE: "image",
        FONT: "font",
        MEDIA: "media",
        OTHER: "other"
      };
      RequestType = {
        FETCH: ResourceType.FETCH,
        XHR: ResourceType.XHR
      };
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/bufferedData.js
  function startBufferingData(trackRuntimeErrorImpl = trackRuntimeError) {
    const observable = new BufferedObservable(BUFFER_LIMIT2);
    const runtimeErrorSubscription = trackRuntimeErrorImpl().subscribe((error) => {
      observable.notify({
        type: 0,
        error
      });
    });
    return {
      observable,
      stop: () => {
        runtimeErrorSubscription.unsubscribe();
      }
    };
  }
  var BUFFER_LIMIT2;
  var init_bufferedData = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/bufferedData.js"() {
      init_observable();
      init_trackRuntimeError();
      BUFFER_LIMIT2 = 500;
    }
  });

  // node_modules/@openobserve/browser-core/esm/tools/utils/timezone.js
  function getTimeZone() {
    try {
      const intl = new Intl.DateTimeFormat();
      return intl.resolvedOptions().timeZone;
    } catch (_a) {
      return void 0;
    }
  }
  var init_timezone = __esm({
    "node_modules/@openobserve/browser-core/esm/tools/utils/timezone.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/deflate/deflate.types.js
  var init_deflate_types = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/deflate/deflate.types.js"() {
    }
  });

  // node_modules/@openobserve/browser-core/esm/domain/deflate/index.js
  var init_deflate = __esm({
    "node_modules/@openobserve/browser-core/esm/domain/deflate/index.js"() {
      init_deflate_types();
    }
  });

  // node_modules/@openobserve/browser-core/esm/index.js
  var init_esm = __esm({
    "node_modules/@openobserve/browser-core/esm/index.js"() {
      init_configuration2();
      init_intakeSites();
      init_trackingConsent();
      init_experimentalFeatures();
      init_computeStackTrace();
      init_init();
      init_displayAlreadyInitializedError();
      init_reportObservable();
      init_telemetry2();
      init_monitor();
      init_observable();
      init_sessionManager();
      init_sessionConstants();
      init_transport();
      init_display();
      init_encoder();
      init_urlPolyfill();
      init_timeUtils();
      init_arrayUtils();
      init_sanitize();
      init_globalObject();
      init_abstractLifeCycle();
      init_createEventRateLimiter();
      init_browserDetection();
      init_sendToExtension();
      init_runOnReadyState();
      init_getZoneJsOriginalValue();
      init_instrumentMethod();
      init_error();
      init_cookie();
      init_xhrObservable();
      init_fetchObservable();
      init_pageMayExitObservable();
      init_addEventListener();
      init_requestIdleCallback();
      init_taskQueue();
      init_timer();
      init_consoleObservable();
      init_boundedBuffer();
      init_contextManager();
      init_defineContextMethod();
      init_accountContext();
      init_globalContext();
      init_userContext();
      init_contextConstants();
      init_valueHistory();
      init_syntheticsWorkerValues();
      init_resourceUtils();
      init_bufferedData();
      init_polyfills();
      init_timezone();
      init_numberUtils();
      init_byteUtils();
      init_objectUtils();
      init_functionUtils();
      init_jsonStringify();
      init_mergeInto();
      init_stringUtils();
      init_matchOption();
      init_responseUtils();
      init_typeUtils();
      init_error_types();
      init_deflate();
      init_connectivity2();
      init_handlingStack();
      init_abstractHooks();
      init_tags();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/rawRumEvent.types.js
  var RumEventType, RumLongTaskEntryType, ViewLoadingType, ActionType, FrustrationType, VitalType;
  var init_rawRumEvent_types = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/rawRumEvent.types.js"() {
      RumEventType = {
        ACTION: "action",
        ERROR: "error",
        LONG_TASK: "long_task",
        VIEW: "view",
        RESOURCE: "resource",
        VITAL: "vital"
      };
      RumLongTaskEntryType = {
        LONG_TASK: "long-task",
        LONG_ANIMATION_FRAME: "long-animation-frame"
      };
      ViewLoadingType = {
        INITIAL_LOAD: "initial_load",
        ROUTE_CHANGE: "route_change",
        BF_CACHE: "bf_cache"
      };
      ActionType = {
        CLICK: "click",
        CUSTOM: "custom"
      };
      FrustrationType = {
        RAGE_CLICK: "rage_click",
        ERROR_CLICK: "error_click",
        DEAD_CLICK: "dead_click"
      };
      VitalType = {
        DURATION: "duration",
        OPERATION_STEP: "operation_step"
      };
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/vital/vitalCollection.js
  function createCustomVitalsState() {
    const vitalsByName = /* @__PURE__ */ new Map();
    const vitalsByReference = /* @__PURE__ */ new WeakMap();
    return { vitalsByName, vitalsByReference };
  }
  function startVitalCollection(lifeCycle, pageStateHistory, customVitalsState) {
    function isValid(vital) {
      return !pageStateHistory.wasInPageStateDuringPeriod("frozen", vital.startClocks.relative, vital.duration);
    }
    function addDurationVital(vital) {
      if (isValid(vital)) {
        lifeCycle.notify(12, processVital(vital));
      }
    }
    function addOperationStepVital(name, stepType, options, failureReason) {
      if (!isExperimentalFeatureEnabled(ExperimentalFeature.FEATURE_OPERATION_VITAL)) {
        return;
      }
      const { operationKey, context, description } = options || {};
      const vital = {
        name,
        type: VitalType.OPERATION_STEP,
        operationKey,
        failureReason,
        stepType,
        startClocks: clocksNow(),
        context: sanitize(context),
        description
      };
      lifeCycle.notify(12, processVital(vital));
    }
    return {
      addOperationStepVital,
      addDurationVital,
      startDurationVital: (name, options = {}) => startDurationVital(customVitalsState, name, options),
      stopDurationVital: (nameOrRef, options = {}) => {
        stopDurationVital(addDurationVital, customVitalsState, nameOrRef, options);
      }
    };
  }
  function startDurationVital({ vitalsByName, vitalsByReference }, name, options = {}) {
    const vital = {
      name,
      startClocks: clocksNow(),
      ...options
    };
    const reference = { __oo_vital_reference: true };
    vitalsByName.set(name, vital);
    vitalsByReference.set(reference, vital);
    return reference;
  }
  function stopDurationVital(stopCallback, { vitalsByName, vitalsByReference }, nameOrRef, options = {}) {
    const vitalStart = typeof nameOrRef === "string" ? vitalsByName.get(nameOrRef) : vitalsByReference.get(nameOrRef);
    if (!vitalStart) {
      return;
    }
    stopCallback(buildDurationVital(vitalStart, vitalStart.startClocks, options, clocksNow()));
    if (typeof nameOrRef === "string") {
      vitalsByName.delete(nameOrRef);
    } else {
      vitalsByReference.delete(nameOrRef);
    }
  }
  function buildDurationVital(vitalStart, startClocks, stopOptions, stopClocks) {
    var _a;
    return {
      name: vitalStart.name,
      type: VitalType.DURATION,
      startClocks,
      duration: elapsed(startClocks.timeStamp, stopClocks.timeStamp),
      context: combine(vitalStart.context, stopOptions.context),
      description: (_a = stopOptions.description) !== null && _a !== void 0 ? _a : vitalStart.description
    };
  }
  function processVital(vital) {
    const { startClocks, type, name, description, context } = vital;
    const vitalData = {
      id: generateUUID(),
      type,
      name,
      description,
      ...type === VitalType.DURATION ? { duration: toServerDuration(vital.duration) } : {
        step_type: vital.stepType,
        operation_key: vital.operationKey,
        failure_reason: vital.failureReason
      }
    };
    return {
      rawRumEvent: {
        date: startClocks.timeStamp,
        vital: vitalData,
        type: RumEventType.VITAL,
        context
      },
      startTime: startClocks.relative,
      duration: type === VitalType.DURATION ? vital.duration : void 0,
      domainContext: {}
    };
  }
  var init_vitalCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/vital/vitalCollection.js"() {
      init_esm();
      init_rawRumEvent_types();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/plugins.js
  function callPluginsMethod(plugins, methodName, parameter) {
    if (!plugins) {
      return;
    }
    for (const plugin of plugins) {
      const method = plugin[methodName];
      if (method) {
        method(parameter);
      }
    }
  }
  var init_plugins = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/plugins.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/sampler/sampler.js
  function isSampled(sessionId, sampleRate) {
    if (sampleRate === 100) {
      return true;
    }
    if (sampleRate === 0) {
      return false;
    }
    const cachedDecision = sampleDecisionCache.get(sampleRate);
    if (cachedDecision && sessionId === cachedDecision.sessionId) {
      return cachedDecision.decision;
    }
    let decision;
    if (window.BigInt) {
      decision = sampleUsingKnuthFactor(BigInt(`0x${sessionId.split("-")[4]}`), sampleRate);
    } else {
      decision = performDraw(sampleRate);
    }
    sampleDecisionCache.set(sampleRate, { sessionId, decision });
    return decision;
  }
  function sampleUsingKnuthFactor(identifier, sampleRate) {
    const knuthFactor = BigInt("1111111111111111111");
    const twoPow64 = BigInt("0x10000000000000000");
    const hash = identifier * knuthFactor % twoPow64;
    return Number(hash) <= sampleRate / 100 * Number(twoPow64);
  }
  var sampleDecisionCache;
  var init_sampler = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/sampler/sampler.js"() {
      init_esm();
      sampleDecisionCache = /* @__PURE__ */ new Map();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/tracing/identifier.js
  function createTraceIdentifier() {
    return createIdentifier(64);
  }
  function createSpanIdentifier() {
    return createIdentifier(63);
  }
  function createIdentifier(bits) {
    const buffer = crypto.getRandomValues(new Uint32Array(2));
    if (bits === 63) {
      buffer[buffer.length - 1] >>>= 1;
    }
    return {
      toString(radix = 10) {
        let high = buffer[1];
        let low = buffer[0];
        let str = "";
        do {
          const mod = high % radix * 4294967296 + low;
          high = Math.floor(high / radix);
          low = Math.floor(mod / radix);
          str = (mod % radix).toString(radix) + str;
        } while (high || low);
        return str;
      }
    };
  }
  function toPaddedHexadecimalString(id) {
    return id.toString(16).padStart(16, "0");
  }
  var init_identifier = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/tracing/identifier.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/tracing/tracer.js
  function isTracingOption(item) {
    const expectedItem = item;
    return getType(expectedItem) === "object" && isMatchOption(expectedItem.match) && Array.isArray(expectedItem.propagatorTypes);
  }
  function clearTracingIfNeeded(context) {
    if (context.status === 0 && !context.isAborted) {
      context.traceId = void 0;
      context.spanId = void 0;
      context.traceSampled = void 0;
    }
  }
  function startTracer(configuration, sessionManager, userContext, accountContext) {
    return {
      clearTracingIfNeeded,
      traceFetch: (context) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, (tracingHeaders) => {
        var _a;
        if (context.input instanceof Request && !((_a = context.init) === null || _a === void 0 ? void 0 : _a.headers)) {
          context.input = new Request(context.input);
          Object.keys(tracingHeaders).forEach((key) => {
            ;
            context.input.headers.append(key, tracingHeaders[key]);
          });
        } else {
          context.init = shallowClone(context.init);
          const headers = [];
          if (context.init.headers instanceof Headers) {
            context.init.headers.forEach((value, key) => {
              headers.push([key, value]);
            });
          } else if (Array.isArray(context.init.headers)) {
            context.init.headers.forEach((header) => {
              headers.push(header);
            });
          } else if (context.init.headers) {
            Object.keys(context.init.headers).forEach((key) => {
              headers.push([key, context.init.headers[key]]);
            });
          }
          context.init.headers = headers.concat(objectEntries(tracingHeaders));
        }
      }),
      traceXhr: (context, xhr) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, (tracingHeaders) => {
        Object.keys(tracingHeaders).forEach((name) => {
          xhr.setRequestHeader(name, tracingHeaders[name]);
        });
      })
    };
  }
  function injectHeadersIfTracingAllowed(configuration, context, sessionManager, userContext, accountContext, inject) {
    const session = sessionManager.findTrackedSession();
    if (!session) {
      return;
    }
    const tracingOption = configuration.allowedTracingUrls.find((tracingOption2) => matchList([tracingOption2.match], context.url, true));
    if (!tracingOption) {
      return;
    }
    const traceSampled = isSampled(session.id, configuration.traceSampleRate);
    const shouldInjectHeaders = traceSampled || configuration.traceContextInjection === TraceContextInjection.ALL;
    if (!shouldInjectHeaders) {
      return;
    }
    context.traceSampled = traceSampled;
    context.traceId = createTraceIdentifier();
    context.spanId = createSpanIdentifier();
    inject(makeTracingHeaders(context.traceId, context.spanId, context.traceSampled, session.id, tracingOption.propagatorTypes, userContext, accountContext, configuration));
  }
  function makeTracingHeaders(traceId, spanId, traceSampled, sessionId, propagatorTypes, userContext, accountContext, configuration) {
    const tracingHeaders = {};
    propagatorTypes.forEach((propagatorType) => {
      switch (propagatorType) {
        // https://www.w3.org/TR/trace-context/
        case "tracecontext": {
          Object.assign(tracingHeaders, {
            traceparent: `00-0000000000000000${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-0${traceSampled ? "1" : "0"}`,
            tracestate: `oo=s:${traceSampled ? "1" : "0"};o:rum`
          });
          break;
        }
        // https://github.com/openzipkin/b3-propagation
        case "b3": {
          Object.assign(tracingHeaders, {
            b3: `${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-${traceSampled ? "1" : "0"}`
          });
          break;
        }
        case "b3multi": {
          Object.assign(tracingHeaders, {
            "X-B3-TraceId": toPaddedHexadecimalString(traceId),
            "X-B3-SpanId": toPaddedHexadecimalString(spanId),
            "X-B3-Sampled": traceSampled ? "1" : "0"
          });
          break;
        }
      }
    });
    if (configuration.propagateTraceBaggage) {
      const baggageItems = {
        "session.id": sessionId
      };
      const userId = userContext.getContext().id;
      if (typeof userId === "string") {
        baggageItems["user.id"] = userId;
      }
      const accountId = accountContext.getContext().id;
      if (typeof accountId === "string") {
        baggageItems["account.id"] = accountId;
      }
      const baggageHeader = Object.entries(baggageItems).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join(",");
      if (baggageHeader) {
        tracingHeaders["baggage"] = baggageHeader;
      }
    }
    return tracingHeaders;
  }
  var init_tracer = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/tracing/tracer.js"() {
      init_esm();
      init_sampler();
      init_identifier();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/configuration/configuration.js
  function validateAndBuildRumConfiguration(initConfiguration, errorStack) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (initConfiguration.trackFeatureFlagsForEvents !== void 0 && !Array.isArray(initConfiguration.trackFeatureFlagsForEvents)) {
      display.warn("trackFeatureFlagsForEvents should be an array");
    }
    if (!initConfiguration.applicationId) {
      display.error("Application ID is not configured, no RUM data will be collected.");
      return;
    }
    if (!isSampleRate(initConfiguration.sessionReplaySampleRate, "Session Replay") || !isSampleRate(initConfiguration.traceSampleRate, "Trace")) {
      return;
    }
    if (initConfiguration.excludedActivityUrls !== void 0 && !Array.isArray(initConfiguration.excludedActivityUrls)) {
      display.error("Excluded Activity Urls should be an array");
      return;
    }
    const allowedTracingUrls = validateAndBuildTracingOptions(initConfiguration);
    if (!allowedTracingUrls) {
      return;
    }
    const baseConfiguration = validateAndBuildConfiguration(initConfiguration, errorStack);
    const allowedGraphQlUrls = validateAndBuildGraphQlOptions(initConfiguration);
    if (!baseConfiguration) {
      return;
    }
    const sessionReplaySampleRate = (_a = initConfiguration.sessionReplaySampleRate) !== null && _a !== void 0 ? _a : 0;
    return {
      applicationId: initConfiguration.applicationId,
      actionNameAttribute: initConfiguration.actionNameAttribute,
      sessionReplaySampleRate,
      startSessionReplayRecordingManually: initConfiguration.startSessionReplayRecordingManually !== void 0 ? !!initConfiguration.startSessionReplayRecordingManually : sessionReplaySampleRate === 0,
      traceSampleRate: (_b = initConfiguration.traceSampleRate) !== null && _b !== void 0 ? _b : 100,
      rulePsr: isNumber(initConfiguration.traceSampleRate) ? initConfiguration.traceSampleRate / 100 : void 0,
      allowedTracingUrls,
      excludedActivityUrls: (_c = initConfiguration.excludedActivityUrls) !== null && _c !== void 0 ? _c : [],
      workerUrl: initConfiguration.workerUrl,
      compressIntakeRequests: !!initConfiguration.compressIntakeRequests,
      trackUserInteractions: !!((_d = initConfiguration.trackUserInteractions) !== null && _d !== void 0 ? _d : true),
      trackViewsManually: !!initConfiguration.trackViewsManually,
      trackResources: !!((_e = initConfiguration.trackResources) !== null && _e !== void 0 ? _e : true),
      trackLongTasks: !!((_f = initConfiguration.trackLongTasks) !== null && _f !== void 0 ? _f : true),
      trackBfcacheViews: !!initConfiguration.trackBfcacheViews,
      trackEarlyRequests: !!initConfiguration.trackEarlyRequests,
      subdomain: initConfiguration.subdomain,
      defaultPrivacyLevel: objectHasValue(DefaultPrivacyLevel, initConfiguration.defaultPrivacyLevel) ? initConfiguration.defaultPrivacyLevel : DefaultPrivacyLevel.MASK,
      enablePrivacyForActionName: !!initConfiguration.enablePrivacyForActionName,
      traceContextInjection: objectHasValue(TraceContextInjection, initConfiguration.traceContextInjection) ? initConfiguration.traceContextInjection : TraceContextInjection.SAMPLED,
      plugins: initConfiguration.plugins || [],
      trackFeatureFlagsForEvents: initConfiguration.trackFeatureFlagsForEvents || [],
      profilingSampleRate: (_g = initConfiguration.profilingSampleRate) !== null && _g !== void 0 ? _g : 0,
      propagateTraceBaggage: !!initConfiguration.propagateTraceBaggage,
      allowedGraphQlUrls,
      ...baseConfiguration
    };
  }
  function validateAndBuildTracingOptions(initConfiguration) {
    if (initConfiguration.allowedTracingUrls === void 0) {
      return [];
    }
    if (!Array.isArray(initConfiguration.allowedTracingUrls)) {
      display.error("Allowed Tracing URLs should be an array");
      return;
    }
    if (initConfiguration.allowedTracingUrls.length !== 0 && initConfiguration.service === void 0) {
      display.error("Service needs to be configured when tracing is enabled");
      return;
    }
    const tracingOptions = [];
    initConfiguration.allowedTracingUrls.forEach((option) => {
      if (isMatchOption(option)) {
        tracingOptions.push({ match: option, propagatorTypes: DEFAULT_PROPAGATOR_TYPES });
      } else if (isTracingOption(option)) {
        tracingOptions.push(option);
      } else {
        display.warn("Allowed Tracing Urls parameters should be a string, RegExp, function, or an object. Ignoring parameter", option);
      }
    });
    return tracingOptions;
  }
  function getSelectedTracingPropagators(configuration) {
    const usedTracingPropagators = /* @__PURE__ */ new Set();
    if (isNonEmptyArray(configuration.allowedTracingUrls)) {
      configuration.allowedTracingUrls.forEach((option) => {
        if (isMatchOption(option)) {
          DEFAULT_PROPAGATOR_TYPES.forEach((propagatorType) => usedTracingPropagators.add(propagatorType));
        } else if (getType(option) === "object" && Array.isArray(option.propagatorTypes)) {
          option.propagatorTypes.forEach((propagatorType) => usedTracingPropagators.add(propagatorType));
        }
      });
    }
    return Array.from(usedTracingPropagators);
  }
  function validateAndBuildGraphQlOptions(initConfiguration) {
    if (!initConfiguration.allowedGraphQlUrls) {
      return [];
    }
    if (!Array.isArray(initConfiguration.allowedGraphQlUrls)) {
      display.warn("allowedGraphQlUrls should be an array");
      return [];
    }
    const graphQlOptions = [];
    initConfiguration.allowedGraphQlUrls.forEach((option) => {
      if (isMatchOption(option)) {
        graphQlOptions.push({ match: option, trackPayload: false, trackResponseErrors: false });
      } else if (option && typeof option === "object" && "match" in option && isMatchOption(option.match)) {
        graphQlOptions.push({
          match: option.match,
          trackPayload: !!option.trackPayload,
          trackResponseErrors: !!option.trackResponseErrors
        });
      }
    });
    return graphQlOptions;
  }
  function hasGraphQlPayloadTracking(allowedGraphQlUrls) {
    return isNonEmptyArray(allowedGraphQlUrls) && allowedGraphQlUrls.some((option) => {
      if (typeof option === "object" && "trackPayload" in option) {
        return !!option.trackPayload;
      }
      return false;
    });
  }
  function hasGraphQlResponseErrorsTracking(allowedGraphQlUrls) {
    return isNonEmptyArray(allowedGraphQlUrls) && allowedGraphQlUrls.some((option) => {
      if (typeof option === "object" && "trackResponseErrors" in option) {
        return !!option.trackResponseErrors;
      }
      return false;
    });
  }
  function serializeRumConfiguration(configuration) {
    var _a;
    const baseSerializedConfiguration = serializeConfiguration(configuration);
    return {
      session_replay_sample_rate: configuration.sessionReplaySampleRate,
      start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually,
      trace_sample_rate: configuration.traceSampleRate,
      trace_context_injection: configuration.traceContextInjection,
      propagate_trace_baggage: configuration.propagateTraceBaggage,
      action_name_attribute: configuration.actionNameAttribute,
      use_allowed_tracing_urls: isNonEmptyArray(configuration.allowedTracingUrls),
      use_allowed_graph_ql_urls: isNonEmptyArray(configuration.allowedGraphQlUrls),
      use_track_graph_ql_payload: hasGraphQlPayloadTracking(configuration.allowedGraphQlUrls),
      use_track_graph_ql_response_errors: hasGraphQlResponseErrorsTracking(configuration.allowedGraphQlUrls),
      selected_tracing_propagators: getSelectedTracingPropagators(configuration),
      default_privacy_level: configuration.defaultPrivacyLevel,
      enable_privacy_for_action_name: configuration.enablePrivacyForActionName,
      use_excluded_activity_urls: isNonEmptyArray(configuration.excludedActivityUrls),
      use_worker_url: !!configuration.workerUrl,
      compress_intake_requests: configuration.compressIntakeRequests,
      track_views_manually: configuration.trackViewsManually,
      track_user_interactions: configuration.trackUserInteractions,
      track_resources: configuration.trackResources,
      track_long_task: configuration.trackLongTasks,
      track_bfcache_views: configuration.trackBfcacheViews,
      track_early_requests: configuration.trackEarlyRequests,
      plugins: (_a = configuration.plugins) === null || _a === void 0 ? void 0 : _a.map((plugin) => {
        var _a2;
        return {
          name: plugin.name,
          ...(_a2 = plugin.getConfigurationTelemetry) === null || _a2 === void 0 ? void 0 : _a2.call(plugin)
        };
      }),
      track_feature_flags_for_events: configuration.trackFeatureFlagsForEvents,
      remote_configuration_id: configuration.remoteConfigurationId,
      profiling_sample_rate: configuration.profilingSampleRate,
      use_remote_configuration_proxy: !!configuration.remoteConfigurationProxy,
      ...baseSerializedConfiguration
    };
  }
  var DEFAULT_PROPAGATOR_TYPES;
  var init_configuration3 = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/configuration/configuration.js"() {
      init_esm();
      init_tracer();
      DEFAULT_PROPAGATOR_TYPES = ["tracecontext"];
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/configuration/jsonPathParser.js
  function parseJsonPath(path) {
    const selectors = [];
    let previousToken = 0;
    let currentToken;
    const parsingContext = { quote: void 0, escapeSequence: void 0 };
    let currentSelector = "";
    for (const char of path) {
      currentToken = ALLOWED_NEXT_TOKENS[previousToken].find((token) => TOKEN_PREDICATE[token](char, parsingContext));
      if (!currentToken) {
        return [];
      }
      if (parsingContext.escapeSequence !== void 0 && currentToken !== 12) {
        if (!isValidEscapeSequence(parsingContext.escapeSequence)) {
          return [];
        }
        currentSelector += resolveEscapeSequence(parsingContext.escapeSequence);
        parsingContext.escapeSequence = void 0;
      }
      if (ALLOWED_SELECTOR_TOKENS.includes(currentToken)) {
        currentSelector += char;
      } else if (ALLOWED_SELECTOR_DELIMITER_TOKENS.includes(currentToken) && currentSelector !== "") {
        selectors.push(currentSelector);
        currentSelector = "";
      } else if (currentToken === 12) {
        parsingContext.escapeSequence = parsingContext.escapeSequence ? `${parsingContext.escapeSequence}${char}` : char;
      } else if (currentToken === 8) {
        parsingContext.quote = char;
      } else if (currentToken === 9) {
        parsingContext.quote = void 0;
      }
      previousToken = currentToken;
    }
    if (!ALLOWED_NEXT_TOKENS[previousToken].includes(
      1
      /* Token.END */
    )) {
      return [];
    }
    if (currentSelector !== "") {
      selectors.push(currentSelector);
    }
    return selectors;
  }
  function isValidEscapeSequence(escapeSequence) {
    return `"'/\\bfnrt`.includes(escapeSequence) || escapeSequence.startsWith("u") && escapeSequence.length === 5;
  }
  function resolveEscapeSequence(escapeSequence) {
    if (escapeSequence.startsWith("u")) {
      return String.fromCharCode(parseInt(escapeSequence.slice(1), 16));
    }
    return ESCAPED_CHARS[escapeSequence];
  }
  var NAME_SHORTHAND_FIRST_CHAR_REGEX, NAME_SHORTHAND_CHAR_REGEX, DIGIT_REGEX, UNICODE_CHAR_REGEX, QUOTE_CHARS, TOKEN_PREDICATE, ALLOWED_NEXT_TOKENS, ALLOWED_SELECTOR_TOKENS, ALLOWED_SELECTOR_DELIMITER_TOKENS, ESCAPED_CHARS;
  var init_jsonPathParser = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/configuration/jsonPathParser.js"() {
      NAME_SHORTHAND_FIRST_CHAR_REGEX = /[a-zA-Z_$]/;
      NAME_SHORTHAND_CHAR_REGEX = /[a-zA-Z0-9_$]/;
      DIGIT_REGEX = /[0-9]/;
      UNICODE_CHAR_REGEX = /[a-fA-F0-9]/;
      QUOTE_CHARS = `'"`;
      TOKEN_PREDICATE = {
        // no char should match to START or END
        [
          0
          /* Token.START */
        ]: () => false,
        [
          1
          /* Token.END */
        ]: () => false,
        [
          2
          /* Token.NAME_SHORTHAND_FIRST_CHAR */
        ]: (char) => NAME_SHORTHAND_FIRST_CHAR_REGEX.test(char),
        [
          3
          /* Token.NAME_SHORTHAND_CHAR */
        ]: (char) => NAME_SHORTHAND_CHAR_REGEX.test(char),
        [
          4
          /* Token.DOT */
        ]: (char) => char === ".",
        [
          5
          /* Token.BRACKET_START */
        ]: (char) => char === "[",
        [
          6
          /* Token.BRACKET_END */
        ]: (char) => char === "]",
        [
          7
          /* Token.DIGIT */
        ]: (char) => DIGIT_REGEX.test(char),
        [
          8
          /* Token.QUOTE_START */
        ]: (char) => QUOTE_CHARS.includes(char),
        [
          9
          /* Token.QUOTE_END */
        ]: (char, parsingContext) => char === parsingContext.quote,
        [
          10
          /* Token.NAME_SELECTOR_CHAR */
        ]: () => true,
        // any char can be used in name selector
        [
          11
          /* Token.ESCAPE */
        ]: (char) => char === "\\",
        [
          12
          /* Token.ESCAPE_SEQUENCE_CHAR */
        ]: (char, parsingContext) => {
          if (parsingContext.escapeSequence === void 0) {
            return `${parsingContext.quote}/\\bfnrtu`.includes(char);
          } else if (parsingContext.escapeSequence.startsWith("u") && parsingContext.escapeSequence.length < 5) {
            return UNICODE_CHAR_REGEX.test(char);
          }
          return false;
        }
      };
      ALLOWED_NEXT_TOKENS = {
        [
          0
          /* Token.START */
        ]: [
          2,
          5
          /* Token.BRACKET_START */
        ],
        [
          1
          /* Token.END */
        ]: [],
        [
          2
          /* Token.NAME_SHORTHAND_FIRST_CHAR */
        ]: [
          3,
          4,
          5,
          1
          /* Token.END */
        ],
        [
          3
          /* Token.NAME_SHORTHAND_CHAR */
        ]: [
          3,
          4,
          5,
          1
          /* Token.END */
        ],
        [
          4
          /* Token.DOT */
        ]: [
          2
          /* Token.NAME_SHORTHAND_FIRST_CHAR */
        ],
        [
          5
          /* Token.BRACKET_START */
        ]: [
          8,
          7
          /* Token.DIGIT */
        ],
        [
          6
          /* Token.BRACKET_END */
        ]: [
          4,
          5,
          1
          /* Token.END */
        ],
        [
          7
          /* Token.DIGIT */
        ]: [
          7,
          6
          /* Token.BRACKET_END */
        ],
        [
          8
          /* Token.QUOTE_START */
        ]: [
          11,
          9,
          10
          /* Token.NAME_SELECTOR_CHAR */
        ],
        [
          9
          /* Token.QUOTE_END */
        ]: [
          6
          /* Token.BRACKET_END */
        ],
        [
          10
          /* Token.NAME_SELECTOR_CHAR */
        ]: [
          11,
          9,
          10
          /* Token.NAME_SELECTOR_CHAR */
        ],
        [
          11
          /* Token.ESCAPE */
        ]: [
          12
          /* Token.ESCAPE_SEQUENCE_CHAR */
        ],
        [
          12
          /* Token.ESCAPE_SEQUENCE_CHAR */
        ]: [
          12,
          11,
          9,
          10
          /* Token.NAME_SELECTOR_CHAR */
        ]
      };
      ALLOWED_SELECTOR_TOKENS = [
        2,
        3,
        7,
        10
      ];
      ALLOWED_SELECTOR_DELIMITER_TOKENS = [
        4,
        5,
        6
        /* Token.BRACKET_END */
      ];
      ESCAPED_CHARS = {
        '"': '"',
        "'": "'",
        "/": "/",
        "\\": "\\",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "	"
      };
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/configuration/remoteConfiguration.js
  async function fetchAndApplyRemoteConfiguration(initConfiguration, supportedContextManagers) {
    let rumInitConfiguration;
    const metrics = initMetrics();
    const fetchResult = await fetchRemoteConfiguration(initConfiguration);
    if (!fetchResult.ok) {
      metrics.increment("fetch", "failure");
      display.error(fetchResult.error);
    } else {
      metrics.increment("fetch", "success");
      rumInitConfiguration = applyRemoteConfiguration(initConfiguration, fetchResult.value, supportedContextManagers, metrics);
    }
    addTelemetryMetrics("remote configuration metrics", { metrics: metrics.get() });
    return rumInitConfiguration;
  }
  function applyRemoteConfiguration(initConfiguration, rumRemoteConfiguration, supportedContextManagers, metrics) {
    const appliedConfiguration = { ...initConfiguration };
    SUPPORTED_FIELDS.forEach((option) => {
      if (option in rumRemoteConfiguration) {
        appliedConfiguration[option] = resolveConfigurationProperty(rumRemoteConfiguration[option]);
      }
    });
    Object.keys(supportedContextManagers).forEach((context) => {
      if (rumRemoteConfiguration[context] !== void 0) {
        resolveContextProperty(supportedContextManagers[context], rumRemoteConfiguration[context]);
      }
    });
    return appliedConfiguration;
    function resolveConfigurationProperty(property) {
      if (Array.isArray(property)) {
        return property.map(resolveConfigurationProperty);
      }
      if (isObject(property)) {
        if (isSerializedOption(property)) {
          const type = property.rcSerializedType;
          switch (type) {
            case "string":
              return property.value;
            case "regex":
              return resolveRegex(property.value);
            case "dynamic":
              return resolveDynamicOption(property);
            default:
              display.error(`Unsupported remote configuration: "rcSerializedType": "${type}"`);
              return;
          }
        }
        return mapValues(property, resolveConfigurationProperty);
      }
      return property;
    }
    function resolveContextProperty(contextManager, contextItems) {
      contextItems.forEach(({ key, value }) => {
        contextManager.setContextProperty(key, resolveConfigurationProperty(value));
      });
    }
    function resolveDynamicOption(property) {
      const strategy = property.strategy;
      let resolvedValue;
      switch (strategy) {
        case "cookie":
          resolvedValue = resolveCookieValue(property);
          break;
        case "dom":
          resolvedValue = resolveDomValue(property);
          break;
        case "js":
          resolvedValue = resolveJsValue(property);
          break;
        default:
          display.error(`Unsupported remote configuration: "strategy": "${strategy}"`);
          return;
      }
      const extractor = property.extractor;
      if (extractor !== void 0 && typeof resolvedValue === "string") {
        return extractValue(extractor, resolvedValue);
      }
      return resolvedValue;
    }
    function resolveCookieValue({ name }) {
      const value = getCookie(name);
      metrics.increment("cookie", value !== void 0 ? "success" : "missing");
      return value;
    }
    function resolveDomValue({ selector, attribute }) {
      let element;
      try {
        element = document.querySelector(selector);
      } catch (_a) {
        display.error(`Invalid selector in the remote configuration: '${selector}'`);
        metrics.increment("dom", "failure");
        return;
      }
      if (!element) {
        metrics.increment("dom", "missing");
        return;
      }
      if (isForbidden(element, attribute)) {
        display.error(`Forbidden element selected by the remote configuration: '${selector}'`);
        metrics.increment("dom", "failure");
        return;
      }
      const domValue = attribute !== void 0 ? element.getAttribute(attribute) : element.textContent;
      if (domValue === null) {
        metrics.increment("dom", "missing");
        return;
      }
      metrics.increment("dom", "success");
      return domValue;
    }
    function isForbidden(element, attribute) {
      return element.getAttribute("type") === "password" && attribute === "value";
    }
    function resolveJsValue({ path }) {
      let current = window;
      const pathParts = parseJsonPath(path);
      if (pathParts.length === 0) {
        display.error(`Invalid JSON path in the remote configuration: '${path}'`);
        metrics.increment("js", "failure");
        return;
      }
      for (const pathPart of pathParts) {
        if (!(pathPart in current)) {
          metrics.increment("js", "missing");
          return;
        }
        try {
          current = current[pathPart];
        } catch (e) {
          display.error(`Error accessing: '${path}'`, e);
          metrics.increment("js", "failure");
          return;
        }
      }
      metrics.increment("js", "success");
      return current;
    }
  }
  function initMetrics() {
    const metrics = { fetch: {} };
    return {
      get: () => metrics,
      increment: (metricName, type) => {
        if (!metrics[metricName]) {
          metrics[metricName] = {};
        }
        if (!metrics[metricName][type]) {
          metrics[metricName][type] = 0;
        }
        metrics[metricName][type] = metrics[metricName][type] + 1;
      }
    };
  }
  function isObject(property) {
    return typeof property === "object" && property !== null;
  }
  function isSerializedOption(value) {
    return "rcSerializedType" in value;
  }
  function resolveRegex(pattern) {
    try {
      return new RegExp(pattern);
    } catch (_a) {
      display.error(`Invalid regex in the remote configuration: '${pattern}'`);
    }
  }
  function extractValue(extractor, candidate) {
    const resolvedExtractor = resolveRegex(extractor.value);
    if (resolvedExtractor === void 0) {
      return;
    }
    const regexResult = resolvedExtractor.exec(candidate);
    if (regexResult === null) {
      return;
    }
    const [match, capture] = regexResult;
    return capture ? capture : match;
  }
  async function fetchRemoteConfiguration(configuration) {
    let response;
    try {
      response = await fetch(buildEndpoint(configuration));
    } catch (_a) {
      response = void 0;
    }
    if (!response || !response.ok) {
      return {
        ok: false,
        error: new Error("Error fetching the remote configuration.")
      };
    }
    const remoteConfiguration = await response.json();
    if (remoteConfiguration.rum) {
      return {
        ok: true,
        value: remoteConfiguration.rum
      };
    }
    return {
      ok: false,
      error: new Error("No remote configuration for RUM.")
    };
  }
  function buildEndpoint(configuration) {
    if (configuration.remoteConfigurationProxy) {
      return configuration.remoteConfigurationProxy;
    }
    return `https://sdk-configuration.${buildEndpointHost("rum", configuration)}/${REMOTE_CONFIGURATION_VERSION}/${encodeURIComponent(configuration.remoteConfigurationId)}.json`;
  }
  var REMOTE_CONFIGURATION_VERSION, SUPPORTED_FIELDS;
  var init_remoteConfiguration = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/configuration/remoteConfiguration.js"() {
      init_esm();
      init_jsonPathParser();
      REMOTE_CONFIGURATION_VERSION = "v1";
      SUPPORTED_FIELDS = [
        "applicationId",
        "service",
        "env",
        "version",
        "sessionSampleRate",
        "sessionReplaySampleRate",
        "defaultPrivacyLevel",
        "enablePrivacyForActionName",
        "traceSampleRate",
        "trackSessionAcrossSubdomains",
        "allowedTracingUrls",
        "allowedTrackingOrigins"
      ];
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/configuration/index.js
  var init_configuration4 = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/configuration/index.js"() {
      init_configuration3();
      init_remoteConfiguration();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/boot/preStartRum.js
  function createPreStartStrategy({ ignoreInitIfSyntheticsWillInjectRum = true, startDeflateWorker: startDeflateWorker2 }, trackingConsentState, customVitalsState, doStartRum) {
    const bufferApiCalls = createBoundedBuffer();
    const globalContext = buildGlobalContextManager();
    bufferContextCalls2(globalContext, CustomerContextKey.globalContext, bufferApiCalls);
    const userContext = buildUserContextManager();
    bufferContextCalls2(userContext, CustomerContextKey.userContext, bufferApiCalls);
    const accountContext = buildAccountContextManager();
    bufferContextCalls2(accountContext, CustomerContextKey.accountContext, bufferApiCalls);
    let firstStartViewCall;
    let deflateWorker;
    let cachedInitConfiguration;
    let cachedConfiguration;
    const trackingConsentStateSubscription = trackingConsentState.observable.subscribe(tryStartRum);
    const emptyContext = {};
    function tryStartRum() {
      if (!cachedInitConfiguration || !cachedConfiguration || !trackingConsentState.isGranted()) {
        return;
      }
      trackingConsentStateSubscription.unsubscribe();
      let initialViewOptions;
      if (cachedConfiguration.trackViewsManually) {
        if (!firstStartViewCall) {
          return;
        }
        bufferApiCalls.remove(firstStartViewCall.callback);
        initialViewOptions = firstStartViewCall.options;
      }
      const startRumResult = doStartRum(cachedConfiguration, deflateWorker, initialViewOptions);
      bufferApiCalls.drain(startRumResult);
    }
    function doInit(initConfiguration, errorStack) {
      const eventBridgeAvailable = canUseEventBridge();
      if (eventBridgeAvailable) {
        initConfiguration = overrideInitConfigurationForBridge(initConfiguration);
      }
      cachedInitConfiguration = initConfiguration;
      addTelemetryConfiguration(serializeRumConfiguration(initConfiguration));
      if (cachedConfiguration) {
        displayAlreadyInitializedError("OO_RUM", initConfiguration);
        return;
      }
      const configuration = validateAndBuildRumConfiguration(initConfiguration, errorStack);
      if (!configuration) {
        return;
      }
      if (!eventBridgeAvailable && !configuration.sessionStoreStrategyType) {
        display.warn("No storage available for session. We will not send any data.");
        return;
      }
      if (configuration.compressIntakeRequests && !eventBridgeAvailable && startDeflateWorker2) {
        deflateWorker = startDeflateWorker2(
          configuration,
          "Datadog RUM",
          // Worker initialization can fail asynchronously, especially in Firefox where even CSP
          // issues are reported asynchronously. For now, the SDK will continue its execution even if
          // data won't be sent to Datadog. We could improve this behavior in the future.
          noop
        );
        if (!deflateWorker) {
          return;
        }
      }
      cachedConfiguration = configuration;
      initFetchObservable().subscribe(noop);
      trackingConsentState.tryToInit(configuration.trackingConsent);
      tryStartRum();
    }
    const addDurationVital = (vital) => {
      bufferApiCalls.add((startRumResult) => startRumResult.addDurationVital(vital));
    };
    const addOperationStepVital = (name, stepType, options, failureReason) => {
      bufferApiCalls.add((startRumResult) => startRumResult.addOperationStepVital(sanitize(name), stepType, sanitize(options), sanitize(failureReason)));
    };
    const strategy = {
      init(initConfiguration, publicApi, errorStack) {
        if (!initConfiguration) {
          display.error("Missing configuration");
          return;
        }
        initFeatureFlags(initConfiguration.enableExperimentalFeatures);
        cachedInitConfiguration = initConfiguration;
        if (ignoreInitIfSyntheticsWillInjectRum && willSyntheticsInjectRum()) {
          return;
        }
        callPluginsMethod(initConfiguration.plugins, "onInit", { initConfiguration, publicApi });
        if (initConfiguration.remoteConfigurationId) {
          fetchAndApplyRemoteConfiguration(initConfiguration, { user: userContext, context: globalContext }).then((initConfiguration2) => {
            if (initConfiguration2) {
              doInit(initConfiguration2, errorStack);
            }
          }).catch(monitorError);
        } else {
          doInit(initConfiguration, errorStack);
        }
      },
      get initConfiguration() {
        return cachedInitConfiguration;
      },
      getInternalContext: noop,
      stopSession: noop,
      addTiming(name, time = timeStampNow()) {
        bufferApiCalls.add((startRumResult) => startRumResult.addTiming(name, time));
      },
      startView(options, startClocks = clocksNow()) {
        const callback = (startRumResult) => {
          startRumResult.startView(options, startClocks);
        };
        bufferApiCalls.add(callback);
        if (!firstStartViewCall) {
          firstStartViewCall = { options, callback };
          tryStartRum();
        }
      },
      setViewName(name) {
        bufferApiCalls.add((startRumResult) => startRumResult.setViewName(name));
      },
      // View context APIs
      setViewContext(context) {
        bufferApiCalls.add((startRumResult) => startRumResult.setViewContext(context));
      },
      setViewContextProperty(key, value) {
        bufferApiCalls.add((startRumResult) => startRumResult.setViewContextProperty(key, value));
      },
      getViewContext: () => emptyContext,
      globalContext,
      userContext,
      accountContext,
      addAction(action) {
        bufferApiCalls.add((startRumResult) => startRumResult.addAction(action));
      },
      addError(providedError) {
        bufferApiCalls.add((startRumResult) => startRumResult.addError(providedError));
      },
      addFeatureFlagEvaluation(key, value) {
        bufferApiCalls.add((startRumResult) => startRumResult.addFeatureFlagEvaluation(key, value));
      },
      startDurationVital(name, options) {
        return startDurationVital(customVitalsState, name, options);
      },
      stopDurationVital(name, options) {
        stopDurationVital(addDurationVital, customVitalsState, name, options);
      },
      addDurationVital,
      addOperationStepVital
    };
    return strategy;
  }
  function overrideInitConfigurationForBridge(initConfiguration) {
    var _a, _b;
    return {
      ...initConfiguration,
      applicationId: "00000000-aaaa-0000-aaaa-000000000000",
      clientToken: "empty",
      sessionSampleRate: 100,
      defaultPrivacyLevel: (_a = initConfiguration.defaultPrivacyLevel) !== null && _a !== void 0 ? _a : (_b = getEventBridge()) === null || _b === void 0 ? void 0 : _b.getPrivacyLevel()
    };
  }
  function bufferContextCalls2(preStartContextManager, name, bufferApiCalls) {
    preStartContextManager.changeObservable.subscribe(() => {
      const context = preStartContextManager.getContext();
      bufferApiCalls.add((startRumResult) => startRumResult[name].setContext(context));
    });
  }
  var init_preStartRum = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/boot/preStartRum.js"() {
      init_esm();
      init_configuration4();
      init_vitalCollection();
      init_plugins();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/boot/rumPublicApi.js
  function makeRumPublicApi(startRumImpl, recorderApi2, profilerApi2, options = {}) {
    const trackingConsentState = createTrackingConsentState();
    const customVitalsState = createCustomVitalsState();
    const bufferedDataObservable = startBufferingData().observable;
    let strategy = createPreStartStrategy(options, trackingConsentState, customVitalsState, (configuration, deflateWorker, initialViewOptions) => {
      const createEncoder = deflateWorker && options.createDeflateEncoder ? (streamId) => options.createDeflateEncoder(configuration, deflateWorker, streamId) : createIdentityEncoder;
      const startRumResult = startRumImpl(configuration, recorderApi2, profilerApi2, initialViewOptions, createEncoder, trackingConsentState, customVitalsState, bufferedDataObservable, options.sdkName);
      recorderApi2.onRumStart(startRumResult.lifeCycle, configuration, startRumResult.session, startRumResult.viewHistory, deflateWorker, startRumResult.telemetry);
      profilerApi2.onRumStart(startRumResult.lifeCycle, startRumResult.hooks, configuration, startRumResult.session, startRumResult.viewHistory, createEncoder);
      strategy = createPostStartStrategy(strategy, startRumResult);
      callPluginsMethod(configuration.plugins, "onRumStart", {
        strategy,
        // TODO: remove this in the next major release
        addEvent: startRumResult.addEvent
      });
      return startRumResult;
    });
    const getStrategy = () => strategy;
    const startView = monitor((options2) => {
      const sanitizedOptions = typeof options2 === "object" ? options2 : { name: options2 };
      strategy.startView(sanitizedOptions);
      addTelemetryUsage({ feature: "start-view" });
    });
    const rumPublicApi = makePublicApi({
      init: (initConfiguration) => {
        const errorStack = new Error().stack;
        callMonitored(() => strategy.init(initConfiguration, rumPublicApi, errorStack));
      },
      setTrackingConsent: monitor((trackingConsent) => {
        trackingConsentState.update(trackingConsent);
        addTelemetryUsage({ feature: "set-tracking-consent", tracking_consent: trackingConsent });
      }),
      setViewName: monitor((name) => {
        strategy.setViewName(name);
        addTelemetryUsage({ feature: "set-view-name" });
      }),
      setViewContext: monitor((context) => {
        strategy.setViewContext(context);
        addTelemetryUsage({ feature: "set-view-context" });
      }),
      setViewContextProperty: monitor((key, value) => {
        strategy.setViewContextProperty(key, value);
        addTelemetryUsage({ feature: "set-view-context-property" });
      }),
      getViewContext: monitor(() => {
        addTelemetryUsage({ feature: "set-view-context-property" });
        return strategy.getViewContext();
      }),
      getInternalContext: monitor((startTime) => strategy.getInternalContext(startTime)),
      getInitConfiguration: monitor(() => deepClone(strategy.initConfiguration)),
      addAction: (name, context) => {
        const handlingStack = createHandlingStack("action");
        callMonitored(() => {
          strategy.addAction({
            name: sanitize(name),
            context: sanitize(context),
            startClocks: clocksNow(),
            type: ActionType.CUSTOM,
            handlingStack
          });
          addTelemetryUsage({ feature: "add-action" });
        });
      },
      addError: (error, context) => {
        const handlingStack = createHandlingStack("error");
        callMonitored(() => {
          strategy.addError({
            error,
            // Do not sanitize error here, it is needed unserialized by computeRawError()
            handlingStack,
            context: sanitize(context),
            startClocks: clocksNow()
          });
          addTelemetryUsage({ feature: "add-error" });
        });
      },
      addTiming: monitor((name, time) => {
        strategy.addTiming(sanitize(name), time);
      }),
      setGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContext, "set-global-context"),
      getGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.getContext, "get-global-context"),
      setGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContextProperty, "set-global-context-property"),
      removeGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.removeContextProperty, "remove-global-context-property"),
      clearGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.clearContext, "clear-global-context"),
      setUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContext, "set-user"),
      getUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.getContext, "get-user"),
      setUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContextProperty, "set-user-property"),
      removeUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.removeContextProperty, "remove-user-property"),
      clearUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.clearContext, "clear-user"),
      setAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContext, "set-account"),
      getAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.getContext, "get-account"),
      setAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContextProperty, "set-account-property"),
      removeAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.removeContextProperty, "remove-account-property"),
      clearAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.clearContext, "clear-account"),
      startView,
      stopSession: monitor(() => {
        strategy.stopSession();
        addTelemetryUsage({ feature: "stop-session" });
      }),
      addFeatureFlagEvaluation: monitor((key, value) => {
        strategy.addFeatureFlagEvaluation(sanitize(key), sanitize(value));
        addTelemetryUsage({ feature: "add-feature-flag-evaluation" });
      }),
      getSessionReplayLink: monitor(() => recorderApi2.getSessionReplayLink()),
      startSessionReplayRecording: monitor((options2) => {
        recorderApi2.start(options2);
        addTelemetryUsage({ feature: "start-session-replay-recording", force: options2 && options2.force });
      }),
      stopSessionReplayRecording: monitor(() => recorderApi2.stop()),
      addDurationVital: monitor((name, options2) => {
        addTelemetryUsage({ feature: "add-duration-vital" });
        strategy.addDurationVital({
          name: sanitize(name),
          type: VitalType.DURATION,
          startClocks: timeStampToClocks(options2.startTime),
          duration: options2.duration,
          context: sanitize(options2 && options2.context),
          description: sanitize(options2 && options2.description)
        });
      }),
      startDurationVital: monitor((name, options2) => {
        addTelemetryUsage({ feature: "start-duration-vital" });
        return strategy.startDurationVital(sanitize(name), {
          context: sanitize(options2 && options2.context),
          description: sanitize(options2 && options2.description)
        });
      }),
      stopDurationVital: monitor((nameOrRef, options2) => {
        addTelemetryUsage({ feature: "stop-duration-vital" });
        strategy.stopDurationVital(typeof nameOrRef === "string" ? sanitize(nameOrRef) : nameOrRef, {
          context: sanitize(options2 && options2.context),
          description: sanitize(options2 && options2.description)
        });
      }),
      startFeatureOperation: monitor((name, options2) => {
        addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "start" });
        strategy.addOperationStepVital(name, "start", options2);
      }),
      succeedFeatureOperation: monitor((name, options2) => {
        addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "succeed" });
        strategy.addOperationStepVital(name, "end", options2);
      }),
      failFeatureOperation: monitor((name, failureReason, options2) => {
        addTelemetryUsage({ feature: "add-operation-step-vital", action_type: "fail" });
        strategy.addOperationStepVital(name, "end", options2, failureReason);
      })
    });
    return rumPublicApi;
  }
  function createPostStartStrategy(preStartStrategy, startRumResult) {
    return {
      init: (initConfiguration) => {
        displayAlreadyInitializedError("OO_RUM", initConfiguration);
      },
      initConfiguration: preStartStrategy.initConfiguration,
      ...startRumResult
    };
  }
  var init_rumPublicApi = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/boot/rumPublicApi.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_vitalCollection();
      init_plugins();
      init_preStartRum();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/domMutationObservable.js
  function createDOMMutationObservable() {
    const MutationObserver = getMutationObserverConstructor();
    return new Observable((observable) => {
      if (!MutationObserver) {
        return;
      }
      const observer2 = new MutationObserver(monitor((records) => observable.notify(records)));
      observer2.observe(document, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true
      });
      return () => observer2.disconnect();
    });
  }
  function getMutationObserverConstructor() {
    let constructor;
    const browserWindow = window;
    if (browserWindow.Zone) {
      constructor = getZoneJsOriginalValue(browserWindow, "MutationObserver");
      if (browserWindow.MutationObserver && constructor === browserWindow.MutationObserver) {
        const patchedInstance = new browserWindow.MutationObserver(noop);
        const originalInstance = getZoneJsOriginalValue(patchedInstance, "originalInstance");
        constructor = originalInstance && originalInstance.constructor;
      }
    }
    if (!constructor) {
      constructor = browserWindow.MutationObserver;
    }
    return constructor;
  }
  var init_domMutationObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/domMutationObservable.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/windowOpenObservable.js
  function createWindowOpenObservable() {
    const observable = new Observable();
    const { stop } = instrumentMethod(window, "open", () => observable.notify());
    return { observable, stop };
  }
  var init_windowOpenObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/windowOpenObservable.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/internalContext.js
  function startInternalContext(applicationId, sessionManager, viewHistory, actionContexts, urlContexts) {
    return {
      get: (startTime) => {
        const viewContext = viewHistory.findView(startTime);
        const urlContext = urlContexts.findUrl(startTime);
        const session = sessionManager.findTrackedSession(startTime);
        if (session && viewContext && urlContext) {
          const actionId = actionContexts.findActionId(startTime);
          return {
            application_id: applicationId,
            session_id: session.id,
            user_action: actionId ? { id: actionId } : void 0,
            view: { id: viewContext.id, name: viewContext.name, referrer: urlContext.referrer, url: urlContext.url }
          };
        }
      }
    };
  }
  var init_internalContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/internalContext.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/lifeCycle.js
  var LifeCycle;
  var init_lifeCycle = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/lifeCycle.js"() {
      init_esm();
      LifeCycle = AbstractLifeCycle;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/viewHistory.js
  function startViewHistory(lifeCycle) {
    const viewValueHistory = createValueHistory({ expireDelay: VIEW_CONTEXT_TIME_OUT_DELAY });
    lifeCycle.subscribe(1, (view) => {
      viewValueHistory.add(buildViewHistoryEntry(view), view.startClocks.relative);
    });
    lifeCycle.subscribe(6, ({ endClocks }) => {
      viewValueHistory.closeActive(endClocks.relative);
    });
    lifeCycle.subscribe(3, (viewUpdate) => {
      const currentView = viewValueHistory.find(viewUpdate.startClocks.relative);
      if (!currentView) {
        return;
      }
      if (viewUpdate.name) {
        currentView.name = viewUpdate.name;
      }
      if (viewUpdate.context) {
        currentView.context = viewUpdate.context;
      }
      currentView.sessionIsActive = viewUpdate.sessionIsActive;
    });
    lifeCycle.subscribe(10, () => {
      viewValueHistory.reset();
    });
    function buildViewHistoryEntry(view) {
      return {
        service: view.service,
        version: view.version,
        context: view.context,
        id: view.id,
        name: view.name,
        startClocks: view.startClocks
      };
    }
    return {
      findView: (startTime) => viewValueHistory.find(startTime),
      stop: () => {
        viewValueHistory.stop();
      }
    };
  }
  var VIEW_CONTEXT_TIME_OUT_DELAY;
  var init_viewHistory = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/viewHistory.js"() {
      init_esm();
      VIEW_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/resourceUtils.js
  function computeResourceEntryType(entry) {
    const url = entry.name;
    if (!isValidUrl(url)) {
      return ResourceType.OTHER;
    }
    const path = getPathName(url);
    for (const [type, isType] of RESOURCE_TYPES) {
      if (isType(entry.initiatorType, path)) {
        return type;
      }
    }
    return ResourceType.OTHER;
  }
  function areInOrder(...numbers) {
    for (let i = 1; i < numbers.length; i += 1) {
      if (numbers[i - 1] > numbers[i]) {
        return false;
      }
    }
    return true;
  }
  function isResourceEntryRequestType(entry) {
    return entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch";
  }
  function computeResourceEntryDuration(entry) {
    const { duration, startTime, responseEnd } = entry;
    if (duration === 0 && startTime < responseEnd) {
      return elapsed(startTime, responseEnd);
    }
    return duration;
  }
  function computeResourceEntryDetails(entry) {
    if (!hasValidResourceEntryTimings(entry)) {
      return void 0;
    }
    const { startTime, fetchStart, workerStart, redirectStart, redirectEnd, domainLookupStart, domainLookupEnd, connectStart, secureConnectionStart, connectEnd, requestStart, responseStart, responseEnd } = entry;
    const details = {
      download: formatTiming(startTime, responseStart, responseEnd),
      first_byte: formatTiming(startTime, requestStart, responseStart)
    };
    if (0 < workerStart && workerStart < fetchStart) {
      details.worker = formatTiming(startTime, workerStart, fetchStart);
    }
    if (fetchStart < connectEnd) {
      details.connect = formatTiming(startTime, connectStart, connectEnd);
      if (connectStart <= secureConnectionStart && secureConnectionStart <= connectEnd) {
        details.ssl = formatTiming(startTime, secureConnectionStart, connectEnd);
      }
    }
    if (fetchStart < domainLookupEnd) {
      details.dns = formatTiming(startTime, domainLookupStart, domainLookupEnd);
    }
    if (startTime < redirectEnd) {
      details.redirect = formatTiming(startTime, redirectStart, redirectEnd);
    }
    return details;
  }
  function hasValidResourceEntryDuration(entry) {
    return entry.duration >= 0;
  }
  function hasValidResourceEntryTimings(entry) {
    const areCommonTimingsInOrder = areInOrder(entry.startTime, entry.fetchStart, entry.domainLookupStart, entry.domainLookupEnd, entry.connectStart, entry.connectEnd, entry.requestStart, entry.responseStart, entry.responseEnd);
    const areRedirectionTimingsInOrder = hasRedirection(entry) ? areInOrder(entry.startTime, entry.redirectStart, entry.redirectEnd, entry.fetchStart) : true;
    return areCommonTimingsInOrder && areRedirectionTimingsInOrder;
  }
  function hasRedirection(entry) {
    return entry.redirectEnd > entry.startTime;
  }
  function formatTiming(origin, start, end) {
    if (origin <= start && start <= end) {
      return {
        duration: toServerDuration(elapsed(start, end)),
        start: toServerDuration(elapsed(origin, start))
      };
    }
  }
  function computeResourceEntryProtocol(entry) {
    return entry.nextHopProtocol === "" ? void 0 : entry.nextHopProtocol;
  }
  function computeResourceEntryDeliveryType(entry) {
    return entry.deliveryType === "" ? "other" : entry.deliveryType;
  }
  function computeResourceEntrySize(entry) {
    if (entry.startTime < entry.responseStart) {
      const { encodedBodySize, decodedBodySize, transferSize } = entry;
      return {
        size: decodedBodySize,
        encoded_body_size: encodedBodySize,
        decoded_body_size: decodedBodySize,
        transfer_size: transferSize
      };
    }
    return {
      size: void 0,
      encoded_body_size: void 0,
      decoded_body_size: void 0,
      transfer_size: void 0
    };
  }
  function isAllowedRequestUrl(url) {
    return url && (!isIntakeUrl(url) || isExperimentalFeatureEnabled(ExperimentalFeature.TRACK_INTAKE_REQUESTS));
  }
  function sanitizeIfLongDataUrl(url, lengthLimit = MAX_RESOURCE_VALUE_CHAR_LENGTH) {
    if (url.length <= lengthLimit || !url.startsWith("data:")) {
      return url;
    }
    const dataUrlMatchArray = url.substring(0, 100).match(DATA_URL_REGEX);
    if (!dataUrlMatchArray) {
      return url;
    }
    return `${dataUrlMatchArray[0]}[...]`;
  }
  var FAKE_INITIAL_DOCUMENT, RESOURCE_TYPES, DATA_URL_REGEX, MAX_RESOURCE_VALUE_CHAR_LENGTH;
  var init_resourceUtils2 = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/resourceUtils.js"() {
      init_esm();
      FAKE_INITIAL_DOCUMENT = "initial_document";
      RESOURCE_TYPES = [
        [ResourceType.DOCUMENT, (initiatorType) => FAKE_INITIAL_DOCUMENT === initiatorType],
        [ResourceType.XHR, (initiatorType) => "xmlhttprequest" === initiatorType],
        [ResourceType.FETCH, (initiatorType) => "fetch" === initiatorType],
        [ResourceType.BEACON, (initiatorType) => "beacon" === initiatorType],
        [ResourceType.CSS, (_, path) => /\.css$/i.test(path)],
        [ResourceType.JS, (_, path) => /\.js$/i.test(path)],
        [
          ResourceType.IMAGE,
          (initiatorType, path) => ["image", "img", "icon"].includes(initiatorType) || /\.(gif|jpg|jpeg|tiff|png|svg|ico)$/i.exec(path) !== null
        ],
        [ResourceType.FONT, (_, path) => /\.(woff|eot|woff2|ttf)$/i.exec(path) !== null],
        [
          ResourceType.MEDIA,
          (initiatorType, path) => ["audio", "video"].includes(initiatorType) || /\.(mp3|mp4)$/i.exec(path) !== null
        ]
      ];
      DATA_URL_REGEX = /data:(.+)?(;base64)?,/g;
      MAX_RESOURCE_VALUE_CHAR_LENGTH = 24e3;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/graphql.js
  function extractGraphQlMetadata(request, graphQlConfig) {
    const metadata = extractGraphQlRequestMetadata(request.requestBody, graphQlConfig.trackPayload);
    if (!metadata) {
      return;
    }
    if (graphQlConfig.trackResponseErrors && request.responseBody) {
      const responseErrors = parseGraphQlResponse(request.responseBody);
      if (responseErrors) {
        metadata.errors_count = responseErrors.length;
        metadata.errors = responseErrors;
      }
    }
    return metadata;
  }
  function parseGraphQlResponse(responseText) {
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (_a) {
      return;
    }
    if (!response || typeof response !== "object") {
      return;
    }
    const responseObj = response;
    if (!isNonEmptyArray(responseObj.errors)) {
      return;
    }
    const errors = responseObj.errors.map((error) => {
      var _a;
      const graphqlError = {
        message: error.message,
        path: error.path,
        locations: error.locations,
        code: (_a = error.extensions) === null || _a === void 0 ? void 0 : _a.code
      };
      return graphqlError;
    });
    return errors;
  }
  function findGraphQlConfiguration(url, configuration) {
    return configuration.allowedGraphQlUrls.find((graphQlOption) => matchList([graphQlOption.match], url));
  }
  function extractGraphQlRequestMetadata(requestBody, trackPayload = false) {
    if (!requestBody || typeof requestBody !== "string") {
      return;
    }
    let graphqlBody;
    try {
      graphqlBody = JSON.parse(requestBody);
    } catch (_a) {
      return;
    }
    if (!graphqlBody || !graphqlBody.query) {
      return;
    }
    const query = graphqlBody.query.trim();
    const operationType = getOperationType(query);
    const operationName = graphqlBody.operationName;
    if (!operationType) {
      return;
    }
    let variables;
    if (graphqlBody.variables) {
      variables = JSON.stringify(graphqlBody.variables);
    }
    return {
      operationType,
      operationName,
      variables,
      payload: trackPayload ? safeTruncate(query, GRAPHQL_PAYLOAD_LIMIT, "...") : void 0
    };
  }
  function getOperationType(query) {
    var _a;
    return (_a = query.match(/^\s*(query|mutation|subscription)\b/i)) === null || _a === void 0 ? void 0 : _a[1];
  }
  var GRAPHQL_PAYLOAD_LIMIT;
  var init_graphql = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/graphql.js"() {
      init_esm();
      GRAPHQL_PAYLOAD_LIMIT = 32 * ONE_KIBI_BYTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/requestCollection.js
  function startRequestCollection(lifeCycle, configuration, sessionManager, userContext, accountContext) {
    const tracer = startTracer(configuration, sessionManager, userContext, accountContext);
    trackXhr(lifeCycle, configuration, tracer);
    trackFetch(lifeCycle, configuration, tracer);
  }
  function trackXhr(lifeCycle, configuration, tracer) {
    const subscription = initXhrObservable(configuration).subscribe((rawContext) => {
      const context = rawContext;
      if (!isAllowedRequestUrl(context.url)) {
        return;
      }
      switch (context.state) {
        case "start":
          tracer.traceXhr(context, context.xhr);
          context.requestIndex = getNextRequestIndex();
          lifeCycle.notify(7, {
            requestIndex: context.requestIndex,
            url: context.url
          });
          break;
        case "complete":
          tracer.clearTracingIfNeeded(context);
          lifeCycle.notify(8, {
            duration: context.duration,
            method: context.method,
            requestIndex: context.requestIndex,
            spanId: context.spanId,
            startClocks: context.startClocks,
            status: context.status,
            traceId: context.traceId,
            traceSampled: context.traceSampled,
            type: RequestType.XHR,
            url: context.url,
            xhr: context.xhr,
            isAborted: context.isAborted,
            handlingStack: context.handlingStack,
            requestBody: context.requestBody,
            responseBody: context.responseBody
          });
          break;
      }
    });
    return { stop: () => subscription.unsubscribe() };
  }
  function trackFetch(lifeCycle, configuration, tracer) {
    const subscription = initFetchObservable({
      responseBodyAction: (context) => {
        var _a;
        if ((_a = findGraphQlConfiguration(context.url, configuration)) === null || _a === void 0 ? void 0 : _a.trackResponseErrors) {
          return 2;
        }
        return 1;
      }
    }).subscribe((rawContext) => {
      var _a;
      const context = rawContext;
      if (!isAllowedRequestUrl(context.url)) {
        return;
      }
      switch (context.state) {
        case "start":
          tracer.traceFetch(context);
          context.requestIndex = getNextRequestIndex();
          lifeCycle.notify(7, {
            requestIndex: context.requestIndex,
            url: context.url
          });
          break;
        case "resolve":
          tracer.clearTracingIfNeeded(context);
          lifeCycle.notify(8, {
            duration: elapsed(context.startClocks.timeStamp, timeStampNow()),
            method: context.method,
            requestIndex: context.requestIndex,
            responseType: context.responseType,
            spanId: context.spanId,
            startClocks: context.startClocks,
            status: context.status,
            traceId: context.traceId,
            traceSampled: context.traceSampled,
            type: RequestType.FETCH,
            url: context.url,
            response: context.response,
            init: context.init,
            input: context.input,
            isAborted: context.isAborted,
            handlingStack: context.handlingStack,
            requestBody: (_a = context.init) === null || _a === void 0 ? void 0 : _a.body,
            responseBody: context.responseBody
          });
          break;
      }
    });
    return { stop: () => subscription.unsubscribe() };
  }
  function getNextRequestIndex() {
    const result = nextRequestIndex;
    nextRequestIndex += 1;
    return result;
  }
  var nextRequestIndex;
  var init_requestCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/requestCollection.js"() {
      init_esm();
      init_resourceUtils2();
      init_tracer();
      init_graphql();
      nextRequestIndex = 1;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/discardNegativeDuration.js
  function discardNegativeDuration(duration) {
    return isNumber(duration) && duration < 0 ? void 0 : duration;
  }
  var init_discardNegativeDuration = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/discardNegativeDuration.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/trackEventCounts.js
  function trackEventCounts({ lifeCycle, isChildEvent, onChange: callback = noop }) {
    const eventCounts = {
      errorCount: 0,
      longTaskCount: 0,
      resourceCount: 0,
      actionCount: 0,
      frustrationCount: 0
    };
    const subscription = lifeCycle.subscribe(13, (event) => {
      var _a;
      if (event.type === "view" || event.type === "vital" || !isChildEvent(event)) {
        return;
      }
      switch (event.type) {
        case RumEventType.ERROR:
          eventCounts.errorCount += 1;
          callback();
          break;
        case RumEventType.ACTION:
          eventCounts.actionCount += 1;
          if (event.action.frustration) {
            eventCounts.frustrationCount += event.action.frustration.type.length;
          }
          callback();
          break;
        case RumEventType.LONG_TASK:
          eventCounts.longTaskCount += 1;
          callback();
          break;
        case RumEventType.RESOURCE:
          if (!((_a = event._oo) === null || _a === void 0 ? void 0 : _a.discarded)) {
            eventCounts.resourceCount += 1;
            callback();
          }
          break;
      }
    });
    return {
      stop: () => {
        subscription.unsubscribe();
      },
      eventCounts
    };
  }
  var init_trackEventCounts = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/trackEventCounts.js"() {
      init_esm();
      init_rawRumEvent_types();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/firstInputPolyfill.js
  function retrieveFirstInputTiming(configuration, callback) {
    const startTimeStamp = dateNow();
    let timingSent = false;
    const { stop: removeEventListeners } = addEventListeners(configuration, window, [
      "click",
      "mousedown",
      "keydown",
      "touchstart",
      "pointerdown"
      /* DOM_EVENT.POINTER_DOWN */
    ], (evt) => {
      if (!evt.cancelable) {
        return;
      }
      const timing = {
        entryType: "first-input",
        processingStart: relativeNow(),
        processingEnd: relativeNow(),
        startTime: evt.timeStamp,
        duration: 0,
        // arbitrary value to avoid nullable duration and simplify INP logic
        name: "",
        cancelable: false,
        target: null,
        toJSON: () => ({})
      };
      if (evt.type === "pointerdown") {
        sendTimingIfPointerIsNotCancelled(configuration, timing);
      } else {
        sendTiming(timing);
      }
    }, { passive: true, capture: true });
    return { stop: removeEventListeners };
    function sendTimingIfPointerIsNotCancelled(configuration2, timing) {
      addEventListeners(configuration2, window, [
        "pointerup",
        "pointercancel"
        /* DOM_EVENT.POINTER_CANCEL */
      ], (event) => {
        if (event.type === "pointerup") {
          sendTiming(timing);
        }
      }, { once: true });
    }
    function sendTiming(timing) {
      if (!timingSent) {
        timingSent = true;
        removeEventListeners();
        const delay = timing.processingStart - timing.startTime;
        if (delay >= 0 && delay < dateNow() - startTimeStamp) {
          callback(timing);
        }
      }
    }
  }
  var init_firstInputPolyfill = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/firstInputPolyfill.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/performanceObservable.js
  function createPerformanceObservable(configuration, options) {
    return new Observable((observable) => {
      if (!window.PerformanceObserver) {
        return;
      }
      const handlePerformanceEntries = (entries) => {
        const rumPerformanceEntries = filterRumPerformanceEntries(entries);
        if (rumPerformanceEntries.length > 0) {
          observable.notify(rumPerformanceEntries);
        }
      };
      let timeoutId;
      let isObserverInitializing = true;
      const observer2 = new PerformanceObserver(monitor((entries) => {
        if (isObserverInitializing) {
          timeoutId = setTimeout(() => handlePerformanceEntries(entries.getEntries()));
        } else {
          handlePerformanceEntries(entries.getEntries());
        }
      }));
      try {
        observer2.observe(options);
      } catch (_a) {
        const fallbackSupportedEntryTypes = [
          RumPerformanceEntryType.RESOURCE,
          RumPerformanceEntryType.NAVIGATION,
          RumPerformanceEntryType.LONG_TASK,
          RumPerformanceEntryType.PAINT
        ];
        if (fallbackSupportedEntryTypes.includes(options.type)) {
          if (options.buffered) {
            timeoutId = setTimeout(() => handlePerformanceEntries(performance.getEntriesByType(options.type)));
          }
          try {
            observer2.observe({ entryTypes: [options.type] });
          } catch (_b) {
            return;
          }
        }
      }
      isObserverInitializing = false;
      manageResourceTimingBufferFull(configuration);
      let stopFirstInputTiming;
      if (!supportPerformanceTimingEvent(RumPerformanceEntryType.FIRST_INPUT) && options.type === RumPerformanceEntryType.FIRST_INPUT) {
        ;
        ({ stop: stopFirstInputTiming } = retrieveFirstInputTiming(configuration, (timing) => {
          handlePerformanceEntries([timing]);
        }));
      }
      return () => {
        observer2.disconnect();
        if (stopFirstInputTiming) {
          stopFirstInputTiming();
        }
        clearTimeout(timeoutId);
      };
    });
  }
  function manageResourceTimingBufferFull(configuration) {
    if (!resourceTimingBufferFullListener && supportPerformanceObject() && "addEventListener" in performance) {
      resourceTimingBufferFullListener = addEventListener(configuration, performance, "resourcetimingbufferfull", () => {
        performance.clearResourceTimings();
      });
    }
    return () => {
      resourceTimingBufferFullListener === null || resourceTimingBufferFullListener === void 0 ? void 0 : resourceTimingBufferFullListener.stop();
    };
  }
  function supportPerformanceObject() {
    return window.performance !== void 0 && "getEntries" in performance;
  }
  function supportPerformanceTimingEvent(entryType) {
    return window.PerformanceObserver && PerformanceObserver.supportedEntryTypes !== void 0 && PerformanceObserver.supportedEntryTypes.includes(entryType);
  }
  function filterRumPerformanceEntries(entries) {
    return entries.filter((entry) => !isForbiddenResource(entry));
  }
  function isForbiddenResource(entry) {
    return entry.entryType === RumPerformanceEntryType.RESOURCE && (!isAllowedRequestUrl(entry.name) || !hasValidResourceEntryDuration(entry));
  }
  var RumPerformanceEntryType, resourceTimingBufferFullListener;
  var init_performanceObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/performanceObservable.js"() {
      init_esm();
      init_resourceUtils2();
      init_firstInputPolyfill();
      (function(RumPerformanceEntryType2) {
        RumPerformanceEntryType2["EVENT"] = "event";
        RumPerformanceEntryType2["FIRST_INPUT"] = "first-input";
        RumPerformanceEntryType2["LARGEST_CONTENTFUL_PAINT"] = "largest-contentful-paint";
        RumPerformanceEntryType2["LAYOUT_SHIFT"] = "layout-shift";
        RumPerformanceEntryType2["LONG_TASK"] = "longtask";
        RumPerformanceEntryType2["LONG_ANIMATION_FRAME"] = "long-animation-frame";
        RumPerformanceEntryType2["NAVIGATION"] = "navigation";
        RumPerformanceEntryType2["PAINT"] = "paint";
        RumPerformanceEntryType2["RESOURCE"] = "resource";
        RumPerformanceEntryType2["VISIBILITY_STATE"] = "visibility-state";
      })(RumPerformanceEntryType || (RumPerformanceEntryType = {}));
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/htmlDomUtils.js
  function isTextNode(node) {
    return node.nodeType === Node.TEXT_NODE;
  }
  function isCommentNode(node) {
    return node.nodeType === Node.COMMENT_NODE;
  }
  function isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  function isNodeShadowHost(node) {
    return isElementNode(node) && Boolean(node.shadowRoot);
  }
  function isNodeShadowRoot(node) {
    const shadowRoot = node;
    return !!shadowRoot.host && shadowRoot.nodeType === Node.DOCUMENT_FRAGMENT_NODE && isElementNode(shadowRoot.host);
  }
  function hasChildNodes(node) {
    return node.childNodes.length > 0 || isNodeShadowHost(node);
  }
  function forEachChildNodes(node, callback) {
    let child = node.firstChild;
    while (child) {
      callback(child);
      child = child.nextSibling;
    }
    if (isNodeShadowHost(node)) {
      callback(node.shadowRoot);
    }
  }
  function getParentNode(node) {
    return isNodeShadowRoot(node) ? node.host : node.parentNode;
  }
  var init_htmlDomUtils = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/htmlDomUtils.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/waitPageActivityEnd.js
  function waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageActivityEndCallback, maxDuration) {
    const pageActivityObservable = createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration);
    return doWaitPageActivityEnd(pageActivityObservable, pageActivityEndCallback, maxDuration);
  }
  function doWaitPageActivityEnd(pageActivityObservable, pageActivityEndCallback, maxDuration) {
    let pageActivityEndTimeoutId;
    let hasCompleted = false;
    const validationTimeoutId = setTimeout(monitor(() => complete({ hadActivity: false })), PAGE_ACTIVITY_VALIDATION_DELAY);
    const maxDurationTimeoutId = maxDuration !== void 0 ? setTimeout(monitor(() => complete({ hadActivity: true, end: timeStampNow() })), maxDuration) : void 0;
    const pageActivitySubscription = pageActivityObservable.subscribe(({ isBusy }) => {
      clearTimeout(validationTimeoutId);
      clearTimeout(pageActivityEndTimeoutId);
      const lastChangeTime = timeStampNow();
      if (!isBusy) {
        pageActivityEndTimeoutId = setTimeout(monitor(() => complete({ hadActivity: true, end: lastChangeTime })), PAGE_ACTIVITY_END_DELAY);
      }
    });
    const stop = () => {
      hasCompleted = true;
      clearTimeout(validationTimeoutId);
      clearTimeout(pageActivityEndTimeoutId);
      clearTimeout(maxDurationTimeoutId);
      pageActivitySubscription.unsubscribe();
    };
    function complete(event) {
      if (hasCompleted) {
        return;
      }
      stop();
      pageActivityEndCallback(event);
    }
    return { stop };
  }
  function createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
    return new Observable((observable) => {
      const subscriptions = [];
      let firstRequestIndex;
      let pendingRequestsCount = 0;
      subscriptions.push(domMutationObservable.subscribe((mutations) => {
        if (!mutations.every(isExcludedMutation)) {
          notifyPageActivity();
        }
      }), windowOpenObservable.subscribe(notifyPageActivity), createPerformanceObservable(configuration, { type: RumPerformanceEntryType.RESOURCE }).subscribe((entries) => {
        if (entries.some((entry) => !isExcludedUrl(configuration, entry.name))) {
          notifyPageActivity();
        }
      }), lifeCycle.subscribe(7, (startEvent) => {
        if (isExcludedUrl(configuration, startEvent.url)) {
          return;
        }
        if (firstRequestIndex === void 0) {
          firstRequestIndex = startEvent.requestIndex;
        }
        pendingRequestsCount += 1;
        notifyPageActivity();
      }), lifeCycle.subscribe(8, (request) => {
        if (isExcludedUrl(configuration, request.url) || firstRequestIndex === void 0 || // If the request started before the tracking start, ignore it
        request.requestIndex < firstRequestIndex) {
          return;
        }
        pendingRequestsCount -= 1;
        notifyPageActivity();
      }));
      return () => {
        subscriptions.forEach((s) => s.unsubscribe());
      };
      function notifyPageActivity() {
        observable.notify({ isBusy: pendingRequestsCount > 0 });
      }
    });
  }
  function isExcludedUrl(configuration, requestUrl) {
    return matchList(configuration.excludedActivityUrls, requestUrl);
  }
  function isExcludedMutation(mutation) {
    const targetElement = mutation.type === "characterData" ? mutation.target.parentElement : mutation.target;
    return Boolean(targetElement && isElementNode(targetElement) && targetElement.matches(`[${EXCLUDED_MUTATIONS_ATTRIBUTE}], [${EXCLUDED_MUTATIONS_ATTRIBUTE}] *`));
  }
  var PAGE_ACTIVITY_VALIDATION_DELAY, PAGE_ACTIVITY_END_DELAY, EXCLUDED_MUTATIONS_ATTRIBUTE;
  var init_waitPageActivityEnd = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/waitPageActivityEnd.js"() {
      init_esm();
      init_performanceObservable();
      init_htmlDomUtils();
      PAGE_ACTIVITY_VALIDATION_DELAY = 100;
      PAGE_ACTIVITY_END_DELAY = 100;
      EXCLUDED_MUTATIONS_ATTRIBUTE = "data-dd-excluded-activity-mutations";
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/actionNameConstants.js
  var DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE, ACTION_NAME_PLACEHOLDER;
  var init_actionNameConstants = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/actionNameConstants.js"() {
      DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE = "data-dd-action-name";
      ACTION_NAME_PLACEHOLDER = "Masked Element";
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/getSelectorFromElement.js
  function getSelectorFromElement(targetElement, actionNameAttribute) {
    if (!targetElement.isConnected) {
      return;
    }
    let targetElementSelector;
    let currentElement = targetElement;
    while (currentElement && currentElement.nodeName !== "HTML") {
      const globallyUniqueSelector = findSelector(currentElement, GLOBALLY_UNIQUE_SELECTOR_GETTERS, isSelectorUniqueGlobally, actionNameAttribute, targetElementSelector);
      if (globallyUniqueSelector) {
        return globallyUniqueSelector;
      }
      const uniqueSelectorAmongChildren = findSelector(currentElement, UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS, isSelectorUniqueAmongSiblings, actionNameAttribute, targetElementSelector);
      targetElementSelector = uniqueSelectorAmongChildren || combineSelector(getPositionSelector(currentElement), targetElementSelector);
      currentElement = currentElement.parentElement;
    }
    return targetElementSelector;
  }
  function isGeneratedValue(value) {
    return /[0-9]/.test(value);
  }
  function getIDSelector(element) {
    if (element.id && !isGeneratedValue(element.id)) {
      return `#${CSS.escape(element.id)}`;
    }
  }
  function getClassSelector(element) {
    if (element.tagName === "BODY") {
      return;
    }
    const classList = element.classList;
    for (let i = 0; i < classList.length; i += 1) {
      const className = classList[i];
      if (isGeneratedValue(className)) {
        continue;
      }
      return `${CSS.escape(element.tagName)}.${CSS.escape(className)}`;
    }
  }
  function getTagNameSelector(element) {
    return CSS.escape(element.tagName);
  }
  function getStableAttributeSelector(element, actionNameAttribute) {
    if (actionNameAttribute) {
      const selector = getAttributeSelector(actionNameAttribute);
      if (selector) {
        return selector;
      }
    }
    for (const attributeName of STABLE_ATTRIBUTES) {
      const selector = getAttributeSelector(attributeName);
      if (selector) {
        return selector;
      }
    }
    function getAttributeSelector(attributeName) {
      if (element.hasAttribute(attributeName)) {
        return `${CSS.escape(element.tagName)}[${attributeName}="${CSS.escape(element.getAttribute(attributeName))}"]`;
      }
    }
  }
  function getPositionSelector(element) {
    let sibling = element.parentElement.firstElementChild;
    let elementIndex = 1;
    while (sibling && sibling !== element) {
      if (sibling.tagName === element.tagName) {
        elementIndex += 1;
      }
      sibling = sibling.nextElementSibling;
    }
    return `${CSS.escape(element.tagName)}:nth-of-type(${elementIndex})`;
  }
  function findSelector(element, selectorGetters, predicate, actionNameAttribute, childSelector) {
    for (const selectorGetter of selectorGetters) {
      const elementSelector = selectorGetter(element, actionNameAttribute);
      if (!elementSelector) {
        continue;
      }
      if (predicate(element, elementSelector, childSelector)) {
        return combineSelector(elementSelector, childSelector);
      }
    }
  }
  function isSelectorUniqueGlobally(element, elementSelector, childSelector) {
    return element.ownerDocument.querySelectorAll(combineSelector(elementSelector, childSelector)).length === 1;
  }
  function isSelectorUniqueAmongSiblings(currentElement, currentElementSelector, childSelector) {
    let isSiblingMatching;
    if (childSelector === void 0) {
      isSiblingMatching = (sibling2) => sibling2.matches(currentElementSelector);
    } else {
      const scopedSelector = combineSelector(`${currentElementSelector}:scope`, childSelector);
      isSiblingMatching = (sibling2) => sibling2.querySelector(scopedSelector) !== null;
    }
    const parent = currentElement.parentElement;
    let sibling = parent.firstElementChild;
    while (sibling) {
      if (sibling !== currentElement && isSiblingMatching(sibling)) {
        return false;
      }
      sibling = sibling.nextElementSibling;
    }
    return true;
  }
  function combineSelector(parent, child) {
    return child ? `${parent}>${child}` : parent;
  }
  var STABLE_ATTRIBUTES, GLOBALLY_UNIQUE_SELECTOR_GETTERS, UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS;
  var init_getSelectorFromElement = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/getSelectorFromElement.js"() {
      init_actionNameConstants();
      STABLE_ATTRIBUTES = [
        DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE,
        // Common test attributes (list provided by google recorder)
        "data-testid",
        "data-test",
        "data-qa",
        "data-cy",
        "data-test-id",
        "data-qa-id",
        "data-testing",
        // FullStory decorator attributes:
        "data-component",
        "data-element",
        "data-source-file"
      ];
      GLOBALLY_UNIQUE_SELECTOR_GETTERS = [getStableAttributeSelector, getIDSelector];
      UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS = [
        getStableAttributeSelector,
        getClassSelector,
        getTagNameSelector
      ];
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/privacyConstants.js
  function getPrivacySelector(privacyLevel) {
    return `[${PRIVACY_ATTR_NAME}="${privacyLevel}"], .${PRIVACY_CLASS_PREFIX}${privacyLevel}`;
  }
  var NodePrivacyLevel, PRIVACY_ATTR_NAME, PRIVACY_ATTR_VALUE_HIDDEN, PRIVACY_CLASS_PREFIX, CENSORED_STRING_MARK, CENSORED_IMG_MARK, FORM_PRIVATE_TAG_NAMES, TEXT_MASKING_CHAR;
  var init_privacyConstants = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/privacyConstants.js"() {
      init_esm();
      NodePrivacyLevel = {
        IGNORE: "ignore",
        HIDDEN: "hidden",
        ALLOW: DefaultPrivacyLevel.ALLOW,
        MASK: DefaultPrivacyLevel.MASK,
        MASK_USER_INPUT: DefaultPrivacyLevel.MASK_USER_INPUT,
        MASK_UNLESS_ALLOWLISTED: DefaultPrivacyLevel.MASK_UNLESS_ALLOWLISTED
      };
      PRIVACY_ATTR_NAME = "data-oo-privacy";
      PRIVACY_ATTR_VALUE_HIDDEN = "hidden";
      PRIVACY_CLASS_PREFIX = "oo-privacy-";
      CENSORED_STRING_MARK = "***";
      CENSORED_IMG_MARK = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
      FORM_PRIVATE_TAG_NAMES = {
        INPUT: true,
        OUTPUT: true,
        TEXTAREA: true,
        SELECT: true,
        OPTION: true,
        DATALIST: true,
        OPTGROUP: true
      };
      TEXT_MASKING_CHAR = "x";
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/privacy.js
  function getNodePrivacyLevel(node, defaultPrivacyLevel, cache) {
    if (cache && cache.has(node)) {
      return cache.get(node);
    }
    const parentNode = getParentNode(node);
    const parentNodePrivacyLevel = parentNode ? getNodePrivacyLevel(parentNode, defaultPrivacyLevel, cache) : defaultPrivacyLevel;
    const selfNodePrivacyLevel = getNodeSelfPrivacyLevel(node);
    const nodePrivacyLevel = reducePrivacyLevel(selfNodePrivacyLevel, parentNodePrivacyLevel);
    if (cache) {
      cache.set(node, nodePrivacyLevel);
    }
    return nodePrivacyLevel;
  }
  function reducePrivacyLevel(childPrivacyLevel, parentNodePrivacyLevel) {
    switch (parentNodePrivacyLevel) {
      // These values cannot be overridden
      case NodePrivacyLevel.HIDDEN:
      case NodePrivacyLevel.IGNORE:
        return parentNodePrivacyLevel;
    }
    switch (childPrivacyLevel) {
      case NodePrivacyLevel.ALLOW:
      case NodePrivacyLevel.MASK:
      case NodePrivacyLevel.MASK_USER_INPUT:
      case NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED:
      case NodePrivacyLevel.HIDDEN:
      case NodePrivacyLevel.IGNORE:
        return childPrivacyLevel;
      default:
        return parentNodePrivacyLevel;
    }
  }
  function getNodeSelfPrivacyLevel(node) {
    if (!isElementNode(node)) {
      return;
    }
    if (node.tagName === "BASE") {
      return NodePrivacyLevel.ALLOW;
    }
    if (node.tagName === "INPUT") {
      const inputElement = node;
      if (inputElement.type === "password" || inputElement.type === "email" || inputElement.type === "tel") {
        return NodePrivacyLevel.MASK;
      }
      if (inputElement.type === "hidden") {
        return NodePrivacyLevel.MASK;
      }
      const autocomplete = inputElement.getAttribute("autocomplete");
      if (autocomplete && (autocomplete.startsWith("cc-") || autocomplete.endsWith("-password"))) {
        return NodePrivacyLevel.MASK;
      }
    }
    if (node.matches(getPrivacySelector(NodePrivacyLevel.HIDDEN))) {
      return NodePrivacyLevel.HIDDEN;
    }
    if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK))) {
      return NodePrivacyLevel.MASK;
    }
    if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED))) {
      return NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED;
    }
    if (node.matches(getPrivacySelector(NodePrivacyLevel.MASK_USER_INPUT))) {
      return NodePrivacyLevel.MASK_USER_INPUT;
    }
    if (node.matches(getPrivacySelector(NodePrivacyLevel.ALLOW))) {
      return NodePrivacyLevel.ALLOW;
    }
    if (shouldIgnoreElement(node)) {
      return NodePrivacyLevel.IGNORE;
    }
  }
  function shouldMaskNode(node, privacyLevel) {
    switch (privacyLevel) {
      case NodePrivacyLevel.MASK:
      case NodePrivacyLevel.HIDDEN:
      case NodePrivacyLevel.IGNORE:
        return true;
      case NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED:
        if (isTextNode(node)) {
          return isFormElement(node.parentNode) ? true : !isAllowlisted(node.textContent || "");
        }
        return isFormElement(node);
      case NodePrivacyLevel.MASK_USER_INPUT:
        return isTextNode(node) ? isFormElement(node.parentNode) : isFormElement(node);
      default:
        return false;
    }
  }
  function shouldMaskAttribute(tagName, attributeName, attributeValue, nodePrivacyLevel, configuration) {
    if (nodePrivacyLevel !== NodePrivacyLevel.MASK && nodePrivacyLevel !== NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED) {
      return false;
    }
    if (attributeName === PRIVACY_ATTR_NAME || STABLE_ATTRIBUTES.includes(attributeName) || attributeName === configuration.actionNameAttribute) {
      return false;
    }
    switch (attributeName) {
      case "title":
      case "alt":
      case "placeholder":
        return true;
    }
    if (tagName === "A" && attributeName === "href") {
      return true;
    }
    if (tagName === "IFRAME" && attributeName === "srcdoc") {
      return true;
    }
    if (attributeValue && attributeName.startsWith("data-")) {
      return true;
    }
    if ((tagName === "IMG" || tagName === "SOURCE") && (attributeName === "src" || attributeName === "srcset")) {
      return true;
    }
    return false;
  }
  function isFormElement(node) {
    if (!node || node.nodeType !== node.ELEMENT_NODE) {
      return false;
    }
    const element = node;
    if (element.tagName === "INPUT") {
      switch (element.type) {
        case "button":
        case "color":
        case "reset":
        case "submit":
          return false;
      }
    }
    return !!FORM_PRIVATE_TAG_NAMES[element.tagName];
  }
  function getTextContent(textNode, parentNodePrivacyLevel) {
    var _a;
    const parentTagName = (_a = textNode.parentElement) === null || _a === void 0 ? void 0 : _a.tagName;
    let textContent = textNode.textContent || "";
    const shouldIgnoreWhiteSpace = parentTagName === "HEAD";
    if (shouldIgnoreWhiteSpace && !textContent.trim()) {
      return;
    }
    const nodePrivacyLevel = parentNodePrivacyLevel;
    const isScript = parentTagName === "SCRIPT";
    if (isScript) {
      textContent = CENSORED_STRING_MARK;
    } else if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      textContent = CENSORED_STRING_MARK;
    } else if (shouldMaskNode(textNode, nodePrivacyLevel)) {
      if (
        // Scrambling the child list breaks text nodes for DATALIST/SELECT/OPTGROUP
        parentTagName === "DATALIST" || parentTagName === "SELECT" || parentTagName === "OPTGROUP"
      ) {
        if (!textContent.trim()) {
          return;
        }
      } else if (parentTagName === "OPTION") {
        textContent = CENSORED_STRING_MARK;
      } else if (nodePrivacyLevel === NodePrivacyLevel.MASK_UNLESS_ALLOWLISTED) {
        textContent = maskDisallowedTextContent(textContent);
      } else {
        textContent = censorText(textContent);
      }
    }
    return textContent;
  }
  function shouldIgnoreElement(element) {
    if (element.nodeName === "SCRIPT") {
      return true;
    }
    if (element.nodeName === "LINK") {
      const relAttribute = getLowerCaseAttribute("rel");
      return (
        // Link as script - Ignore only when rel=preload, modulepreload or prefetch
        /preload|prefetch/i.test(relAttribute) && getLowerCaseAttribute("as") === "script" || // Favicons
        relAttribute === "shortcut icon" || relAttribute === "icon"
      );
    }
    if (element.nodeName === "META") {
      const nameAttribute = getLowerCaseAttribute("name");
      const relAttribute = getLowerCaseAttribute("rel");
      const propertyAttribute = getLowerCaseAttribute("property");
      return (
        // Favicons
        /^msapplication-tile(image|color)$/.test(nameAttribute) || nameAttribute === "application-name" || relAttribute === "icon" || relAttribute === "apple-touch-icon" || relAttribute === "shortcut icon" || // Description
        nameAttribute === "keywords" || nameAttribute === "description" || // Social
        /^(og|twitter|fb):/.test(propertyAttribute) || /^(og|twitter):/.test(nameAttribute) || nameAttribute === "pinterest" || // Robots
        nameAttribute === "robots" || nameAttribute === "googlebot" || nameAttribute === "bingbot" || // Http headers. Ex: X-UA-Compatible, Content-Type, Content-Language, cache-control,
        // X-Translated-By
        element.hasAttribute("http-equiv") || // Authorship
        nameAttribute === "author" || nameAttribute === "generator" || nameAttribute === "framework" || nameAttribute === "publisher" || nameAttribute === "progid" || /^article:/.test(propertyAttribute) || /^product:/.test(propertyAttribute) || // Verification
        nameAttribute === "google-site-verification" || nameAttribute === "yandex-verification" || nameAttribute === "csrf-token" || nameAttribute === "p:domain_verify" || nameAttribute === "verify-v1" || nameAttribute === "verification" || nameAttribute === "shopify-checkout-api-token"
      );
    }
    function getLowerCaseAttribute(name) {
      return (element.getAttribute(name) || "").toLowerCase();
    }
    return false;
  }
  function isAllowlisted(text) {
    var _a;
    if (!text || !text.trim()) {
      return true;
    }
    return ((_a = window.$DD_ALLOW) === null || _a === void 0 ? void 0 : _a.has(text.toLocaleLowerCase())) || false;
  }
  function maskDisallowedTextContent(text, fixedMask) {
    if (isAllowlisted(text)) {
      return text;
    }
    return fixedMask || censorText(text);
  }
  var censorText;
  var init_privacy = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/privacy.js"() {
      init_htmlDomUtils();
      init_privacyConstants();
      init_getSelectorFromElement();
      censorText = (text) => text.replace(/\S/g, TEXT_MASKING_CHAR);
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/clickChain.js
  function createClickChain(firstClick, onFinalize) {
    const bufferedClicks = [];
    let status = 0;
    let maxDurationBetweenClicksTimeoutId;
    appendClick(firstClick);
    function appendClick(click) {
      click.stopObservable.subscribe(tryFinalize);
      bufferedClicks.push(click);
      clearTimeout(maxDurationBetweenClicksTimeoutId);
      maxDurationBetweenClicksTimeoutId = setTimeout(dontAcceptMoreClick, MAX_DURATION_BETWEEN_CLICKS);
    }
    function tryFinalize() {
      if (status === 1 && bufferedClicks.every((click) => click.isStopped())) {
        status = 2;
        onFinalize(bufferedClicks);
      }
    }
    function dontAcceptMoreClick() {
      clearTimeout(maxDurationBetweenClicksTimeoutId);
      if (status === 0) {
        status = 1;
        tryFinalize();
      }
    }
    return {
      tryAppend: (click) => {
        if (status !== 0) {
          return false;
        }
        if (bufferedClicks.length > 0 && !areEventsSimilar(bufferedClicks[bufferedClicks.length - 1].event, click.event)) {
          dontAcceptMoreClick();
          return false;
        }
        appendClick(click);
        return true;
      },
      stop: () => {
        dontAcceptMoreClick();
      }
    };
  }
  function areEventsSimilar(first, second) {
    return first.target === second.target && mouseEventDistance(first, second) <= MAX_DISTANCE_BETWEEN_CLICKS && first.timeStamp - second.timeStamp <= MAX_DURATION_BETWEEN_CLICKS;
  }
  function mouseEventDistance(origin, other) {
    return Math.sqrt(Math.pow(origin.clientX - other.clientX, 2) + Math.pow(origin.clientY - other.clientY, 2));
  }
  var MAX_DURATION_BETWEEN_CLICKS, MAX_DISTANCE_BETWEEN_CLICKS;
  var init_clickChain = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/clickChain.js"() {
      init_esm();
      MAX_DURATION_BETWEEN_CLICKS = ONE_SECOND;
      MAX_DISTANCE_BETWEEN_CLICKS = 100;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/getActionNameFromElement.js
  function getActionNameFromElement(element, rumConfiguration, nodePrivacyLevel = NodePrivacyLevel.ALLOW) {
    const nodePrivacyLevelCache = /* @__PURE__ */ new Map();
    const { actionNameAttribute: userProgrammaticAttribute } = rumConfiguration;
    const defaultActionName = getActionNameFromElementProgrammatically(element, DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE) || userProgrammaticAttribute && getActionNameFromElementProgrammatically(element, userProgrammaticAttribute);
    if (defaultActionName) {
      return {
        name: defaultActionName,
        nameSource: "custom_attribute"
        /* ActionNameSource.CUSTOM_ATTRIBUTE */
      };
    } else if (nodePrivacyLevel === NodePrivacyLevel.MASK) {
      return {
        name: ACTION_NAME_PLACEHOLDER,
        nameSource: "mask_placeholder"
        /* ActionNameSource.MASK_PLACEHOLDER */
      };
    }
    return getActionNameFromElementForStrategies(element, priorityStrategies, rumConfiguration, nodePrivacyLevelCache) || getActionNameFromElementForStrategies(element, fallbackStrategies, rumConfiguration, nodePrivacyLevelCache) || {
      name: "",
      nameSource: "blank"
    };
  }
  function getActionNameFromElementProgrammatically(targetElement, programmaticAttribute) {
    const elementWithAttribute = targetElement.closest(`[${programmaticAttribute}]`);
    if (!elementWithAttribute) {
      return;
    }
    const name = elementWithAttribute.getAttribute(programmaticAttribute);
    return truncate(normalizeWhitespace(name.trim()));
  }
  function getActionNameFromElementForStrategies(targetElement, strategies, rumConfiguration, nodePrivacyLevelCache) {
    let element = targetElement;
    let recursionCounter = 0;
    while (recursionCounter <= MAX_PARENTS_TO_CONSIDER && element && element.nodeName !== "BODY" && element.nodeName !== "HTML" && element.nodeName !== "HEAD") {
      for (const strategy of strategies) {
        const actionName = strategy(element, rumConfiguration, nodePrivacyLevelCache);
        if (actionName) {
          const { name, nameSource } = actionName;
          const trimmedName = name && name.trim();
          if (trimmedName) {
            return { name: truncate(normalizeWhitespace(trimmedName)), nameSource };
          }
        }
      }
      if (element.nodeName === "FORM") {
        break;
      }
      element = element.parentElement;
      recursionCounter += 1;
    }
  }
  function normalizeWhitespace(s) {
    return s.replace(/\s+/g, " ");
  }
  function truncate(s) {
    return s.length > 100 ? `${safeTruncate(s, 100)} [...]` : s;
  }
  function getElementById(refElement, id) {
    return refElement.ownerDocument ? refElement.ownerDocument.getElementById(id) : null;
  }
  function getActionNameFromStandardAttribute(element, attribute, rumConfiguration, nodePrivacyLevelCache) {
    const { enablePrivacyForActionName, defaultPrivacyLevel } = rumConfiguration;
    let attributeValue = element.getAttribute(attribute);
    if (attributeValue && enablePrivacyForActionName) {
      const nodePrivacyLevel = getNodePrivacyLevel(element, defaultPrivacyLevel, nodePrivacyLevelCache);
      if (shouldMaskAttribute(element.tagName, attribute, attributeValue, nodePrivacyLevel, rumConfiguration)) {
        attributeValue = maskDisallowedTextContent(attributeValue, ACTION_NAME_PLACEHOLDER);
      }
    } else if (!attributeValue) {
      attributeValue = "";
    }
    return {
      name: attributeValue,
      nameSource: "standard_attribute"
    };
  }
  function getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache) {
    return {
      name: getTextualContent(element, rumConfiguration, nodePrivacyLevelCache) || "",
      nameSource: "text_content"
    };
  }
  function getTextualContent(element, rumConfiguration, nodePrivacyLevelCache) {
    if (element.isContentEditable) {
      return;
    }
    const { enablePrivacyForActionName, actionNameAttribute: userProgrammaticAttribute, defaultPrivacyLevel } = rumConfiguration;
    if (isExperimentalFeatureEnabled(ExperimentalFeature.USE_TREE_WALKER_FOR_ACTION_NAME)) {
      return getTextualContentWithTreeWalker(element, userProgrammaticAttribute, enablePrivacyForActionName, defaultPrivacyLevel, nodePrivacyLevelCache);
    }
    if ("innerText" in element) {
      let text = element.innerText;
      const removeTextFromElements = (query) => {
        const list = element.querySelectorAll(query);
        for (let index = 0; index < list.length; index += 1) {
          const element2 = list[index];
          if ("innerText" in element2) {
            const textToReplace = element2.innerText;
            if (textToReplace && textToReplace.trim().length > 0) {
              text = text.replace(textToReplace, "");
            }
          }
        }
      };
      removeTextFromElements(`[${DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE}]`);
      if (userProgrammaticAttribute) {
        removeTextFromElements(`[${userProgrammaticAttribute}]`);
      }
      if (enablePrivacyForActionName) {
        removeTextFromElements(`${getPrivacySelector(NodePrivacyLevel.HIDDEN)}, ${getPrivacySelector(NodePrivacyLevel.MASK)}`);
      }
      return text;
    }
    return element.textContent;
  }
  function getTextualContentWithTreeWalker(element, userProgrammaticAttribute, privacyEnabledActionName, defaultPrivacyLevel, nodePrivacyLevelCache) {
    const walker = document.createTreeWalker(
      element,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      rejectInvisibleOrMaskedElementsFilter
    );
    let text = "";
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (isElementNode(node)) {
        if (
          // Following InnerText rendering spec https://html.spec.whatwg.org/multipage/dom.html#rendered-text-collection-steps
          node.nodeName === "BR" || node.nodeName === "P" || ["block", "flex", "grid", "list-item", "table", "table-caption"].includes(getComputedStyle(node).display)
        ) {
          text += " ";
        }
        continue;
      }
      text += node.textContent || "";
    }
    return text.replace(/\s+/g, " ").trim();
    function rejectInvisibleOrMaskedElementsFilter(node) {
      const nodeSelfPrivacyLevel = getNodePrivacyLevel(node, defaultPrivacyLevel, nodePrivacyLevelCache);
      if (privacyEnabledActionName && nodeSelfPrivacyLevel && shouldMaskNode(node, nodeSelfPrivacyLevel)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (isElementNode(node)) {
        if (node.hasAttribute(DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE) || userProgrammaticAttribute && node.hasAttribute(userProgrammaticAttribute)) {
          return NodeFilter.FILTER_REJECT;
        }
        const style = getComputedStyle(node);
        if (style.visibility !== "visible" || style.display === "none" || style.contentVisibility && style.contentVisibility !== "visible") {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  }
  var priorityStrategies, fallbackStrategies, MAX_PARENTS_TO_CONSIDER;
  var init_getActionNameFromElement = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/getActionNameFromElement.js"() {
      init_esm();
      init_privacyConstants();
      init_privacy();
      init_htmlDomUtils();
      init_actionNameConstants();
      priorityStrategies = [
        // associated LABEL text
        (element, rumConfiguration, nodePrivacyLevelCache) => {
          if ("labels" in element && element.labels && element.labels.length > 0) {
            return getActionNameFromTextualContent(element.labels[0], rumConfiguration, nodePrivacyLevelCache);
          }
        },
        // INPUT button (and associated) value
        (element) => {
          if (element.nodeName === "INPUT") {
            const input = element;
            const type = input.getAttribute("type");
            if (type === "button" || type === "submit" || type === "reset") {
              return {
                name: input.value,
                nameSource: "text_content"
                /* ActionNameSource.TEXT_CONTENT */
              };
            }
          }
        },
        // BUTTON, LABEL or button-like element text
        (element, rumConfiguration, nodePrivacyLevelCache) => {
          if (element.nodeName === "BUTTON" || element.nodeName === "LABEL" || element.getAttribute("role") === "button") {
            return getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache);
          }
        },
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "aria-label", rumConfiguration, nodePrivacyLevelCache),
        // associated element text designated by the aria-labelledby attribute
        (element, rumConfiguration, nodePrivacyLevelCache) => {
          const labelledByAttribute = element.getAttribute("aria-labelledby");
          if (labelledByAttribute) {
            return {
              name: labelledByAttribute.split(/\s+/).map((id) => getElementById(element, id)).filter((label) => Boolean(label)).map((element2) => getTextualContent(element2, rumConfiguration, nodePrivacyLevelCache)).join(" "),
              nameSource: "text_content"
            };
          }
        },
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "alt", rumConfiguration, nodePrivacyLevelCache),
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "name", rumConfiguration, nodePrivacyLevelCache),
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "title", rumConfiguration, nodePrivacyLevelCache),
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromStandardAttribute(element, "placeholder", rumConfiguration, nodePrivacyLevelCache),
        // SELECT first OPTION text
        (element, rumConfiguration, nodePrivacyLevelCache) => {
          if ("options" in element && element.options.length > 0) {
            return getActionNameFromTextualContent(element.options[0], rumConfiguration, nodePrivacyLevelCache);
          }
        }
      ];
      fallbackStrategies = [
        (element, rumConfiguration, nodePrivacyLevelCache) => getActionNameFromTextualContent(element, rumConfiguration, nodePrivacyLevelCache)
      ];
      MAX_PARENTS_TO_CONSIDER = 10;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/listenActionEvents.js
  function listenActionEvents(configuration, { onPointerDown, onPointerUp }) {
    let selectionEmptyAtPointerDown;
    let userActivity = {
      selection: false,
      input: false,
      scroll: false
    };
    let clickContext;
    const listeners = [
      addEventListener(configuration, window, "pointerdown", (event) => {
        if (isValidPointerEvent(event)) {
          selectionEmptyAtPointerDown = isSelectionEmpty();
          userActivity = {
            selection: false,
            input: false,
            scroll: false
          };
          clickContext = onPointerDown(event);
        }
      }, { capture: true }),
      addEventListener(configuration, window, "selectionchange", () => {
        if (!selectionEmptyAtPointerDown || !isSelectionEmpty()) {
          userActivity.selection = true;
        }
      }, { capture: true }),
      addEventListener(configuration, window, "scroll", () => {
        userActivity.scroll = true;
      }, { capture: true, passive: true }),
      addEventListener(configuration, window, "pointerup", (event) => {
        if (isValidPointerEvent(event) && clickContext) {
          const localUserActivity = userActivity;
          onPointerUp(clickContext, event, () => localUserActivity);
          clickContext = void 0;
        }
      }, { capture: true }),
      addEventListener(configuration, window, "input", () => {
        userActivity.input = true;
      }, { capture: true })
    ];
    return {
      stop: () => {
        listeners.forEach((listener) => listener.stop());
      }
    };
  }
  function isSelectionEmpty() {
    const selection = window.getSelection();
    return !selection || selection.isCollapsed;
  }
  function isValidPointerEvent(event) {
    return event.target instanceof Element && // Only consider 'primary' pointer events for now. Multi-touch support could be implemented in
    // the future.
    event.isPrimary !== false;
  }
  var init_listenActionEvents = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/listenActionEvents.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/computeFrustration.js
  function computeFrustration(clicks, rageClick) {
    if (isRage(clicks)) {
      rageClick.addFrustration(FrustrationType.RAGE_CLICK);
      if (clicks.some(isDead)) {
        rageClick.addFrustration(FrustrationType.DEAD_CLICK);
      }
      if (rageClick.hasError) {
        rageClick.addFrustration(FrustrationType.ERROR_CLICK);
      }
      return { isRage: true };
    }
    const hasSelectionChanged = clicks.some((click) => click.getUserActivity().selection);
    clicks.forEach((click) => {
      if (click.hasError) {
        click.addFrustration(FrustrationType.ERROR_CLICK);
      }
      if (isDead(click) && // Avoid considering clicks part of a double-click or triple-click selections as dead clicks
      !hasSelectionChanged) {
        click.addFrustration(FrustrationType.DEAD_CLICK);
      }
    });
    return { isRage: false };
  }
  function isRage(clicks) {
    if (clicks.some((click) => click.getUserActivity().selection || click.getUserActivity().scroll)) {
      return false;
    }
    for (let i = 0; i < clicks.length - (MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE - 1); i += 1) {
      if (clicks[i + MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE - 1].event.timeStamp - clicks[i].event.timeStamp <= ONE_SECOND) {
        return true;
      }
    }
    return false;
  }
  function isDead(click) {
    if (click.hasPageActivity || click.getUserActivity().input || click.getUserActivity().scroll) {
      return false;
    }
    let target = click.event.target;
    if (target.tagName === "LABEL" && target.hasAttribute("for")) {
      target = document.getElementById(target.getAttribute("for"));
    }
    return !target || !target.matches(DEAD_CLICK_EXCLUDE_SELECTOR);
  }
  var MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE, DEAD_CLICK_EXCLUDE_SELECTOR;
  var init_computeFrustration = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/computeFrustration.js"() {
      init_esm();
      init_rawRumEvent_types();
      MIN_CLICKS_PER_SECOND_TO_CONSIDER_RAGE = 3;
      DEAD_CLICK_EXCLUDE_SELECTOR = // inputs that don't trigger a meaningful event like "input" when clicked, including textual
      // inputs (using a negative selector is shorter here)
      'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]),textarea,select,[contenteditable],[contenteditable] *,canvas,a[href],a[href] *';
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/interactionSelectorCache.js
  function getInteractionSelector(relativeTimestamp) {
    const selector = interactionSelectorCache.get(relativeTimestamp);
    interactionSelectorCache.delete(relativeTimestamp);
    return selector;
  }
  function updateInteractionSelector(relativeTimestamp, selector) {
    interactionSelectorCache.set(relativeTimestamp, selector);
    interactionSelectorCache.forEach((_, relativeTimestamp2) => {
      if (elapsed(relativeTimestamp2, relativeNow()) > CLICK_ACTION_MAX_DURATION) {
        interactionSelectorCache.delete(relativeTimestamp2);
      }
    });
  }
  var CLICK_ACTION_MAX_DURATION, interactionSelectorCache;
  var init_interactionSelectorCache = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/interactionSelectorCache.js"() {
      init_esm();
      CLICK_ACTION_MAX_DURATION = 10 * ONE_SECOND;
      interactionSelectorCache = /* @__PURE__ */ new Map();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/trackClickActions.js
  function trackClickActions(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
    const history2 = createValueHistory({ expireDelay: ACTION_CONTEXT_TIME_OUT_DELAY });
    const stopObservable = new Observable();
    let currentClickChain;
    lifeCycle.subscribe(10, () => {
      history2.reset();
    });
    lifeCycle.subscribe(5, stopClickChain);
    lifeCycle.subscribe(11, (event) => {
      if (event.reason === PageExitReason.UNLOADING) {
        stopClickChain();
      }
    });
    const { stop: stopActionEventsListener } = listenActionEvents(configuration, {
      onPointerDown: (pointerDownEvent) => processPointerDown(configuration, lifeCycle, domMutationObservable, pointerDownEvent, windowOpenObservable),
      onPointerUp: ({ clickActionBase, hadActivityOnPointerDown }, startEvent, getUserActivity) => {
        startClickAction(configuration, lifeCycle, domMutationObservable, windowOpenObservable, history2, stopObservable, appendClickToClickChain, clickActionBase, startEvent, getUserActivity, hadActivityOnPointerDown);
      }
    });
    const actionContexts = {
      findActionId: (startTime) => history2.findAll(startTime)
    };
    return {
      stop: () => {
        stopClickChain();
        stopObservable.notify();
        stopActionEventsListener();
      },
      actionContexts
    };
    function appendClickToClickChain(click) {
      if (!currentClickChain || !currentClickChain.tryAppend(click)) {
        const rageClick = click.clone();
        currentClickChain = createClickChain(click, (clicks) => {
          finalizeClicks(clicks, rageClick);
        });
      }
    }
    function stopClickChain() {
      if (currentClickChain) {
        currentClickChain.stop();
      }
    }
  }
  function processPointerDown(configuration, lifeCycle, domMutationObservable, pointerDownEvent, windowOpenObservable) {
    let nodePrivacyLevel;
    if (configuration.enablePrivacyForActionName) {
      nodePrivacyLevel = getNodePrivacyLevel(pointerDownEvent.target, configuration.defaultPrivacyLevel);
    } else {
      nodePrivacyLevel = NodePrivacyLevel.ALLOW;
    }
    if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      return void 0;
    }
    const clickActionBase = computeClickActionBase(pointerDownEvent, nodePrivacyLevel, configuration);
    let hadActivityOnPointerDown = false;
    waitPageActivityEnd(
      lifeCycle,
      domMutationObservable,
      windowOpenObservable,
      configuration,
      (pageActivityEndEvent) => {
        hadActivityOnPointerDown = pageActivityEndEvent.hadActivity;
      },
      // We don't care about the activity duration, we just want to know whether an activity did happen
      // within the "validation delay" or not. Limit the duration so the callback is called sooner.
      PAGE_ACTIVITY_VALIDATION_DELAY
    );
    return { clickActionBase, hadActivityOnPointerDown: () => hadActivityOnPointerDown };
  }
  function startClickAction(configuration, lifeCycle, domMutationObservable, windowOpenObservable, history2, stopObservable, appendClickToClickChain, clickActionBase, startEvent, getUserActivity, hadActivityOnPointerDown) {
    var _a;
    const click = newClick(lifeCycle, history2, getUserActivity, clickActionBase, startEvent);
    appendClickToClickChain(click);
    const selector = (_a = clickActionBase === null || clickActionBase === void 0 ? void 0 : clickActionBase.target) === null || _a === void 0 ? void 0 : _a.selector;
    if (selector) {
      updateInteractionSelector(startEvent.timeStamp, selector);
    }
    const { stop: stopWaitPageActivityEnd } = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (pageActivityEndEvent) => {
      if (pageActivityEndEvent.hadActivity && pageActivityEndEvent.end < click.startClocks.timeStamp) {
        click.discard();
      } else {
        if (pageActivityEndEvent.hadActivity) {
          click.stop(pageActivityEndEvent.end);
        } else if (hadActivityOnPointerDown()) {
          click.stop(
            // using the click start as activity end, so the click will have some activity but its
            // duration will be 0 (as the activity started before the click start)
            click.startClocks.timeStamp
          );
        } else {
          click.stop();
        }
      }
    }, CLICK_ACTION_MAX_DURATION);
    const viewEndedSubscription = lifeCycle.subscribe(5, ({ endClocks }) => {
      click.stop(endClocks.timeStamp);
    });
    const stopSubscription = stopObservable.subscribe(() => {
      click.stop();
    });
    click.stopObservable.subscribe(() => {
      viewEndedSubscription.unsubscribe();
      stopWaitPageActivityEnd();
      stopSubscription.unsubscribe();
    });
  }
  function computeClickActionBase(event, nodePrivacyLevel, configuration) {
    const rect = event.target.getBoundingClientRect();
    const selector = getSelectorFromElement(event.target, configuration.actionNameAttribute);
    if (selector) {
      updateInteractionSelector(event.timeStamp, selector);
    }
    const { name, nameSource } = getActionNameFromElement(event.target, configuration, nodePrivacyLevel);
    return {
      type: ActionType.CLICK,
      target: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        selector
      },
      position: {
        // Use clientX and Y because for SVG element offsetX and Y are relatives to the <svg> element
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top)
      },
      name,
      nameSource
    };
  }
  function newClick(lifeCycle, history2, getUserActivity, clickActionBase, startEvent) {
    const id = generateUUID();
    const startClocks = clocksNow();
    const historyEntry = history2.add(id, startClocks.relative);
    const eventCountsSubscription = trackEventCounts({
      lifeCycle,
      isChildEvent: (event) => event.action !== void 0 && (Array.isArray(event.action.id) ? event.action.id.includes(id) : event.action.id === id)
    });
    let status = 0;
    let activityEndTime;
    const frustrationTypes = [];
    const stopObservable = new Observable();
    function stop(newActivityEndTime) {
      if (status !== 0) {
        return;
      }
      activityEndTime = newActivityEndTime;
      status = 1;
      if (activityEndTime) {
        historyEntry.close(getRelativeTime(activityEndTime));
      } else {
        historyEntry.remove();
      }
      eventCountsSubscription.stop();
      stopObservable.notify();
    }
    return {
      event: startEvent,
      stop,
      stopObservable,
      get hasError() {
        return eventCountsSubscription.eventCounts.errorCount > 0;
      },
      get hasPageActivity() {
        return activityEndTime !== void 0;
      },
      getUserActivity,
      addFrustration: (frustrationType) => {
        frustrationTypes.push(frustrationType);
      },
      startClocks,
      isStopped: () => status === 1 || status === 2,
      clone: () => newClick(lifeCycle, history2, getUserActivity, clickActionBase, startEvent),
      validate: (domEvents) => {
        stop();
        if (status !== 1) {
          return;
        }
        const { resourceCount, errorCount, longTaskCount } = eventCountsSubscription.eventCounts;
        const clickAction = {
          duration: activityEndTime && elapsed(startClocks.timeStamp, activityEndTime),
          startClocks,
          id,
          frustrationTypes,
          counts: {
            resourceCount,
            errorCount,
            longTaskCount
          },
          events: domEvents !== null && domEvents !== void 0 ? domEvents : [startEvent],
          event: startEvent,
          ...clickActionBase
        };
        lifeCycle.notify(0, clickAction);
        status = 2;
      },
      discard: () => {
        stop();
        status = 2;
      }
    };
  }
  function finalizeClicks(clicks, rageClick) {
    const { isRage: isRage2 } = computeFrustration(clicks, rageClick);
    if (isRage2) {
      clicks.forEach((click) => click.discard());
      rageClick.stop(timeStampNow());
      rageClick.validate(clicks.map((click) => click.event));
    } else {
      rageClick.discard();
      clicks.forEach((click) => click.validate());
    }
  }
  var ACTION_CONTEXT_TIME_OUT_DELAY;
  var init_trackClickActions = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/trackClickActions.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_trackEventCounts();
      init_waitPageActivityEnd();
      init_getSelectorFromElement();
      init_privacy();
      init_privacyConstants();
      init_clickChain();
      init_getActionNameFromElement();
      init_listenActionEvents();
      init_computeFrustration();
      init_interactionSelectorCache();
      ACTION_CONTEXT_TIME_OUT_DELAY = 5 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/action/actionCollection.js
  function startActionCollection(lifeCycle, hooks, domMutationObservable, windowOpenObservable, configuration) {
    const { unsubscribe: unsubscribeAutoAction } = lifeCycle.subscribe(0, (action) => {
      lifeCycle.notify(12, processAction(action));
    });
    hooks.register(0, ({ startTime, eventType }) => {
      if (eventType !== RumEventType.ERROR && eventType !== RumEventType.RESOURCE && eventType !== RumEventType.LONG_TASK) {
        return SKIPPED;
      }
      const actionId = actionContexts.findActionId(startTime);
      if (!actionId) {
        return SKIPPED;
      }
      return {
        type: eventType,
        action: { id: actionId }
      };
    });
    hooks.register(1, ({ startTime }) => ({
      action: { id: actionContexts.findActionId(startTime) }
    }));
    let actionContexts = { findActionId: noop };
    let stop = noop;
    if (configuration.trackUserInteractions) {
      ;
      ({ actionContexts, stop } = trackClickActions(lifeCycle, domMutationObservable, windowOpenObservable, configuration));
    }
    return {
      addAction: (action) => {
        lifeCycle.notify(12, processAction(action));
      },
      actionContexts,
      stop: () => {
        unsubscribeAutoAction();
        stop();
      }
    };
  }
  function processAction(action) {
    const autoActionProperties = isAutoAction(action) ? {
      action: {
        id: action.id,
        loading_time: discardNegativeDuration(toServerDuration(action.duration)),
        frustration: {
          type: action.frustrationTypes
        },
        error: {
          count: action.counts.errorCount
        },
        long_task: {
          count: action.counts.longTaskCount
        },
        resource: {
          count: action.counts.resourceCount
        }
      },
      _oo: {
        action: {
          target: action.target,
          position: action.position,
          name_source: action.nameSource
        }
      }
    } : {
      context: action.context
    };
    const actionEvent = combine({
      action: { id: generateUUID(), target: { name: action.name }, type: action.type },
      date: action.startClocks.timeStamp,
      type: RumEventType.ACTION
    }, autoActionProperties);
    const duration = isAutoAction(action) ? action.duration : void 0;
    const domainContext = isAutoAction(action) ? { events: action.events } : { handlingStack: action.handlingStack };
    return {
      rawRumEvent: actionEvent,
      duration,
      startTime: action.startClocks.relative,
      domainContext
    };
  }
  function isAutoAction(action) {
    return action.type !== ActionType.CUSTOM;
  }
  var init_actionCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/action/actionCollection.js"() {
      init_esm();
      init_discardNegativeDuration();
      init_rawRumEvent_types();
      init_trackClickActions();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/error/trackConsoleError.js
  function trackConsoleError(errorObservable) {
    const subscription = initConsoleObservable([ConsoleApiName.error]).subscribe((consoleLog) => errorObservable.notify(consoleLog.error));
    return {
      stop: () => {
        subscription.unsubscribe();
      }
    };
  }
  var init_trackConsoleError = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/error/trackConsoleError.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/error/trackReportError.js
  function trackReportError(configuration, errorObservable) {
    const subscription = initReportObservable(configuration, [
      RawReportType.cspViolation,
      RawReportType.intervention
    ]).subscribe((rawError) => errorObservable.notify(rawError));
    return {
      stop: () => {
        subscription.unsubscribe();
      }
    };
  }
  var init_trackReportError = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/error/trackReportError.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/error/errorCollection.js
  function startErrorCollection(lifeCycle, configuration, bufferedDataObservable) {
    const errorObservable = new Observable();
    bufferedDataObservable.subscribe((bufferedData) => {
      if (bufferedData.type === 0) {
        errorObservable.notify(bufferedData.error);
      }
    });
    trackConsoleError(errorObservable);
    trackReportError(configuration, errorObservable);
    errorObservable.subscribe((error) => lifeCycle.notify(14, { error }));
    return doStartErrorCollection(lifeCycle);
  }
  function doStartErrorCollection(lifeCycle) {
    lifeCycle.subscribe(14, ({ error }) => {
      lifeCycle.notify(12, processError(error));
    });
    return {
      addError: ({ error, handlingStack, componentStack, startClocks, context }) => {
        const rawError = computeRawError({
          originalError: error,
          handlingStack,
          componentStack,
          startClocks,
          nonErrorPrefix: "Provided",
          source: ErrorSource.CUSTOM,
          handling: "handled"
        });
        rawError.context = combine(rawError.context, context);
        lifeCycle.notify(14, { error: rawError });
      }
    };
  }
  function processError(error) {
    const rawRumEvent = {
      date: error.startClocks.timeStamp,
      error: {
        id: generateUUID(),
        message: error.message,
        source: error.source,
        stack: error.stack,
        handling_stack: error.handlingStack,
        component_stack: error.componentStack,
        type: error.type,
        handling: error.handling,
        causes: error.causes,
        source_type: "browser",
        fingerprint: error.fingerprint,
        csp: error.csp
      },
      type: RumEventType.ERROR,
      context: error.context
    };
    const domainContext = {
      error: error.originalError,
      handlingStack: error.handlingStack
    };
    return {
      rawRumEvent,
      startTime: error.startClocks.relative,
      domainContext
    };
  }
  var init_errorCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/error/errorCollection.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_trackConsoleError();
      init_trackReportError();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/matchRequestResourceEntry.js
  function matchRequestResourceEntry(request) {
    if (!performance || !("getEntriesByName" in performance)) {
      return;
    }
    const sameNameEntries = performance.getEntriesByName(request.url, "resource");
    if (!sameNameEntries.length || !("toJSON" in sameNameEntries[0])) {
      return;
    }
    const candidates = sameNameEntries.filter((entry) => !alreadyMatchedEntries.has(entry)).filter((entry) => hasValidResourceEntryDuration(entry) && hasValidResourceEntryTimings(entry)).filter((entry) => isBetween(entry, request.startClocks.relative, endTime({ startTime: request.startClocks.relative, duration: request.duration })));
    if (candidates.length === 1) {
      alreadyMatchedEntries.add(candidates[0]);
      return candidates[0].toJSON();
    }
    return;
  }
  function endTime(timing) {
    return addDuration(timing.startTime, timing.duration);
  }
  function isBetween(timing, start, end) {
    const errorMargin = 1;
    return timing.startTime >= start - errorMargin && endTime(timing) <= addDuration(end, errorMargin);
  }
  var alreadyMatchedEntries;
  var init_matchRequestResourceEntry = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/matchRequestResourceEntry.js"() {
      init_esm();
      init_resourceUtils2();
      alreadyMatchedEntries = /* @__PURE__ */ new WeakSet();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/tracing/getDocumentTraceId.js
  function getDocumentTraceId(document2) {
    const data = getDocumentTraceDataFromMeta(document2) || getDocumentTraceDataFromComment(document2);
    if (!data || data.traceTime <= dateNow() - INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD) {
      return void 0;
    }
    return data.traceId;
  }
  function getDocumentTraceDataFromMeta(document2) {
    const traceIdMeta = document2.querySelector("meta[name=oo-trace-id]");
    const traceTimeMeta = document2.querySelector("meta[name=oo-trace-time]");
    return createDocumentTraceData(traceIdMeta && traceIdMeta.content, traceTimeMeta && traceTimeMeta.content);
  }
  function getDocumentTraceDataFromComment(document2) {
    const comment = findTraceComment(document2);
    if (!comment) {
      return void 0;
    }
    return createDocumentTraceData(findCommaSeparatedValue(comment, "trace-id"), findCommaSeparatedValue(comment, "trace-time"));
  }
  function createDocumentTraceData(traceId, rawTraceTime) {
    const traceTime = rawTraceTime && Number(rawTraceTime);
    if (!traceId || !traceTime) {
      return void 0;
    }
    return {
      traceId,
      traceTime
    };
  }
  function findTraceComment(document2) {
    for (let i = 0; i < document2.childNodes.length; i += 1) {
      const comment = getTraceCommentFromNode(document2.childNodes[i]);
      if (comment) {
        return comment;
      }
    }
    if (document2.body) {
      for (let i = document2.body.childNodes.length - 1; i >= 0; i -= 1) {
        const node = document2.body.childNodes[i];
        const comment = getTraceCommentFromNode(node);
        if (comment) {
          return comment;
        }
        if (!isTextNode(node)) {
          break;
        }
      }
    }
  }
  function getTraceCommentFromNode(node) {
    if (node && isCommentNode(node)) {
      const match = /^\s*OPENOBSERVE;(.*?)\s*$/.exec(node.data);
      if (match) {
        return match[1];
      }
    }
  }
  var INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD;
  var init_getDocumentTraceId = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/tracing/getDocumentTraceId.js"() {
      init_esm();
      init_htmlDomUtils();
      INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD = 2 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/performanceUtils.js
  function getNavigationEntry() {
    if (supportPerformanceTimingEvent(RumPerformanceEntryType.NAVIGATION)) {
      const navigationEntry = performance.getEntriesByType(RumPerformanceEntryType.NAVIGATION)[0];
      if (navigationEntry) {
        return navigationEntry;
      }
    }
    const timings = computeTimingsFromDeprecatedPerformanceTiming();
    const entry = {
      entryType: RumPerformanceEntryType.NAVIGATION,
      initiatorType: "navigation",
      name: window.location.href,
      startTime: 0,
      duration: timings.loadEventEnd,
      decodedBodySize: 0,
      encodedBodySize: 0,
      transferSize: 0,
      workerStart: 0,
      toJSON: () => ({ ...entry, toJSON: void 0 }),
      ...timings
    };
    return entry;
  }
  function computeTimingsFromDeprecatedPerformanceTiming() {
    const result = {};
    const timing = performance.timing;
    for (const key in timing) {
      if (isNumber(timing[key])) {
        const numberKey = key;
        const timingElement = timing[numberKey];
        result[numberKey] = timingElement === 0 ? 0 : getRelativeTime(timingElement);
      }
    }
    return result;
  }
  var init_performanceUtils = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/performanceUtils.js"() {
      init_esm();
      init_performanceObservable();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/retrieveInitialDocumentResourceTiming.js
  function retrieveInitialDocumentResourceTiming(configuration, callback, getNavigationEntryImpl = getNavigationEntry) {
    runOnReadyState(configuration, "interactive", () => {
      const navigationEntry = getNavigationEntryImpl();
      const entry = Object.assign(navigationEntry.toJSON(), {
        entryType: RumPerformanceEntryType.RESOURCE,
        initiatorType: FAKE_INITIAL_DOCUMENT,
        // The ResourceTiming duration entry should be `responseEnd - startTime`. With
        // NavigationTiming entries, `startTime` is always 0, so set it to `responseEnd`.
        duration: navigationEntry.responseEnd,
        traceId: getDocumentTraceId(document),
        toJSON: () => ({ ...entry, toJSON: void 0 })
      });
      callback(entry);
    });
  }
  var init_retrieveInitialDocumentResourceTiming = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/retrieveInitialDocumentResourceTiming.js"() {
      init_esm();
      init_performanceObservable();
      init_getDocumentTraceId();
      init_performanceUtils();
      init_resourceUtils2();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/requestRegistry.js
  function createRequestRegistry(lifeCycle) {
    const requests = /* @__PURE__ */ new Set();
    const subscription = lifeCycle.subscribe(8, (request) => {
      requests.add(request);
      if (requests.size > MAX_REQUESTS) {
        addTelemetryDebug("Too many requests");
        requests.delete(requests.values().next().value);
      }
    });
    return {
      getMatchingRequest(entry) {
        let minTimeDifference = Infinity;
        let closestRequest;
        for (const request of requests) {
          const timeDifference = entry.startTime - request.startClocks.relative;
          if (0 <= timeDifference && timeDifference < minTimeDifference && request.url === entry.name) {
            minTimeDifference = Math.abs(timeDifference);
            closestRequest = request;
          }
        }
        if (closestRequest) {
          requests.delete(closestRequest);
        }
        return closestRequest;
      },
      stop() {
        subscription.unsubscribe();
      }
    };
  }
  var MAX_REQUESTS;
  var init_requestRegistry = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/requestRegistry.js"() {
      init_esm();
      MAX_REQUESTS = 1e3;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/resource/resourceCollection.js
  function startResourceCollection(lifeCycle, configuration, pageStateHistory, taskQueue = createTaskQueue(), retrieveInitialDocumentResourceTimingImpl = retrieveInitialDocumentResourceTiming) {
    let requestRegistry;
    const isEarlyRequestCollectionEnabled = configuration.trackEarlyRequests;
    if (isEarlyRequestCollectionEnabled) {
      requestRegistry = createRequestRegistry(lifeCycle);
    } else {
      lifeCycle.subscribe(8, (request) => {
        handleResource(() => processRequest(request, configuration, pageStateHistory));
      });
    }
    const performanceResourceSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.RESOURCE,
      buffered: true
    }).subscribe((entries) => {
      for (const entry of entries) {
        if (isEarlyRequestCollectionEnabled || !isResourceEntryRequestType(entry)) {
          handleResource(() => processResourceEntry(entry, configuration, pageStateHistory, requestRegistry));
        }
      }
    });
    retrieveInitialDocumentResourceTimingImpl(configuration, (timing) => {
      handleResource(() => processResourceEntry(timing, configuration, pageStateHistory, requestRegistry));
    });
    function handleResource(computeRawEvent) {
      taskQueue.push(() => {
        const rawEvent = computeRawEvent();
        if (rawEvent) {
          lifeCycle.notify(12, rawEvent);
        }
      });
    }
    return {
      stop: () => {
        taskQueue.stop();
        performanceResourceSubscription.unsubscribe();
      }
    };
  }
  function processRequest(request, configuration, pageStateHistory) {
    const matchingTiming = matchRequestResourceEntry(request);
    return assembleResource(matchingTiming, request, pageStateHistory, configuration);
  }
  function processResourceEntry(entry, configuration, pageStateHistory, requestRegistry) {
    const matchingRequest = isResourceEntryRequestType(entry) && requestRegistry ? requestRegistry.getMatchingRequest(entry) : void 0;
    return assembleResource(entry, matchingRequest, pageStateHistory, configuration);
  }
  function assembleResource(entry, request, pageStateHistory, configuration) {
    if (!entry && !request) {
      return;
    }
    const tracingInfo = request ? computeRequestTracingInfo(request, configuration) : computeResourceEntryTracingInfo(entry, configuration);
    if (!configuration.trackResources && !tracingInfo) {
      return;
    }
    const startClocks = entry ? relativeToClocks(entry.startTime) : request.startClocks;
    const duration = entry ? computeResourceEntryDuration(entry) : computeRequestDuration(pageStateHistory, startClocks, request.duration);
    const graphql = request && computeGraphQlMetaData(request, configuration);
    const resourceEvent = combine({
      date: startClocks.timeStamp,
      resource: {
        id: generateUUID(),
        duration: toServerDuration(duration),
        // TODO: in the future when `entry` is required, we can probably only rely on `computeResourceEntryType`
        type: request ? request.type === RequestType.XHR ? ResourceType.XHR : ResourceType.FETCH : computeResourceEntryType(entry),
        method: request ? request.method : void 0,
        status_code: request ? request.status : discardZeroStatus(entry.responseStatus),
        url: request ? sanitizeIfLongDataUrl(request.url) : entry.name,
        protocol: entry && computeResourceEntryProtocol(entry),
        delivery_type: entry && computeResourceEntryDeliveryType(entry),
        graphql
      },
      type: RumEventType.RESOURCE,
      _oo: {
        discarded: !configuration.trackResources
      }
    }, tracingInfo, entry && computeResourceEntryMetrics(entry));
    return {
      startTime: startClocks.relative,
      duration,
      rawRumEvent: resourceEvent,
      domainContext: getResourceDomainContext(entry, request)
    };
  }
  function computeGraphQlMetaData(request, configuration) {
    const graphQlConfig = findGraphQlConfiguration(request.url, configuration);
    if (!graphQlConfig) {
      return;
    }
    return extractGraphQlMetadata(request, graphQlConfig);
  }
  function getResourceDomainContext(entry, request) {
    if (request) {
      const baseDomainContext = {
        performanceEntry: entry,
        isAborted: request.isAborted,
        handlingStack: request.handlingStack
      };
      if (request.type === RequestType.XHR) {
        return {
          xhr: request.xhr,
          ...baseDomainContext
        };
      }
      return {
        requestInput: request.input,
        requestInit: request.init,
        response: request.response,
        error: request.error,
        ...baseDomainContext
      };
    }
    return {
      // Currently, at least one of `entry` or `request` must be defined when calling this function.
      // So `entry` is guaranteed to be defined here. In the future, when `entry` is required, we can
      // remove the `!` assertion.
      performanceEntry: entry
    };
  }
  function computeResourceEntryMetrics(entry) {
    const { renderBlockingStatus } = entry;
    return {
      resource: {
        render_blocking_status: renderBlockingStatus,
        ...computeResourceEntrySize(entry),
        ...computeResourceEntryDetails(entry)
      }
    };
  }
  function computeRequestTracingInfo(request, configuration) {
    const hasBeenTraced = request.traceSampled && request.traceId && request.spanId;
    if (!hasBeenTraced) {
      return void 0;
    }
    return {
      _oo: {
        span_id: request.spanId.toString(),
        trace_id: request.traceId.toString(),
        rule_psr: configuration.rulePsr
      }
    };
  }
  function computeResourceEntryTracingInfo(entry, configuration) {
    const hasBeenTraced = entry.traceId;
    if (!hasBeenTraced) {
      return void 0;
    }
    return {
      _oo: {
        trace_id: entry.traceId,
        span_id: createSpanIdentifier().toString(),
        rule_psr: configuration.rulePsr
      }
    };
  }
  function computeRequestDuration(pageStateHistory, startClocks, duration) {
    return !pageStateHistory.wasInPageStateDuringPeriod("frozen", startClocks.relative, duration) ? duration : void 0;
  }
  function discardZeroStatus(statusCode) {
    return statusCode === 0 ? void 0 : statusCode;
  }
  var init_resourceCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/resource/resourceCollection.js"() {
      init_esm();
      init_performanceObservable();
      init_rawRumEvent_types();
      init_identifier();
      init_matchRequestResourceEntry();
      init_resourceUtils2();
      init_retrieveInitialDocumentResourceTiming();
      init_requestRegistry();
      init_graphql();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/trackViewEventCounts.js
  function trackViewEventCounts(lifeCycle, viewId, onChange) {
    const { stop, eventCounts } = trackEventCounts({
      lifeCycle,
      isChildEvent: (event) => event.view.id === viewId,
      onChange
    });
    return {
      stop,
      eventCounts
    };
  }
  var init_trackViewEventCounts = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/trackViewEventCounts.js"() {
      init_trackEventCounts();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstContentfulPaint.js
  function trackFirstContentfulPaint(configuration, firstHidden, callback) {
    const performanceSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.PAINT,
      buffered: true
    }).subscribe((entries) => {
      const fcpEntry = entries.find((entry) => entry.name === "first-contentful-paint" && entry.startTime < firstHidden.timeStamp && entry.startTime < FCP_MAXIMUM_DELAY);
      if (fcpEntry) {
        callback(fcpEntry.startTime);
      }
    });
    return {
      stop: performanceSubscription.unsubscribe
    };
  }
  function trackRestoredFirstContentfulPaint(viewStartRelative, callback) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        callback(elapsed(viewStartRelative, relativeNow()));
      });
    });
  }
  var FCP_MAXIMUM_DELAY;
  var init_trackFirstContentfulPaint = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstContentfulPaint.js"() {
      init_esm();
      init_performanceObservable();
      FCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstInput.js
  function trackFirstInput(configuration, firstHidden, callback) {
    const performanceFirstInputSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.FIRST_INPUT,
      buffered: true
    }).subscribe((entries) => {
      const firstInputEntry = entries.find((entry) => entry.startTime < firstHidden.timeStamp);
      if (firstInputEntry) {
        const firstInputDelay = elapsed(firstInputEntry.startTime, firstInputEntry.processingStart);
        let firstInputTargetSelector;
        if (firstInputEntry.target && isElementNode(firstInputEntry.target)) {
          firstInputTargetSelector = getSelectorFromElement(firstInputEntry.target, configuration.actionNameAttribute);
        }
        callback({
          // Ensure firstInputDelay to be positive, see
          // https://bugs.chromium.org/p/chromium/issues/detail?id=1185815
          delay: firstInputDelay >= 0 ? firstInputDelay : 0,
          time: firstInputEntry.startTime,
          targetSelector: firstInputTargetSelector
        });
      }
    });
    return {
      stop: () => {
        performanceFirstInputSubscription.unsubscribe();
      }
    };
  }
  var init_trackFirstInput = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstInput.js"() {
      init_esm();
      init_htmlDomUtils();
      init_performanceObservable();
      init_getSelectorFromElement();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackNavigationTimings.js
  function trackNavigationTimings(configuration, callback, getNavigationEntryImpl = getNavigationEntry) {
    return waitAfterLoadEvent(configuration, () => {
      const entry = getNavigationEntryImpl();
      if (!isIncompleteNavigation(entry)) {
        callback(processNavigationEntry(entry));
      }
    });
  }
  function processNavigationEntry(entry) {
    return {
      domComplete: entry.domComplete,
      domContentLoaded: entry.domContentLoadedEventEnd,
      domInteractive: entry.domInteractive,
      loadEvent: entry.loadEventEnd,
      // In some cases the value reported is negative or is larger
      // than the current page time. Ignore these cases:
      // https://github.com/GoogleChrome/web-vitals/issues/137
      // https://github.com/GoogleChrome/web-vitals/issues/162
      firstByte: entry.responseStart >= 0 && entry.responseStart <= relativeNow() ? entry.responseStart : void 0
    };
  }
  function isIncompleteNavigation(entry) {
    return entry.loadEventEnd <= 0;
  }
  function waitAfterLoadEvent(configuration, callback) {
    let timeoutId;
    const { stop: stopOnReadyState } = runOnReadyState(configuration, "complete", () => {
      timeoutId = setTimeout(() => callback());
    });
    return {
      stop: () => {
        stopOnReadyState();
        clearTimeout(timeoutId);
      }
    };
  }
  var init_trackNavigationTimings = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackNavigationTimings.js"() {
      init_esm();
      init_performanceUtils();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackLargestContentfulPaint.js
  function trackLargestContentfulPaint(configuration, firstHidden, eventTarget, callback) {
    let firstInteractionTimestamp = Infinity;
    const { stop: stopEventListener } = addEventListeners(configuration, eventTarget, [
      "pointerdown",
      "keydown"
      /* DOM_EVENT.KEY_DOWN */
    ], (event) => {
      firstInteractionTimestamp = event.timeStamp;
    }, { capture: true, once: true });
    let biggestLcpSize = 0;
    const performanceLcpSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT,
      buffered: true
    }).subscribe((entries) => {
      const lcpEntry = findLast(entries, (entry) => entry.entryType === RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT && entry.startTime < firstInteractionTimestamp && entry.startTime < firstHidden.timeStamp && entry.startTime < LCP_MAXIMUM_DELAY && // Ensure to get the LCP entry with the biggest size, see
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1516655
      entry.size > biggestLcpSize);
      if (lcpEntry) {
        let lcpTargetSelector;
        if (lcpEntry.element) {
          lcpTargetSelector = getSelectorFromElement(lcpEntry.element, configuration.actionNameAttribute);
        }
        callback({
          value: lcpEntry.startTime,
          targetSelector: lcpTargetSelector,
          resourceUrl: computeLcpEntryUrl(lcpEntry)
        });
        biggestLcpSize = lcpEntry.size;
      }
    });
    return {
      stop: () => {
        stopEventListener();
        performanceLcpSubscription.unsubscribe();
      }
    };
  }
  function computeLcpEntryUrl(entry) {
    return entry.url === "" ? void 0 : entry.url;
  }
  var LCP_MAXIMUM_DELAY;
  var init_trackLargestContentfulPaint = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackLargestContentfulPaint.js"() {
      init_esm();
      init_performanceObservable();
      init_getSelectorFromElement();
      LCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstHidden.js
  function trackFirstHidden(configuration, viewStart, eventTarget = window) {
    if (document.visibilityState === "hidden") {
      return { timeStamp: 0, stop: noop };
    }
    if (supportPerformanceTimingEvent(RumPerformanceEntryType.VISIBILITY_STATE)) {
      const firstHiddenEntry = performance.getEntriesByType(RumPerformanceEntryType.VISIBILITY_STATE).filter((entry) => entry.name === "hidden").find((entry) => entry.startTime >= viewStart.relative);
      if (firstHiddenEntry) {
        return { timeStamp: firstHiddenEntry.startTime, stop: noop };
      }
    }
    let timeStamp = Infinity;
    const { stop } = addEventListeners(configuration, eventTarget, [
      "pagehide",
      "visibilitychange"
      /* DOM_EVENT.VISIBILITY_CHANGE */
    ], (event) => {
      if (event.type === "pagehide" || document.visibilityState === "hidden") {
        timeStamp = event.timeStamp;
        stop();
      }
    }, { capture: true });
    return {
      get timeStamp() {
        return timeStamp;
      },
      stop
    };
  }
  var init_trackFirstHidden = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackFirstHidden.js"() {
      init_esm();
      init_performanceObservable();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackInitialViewMetrics.js
  function trackInitialViewMetrics(configuration, viewStart, setLoadEvent, scheduleViewUpdate) {
    const initialViewMetrics = {};
    const { stop: stopNavigationTracking } = trackNavigationTimings(configuration, (navigationTimings) => {
      setLoadEvent(navigationTimings.loadEvent);
      initialViewMetrics.navigationTimings = navigationTimings;
      scheduleViewUpdate();
    });
    const firstHidden = trackFirstHidden(configuration, viewStart);
    const { stop: stopFCPTracking } = trackFirstContentfulPaint(configuration, firstHidden, (firstContentfulPaint) => {
      initialViewMetrics.firstContentfulPaint = firstContentfulPaint;
      scheduleViewUpdate();
    });
    const { stop: stopLCPTracking } = trackLargestContentfulPaint(configuration, firstHidden, window, (largestContentfulPaint) => {
      initialViewMetrics.largestContentfulPaint = largestContentfulPaint;
      scheduleViewUpdate();
    });
    const { stop: stopFIDTracking } = trackFirstInput(configuration, firstHidden, (firstInput) => {
      initialViewMetrics.firstInput = firstInput;
      scheduleViewUpdate();
    });
    function stop() {
      stopNavigationTracking();
      stopFCPTracking();
      stopLCPTracking();
      stopFIDTracking();
      firstHidden.stop();
    }
    return {
      stop,
      initialViewMetrics
    };
  }
  var init_trackInitialViewMetrics = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackInitialViewMetrics.js"() {
      init_trackFirstContentfulPaint();
      init_trackFirstInput();
      init_trackNavigationTimings();
      init_trackLargestContentfulPaint();
      init_trackFirstHidden();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/getClsAttributionImpactedArea.js
  var calculateArea, calculateIntersectionArea, getClsAttributionImpactedArea;
  var init_getClsAttributionImpactedArea = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/getClsAttributionImpactedArea.js"() {
      calculateArea = (width, height) => width * height;
      calculateIntersectionArea = (rect1, rect2) => {
        const left = Math.max(rect1.left, rect2.left);
        const top = Math.max(rect1.top, rect2.top);
        const right = Math.min(rect1.right, rect2.right);
        const bottom = Math.min(rect1.bottom, rect2.bottom);
        if (left >= right || top >= bottom) {
          return 0;
        }
        return calculateArea(right - left, bottom - top);
      };
      getClsAttributionImpactedArea = (source) => {
        const previousArea = calculateArea(source.previousRect.width, source.previousRect.height);
        const currentArea = calculateArea(source.currentRect.width, source.currentRect.height);
        const intersectionArea = calculateIntersectionArea(source.previousRect, source.currentRect);
        return previousArea + currentArea - intersectionArea;
      };
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackCumulativeLayoutShift.js
  function trackCumulativeLayoutShift(configuration, viewStart, callback) {
    if (!isLayoutShiftSupported()) {
      return {
        stop: noop
      };
    }
    let maxClsValue = 0;
    let biggestShift;
    callback({
      value: 0
    });
    const slidingWindow = slidingSessionWindow();
    const performanceSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.LAYOUT_SHIFT,
      buffered: true
    }).subscribe((entries) => {
      var _a;
      for (const entry of entries) {
        if (entry.hadRecentInput || entry.startTime < viewStart) {
          continue;
        }
        const { cumulatedValue, isMaxValue } = slidingWindow.update(entry);
        if (isMaxValue) {
          const attribution = getTopImpactedElement(entry.sources);
          biggestShift = {
            target: (attribution === null || attribution === void 0 ? void 0 : attribution.node) ? new WeakRef(attribution.node) : void 0,
            time: elapsed(viewStart, entry.startTime),
            previousRect: attribution === null || attribution === void 0 ? void 0 : attribution.previousRect,
            currentRect: attribution === null || attribution === void 0 ? void 0 : attribution.currentRect,
            devicePixelRatio: window.devicePixelRatio
          };
        }
        if (cumulatedValue > maxClsValue) {
          maxClsValue = cumulatedValue;
          const target = (_a = biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.target) === null || _a === void 0 ? void 0 : _a.deref();
          callback({
            value: round(maxClsValue, 4),
            targetSelector: target && getSelectorFromElement(target, configuration.actionNameAttribute),
            time: biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.time,
            previousRect: (biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.previousRect) ? asRumRect(biggestShift.previousRect) : void 0,
            currentRect: (biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.currentRect) ? asRumRect(biggestShift.currentRect) : void 0,
            devicePixelRatio: biggestShift === null || biggestShift === void 0 ? void 0 : biggestShift.devicePixelRatio
          });
        }
      }
    });
    return {
      stop: () => {
        performanceSubscription.unsubscribe();
      }
    };
  }
  function getTopImpactedElement(sources) {
    let topImpactedSource;
    for (const source of sources) {
      if (source.node && isElementNode(source.node)) {
        const currentImpactedArea = getClsAttributionImpactedArea(source);
        if (!topImpactedSource || getClsAttributionImpactedArea(topImpactedSource) < currentImpactedArea) {
          topImpactedSource = source;
        }
      }
    }
    return topImpactedSource;
  }
  function asRumRect({ x, y, width, height }) {
    return { x, y, width, height };
  }
  function slidingSessionWindow() {
    let cumulatedValue = 0;
    let startTime;
    let endTime2;
    let maxValue = 0;
    return {
      update: (entry) => {
        const shouldCreateNewWindow = startTime === void 0 || entry.startTime - endTime2 >= MAX_UPDATE_GAP || entry.startTime - startTime >= MAX_WINDOW_DURATION;
        let isMaxValue;
        if (shouldCreateNewWindow) {
          startTime = endTime2 = entry.startTime;
          maxValue = cumulatedValue = entry.value;
          isMaxValue = true;
        } else {
          cumulatedValue += entry.value;
          endTime2 = entry.startTime;
          isMaxValue = entry.value > maxValue;
          if (isMaxValue) {
            maxValue = entry.value;
          }
        }
        return {
          cumulatedValue,
          isMaxValue
        };
      }
    };
  }
  function isLayoutShiftSupported() {
    return supportPerformanceTimingEvent(RumPerformanceEntryType.LAYOUT_SHIFT) && "WeakRef" in window;
  }
  var MAX_WINDOW_DURATION, MAX_UPDATE_GAP;
  var init_trackCumulativeLayoutShift = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackCumulativeLayoutShift.js"() {
      init_esm();
      init_htmlDomUtils();
      init_performanceObservable();
      init_getSelectorFromElement();
      init_getClsAttributionImpactedArea();
      MAX_WINDOW_DURATION = 5 * ONE_SECOND;
      MAX_UPDATE_GAP = ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/interactionCountPolyfill.js
  function initInteractionCountPolyfill() {
    if ("interactionCount" in performance || observer) {
      return;
    }
    observer = new window.PerformanceObserver(monitor((entries) => {
      entries.getEntries().forEach((e) => {
        const entry = e;
        if (entry.interactionId) {
          minKnownInteractionId = Math.min(minKnownInteractionId, entry.interactionId);
          maxKnownInteractionId = Math.max(maxKnownInteractionId, entry.interactionId);
          interactionCountEstimate = (maxKnownInteractionId - minKnownInteractionId) / 7 + 1;
        }
      });
    }));
    observer.observe({ type: "event", buffered: true, durationThreshold: 0 });
  }
  var observer, interactionCountEstimate, minKnownInteractionId, maxKnownInteractionId, getInteractionCount;
  var init_interactionCountPolyfill = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/interactionCountPolyfill.js"() {
      init_esm();
      interactionCountEstimate = 0;
      minKnownInteractionId = Infinity;
      maxKnownInteractionId = 0;
      getInteractionCount = () => observer ? interactionCountEstimate : window.performance.interactionCount || 0;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackInteractionToNextPaint.js
  function trackInteractionToNextPaint(configuration, viewStart, viewLoadingType) {
    if (!isInteractionToNextPaintSupported()) {
      return {
        getInteractionToNextPaint: () => void 0,
        setViewEnd: noop,
        stop: noop
      };
    }
    const { getViewInteractionCount, stopViewInteractionCount } = trackViewInteractionCount(viewLoadingType);
    let viewEnd = Infinity;
    const longestInteractions = trackLongestInteractions(getViewInteractionCount);
    let interactionToNextPaint = -1;
    let interactionToNextPaintTargetSelector;
    let interactionToNextPaintStartTime;
    function handleEntries(entries) {
      for (const entry of entries) {
        if (entry.interactionId && // Check the entry start time is inside the view bounds because some view interactions can be reported after the view end (if long duration).
        entry.startTime >= viewStart && entry.startTime <= viewEnd) {
          longestInteractions.process(entry);
        }
      }
      const newInteraction = longestInteractions.estimateP98Interaction();
      if (newInteraction && newInteraction.duration !== interactionToNextPaint) {
        interactionToNextPaint = newInteraction.duration;
        interactionToNextPaintStartTime = elapsed(viewStart, newInteraction.startTime);
        interactionToNextPaintTargetSelector = getInteractionSelector(newInteraction.startTime);
        if (!interactionToNextPaintTargetSelector && newInteraction.target && isElementNode(newInteraction.target)) {
          interactionToNextPaintTargetSelector = getSelectorFromElement(newInteraction.target, configuration.actionNameAttribute);
        }
      }
    }
    const firstInputSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.FIRST_INPUT,
      buffered: true
    }).subscribe(handleEntries);
    const eventSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.EVENT,
      // durationThreshold only impact PerformanceEventTiming entries used for INP computation which requires a threshold at 40 (default is 104ms)
      // cf: https://github.com/GoogleChrome/web-vitals/blob/3806160ffbc93c3c4abf210a167b81228172b31c/src/onINP.ts#L202-L210
      durationThreshold: 40,
      buffered: true
    }).subscribe(handleEntries);
    return {
      getInteractionToNextPaint: () => {
        if (interactionToNextPaint >= 0) {
          return {
            value: Math.min(interactionToNextPaint, MAX_INP_VALUE),
            targetSelector: interactionToNextPaintTargetSelector,
            time: interactionToNextPaintStartTime
          };
        } else if (getViewInteractionCount()) {
          return {
            value: 0
          };
        }
      },
      setViewEnd: (viewEndTime) => {
        viewEnd = viewEndTime;
        stopViewInteractionCount();
      },
      stop: () => {
        eventSubscription.unsubscribe();
        firstInputSubscription.unsubscribe();
      }
    };
  }
  function trackLongestInteractions(getViewInteractionCount) {
    const longestInteractions = [];
    function sortAndTrimLongestInteractions() {
      longestInteractions.sort((a, b) => b.duration - a.duration).splice(MAX_INTERACTION_ENTRIES);
    }
    return {
      /**
       * Process the performance entry:
       * - if its duration is long enough, add the performance entry to the list of worst interactions
       * - if an entry with the same interaction id exists and its duration is lower than the new one, then replace it in the list of worst interactions
       */
      process(entry) {
        const interactionIndex = longestInteractions.findIndex((interaction) => entry.interactionId === interaction.interactionId);
        const minLongestInteraction = longestInteractions[longestInteractions.length - 1];
        if (interactionIndex !== -1) {
          if (entry.duration > longestInteractions[interactionIndex].duration) {
            longestInteractions[interactionIndex] = entry;
            sortAndTrimLongestInteractions();
          }
        } else if (longestInteractions.length < MAX_INTERACTION_ENTRIES || entry.duration > minLongestInteraction.duration) {
          longestInteractions.push(entry);
          sortAndTrimLongestInteractions();
        }
      },
      /**
       * Compute the p98 longest interaction.
       * For better performance the computation is based on 10 longest interactions and the interaction count of the current view.
       */
      estimateP98Interaction() {
        const interactionIndex = Math.min(longestInteractions.length - 1, Math.floor(getViewInteractionCount() / 50));
        return longestInteractions[interactionIndex];
      }
    };
  }
  function trackViewInteractionCount(viewLoadingType) {
    initInteractionCountPolyfill();
    const previousInteractionCount = viewLoadingType === ViewLoadingType.INITIAL_LOAD ? 0 : getInteractionCount();
    let state2 = { stopped: false };
    function computeViewInteractionCount() {
      return getInteractionCount() - previousInteractionCount;
    }
    return {
      getViewInteractionCount: () => {
        if (state2.stopped) {
          return state2.interactionCount;
        }
        return computeViewInteractionCount();
      },
      stopViewInteractionCount: () => {
        state2 = { stopped: true, interactionCount: computeViewInteractionCount() };
      }
    };
  }
  function isInteractionToNextPaintSupported() {
    return supportPerformanceTimingEvent(RumPerformanceEntryType.EVENT) && window.PerformanceEventTiming && "interactionId" in PerformanceEventTiming.prototype;
  }
  var MAX_INTERACTION_ENTRIES, MAX_INP_VALUE;
  var init_trackInteractionToNextPaint = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackInteractionToNextPaint.js"() {
      init_esm();
      init_performanceObservable();
      init_rawRumEvent_types();
      init_getSelectorFromElement();
      init_htmlDomUtils();
      init_interactionSelectorCache();
      init_interactionCountPolyfill();
      MAX_INTERACTION_ENTRIES = 10;
      MAX_INP_VALUE = 1 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackLoadingTime.js
  function trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadType, viewStart, callback) {
    let isWaitingForLoadEvent = loadType === ViewLoadingType.INITIAL_LOAD;
    let isWaitingForActivityLoadingTime = true;
    const loadingTimeCandidates = [];
    const firstHidden = trackFirstHidden(configuration, viewStart);
    function invokeCallbackIfAllCandidatesAreReceived() {
      if (!isWaitingForActivityLoadingTime && !isWaitingForLoadEvent && loadingTimeCandidates.length > 0) {
        const loadingTime = Math.max(...loadingTimeCandidates);
        if (loadingTime < firstHidden.timeStamp - viewStart.relative) {
          callback(loadingTime);
        }
      }
    }
    const { stop } = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (event) => {
      if (isWaitingForActivityLoadingTime) {
        isWaitingForActivityLoadingTime = false;
        if (event.hadActivity) {
          loadingTimeCandidates.push(elapsed(viewStart.timeStamp, event.end));
        }
        invokeCallbackIfAllCandidatesAreReceived();
      }
    });
    return {
      stop: () => {
        stop();
        firstHidden.stop();
      },
      setLoadEvent: (loadEvent) => {
        if (isWaitingForLoadEvent) {
          isWaitingForLoadEvent = false;
          loadingTimeCandidates.push(loadEvent);
          invokeCallbackIfAllCandidatesAreReceived();
        }
      }
    };
  }
  var init_trackLoadingTime = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackLoadingTime.js"() {
      init_esm();
      init_waitPageActivityEnd();
      init_rawRumEvent_types();
      init_trackFirstHidden();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/scroll.js
  function getScrollX() {
    let scrollX;
    const visual = window.visualViewport;
    if (visual) {
      scrollX = visual.pageLeft - visual.offsetLeft;
    } else if (window.scrollX !== void 0) {
      scrollX = window.scrollX;
    } else {
      scrollX = window.pageXOffset || 0;
    }
    return Math.round(scrollX);
  }
  function getScrollY() {
    let scrollY;
    const visual = window.visualViewport;
    if (visual) {
      scrollY = visual.pageTop - visual.offsetTop;
    } else if (window.scrollY !== void 0) {
      scrollY = window.scrollY;
    } else {
      scrollY = window.pageYOffset || 0;
    }
    return Math.round(scrollY);
  }
  var init_scroll = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/scroll.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/viewportObservable.js
  function initViewportObservable(configuration) {
    if (!viewportObservable) {
      viewportObservable = createViewportObservable(configuration);
    }
    return viewportObservable;
  }
  function createViewportObservable(configuration) {
    return new Observable((observable) => {
      const { throttled: updateDimension } = throttle(() => {
        observable.notify(getViewportDimension());
      }, 200);
      return addEventListener(configuration, window, "resize", updateDimension, { capture: true, passive: true }).stop;
    });
  }
  function getViewportDimension() {
    const visual = window.visualViewport;
    if (visual) {
      return {
        width: Number(visual.width * visual.scale),
        height: Number(visual.height * visual.scale)
      };
    }
    return {
      width: Number(window.innerWidth || 0),
      height: Number(window.innerHeight || 0)
    };
  }
  var viewportObservable;
  var init_viewportObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/viewportObservable.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackScrollMetrics.js
  function trackScrollMetrics(configuration, viewStart, callback, scrollValues = createScrollValuesObservable(configuration)) {
    let maxScrollDepth = 0;
    let maxScrollHeight = 0;
    let maxScrollHeightTime = 0;
    const subscription = scrollValues.subscribe(({ scrollDepth, scrollTop, scrollHeight }) => {
      let shouldUpdate = false;
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        shouldUpdate = true;
      }
      if (scrollHeight > maxScrollHeight) {
        maxScrollHeight = scrollHeight;
        const now = relativeNow();
        maxScrollHeightTime = elapsed(viewStart.relative, now);
        shouldUpdate = true;
      }
      if (shouldUpdate) {
        callback({
          maxDepth: Math.min(maxScrollDepth, maxScrollHeight),
          maxDepthScrollTop: scrollTop,
          maxScrollHeight,
          maxScrollHeightTime
        });
      }
    });
    return {
      stop: () => subscription.unsubscribe()
    };
  }
  function computeScrollValues() {
    const scrollTop = getScrollY();
    const { height } = getViewportDimension();
    const scrollHeight = Math.round((document.scrollingElement || document.documentElement).scrollHeight);
    const scrollDepth = Math.round(height + scrollTop);
    return {
      scrollHeight,
      scrollDepth,
      scrollTop
    };
  }
  function createScrollValuesObservable(configuration, throttleDuration = THROTTLE_SCROLL_DURATION) {
    return new Observable((observable) => {
      function notify() {
        observable.notify(computeScrollValues());
      }
      if (window.ResizeObserver) {
        const throttledNotify = throttle(notify, throttleDuration, {
          leading: false,
          trailing: true
        });
        const observerTarget = document.scrollingElement || document.documentElement;
        const resizeObserver = new ResizeObserver(monitor(throttledNotify.throttled));
        if (observerTarget) {
          resizeObserver.observe(observerTarget);
        }
        const eventListener = addEventListener(configuration, window, "scroll", throttledNotify.throttled, {
          passive: true
        });
        return () => {
          throttledNotify.cancel();
          resizeObserver.disconnect();
          eventListener.stop();
        };
      }
    });
  }
  var THROTTLE_SCROLL_DURATION;
  var init_trackScrollMetrics = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackScrollMetrics.js"() {
      init_esm();
      init_scroll();
      init_viewportObservable();
      THROTTLE_SCROLL_DURATION = ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackCommonViewMetrics.js
  function trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, viewStart) {
    const commonViewMetrics = {};
    const { stop: stopLoadingTimeTracking, setLoadEvent } = trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, viewStart, (newLoadingTime) => {
      commonViewMetrics.loadingTime = newLoadingTime;
      scheduleViewUpdate();
    });
    const { stop: stopScrollMetricsTracking } = trackScrollMetrics(configuration, viewStart, (newScrollMetrics) => {
      commonViewMetrics.scroll = newScrollMetrics;
    });
    const { stop: stopCLSTracking } = trackCumulativeLayoutShift(configuration, viewStart.relative, (cumulativeLayoutShift) => {
      commonViewMetrics.cumulativeLayoutShift = cumulativeLayoutShift;
      scheduleViewUpdate();
    });
    const { stop: stopINPTracking, getInteractionToNextPaint, setViewEnd } = trackInteractionToNextPaint(configuration, viewStart.relative, loadingType);
    return {
      stop: () => {
        stopLoadingTimeTracking();
        stopCLSTracking();
        stopScrollMetricsTracking();
      },
      stopINPTracking,
      setLoadEvent,
      setViewEnd,
      getCommonViewMetrics: () => {
        commonViewMetrics.interactionToNextPaint = getInteractionToNextPaint();
        return commonViewMetrics;
      }
    };
  }
  var init_trackCommonViewMetrics = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackCommonViewMetrics.js"() {
      init_trackCumulativeLayoutShift();
      init_trackInteractionToNextPaint();
      init_trackLoadingTime();
      init_trackScrollMetrics();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/bfCacheSupport.js
  function onBFCacheRestore(configuration, callback) {
    const { stop } = addEventListener(configuration, window, "pageshow", (event) => {
      if (event.persisted) {
        callback(event);
      }
    }, { capture: true });
    return stop;
  }
  var init_bfCacheSupport = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/bfCacheSupport.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackBfcacheMetrics.js
  function trackBfcacheMetrics(viewStart, metrics, scheduleViewUpdate) {
    trackRestoredFirstContentfulPaint(viewStart.relative, (paintTime) => {
      metrics.firstContentfulPaint = paintTime;
      metrics.largestContentfulPaint = { value: paintTime };
      scheduleViewUpdate();
    });
  }
  var init_trackBfcacheMetrics = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/trackBfcacheMetrics.js"() {
      init_trackFirstContentfulPaint();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/trackViews.js
  function trackViews(location2, lifeCycle, domMutationObservable, windowOpenObservable, configuration, locationChangeObservable, areViewsTrackedAutomatically, initialViewOptions) {
    const activeViews = /* @__PURE__ */ new Set();
    let currentView = startNewView(ViewLoadingType.INITIAL_LOAD, clocksOrigin(), initialViewOptions);
    let stopOnBFCacheRestore;
    startViewLifeCycle();
    let locationChangeSubscription;
    if (areViewsTrackedAutomatically) {
      locationChangeSubscription = renewViewOnLocationChange(locationChangeObservable);
      if (configuration.trackBfcacheViews) {
        stopOnBFCacheRestore = onBFCacheRestore(configuration, (pageshowEvent) => {
          currentView.end();
          const startClocks = relativeToClocks(pageshowEvent.timeStamp);
          currentView = startNewView(ViewLoadingType.BF_CACHE, startClocks, void 0);
        });
      }
    }
    function startNewView(loadingType, startClocks, viewOptions) {
      const newlyCreatedView = newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, location2, loadingType, startClocks, viewOptions);
      activeViews.add(newlyCreatedView);
      newlyCreatedView.stopObservable.subscribe(() => {
        activeViews.delete(newlyCreatedView);
      });
      return newlyCreatedView;
    }
    function startViewLifeCycle() {
      lifeCycle.subscribe(10, () => {
        currentView = startNewView(ViewLoadingType.ROUTE_CHANGE, void 0, {
          name: currentView.name,
          service: currentView.service,
          version: currentView.version,
          context: currentView.contextManager.getContext()
        });
      });
      lifeCycle.subscribe(9, () => {
        currentView.end({ sessionIsActive: false });
      });
    }
    function renewViewOnLocationChange(locationChangeObservable2) {
      return locationChangeObservable2.subscribe(({ oldLocation, newLocation }) => {
        if (areDifferentLocation(oldLocation, newLocation)) {
          currentView.end();
          currentView = startNewView(ViewLoadingType.ROUTE_CHANGE);
        }
      });
    }
    return {
      addTiming: (name, time = timeStampNow()) => {
        currentView.addTiming(name, time);
      },
      startView: (options, startClocks) => {
        currentView.end({ endClocks: startClocks });
        currentView = startNewView(ViewLoadingType.ROUTE_CHANGE, startClocks, options);
      },
      setViewContext: (context) => {
        currentView.contextManager.setContext(context);
      },
      setViewContextProperty: (key, value) => {
        currentView.contextManager.setContextProperty(key, value);
      },
      setViewName: (name) => {
        currentView.setViewName(name);
      },
      getViewContext: () => currentView.contextManager.getContext(),
      stop: () => {
        if (locationChangeSubscription) {
          locationChangeSubscription.unsubscribe();
        }
        if (stopOnBFCacheRestore) {
          stopOnBFCacheRestore();
        }
        currentView.end();
        activeViews.forEach((view) => view.stop());
      }
    };
  }
  function newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, initialLocation, loadingType, startClocks = clocksNow(), viewOptions) {
    const id = generateUUID();
    const stopObservable = new Observable();
    const customTimings = {};
    let documentVersion = 0;
    let endClocks;
    const location2 = shallowClone(initialLocation);
    const contextManager = createContextManager();
    let sessionIsActive = true;
    let name = viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.name;
    const service = (viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.service) || configuration.service;
    const version = (viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.version) || configuration.version;
    const context = viewOptions === null || viewOptions === void 0 ? void 0 : viewOptions.context;
    if (context) {
      contextManager.setContext(context);
    }
    const viewCreatedEvent = {
      id,
      name,
      startClocks,
      service,
      version,
      context
    };
    lifeCycle.notify(1, viewCreatedEvent);
    lifeCycle.notify(2, viewCreatedEvent);
    const { throttled, cancel: cancelScheduleViewUpdate } = throttle(triggerViewUpdate, THROTTLE_VIEW_UPDATE_PERIOD, {
      leading: false
    });
    const { setLoadEvent, setViewEnd, stop: stopCommonViewMetricsTracking, stopINPTracking, getCommonViewMetrics } = trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, startClocks);
    const { stop: stopInitialViewMetricsTracking, initialViewMetrics } = loadingType === ViewLoadingType.INITIAL_LOAD ? trackInitialViewMetrics(configuration, startClocks, setLoadEvent, scheduleViewUpdate) : { stop: noop, initialViewMetrics: {} };
    if (loadingType === ViewLoadingType.BF_CACHE) {
      trackBfcacheMetrics(startClocks, initialViewMetrics, scheduleViewUpdate);
    }
    const { stop: stopEventCountsTracking, eventCounts } = trackViewEventCounts(lifeCycle, id, scheduleViewUpdate);
    const keepAliveIntervalId = setInterval(triggerViewUpdate, SESSION_KEEP_ALIVE_INTERVAL);
    const pageMayExitSubscription = lifeCycle.subscribe(11, (pageMayExitEvent) => {
      if (pageMayExitEvent.reason === PageExitReason.UNLOADING) {
        triggerViewUpdate();
      }
    });
    triggerViewUpdate();
    contextManager.changeObservable.subscribe(scheduleViewUpdate);
    function triggerBeforeViewUpdate() {
      lifeCycle.notify(3, {
        id,
        name,
        context: contextManager.getContext(),
        startClocks,
        sessionIsActive
      });
    }
    function scheduleViewUpdate() {
      triggerBeforeViewUpdate();
      throttled();
    }
    function triggerViewUpdate() {
      cancelScheduleViewUpdate();
      triggerBeforeViewUpdate();
      documentVersion += 1;
      const currentEnd = endClocks === void 0 ? timeStampNow() : endClocks.timeStamp;
      lifeCycle.notify(4, {
        customTimings,
        documentVersion,
        id,
        name,
        service,
        version,
        context: contextManager.getContext(),
        loadingType,
        location: location2,
        startClocks,
        commonViewMetrics: getCommonViewMetrics(),
        initialViewMetrics,
        duration: elapsed(startClocks.timeStamp, currentEnd),
        isActive: endClocks === void 0,
        sessionIsActive,
        eventCounts
      });
    }
    return {
      get name() {
        return name;
      },
      service,
      version,
      contextManager,
      stopObservable,
      end(options = {}) {
        var _a, _b;
        if (endClocks) {
          return;
        }
        endClocks = (_a = options.endClocks) !== null && _a !== void 0 ? _a : clocksNow();
        sessionIsActive = (_b = options.sessionIsActive) !== null && _b !== void 0 ? _b : true;
        lifeCycle.notify(5, { endClocks });
        lifeCycle.notify(6, { endClocks });
        clearInterval(keepAliveIntervalId);
        setViewEnd(endClocks.relative);
        stopCommonViewMetricsTracking();
        pageMayExitSubscription.unsubscribe();
        triggerViewUpdate();
        setTimeout(() => {
          this.stop();
        }, KEEP_TRACKING_AFTER_VIEW_DELAY);
      },
      stop() {
        stopInitialViewMetricsTracking();
        stopEventCountsTracking();
        stopINPTracking();
        stopObservable.notify();
      },
      addTiming(name2, time) {
        if (endClocks) {
          return;
        }
        const relativeTime = looksLikeRelativeTime(time) ? time : elapsed(startClocks.timeStamp, time);
        customTimings[sanitizeTiming(name2)] = relativeTime;
        scheduleViewUpdate();
      },
      setViewName(updatedName) {
        name = updatedName;
        triggerViewUpdate();
      }
    };
  }
  function sanitizeTiming(name) {
    const sanitized = name.replace(/[^a-zA-Z0-9-_.@$]/g, "_");
    if (sanitized !== name) {
      display.warn(`Invalid timing name: ${name}, sanitized to: ${sanitized}`);
    }
    return sanitized;
  }
  function areDifferentLocation(currentLocation, otherLocation) {
    return currentLocation.pathname !== otherLocation.pathname || !isHashAnAnchor(otherLocation.hash) && getPathFromHash(otherLocation.hash) !== getPathFromHash(currentLocation.hash);
  }
  function isHashAnAnchor(hash) {
    const correspondingId = hash.substring(1);
    return correspondingId !== "" && !!document.getElementById(correspondingId);
  }
  function getPathFromHash(hash) {
    const index = hash.indexOf("?");
    return index < 0 ? hash : hash.slice(0, index);
  }
  var THROTTLE_VIEW_UPDATE_PERIOD, SESSION_KEEP_ALIVE_INTERVAL, KEEP_TRACKING_AFTER_VIEW_DELAY;
  var init_trackViews = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/trackViews.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_trackViewEventCounts();
      init_trackInitialViewMetrics();
      init_trackCommonViewMetrics();
      init_bfCacheSupport();
      init_trackBfcacheMetrics();
      THROTTLE_VIEW_UPDATE_PERIOD = 3e3;
      SESSION_KEEP_ALIVE_INTERVAL = 5 * ONE_MINUTE;
      KEEP_TRACKING_AFTER_VIEW_DELAY = 5 * ONE_MINUTE;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewCollection.js
  function startViewCollection(lifeCycle, hooks, configuration, location2, domMutationObservable, pageOpenObservable, locationChangeObservable, recorderApi2, viewHistory, initialViewOptions) {
    lifeCycle.subscribe(4, (view) => lifeCycle.notify(12, processViewUpdate(view, configuration, recorderApi2)));
    hooks.register(0, ({ startTime, eventType }) => {
      const view = viewHistory.findView(startTime);
      if (!view) {
        return DISCARDED;
      }
      return {
        type: eventType,
        service: view.service,
        version: view.version,
        context: view.context,
        view: {
          id: view.id,
          name: view.name
        }
      };
    });
    hooks.register(1, ({ startTime }) => {
      var _a;
      return {
        view: {
          id: (_a = viewHistory.findView(startTime)) === null || _a === void 0 ? void 0 : _a.id
        }
      };
    });
    return trackViews(location2, lifeCycle, domMutationObservable, pageOpenObservable, configuration, locationChangeObservable, !configuration.trackViewsManually, initialViewOptions);
  }
  function processViewUpdate(view, configuration, recorderApi2) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const replayStats = recorderApi2.getReplayStats(view.id);
    const clsDevicePixelRatio = (_b = (_a = view.commonViewMetrics) === null || _a === void 0 ? void 0 : _a.cumulativeLayoutShift) === null || _b === void 0 ? void 0 : _b.devicePixelRatio;
    const viewEvent = {
      _oo: {
        document_version: view.documentVersion,
        replay_stats: replayStats,
        cls: clsDevicePixelRatio ? {
          device_pixel_ratio: clsDevicePixelRatio
        } : void 0,
        configuration: {
          start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually
        }
      },
      date: view.startClocks.timeStamp,
      type: RumEventType.VIEW,
      view: {
        action: {
          count: view.eventCounts.actionCount
        },
        frustration: {
          count: view.eventCounts.frustrationCount
        },
        cumulative_layout_shift: (_c = view.commonViewMetrics.cumulativeLayoutShift) === null || _c === void 0 ? void 0 : _c.value,
        cumulative_layout_shift_time: toServerDuration((_d = view.commonViewMetrics.cumulativeLayoutShift) === null || _d === void 0 ? void 0 : _d.time),
        cumulative_layout_shift_target_selector: (_e = view.commonViewMetrics.cumulativeLayoutShift) === null || _e === void 0 ? void 0 : _e.targetSelector,
        first_byte: toServerDuration((_f = view.initialViewMetrics.navigationTimings) === null || _f === void 0 ? void 0 : _f.firstByte),
        dom_complete: toServerDuration((_g = view.initialViewMetrics.navigationTimings) === null || _g === void 0 ? void 0 : _g.domComplete),
        dom_content_loaded: toServerDuration((_h = view.initialViewMetrics.navigationTimings) === null || _h === void 0 ? void 0 : _h.domContentLoaded),
        dom_interactive: toServerDuration((_j = view.initialViewMetrics.navigationTimings) === null || _j === void 0 ? void 0 : _j.domInteractive),
        error: {
          count: view.eventCounts.errorCount
        },
        first_contentful_paint: toServerDuration(view.initialViewMetrics.firstContentfulPaint),
        first_input_delay: toServerDuration((_k = view.initialViewMetrics.firstInput) === null || _k === void 0 ? void 0 : _k.delay),
        first_input_time: toServerDuration((_l = view.initialViewMetrics.firstInput) === null || _l === void 0 ? void 0 : _l.time),
        first_input_target_selector: (_m = view.initialViewMetrics.firstInput) === null || _m === void 0 ? void 0 : _m.targetSelector,
        interaction_to_next_paint: toServerDuration((_o = view.commonViewMetrics.interactionToNextPaint) === null || _o === void 0 ? void 0 : _o.value),
        interaction_to_next_paint_time: toServerDuration((_p = view.commonViewMetrics.interactionToNextPaint) === null || _p === void 0 ? void 0 : _p.time),
        interaction_to_next_paint_target_selector: (_q = view.commonViewMetrics.interactionToNextPaint) === null || _q === void 0 ? void 0 : _q.targetSelector,
        is_active: view.isActive,
        name: view.name,
        largest_contentful_paint: toServerDuration((_r = view.initialViewMetrics.largestContentfulPaint) === null || _r === void 0 ? void 0 : _r.value),
        largest_contentful_paint_target_selector: (_s = view.initialViewMetrics.largestContentfulPaint) === null || _s === void 0 ? void 0 : _s.targetSelector,
        load_event: toServerDuration((_t = view.initialViewMetrics.navigationTimings) === null || _t === void 0 ? void 0 : _t.loadEvent),
        loading_time: discardNegativeDuration(toServerDuration(view.commonViewMetrics.loadingTime)),
        loading_type: view.loadingType,
        long_task: {
          count: view.eventCounts.longTaskCount
        },
        performance: computeViewPerformanceData(view.commonViewMetrics, view.initialViewMetrics),
        resource: {
          count: view.eventCounts.resourceCount
        },
        time_spent: toServerDuration(view.duration)
      },
      display: view.commonViewMetrics.scroll ? {
        scroll: {
          max_depth: view.commonViewMetrics.scroll.maxDepth,
          max_depth_scroll_top: view.commonViewMetrics.scroll.maxDepthScrollTop,
          max_scroll_height: view.commonViewMetrics.scroll.maxScrollHeight,
          max_scroll_height_time: toServerDuration(view.commonViewMetrics.scroll.maxScrollHeightTime)
        }
      } : void 0,
      privacy: {
        replay_level: configuration.defaultPrivacyLevel
      },
      device: {
        locale: navigator.language,
        locales: navigator.languages,
        time_zone: getTimeZone()
      }
    };
    if (!isEmptyObject(view.customTimings)) {
      viewEvent.view.custom_timings = mapValues(view.customTimings, toServerDuration);
    }
    return {
      rawRumEvent: viewEvent,
      startTime: view.startClocks.relative,
      duration: view.duration,
      domainContext: {
        location: view.location
      }
    };
  }
  function computeViewPerformanceData({ cumulativeLayoutShift, interactionToNextPaint }, { firstContentfulPaint, firstInput, largestContentfulPaint }) {
    return {
      cls: cumulativeLayoutShift && {
        score: cumulativeLayoutShift.value,
        timestamp: toServerDuration(cumulativeLayoutShift.time),
        target_selector: cumulativeLayoutShift.targetSelector,
        previous_rect: cumulativeLayoutShift.previousRect,
        current_rect: cumulativeLayoutShift.currentRect
      },
      fcp: firstContentfulPaint && { timestamp: toServerDuration(firstContentfulPaint) },
      fid: firstInput && {
        duration: toServerDuration(firstInput.delay),
        timestamp: toServerDuration(firstInput.time),
        target_selector: firstInput.targetSelector
      },
      inp: interactionToNextPaint && {
        duration: toServerDuration(interactionToNextPaint.value),
        timestamp: toServerDuration(interactionToNextPaint.time),
        target_selector: interactionToNextPaint.targetSelector
      },
      lcp: largestContentfulPaint && {
        timestamp: toServerDuration(largestContentfulPaint.value),
        target_selector: largestContentfulPaint.targetSelector,
        resource_url: largestContentfulPaint.resourceUrl
      }
    };
  }
  var init_viewCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewCollection.js"() {
      init_esm();
      init_discardNegativeDuration();
      init_rawRumEvent_types();
      init_trackViews();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/rumSessionManager.js
  function startRumSessionManager(configuration, lifeCycle, trackingConsentState) {
    const sessionManager = startSessionManager(configuration, RUM_SESSION_KEY2, (rawTrackingType) => computeTrackingType(configuration, rawTrackingType), trackingConsentState);
    sessionManager.expireObservable.subscribe(() => {
      lifeCycle.notify(
        9
        /* LifeCycleEventType.SESSION_EXPIRED */
      );
    });
    sessionManager.renewObservable.subscribe(() => {
      lifeCycle.notify(
        10
        /* LifeCycleEventType.SESSION_RENEWED */
      );
    });
    sessionManager.sessionStateUpdateObservable.subscribe(({ previousState, newState }) => {
      if (!previousState.forcedReplay && newState.forcedReplay) {
        const sessionEntity = sessionManager.findSession();
        if (sessionEntity) {
          sessionEntity.isReplayForced = true;
        }
      }
    });
    return {
      findTrackedSession: (startTime) => {
        const session = sessionManager.findSession(startTime);
        if (!session || session.trackingType === "0") {
          return;
        }
        return {
          id: session.id,
          sessionReplay: session.trackingType === "1" ? 1 : session.isReplayForced ? 2 : 0,
          anonymousId: session.anonymousId
        };
      },
      expire: sessionManager.expire,
      expireObservable: sessionManager.expireObservable,
      setForcedReplay: () => sessionManager.updateSessionState({ forcedReplay: "1" })
    };
  }
  function startRumSessionManagerStub() {
    const session = {
      id: "00000000-aaaa-0000-aaaa-000000000000",
      sessionReplay: bridgeSupports(
        "records"
        /* BridgeCapability.RECORDS */
      ) ? 1 : 0
    };
    return {
      findTrackedSession: () => session,
      expire: noop,
      expireObservable: new Observable(),
      setForcedReplay: noop
    };
  }
  function computeTrackingType(configuration, rawTrackingType) {
    if (hasValidRumSession(rawTrackingType)) {
      return rawTrackingType;
    }
    if (!performDraw(configuration.sessionSampleRate)) {
      return "0";
    }
    if (!performDraw(configuration.sessionReplaySampleRate)) {
      return "2";
    }
    return "1";
  }
  function hasValidRumSession(trackingType) {
    return trackingType === "0" || trackingType === "1" || trackingType === "2";
  }
  var RUM_SESSION_KEY2;
  var init_rumSessionManager = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/rumSessionManager.js"() {
      init_esm();
      RUM_SESSION_KEY2 = "rum";
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/transport/startRumBatch.js
  function startRumBatch(configuration, lifeCycle, reportError, pageMayExitObservable, sessionExpireObservable, createEncoder) {
    const endpoints = [configuration.rumEndpointBuilder];
    if (configuration.replica) {
      endpoints.push(configuration.replica.rumEndpointBuilder);
    }
    const batch = createBatch({
      encoder: createEncoder(
        2
        /* DeflateEncoderStreamId.RUM */
      ),
      request: createHttpRequest(endpoints, reportError),
      flushController: createFlushController({
        pageMayExitObservable,
        sessionExpireObservable
      })
    });
    lifeCycle.subscribe(13, (serverRumEvent) => {
      if (serverRumEvent.type === RumEventType.VIEW) {
        batch.upsert(serverRumEvent, serverRumEvent.view.id);
      } else {
        batch.add(serverRumEvent);
      }
    });
    return batch;
  }
  var init_startRumBatch = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/transport/startRumBatch.js"() {
      init_esm();
      init_rawRumEvent_types();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/transport/startRumEventBridge.js
  function startRumEventBridge(lifeCycle) {
    const bridge = getEventBridge();
    lifeCycle.subscribe(13, (serverRumEvent) => {
      bridge.send("rum", serverRumEvent);
    });
  }
  var init_startRumEventBridge = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/transport/startRumEventBridge.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/urlContexts.js
  function startUrlContexts(lifeCycle, hooks, locationChangeObservable, location2) {
    const urlContextHistory = createValueHistory({ expireDelay: URL_CONTEXT_TIME_OUT_DELAY });
    let previousViewUrl;
    lifeCycle.subscribe(1, ({ startClocks }) => {
      const viewUrl = location2.href;
      urlContextHistory.add(buildUrlContext({
        url: viewUrl,
        referrer: !previousViewUrl ? document.referrer : previousViewUrl
      }), startClocks.relative);
      previousViewUrl = viewUrl;
    });
    lifeCycle.subscribe(6, ({ endClocks }) => {
      urlContextHistory.closeActive(endClocks.relative);
    });
    const locationChangeSubscription = locationChangeObservable.subscribe(({ newLocation }) => {
      const current = urlContextHistory.find();
      if (current) {
        const changeTime = relativeNow();
        urlContextHistory.closeActive(changeTime);
        urlContextHistory.add(buildUrlContext({
          url: newLocation.href,
          referrer: current.referrer
        }), changeTime);
      }
    });
    function buildUrlContext({ url, referrer }) {
      return {
        url,
        referrer
      };
    }
    hooks.register(0, ({ startTime, eventType }) => {
      const urlContext = urlContextHistory.find(startTime);
      if (!urlContext) {
        return DISCARDED;
      }
      return {
        type: eventType,
        view: {
          url: urlContext.url,
          referrer: urlContext.referrer
        }
      };
    });
    return {
      findUrl: (startTime) => urlContextHistory.find(startTime),
      stop: () => {
        locationChangeSubscription.unsubscribe();
        urlContextHistory.stop();
      }
    };
  }
  var URL_CONTEXT_TIME_OUT_DELAY;
  var init_urlContexts = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/urlContexts.js"() {
      init_esm();
      URL_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/locationChangeObservable.js
  function createLocationChangeObservable(configuration, location2) {
    let currentLocation = shallowClone(location2);
    return new Observable((observable) => {
      const { stop: stopHistoryTracking } = trackHistory(configuration, onLocationChange);
      const { stop: stopHashTracking } = trackHash(configuration, onLocationChange);
      function onLocationChange() {
        if (currentLocation.href === location2.href) {
          return;
        }
        const newLocation = shallowClone(location2);
        observable.notify({
          newLocation,
          oldLocation: currentLocation
        });
        currentLocation = newLocation;
      }
      return () => {
        stopHistoryTracking();
        stopHashTracking();
      };
    });
  }
  function trackHistory(configuration, onHistoryChange) {
    const { stop: stopInstrumentingPushState } = instrumentMethod(getHistoryInstrumentationTarget("pushState"), "pushState", ({ onPostCall }) => {
      onPostCall(onHistoryChange);
    });
    const { stop: stopInstrumentingReplaceState } = instrumentMethod(getHistoryInstrumentationTarget("replaceState"), "replaceState", ({ onPostCall }) => {
      onPostCall(onHistoryChange);
    });
    const { stop: removeListener } = addEventListener(configuration, window, "popstate", onHistoryChange);
    return {
      stop: () => {
        stopInstrumentingPushState();
        stopInstrumentingReplaceState();
        removeListener();
      }
    };
  }
  function trackHash(configuration, onHashChange) {
    return addEventListener(configuration, window, "hashchange", onHashChange);
  }
  function getHistoryInstrumentationTarget(methodName) {
    return Object.prototype.hasOwnProperty.call(history, methodName) ? history : History.prototype;
  }
  var init_locationChangeObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/locationChangeObservable.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/featureFlagContext.js
  function startFeatureFlagContexts(lifeCycle, hooks, configuration) {
    const featureFlagContexts = createValueHistory({
      expireDelay: FEATURE_FLAG_CONTEXT_TIME_OUT_DELAY
    });
    lifeCycle.subscribe(1, ({ startClocks }) => {
      featureFlagContexts.add({}, startClocks.relative);
    });
    lifeCycle.subscribe(6, ({ endClocks }) => {
      featureFlagContexts.closeActive(endClocks.relative);
    });
    hooks.register(0, ({ startTime, eventType }) => {
      const trackFeatureFlagsForEvents = configuration.trackFeatureFlagsForEvents.concat([
        RumEventType.VIEW,
        RumEventType.ERROR
      ]);
      if (!trackFeatureFlagsForEvents.includes(eventType)) {
        return SKIPPED;
      }
      const featureFlagContext = featureFlagContexts.find(startTime);
      if (!featureFlagContext || isEmptyObject(featureFlagContext)) {
        return SKIPPED;
      }
      return {
        type: eventType,
        feature_flags: featureFlagContext
      };
    });
    return {
      addFeatureFlagEvaluation: (key, value) => {
        const currentContext = featureFlagContexts.find();
        if (currentContext) {
          currentContext[key] = value;
        }
      }
    };
  }
  var FEATURE_FLAG_CONTEXT_TIME_OUT_DELAY;
  var init_featureFlagContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/featureFlagContext.js"() {
      init_esm();
      init_rawRumEvent_types();
      FEATURE_FLAG_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/startCustomerDataTelemetry.js
  function startCustomerDataTelemetry(telemetry, lifeCycle, batchFlushObservable) {
    if (!telemetry.metricsEnabled) {
      return;
    }
    initCurrentPeriodMeasures();
    batchHasRumEvent = false;
    lifeCycle.subscribe(13, () => {
      batchHasRumEvent = true;
    });
    batchFlushObservable.subscribe(({ bytesCount, messagesCount }) => {
      if (!batchHasRumEvent) {
        return;
      }
      batchHasRumEvent = false;
      currentPeriodMeasures.batchCount += 1;
      updateMeasure(currentPeriodMeasures.batchBytesCount, bytesCount);
      updateMeasure(currentPeriodMeasures.batchMessagesCount, messagesCount);
    });
    setInterval(sendCurrentPeriodMeasures, MEASURES_PERIOD_DURATION);
  }
  function sendCurrentPeriodMeasures() {
    if (currentPeriodMeasures.batchCount === 0) {
      return;
    }
    addTelemetryMetrics("Customer data measures", currentPeriodMeasures);
    initCurrentPeriodMeasures();
  }
  function createMeasure() {
    return { min: Infinity, max: 0, sum: 0 };
  }
  function updateMeasure(measure, value) {
    measure.sum += value;
    measure.min = Math.min(measure.min, value);
    measure.max = Math.max(measure.max, value);
  }
  function initCurrentPeriodMeasures() {
    currentPeriodMeasures = {
      batchCount: 0,
      batchBytesCount: createMeasure(),
      batchMessagesCount: createMeasure()
    };
  }
  var MEASURES_PERIOD_DURATION, currentPeriodMeasures, batchHasRumEvent;
  var init_startCustomerDataTelemetry = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/startCustomerDataTelemetry.js"() {
      init_esm();
      MEASURES_PERIOD_DURATION = 10 * ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/pageStateHistory.js
  function startPageStateHistory(hooks, configuration, maxPageStateEntriesSelectable = MAX_PAGE_STATE_ENTRIES_SELECTABLE) {
    const pageStateEntryHistory = createValueHistory({
      expireDelay: PAGE_STATE_CONTEXT_TIME_OUT_DELAY,
      maxEntries: MAX_PAGE_STATE_ENTRIES
    });
    let currentPageState;
    if (supportPerformanceTimingEvent(RumPerformanceEntryType.VISIBILITY_STATE)) {
      const visibilityEntries = performance.getEntriesByType(RumPerformanceEntryType.VISIBILITY_STATE);
      visibilityEntries.forEach((entry) => {
        const state2 = entry.name === "hidden" ? "hidden" : "active";
        addPageState(state2, entry.startTime);
      });
    }
    addPageState(getPageState(), relativeNow());
    const { stop: stopEventListeners } = addEventListeners(configuration, window, [
      "pageshow",
      "focus",
      "blur",
      "visibilitychange",
      "resume",
      "freeze",
      "pagehide"
    ], (event) => {
      addPageState(computePageState(event), event.timeStamp);
    }, { capture: true });
    function addPageState(nextPageState, startTime = relativeNow()) {
      if (nextPageState === currentPageState) {
        return;
      }
      currentPageState = nextPageState;
      pageStateEntryHistory.closeActive(startTime);
      pageStateEntryHistory.add({ state: currentPageState, startTime }, startTime);
    }
    function wasInPageStateDuringPeriod(state2, startTime, duration) {
      return pageStateEntryHistory.findAll(startTime, duration).some((pageState) => pageState.state === state2);
    }
    hooks.register(0, ({ startTime, duration = 0, eventType }) => {
      if (eventType === RumEventType.VIEW) {
        const pageStates = pageStateEntryHistory.findAll(startTime, duration);
        return {
          type: eventType,
          _oo: { page_states: processPageStates(pageStates, startTime, maxPageStateEntriesSelectable) }
        };
      }
      if (eventType === RumEventType.ACTION || eventType === RumEventType.ERROR) {
        return {
          type: eventType,
          view: { in_foreground: wasInPageStateDuringPeriod("active", startTime, 0) }
        };
      }
      return SKIPPED;
    });
    return {
      wasInPageStateDuringPeriod,
      addPageState,
      stop: () => {
        stopEventListeners();
        pageStateEntryHistory.stop();
      }
    };
  }
  function processPageStates(pageStateEntries, eventStartTime, maxPageStateEntriesSelectable) {
    if (pageStateEntries.length === 0) {
      return;
    }
    return pageStateEntries.slice(-maxPageStateEntriesSelectable).reverse().map(({ state: state2, startTime }) => ({
      state: state2,
      start: toServerDuration(elapsed(eventStartTime, startTime))
    }));
  }
  function computePageState(event) {
    if (event.type === "freeze") {
      return "frozen";
    } else if (event.type === "pagehide") {
      return event.persisted ? "frozen" : "terminated";
    }
    return getPageState();
  }
  function getPageState() {
    if (document.visibilityState === "hidden") {
      return "hidden";
    }
    if (document.hasFocus()) {
      return "active";
    }
    return "passive";
  }
  var MAX_PAGE_STATE_ENTRIES, MAX_PAGE_STATE_ENTRIES_SELECTABLE, PAGE_STATE_CONTEXT_TIME_OUT_DELAY;
  var init_pageStateHistory = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/pageStateHistory.js"() {
      init_esm();
      init_performanceObservable();
      init_rawRumEvent_types();
      MAX_PAGE_STATE_ENTRIES = 4e3;
      MAX_PAGE_STATE_ENTRIES_SELECTABLE = 500;
      PAGE_STATE_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/displayContext.js
  function startDisplayContext(hooks, configuration) {
    let viewport;
    const animationFrameId = requestAnimationFrame(monitor(() => {
      viewport = getViewportDimension();
    }));
    const unsubscribeViewport = initViewportObservable(configuration).subscribe((viewportDimension) => {
      viewport = viewportDimension;
    }).unsubscribe;
    hooks.register(0, ({ eventType }) => ({
      type: eventType,
      display: viewport ? { viewport } : void 0
    }));
    return {
      stop: () => {
        unsubscribeViewport();
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };
  }
  var init_displayContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/displayContext.js"() {
      init_esm();
      init_viewportObservable();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/browser/cookieObservable.js
  function createCookieObservable(configuration, cookieName) {
    const detectCookieChangeStrategy = window.cookieStore ? listenToCookieStoreChange(configuration) : watchCookieFallback;
    return new Observable((observable) => detectCookieChangeStrategy(cookieName, (event) => observable.notify(event)));
  }
  function listenToCookieStoreChange(configuration) {
    return (cookieName, callback) => {
      const listener = addEventListener(configuration, window.cookieStore, "change", (event) => {
        const changeEvent = event.changed.find((event2) => event2.name === cookieName) || event.deleted.find((event2) => event2.name === cookieName);
        if (changeEvent) {
          callback(changeEvent.value);
        }
      });
      return listener.stop;
    };
  }
  function watchCookieFallback(cookieName, callback) {
    const previousCookieValue = findCommaSeparatedValue(document.cookie, cookieName);
    const watchCookieIntervalId = setInterval(() => {
      const cookieValue = findCommaSeparatedValue(document.cookie, cookieName);
      if (cookieValue !== previousCookieValue) {
        callback(cookieValue);
      }
    }, WATCH_COOKIE_INTERVAL_DELAY);
    return () => {
      clearInterval(watchCookieIntervalId);
    };
  }
  var WATCH_COOKIE_INTERVAL_DELAY;
  var init_cookieObservable = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/browser/cookieObservable.js"() {
      init_esm();
      WATCH_COOKIE_INTERVAL_DELAY = ONE_SECOND;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/ciVisibilityContext.js
  function startCiVisibilityContext(configuration, hooks, cookieObservable = createCookieObservable(configuration, CI_VISIBILITY_TEST_ID_COOKIE_NAME)) {
    var _a;
    let testExecutionId = getInitCookie(CI_VISIBILITY_TEST_ID_COOKIE_NAME) || ((_a = window.Cypress) === null || _a === void 0 ? void 0 : _a.env("traceId"));
    const cookieObservableSubscription = cookieObservable.subscribe((value) => {
      testExecutionId = value;
    });
    hooks.register(0, ({ eventType }) => {
      if (typeof testExecutionId !== "string") {
        return SKIPPED;
      }
      return {
        type: eventType,
        session: {
          type: "ci_test"
        },
        ci_test: {
          test_execution_id: testExecutionId
        }
      };
    });
    return {
      stop: () => {
        cookieObservableSubscription.unsubscribe();
      }
    };
  }
  var CI_VISIBILITY_TEST_ID_COOKIE_NAME;
  var init_ciVisibilityContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/ciVisibilityContext.js"() {
      init_esm();
      init_cookieObservable();
      CI_VISIBILITY_TEST_ID_COOKIE_NAME = "datadog-ci-visibility-test-execution-id";
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/longAnimationFrame/longAnimationFrameCollection.js
  function startLongAnimationFrameCollection(lifeCycle, configuration) {
    const performanceResourceSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.LONG_ANIMATION_FRAME,
      buffered: true
    }).subscribe((entries) => {
      for (const entry of entries) {
        const startClocks = relativeToClocks(entry.startTime);
        const rawRumEvent = {
          date: startClocks.timeStamp,
          long_task: {
            id: generateUUID(),
            entry_type: RumLongTaskEntryType.LONG_ANIMATION_FRAME,
            duration: toServerDuration(entry.duration),
            blocking_duration: toServerDuration(entry.blockingDuration),
            first_ui_event_timestamp: toServerDuration(entry.firstUIEventTimestamp),
            render_start: toServerDuration(entry.renderStart),
            style_and_layout_start: toServerDuration(entry.styleAndLayoutStart),
            start_time: toServerDuration(entry.startTime),
            scripts: entry.scripts.map((script) => ({
              duration: toServerDuration(script.duration),
              pause_duration: toServerDuration(script.pauseDuration),
              forced_style_and_layout_duration: toServerDuration(script.forcedStyleAndLayoutDuration),
              start_time: toServerDuration(script.startTime),
              execution_start: toServerDuration(script.executionStart),
              source_url: script.sourceURL,
              source_function_name: script.sourceFunctionName,
              source_char_position: script.sourceCharPosition,
              invoker: script.invoker,
              invoker_type: script.invokerType,
              window_attribution: script.windowAttribution
            }))
          },
          type: RumEventType.LONG_TASK,
          _oo: {
            discarded: false
          }
        };
        lifeCycle.notify(12, {
          rawRumEvent,
          startTime: startClocks.relative,
          duration: entry.duration,
          domainContext: { performanceEntry: entry }
        });
      }
    });
    return { stop: () => performanceResourceSubscription.unsubscribe() };
  }
  var init_longAnimationFrameCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/longAnimationFrame/longAnimationFrameCollection.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_performanceObservable();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/longTask/longTaskCollection.js
  function startLongTaskCollection(lifeCycle, configuration) {
    const performanceLongTaskSubscription = createPerformanceObservable(configuration, {
      type: RumPerformanceEntryType.LONG_TASK,
      buffered: true
    }).subscribe((entries) => {
      for (const entry of entries) {
        if (entry.entryType !== RumPerformanceEntryType.LONG_TASK) {
          break;
        }
        if (!configuration.trackLongTasks) {
          break;
        }
        const startClocks = relativeToClocks(entry.startTime);
        const rawRumEvent = {
          date: startClocks.timeStamp,
          long_task: {
            id: generateUUID(),
            entry_type: RumLongTaskEntryType.LONG_TASK,
            duration: toServerDuration(entry.duration)
          },
          type: RumEventType.LONG_TASK,
          _oo: {
            discarded: false
          }
        };
        lifeCycle.notify(12, {
          rawRumEvent,
          startTime: startClocks.relative,
          duration: entry.duration,
          domainContext: { performanceEntry: entry }
        });
      }
    });
    return {
      stop() {
        performanceLongTaskSubscription.unsubscribe();
      }
    };
  }
  var init_longTaskCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/longTask/longTaskCollection.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_performanceObservable();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/syntheticsContext.js
  function startSyntheticsContext(hooks) {
    hooks.register(0, ({ eventType }) => {
      if (!isSyntheticsTest()) {
        return SKIPPED;
      }
      const testId = getSyntheticsTestId();
      const resultId = getSyntheticsResultId();
      return {
        type: eventType,
        session: {
          type: "synthetics"
        },
        synthetics: {
          test_id: testId,
          result_id: resultId,
          injected: willSyntheticsInjectRum()
        }
      };
    });
  }
  var init_syntheticsContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/syntheticsContext.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/limitModification.js
  function limitModification(object, modifiableFieldPaths, modifier) {
    const clone = deepClone(object);
    const result = modifier(clone);
    objectEntries(modifiableFieldPaths).forEach(([fieldPath, fieldType]) => (
      // Traverse both object and clone simultaneously up to the path and apply the modification from the clone to the original object when the type is valid
      setValueAtPath(object, clone, fieldPath.split(/\.|(?=\[\])/), fieldType)
    ));
    return result;
  }
  function setValueAtPath(object, clone, pathSegments, fieldType) {
    const [field, ...restPathSegments] = pathSegments;
    if (field === "[]") {
      if (Array.isArray(object) && Array.isArray(clone)) {
        object.forEach((item, i) => setValueAtPath(item, clone[i], restPathSegments, fieldType));
      }
      return;
    }
    if (!isValidObject(object) || !isValidObject(clone)) {
      return;
    }
    if (restPathSegments.length > 0) {
      return setValueAtPath(object[field], clone[field], restPathSegments, fieldType);
    }
    setNestedValue(object, field, clone[field], fieldType);
  }
  function setNestedValue(object, field, value, fieldType) {
    const newType = getType(value);
    if (newType === fieldType) {
      object[field] = sanitize(value);
    } else if (fieldType === "object" && (newType === "undefined" || newType === "null")) {
      object[field] = {};
    }
  }
  function isValidObject(object) {
    return getType(object) === "object";
  }
  var init_limitModification = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/limitModification.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/assembly.js
  function startRumAssembly(configuration, lifeCycle, hooks, reportError, eventRateLimit) {
    modifiableFieldPathsByEvent = {
      [RumEventType.VIEW]: {
        "view.performance.lcp.resource_url": "string",
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      },
      [RumEventType.ERROR]: {
        "error.message": "string",
        "error.stack": "string",
        "error.resource.url": "string",
        "error.fingerprint": "string",
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      },
      [RumEventType.RESOURCE]: {
        "resource.url": "string",
        "resource.graphql.variables": "string",
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      },
      [RumEventType.ACTION]: {
        "action.target.name": "string",
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      },
      [RumEventType.LONG_TASK]: {
        "long_task.scripts[].source_url": "string",
        "long_task.scripts[].invoker": "string",
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      },
      [RumEventType.VITAL]: {
        ...USER_CUSTOMIZABLE_FIELD_PATHS,
        ...VIEW_MODIFIABLE_FIELD_PATHS,
        ...ROOT_MODIFIABLE_FIELD_PATHS
      }
    };
    const eventRateLimiters = {
      [RumEventType.ERROR]: createEventRateLimiter(RumEventType.ERROR, reportError, eventRateLimit),
      [RumEventType.ACTION]: createEventRateLimiter(RumEventType.ACTION, reportError, eventRateLimit),
      [RumEventType.VITAL]: createEventRateLimiter(RumEventType.VITAL, reportError, eventRateLimit)
    };
    lifeCycle.subscribe(12, ({ startTime, duration, rawRumEvent, domainContext }) => {
      const defaultRumEventAttributes = hooks.triggerHook(0, {
        eventType: rawRumEvent.type,
        startTime,
        duration
      });
      if (defaultRumEventAttributes === DISCARDED) {
        return;
      }
      const serverRumEvent = combine(defaultRumEventAttributes, rawRumEvent, {
        ootags: buildTags(configuration).join(",")
      });
      if (shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters)) {
        if (isEmptyObject(serverRumEvent.context)) {
          delete serverRumEvent.context;
        }
        lifeCycle.notify(13, serverRumEvent);
      }
    });
  }
  function shouldSend(event, beforeSend2, domainContext, eventRateLimiters) {
    var _a;
    if (beforeSend2) {
      const result = limitModification(event, modifiableFieldPathsByEvent[event.type], (event2) => beforeSend2(event2, domainContext));
      if (result === false && event.type !== RumEventType.VIEW) {
        return false;
      }
      if (result === false) {
        display.warn("Can't dismiss view events using beforeSend!");
      }
    }
    const rateLimitReached = (_a = eventRateLimiters[event.type]) === null || _a === void 0 ? void 0 : _a.isLimitReached();
    return !rateLimitReached;
  }
  var VIEW_MODIFIABLE_FIELD_PATHS, USER_CUSTOMIZABLE_FIELD_PATHS, ROOT_MODIFIABLE_FIELD_PATHS, modifiableFieldPathsByEvent;
  var init_assembly = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/assembly.js"() {
      init_esm();
      init_rawRumEvent_types();
      init_limitModification();
      VIEW_MODIFIABLE_FIELD_PATHS = {
        "view.name": "string",
        "view.url": "string",
        "view.referrer": "string"
      };
      USER_CUSTOMIZABLE_FIELD_PATHS = {
        context: "object"
      };
      ROOT_MODIFIABLE_FIELD_PATHS = {
        service: "string",
        version: "string"
      };
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/sessionContext.js
  function startSessionContext(hooks, sessionManager, recorderApi2, viewHistory) {
    hooks.register(0, ({ eventType, startTime }) => {
      const session = sessionManager.findTrackedSession(startTime);
      const view = viewHistory.findView(startTime);
      if (!session || !view) {
        return DISCARDED;
      }
      let hasReplay;
      let sampledForReplay;
      let isActive;
      if (eventType === RumEventType.VIEW) {
        hasReplay = recorderApi2.getReplayStats(view.id) ? true : void 0;
        sampledForReplay = session.sessionReplay === 1;
        isActive = view.sessionIsActive ? void 0 : false;
      } else {
        hasReplay = recorderApi2.isRecording() ? true : void 0;
      }
      return {
        type: eventType,
        session: {
          id: session.id,
          type: "user",
          has_replay: hasReplay,
          sampled_for_replay: sampledForReplay,
          is_active: isActive
        }
      };
    });
    hooks.register(1, ({ startTime }) => {
      const session = sessionManager.findTrackedSession(startTime);
      if (!session) {
        return SKIPPED;
      }
      return {
        session: {
          id: session.id
        }
      };
    });
  }
  var init_sessionContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/sessionContext.js"() {
      init_esm();
      init_rawRumEvent_types();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/connectivityContext.js
  function startConnectivityContext(hooks) {
    hooks.register(0, ({ eventType }) => ({
      type: eventType,
      connectivity: getConnectivity()
    }));
  }
  var init_connectivityContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/connectivityContext.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/defaultContext.js
  function startDefaultContext(hooks, configuration, sdkName) {
    hooks.register(0, ({ eventType }) => {
      const source = configuration.source;
      return {
        type: eventType,
        _oo: {
          format_version: 2,
          drift: currentDrift(),
          configuration: {
            session_sample_rate: round(configuration.sessionSampleRate, 3),
            session_replay_sample_rate: round(configuration.sessionReplaySampleRate, 3),
            profiling_sample_rate: round(configuration.profilingSampleRate, 3),
            trace_sample_rate: round(configuration.traceSampleRate, 3),
            beta_encode_cookie_options: configuration.betaEncodeCookieOptions
          },
          browser_sdk_version: canUseEventBridge() ? "0.3.1" : void 0,
          sdk_name: sdkName
        },
        application: {
          id: configuration.applicationId
        },
        date: timeStampNow(),
        source
      };
    });
    hooks.register(1, () => ({
      application: { id: configuration.applicationId }
    }));
  }
  var init_defaultContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/defaultContext.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/contexts/trackingConsentContext.js
  function startTrackingConsentContext(hooks, trackingConsentState) {
    hooks.register(1, () => {
      const wasConsented = trackingConsentState.isGranted();
      if (!wasConsented) {
        return DISCARDED;
      }
      return SKIPPED;
    });
  }
  var init_trackingConsentContext = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/contexts/trackingConsentContext.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/hooks.js
  var createHooks;
  var init_hooks = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/hooks.js"() {
      init_esm();
      createHooks = abstractHooks;
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/event/eventCollection.js
  function startEventCollection(lifeCycle) {
    return {
      addEvent: (startTime, event, domainContext, duration) => {
        if (!allowedEventTypes.includes(event.type)) {
          return;
        }
        lifeCycle.notify(12, {
          startTime,
          rawRumEvent: event,
          domainContext,
          duration
        });
      }
    };
  }
  var allowedEventTypes;
  var init_eventCollection = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/event/eventCollection.js"() {
      init_rawRumEvent_types();
      allowedEventTypes = [
        RumEventType.ACTION,
        RumEventType.ERROR,
        RumEventType.LONG_TASK,
        RumEventType.RESOURCE,
        RumEventType.VITAL
      ];
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/startInitialViewMetricsTelemetry.js
  function startInitialViewMetricsTelemetry(lifeCycle, telemetry) {
    if (!telemetry.metricsEnabled) {
      return { stop: noop };
    }
    const { unsubscribe } = lifeCycle.subscribe(4, ({ initialViewMetrics }) => {
      if (!initialViewMetrics.largestContentfulPaint || !initialViewMetrics.navigationTimings) {
        return;
      }
      addTelemetryMetrics("Initial view metrics", {
        metrics: createCoreInitialViewMetrics(initialViewMetrics.largestContentfulPaint, initialViewMetrics.navigationTimings)
      });
      unsubscribe();
    });
    return {
      stop: unsubscribe
    };
  }
  function createCoreInitialViewMetrics(lcp, navigation) {
    return {
      lcp: {
        value: lcp.value
      },
      navigation: {
        domComplete: navigation.domComplete,
        domContentLoaded: navigation.domContentLoaded,
        domInteractive: navigation.domInteractive,
        firstByte: navigation.firstByte,
        loadEvent: navigation.loadEvent
      }
    };
  }
  var init_startInitialViewMetricsTelemetry = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/view/viewMetrics/startInitialViewMetricsTelemetry.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/boot/startRum.js
  function startRum(configuration, recorderApi2, profilerApi2, initialViewOptions, createEncoder, trackingConsentState, customVitalsState, bufferedDataObservable, sdkName) {
    const cleanupTasks2 = [];
    const lifeCycle = new LifeCycle();
    const hooks = createHooks();
    lifeCycle.subscribe(13, (event) => sendToExtension("rum", event));
    const reportError = (error) => {
      lifeCycle.notify(14, { error });
      addTelemetryDebug("Error reported to customer", { "error.message": error.message });
    };
    const pageMayExitObservable = createPageMayExitObservable(configuration);
    const pageMayExitSubscription = pageMayExitObservable.subscribe((event) => {
      lifeCycle.notify(11, event);
    });
    cleanupTasks2.push(() => pageMayExitSubscription.unsubscribe());
    const telemetry = startTelemetry("browser-rum-sdk", configuration, hooks, reportError, pageMayExitObservable, createEncoder);
    cleanupTasks2.push(telemetry.stop);
    const session = !canUseEventBridge() ? startRumSessionManager(configuration, lifeCycle, trackingConsentState) : startRumSessionManagerStub();
    if (!canUseEventBridge()) {
      const batch = startRumBatch(configuration, lifeCycle, reportError, pageMayExitObservable, session.expireObservable, createEncoder);
      cleanupTasks2.push(() => batch.stop());
      startCustomerDataTelemetry(telemetry, lifeCycle, batch.flushController.flushObservable);
    } else {
      startRumEventBridge(lifeCycle);
    }
    const domMutationObservable = createDOMMutationObservable();
    const locationChangeObservable = createLocationChangeObservable(configuration, location);
    const { observable: windowOpenObservable, stop: stopWindowOpen } = createWindowOpenObservable();
    cleanupTasks2.push(stopWindowOpen);
    startDefaultContext(hooks, configuration, sdkName);
    const pageStateHistory = startPageStateHistory(hooks, configuration);
    const viewHistory = startViewHistory(lifeCycle);
    cleanupTasks2.push(() => viewHistory.stop());
    const urlContexts = startUrlContexts(lifeCycle, hooks, locationChangeObservable, location);
    cleanupTasks2.push(() => urlContexts.stop());
    const featureFlagContexts = startFeatureFlagContexts(lifeCycle, hooks, configuration);
    startSessionContext(hooks, session, recorderApi2, viewHistory);
    startConnectivityContext(hooks);
    startTrackingConsentContext(hooks, trackingConsentState);
    const globalContext = startGlobalContext(hooks, configuration, "rum", true);
    const userContext = startUserContext(hooks, configuration, session, "rum");
    const accountContext = startAccountContext(hooks, configuration, "rum");
    const { actionContexts, addAction, addEvent, stop: stopRumEventCollection } = startRumEventCollection(lifeCycle, hooks, configuration, pageStateHistory, domMutationObservable, windowOpenObservable, reportError);
    cleanupTasks2.push(stopRumEventCollection);
    const { addTiming, startView, setViewName, setViewContext, setViewContextProperty, getViewContext, stop: stopViewCollection } = startViewCollection(lifeCycle, hooks, configuration, location, domMutationObservable, windowOpenObservable, locationChangeObservable, recorderApi2, viewHistory, initialViewOptions);
    cleanupTasks2.push(stopViewCollection);
    const { stop: stopInitialViewMetricsTelemetry } = startInitialViewMetricsTelemetry(lifeCycle, telemetry);
    cleanupTasks2.push(stopInitialViewMetricsTelemetry);
    const { stop: stopResourceCollection } = startResourceCollection(lifeCycle, configuration, pageStateHistory);
    cleanupTasks2.push(stopResourceCollection);
    if (configuration.trackLongTasks) {
      if (supportPerformanceTimingEvent(RumPerformanceEntryType.LONG_ANIMATION_FRAME)) {
        const { stop: stopLongAnimationFrameCollection } = startLongAnimationFrameCollection(lifeCycle, configuration);
        cleanupTasks2.push(stopLongAnimationFrameCollection);
      } else {
        startLongTaskCollection(lifeCycle, configuration);
      }
    }
    const { addError } = startErrorCollection(lifeCycle, configuration, bufferedDataObservable);
    bufferedDataObservable.unbuffer();
    startRequestCollection(lifeCycle, configuration, session, userContext, accountContext);
    const vitalCollection = startVitalCollection(lifeCycle, pageStateHistory, customVitalsState);
    const internalContext = startInternalContext(configuration.applicationId, session, viewHistory, actionContexts, urlContexts);
    cleanupTasks2.push(() => profilerApi2.stop());
    return {
      addAction,
      addEvent,
      addError,
      addTiming,
      addFeatureFlagEvaluation: featureFlagContexts.addFeatureFlagEvaluation,
      startView,
      setViewContext,
      setViewContextProperty,
      getViewContext,
      setViewName,
      lifeCycle,
      viewHistory,
      session,
      stopSession: () => session.expire(),
      getInternalContext: internalContext.get,
      startDurationVital: vitalCollection.startDurationVital,
      stopDurationVital: vitalCollection.stopDurationVital,
      addDurationVital: vitalCollection.addDurationVital,
      addOperationStepVital: vitalCollection.addOperationStepVital,
      globalContext,
      userContext,
      accountContext,
      telemetry,
      stop: () => {
        cleanupTasks2.forEach((task) => task());
      },
      hooks
    };
  }
  function startRumEventCollection(lifeCycle, hooks, configuration, pageStateHistory, domMutationObservable, windowOpenObservable, reportError) {
    const actionCollection = startActionCollection(lifeCycle, hooks, domMutationObservable, windowOpenObservable, configuration);
    const eventCollection = startEventCollection(lifeCycle);
    const displayContext = startDisplayContext(hooks, configuration);
    const ciVisibilityContext = startCiVisibilityContext(configuration, hooks);
    startSyntheticsContext(hooks);
    startRumAssembly(configuration, lifeCycle, hooks, reportError);
    return {
      pageStateHistory,
      addAction: actionCollection.addAction,
      addEvent: eventCollection.addEvent,
      actionContexts: actionCollection.actionContexts,
      stop: () => {
        actionCollection.stop();
        ciVisibilityContext.stop();
        displayContext.stop();
        pageStateHistory.stop();
      }
    };
  }
  var init_startRum = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/boot/startRum.js"() {
      init_esm();
      init_domMutationObservable();
      init_windowOpenObservable();
      init_internalContext();
      init_lifeCycle();
      init_viewHistory();
      init_requestCollection();
      init_actionCollection();
      init_errorCollection();
      init_resourceCollection();
      init_viewCollection();
      init_rumSessionManager();
      init_startRumBatch();
      init_startRumEventBridge();
      init_urlContexts();
      init_locationChangeObservable();
      init_featureFlagContext();
      init_startCustomerDataTelemetry();
      init_pageStateHistory();
      init_displayContext();
      init_vitalCollection();
      init_ciVisibilityContext();
      init_longAnimationFrameCollection();
      init_performanceObservable();
      init_longTaskCollection();
      init_syntheticsContext();
      init_assembly();
      init_sessionContext();
      init_connectivityContext();
      init_defaultContext();
      init_trackingConsentContext();
      init_hooks();
      init_eventCollection();
      init_startInitialViewMetricsTelemetry();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/domain/getSessionReplayUrl.js
  function getSessionReplayUrl(configuration, { session, viewContext, errorType }) {
    const sessionId = session ? session.id : "no-session-id";
    const parameters = [];
    if (errorType !== void 0) {
      parameters.push(`error-type=${errorType}`);
    }
    if (viewContext) {
      parameters.push(`seed=${viewContext.id}`);
      parameters.push(`from=${viewContext.startClocks.timeStamp}`);
    }
    const origin = getDatadogSiteUrl(configuration);
    const path = `/rum/replay/sessions/${sessionId}`;
    return `${origin}${path}?${parameters.join("&")}`;
  }
  function getDatadogSiteUrl(rumConfiguration) {
    const site = rumConfiguration.site;
    const subdomain = rumConfiguration.subdomain || getSiteDefaultSubdomain(rumConfiguration);
    return `https://${subdomain ? `${subdomain}.` : ""}${site}`;
  }
  function getSiteDefaultSubdomain(configuration) {
    switch (configuration.site) {
      case INTAKE_SITE_US1:
      case INTAKE_SITE_EU1:
        return "";
      case INTAKE_SITE_STAGING:
        return "";
      default:
        return void 0;
    }
  }
  var init_getSessionReplayUrl = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/domain/getSessionReplayUrl.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/transport/formDataTransport.js
  function createFormDataTransport(configuration, lifeCycle, createEncoder, streamId) {
    const reportError = (error) => {
      lifeCycle.notify(14, { error });
      addTelemetryDebug("Error reported to customer", { "error.message": error.message });
    };
    const httpRequest = createHttpRequest([configuration.profilingEndpointBuilder], reportError);
    const encoder = createEncoder(streamId);
    return {
      async send({ event, ...attachments }) {
        const formData = new FormData();
        const serializedEvent = jsonStringify(event);
        if (!serializedEvent) {
          throw new Error("Failed to serialize event");
        }
        formData.append("event", new Blob([serializedEvent], { type: "application/json" }), "event.json");
        let bytesCount = serializedEvent.length;
        for (const [key, value] of objectEntries(attachments)) {
          const serializedValue = jsonStringify(value);
          if (!serializedValue) {
            throw new Error("Failed to serialize attachment");
          }
          const result = await encode(encoder, serializedValue);
          bytesCount += result.outputBytesCount;
          formData.append(key, new Blob([result.output]), key);
        }
        httpRequest.send({
          data: formData,
          bytesCount
        });
      }
    };
  }
  function encode(encoder, data) {
    return new Promise((resolve) => {
      encoder.write(data);
      encoder.finish((encoderResult) => {
        resolve(encoderResult);
      });
    });
  }
  var init_formDataTransport = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/transport/formDataTransport.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum-core/esm/index.js
  var init_esm2 = __esm({
    "node_modules/@openobserve/browser-rum-core/esm/index.js"() {
      init_rumPublicApi();
      init_rawRumEvent_types();
      init_startRum();
      init_lifeCycle();
      init_viewHistory();
      init_domMutationObservable();
      init_viewportObservable();
      init_scroll();
      init_actionNameConstants();
      init_getSelectorFromElement();
      init_htmlDomUtils();
      init_getSessionReplayUrl();
      init_resourceUtils2();
      init_privacy();
      init_privacyConstants();
      init_performanceObservable();
      init_performanceObservable();
      init_hooks();
      init_sampler();
      init_formDataTransport();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/replayStats.js
  function getSegmentsCount(viewId) {
    return getOrCreateReplayStats(viewId).segments_count;
  }
  function addSegment(viewId) {
    getOrCreateReplayStats(viewId).segments_count += 1;
  }
  function addRecord(viewId) {
    getOrCreateReplayStats(viewId).records_count += 1;
  }
  function addWroteData(viewId, additionalBytesCount) {
    getOrCreateReplayStats(viewId).segments_total_raw_size += additionalBytesCount;
  }
  function getReplayStats(viewId) {
    return statsPerView === null || statsPerView === void 0 ? void 0 : statsPerView.get(viewId);
  }
  function getOrCreateReplayStats(viewId) {
    if (!statsPerView) {
      statsPerView = /* @__PURE__ */ new Map();
    }
    let replayStats;
    if (statsPerView.has(viewId)) {
      replayStats = statsPerView.get(viewId);
    } else {
      replayStats = {
        records_count: 0,
        segments_count: 0,
        segments_total_raw_size: 0
      };
      statsPerView.set(viewId, replayStats);
      if (statsPerView.size > MAX_STATS_HISTORY) {
        deleteOldestStats();
      }
    }
    return replayStats;
  }
  function deleteOldestStats() {
    if (!statsPerView) {
      return;
    }
    const toDelete = statsPerView.keys().next().value;
    if (toDelete) {
      statsPerView.delete(toDelete);
    }
  }
  var MAX_STATS_HISTORY, statsPerView;
  var init_replayStats = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/replayStats.js"() {
      MAX_STATS_HISTORY = 1e3;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/types/sessionReplayConstants.js
  var RecordType, NodeType, IncrementalSource, MouseInteractionType, MediaInteractionType;
  var init_sessionReplayConstants = __esm({
    "node_modules/@openobserve/browser-rum/esm/types/sessionReplayConstants.js"() {
      RecordType = {
        FullSnapshot: 2,
        IncrementalSnapshot: 3,
        Meta: 4,
        Focus: 6,
        ViewEnd: 7,
        VisualViewport: 8,
        FrustrationRecord: 9
      };
      NodeType = {
        Document: 0,
        DocumentType: 1,
        Element: 2,
        Text: 3,
        CDATA: 4,
        DocumentFragment: 11
      };
      IncrementalSource = {
        Mutation: 0,
        MouseMove: 1,
        MouseInteraction: 2,
        Scroll: 3,
        ViewportResize: 4,
        Input: 5,
        TouchMove: 6,
        MediaInteraction: 7,
        StyleSheetRule: 8
        // CanvasMutation : 9,
        // Font : 10,
      };
      MouseInteractionType = {
        MouseUp: 0,
        MouseDown: 1,
        Click: 2,
        ContextMenu: 3,
        DblClick: 4,
        Focus: 5,
        Blur: 6,
        TouchStart: 7,
        TouchEnd: 9
      };
      MediaInteractionType = {
        Play: 0,
        Pause: 1
      };
    }
  });

  // node_modules/@openobserve/browser-rum/esm/types/index.js
  var init_types = __esm({
    "node_modules/@openobserve/browser-rum/esm/types/index.js"() {
      init_sessionReplayConstants();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/eventsUtils.js
  function isTouchEvent(event) {
    return Boolean(event.changedTouches);
  }
  function getEventTarget(event) {
    if (event.composed === true && isNodeShadowHost(event.target)) {
      return event.composedPath()[0];
    }
    return event.target;
  }
  var init_eventsUtils = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/eventsUtils.js"() {
      init_esm2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/viewports.js
  function isVisualViewportFactoredIn(visualViewport) {
    return Math.abs(visualViewport.pageTop - visualViewport.offsetTop - window.scrollY) > TOLERANCE || Math.abs(visualViewport.pageLeft - visualViewport.offsetLeft - window.scrollX) > TOLERANCE;
  }
  var TOLERANCE, convertMouseEventToLayoutCoordinates, getVisualViewport;
  var init_viewports = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/viewports.js"() {
      TOLERANCE = 25;
      convertMouseEventToLayoutCoordinates = (clientX, clientY) => {
        const visualViewport = window.visualViewport;
        const normalized = {
          layoutViewportX: clientX,
          layoutViewportY: clientY,
          visualViewportX: clientX,
          visualViewportY: clientY
        };
        if (!visualViewport) {
          return normalized;
        } else if (isVisualViewportFactoredIn(visualViewport)) {
          normalized.layoutViewportX = Math.round(clientX + visualViewport.offsetLeft);
          normalized.layoutViewportY = Math.round(clientY + visualViewport.offsetTop);
        } else {
          normalized.visualViewportX = Math.round(clientX - visualViewport.offsetLeft);
          normalized.visualViewportY = Math.round(clientY - visualViewport.offsetTop);
        }
        return normalized;
      };
      getVisualViewport = (visualViewport) => ({
        scale: visualViewport.scale,
        offsetLeft: visualViewport.offsetLeft,
        offsetTop: visualViewport.offsetTop,
        pageLeft: visualViewport.pageLeft,
        pageTop: visualViewport.pageTop,
        height: visualViewport.height,
        width: visualViewport.width
      });
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/assembly.js
  function assembleIncrementalSnapshot(source, data) {
    return {
      data: {
        source,
        ...data
      },
      type: RecordType.IncrementalSnapshot,
      timestamp: timeStampNow()
    };
  }
  var init_assembly2 = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/assembly.js"() {
      init_esm();
      init_types();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMove.js
  function trackMove(configuration, scope, moveCb) {
    const { throttled: updatePosition, cancel: cancelThrottle } = throttle((event) => {
      const target = getEventTarget(event);
      const id = scope.nodeIds.get(target);
      if (id === void 0) {
        return;
      }
      const coordinates = tryToComputeCoordinates(event);
      if (!coordinates) {
        return;
      }
      const position = {
        id,
        timeOffset: 0,
        x: coordinates.x,
        y: coordinates.y
      };
      moveCb(assembleIncrementalSnapshot(isTouchEvent(event) ? IncrementalSource.TouchMove : IncrementalSource.MouseMove, { positions: [position] }));
    }, MOUSE_MOVE_OBSERVER_THRESHOLD, {
      trailing: false
    });
    const { stop: removeListener } = addEventListeners(configuration, document, [
      "mousemove",
      "touchmove"
      /* DOM_EVENT.TOUCH_MOVE */
    ], updatePosition, {
      capture: true,
      passive: true
    });
    return {
      stop: () => {
        removeListener();
        cancelThrottle();
      }
    };
  }
  function tryToComputeCoordinates(event) {
    let { clientX: x, clientY: y } = isTouchEvent(event) ? event.changedTouches[0] : event;
    if (window.visualViewport) {
      const { visualViewportX, visualViewportY } = convertMouseEventToLayoutCoordinates(x, y);
      x = visualViewportX;
      y = visualViewportY;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return void 0;
    }
    return { x, y };
  }
  var MOUSE_MOVE_OBSERVER_THRESHOLD;
  var init_trackMove = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMove.js"() {
      init_esm();
      init_types();
      init_eventsUtils();
      init_viewports();
      init_assembly2();
      MOUSE_MOVE_OBSERVER_THRESHOLD = 50;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMouseInteraction.js
  function trackMouseInteraction(configuration, scope, mouseInteractionCb, recordIds) {
    const handler = (event) => {
      const target = getEventTarget(event);
      const id = scope.nodeIds.get(target);
      if (id === void 0 || getNodePrivacyLevel(target, configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
        return;
      }
      const type = eventTypeToMouseInteraction[event.type];
      let interaction;
      if (type !== MouseInteractionType.Blur && type !== MouseInteractionType.Focus) {
        const coordinates = tryToComputeCoordinates(event);
        if (!coordinates) {
          return;
        }
        interaction = { id, type, x: coordinates.x, y: coordinates.y };
      } else {
        interaction = { id, type };
      }
      const record2 = {
        id: recordIds.getIdForEvent(event),
        ...assembleIncrementalSnapshot(IncrementalSource.MouseInteraction, interaction)
      };
      mouseInteractionCb(record2);
    };
    return addEventListeners(configuration, document, Object.keys(eventTypeToMouseInteraction), handler, {
      capture: true,
      passive: true
    });
  }
  var eventTypeToMouseInteraction;
  var init_trackMouseInteraction = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMouseInteraction.js"() {
      init_esm();
      init_esm2();
      init_types();
      init_assembly2();
      init_eventsUtils();
      init_trackMove();
      eventTypeToMouseInteraction = {
        // Listen for pointerup DOM events instead of mouseup for MouseInteraction/MouseUp records. This
        // allows to reference such records from Frustration records.
        //
        // In the context of supporting Mobile Session Replay, we introduced `PointerInteraction` records
        // used by the Mobile SDKs in place of `MouseInteraction`. In the future, we should replace
        // `MouseInteraction` by `PointerInteraction` in the Browser SDK so we have an uniform way to
        // convey such interaction. This would cleanly solve the issue since we would have
        // `PointerInteraction/Up` records that we could reference from `Frustration` records.
        [
          "pointerup"
          /* DOM_EVENT.POINTER_UP */
        ]: MouseInteractionType.MouseUp,
        [
          "mousedown"
          /* DOM_EVENT.MOUSE_DOWN */
        ]: MouseInteractionType.MouseDown,
        [
          "click"
          /* DOM_EVENT.CLICK */
        ]: MouseInteractionType.Click,
        [
          "contextmenu"
          /* DOM_EVENT.CONTEXT_MENU */
        ]: MouseInteractionType.ContextMenu,
        [
          "dblclick"
          /* DOM_EVENT.DBL_CLICK */
        ]: MouseInteractionType.DblClick,
        [
          "focus"
          /* DOM_EVENT.FOCUS */
        ]: MouseInteractionType.Focus,
        [
          "blur"
          /* DOM_EVENT.BLUR */
        ]: MouseInteractionType.Blur,
        [
          "touchstart"
          /* DOM_EVENT.TOUCH_START */
        ]: MouseInteractionType.TouchStart,
        [
          "touchend"
          /* DOM_EVENT.TOUCH_END */
        ]: MouseInteractionType.TouchEnd
      };
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackScroll.js
  function trackScroll(configuration, scope, scrollCb, elementsScrollPositions, target = document) {
    const { throttled: updatePosition, cancel: cancelThrottle } = throttle((event) => {
      const target2 = getEventTarget(event);
      if (!target2) {
        return;
      }
      const id = scope.nodeIds.get(target2);
      if (id === void 0 || getNodePrivacyLevel(target2, configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
        return;
      }
      const scrollPositions = target2 === document ? {
        scrollTop: getScrollY(),
        scrollLeft: getScrollX()
      } : {
        scrollTop: Math.round(target2.scrollTop),
        scrollLeft: Math.round(target2.scrollLeft)
      };
      elementsScrollPositions.set(target2, scrollPositions);
      scrollCb(assembleIncrementalSnapshot(IncrementalSource.Scroll, {
        id,
        x: scrollPositions.scrollLeft,
        y: scrollPositions.scrollTop
      }));
    }, SCROLL_OBSERVER_THRESHOLD);
    const { stop: removeListener } = addEventListener(configuration, target, "scroll", updatePosition, {
      capture: true,
      passive: true
    });
    return {
      stop: () => {
        removeListener();
        cancelThrottle();
      }
    };
  }
  var SCROLL_OBSERVER_THRESHOLD;
  var init_trackScroll = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackScroll.js"() {
      init_esm();
      init_esm2();
      init_eventsUtils();
      init_types();
      init_assembly2();
      SCROLL_OBSERVER_THRESHOLD = 100;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackViewportResize.js
  function trackViewportResize(configuration, viewportResizeCb) {
    const viewportResizeSubscription = initViewportObservable(configuration).subscribe((data) => {
      viewportResizeCb(assembleIncrementalSnapshot(IncrementalSource.ViewportResize, data));
    });
    return {
      stop: () => {
        viewportResizeSubscription.unsubscribe();
      }
    };
  }
  function trackVisualViewportResize(configuration, visualViewportResizeCb) {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return { stop: noop };
    }
    const { throttled: updateDimension, cancel: cancelThrottle } = throttle(() => {
      visualViewportResizeCb({
        data: getVisualViewport(visualViewport),
        type: RecordType.VisualViewport,
        timestamp: timeStampNow()
      });
    }, VISUAL_VIEWPORT_OBSERVER_THRESHOLD, {
      trailing: false
    });
    const { stop: removeListener } = addEventListeners(configuration, visualViewport, [
      "resize",
      "scroll"
      /* DOM_EVENT.SCROLL */
    ], updateDimension, {
      capture: true,
      passive: true
    });
    return {
      stop: () => {
        removeListener();
        cancelThrottle();
      }
    };
  }
  var VISUAL_VIEWPORT_OBSERVER_THRESHOLD;
  var init_trackViewportResize = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackViewportResize.js"() {
      init_esm();
      init_esm2();
      init_types();
      init_viewports();
      init_assembly2();
      VISUAL_VIEWPORT_OBSERVER_THRESHOLD = 200;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMediaInteraction.js
  function trackMediaInteraction(configuration, scope, mediaInteractionCb) {
    return addEventListeners(configuration, document, [
      "play",
      "pause"
      /* DOM_EVENT.PAUSE */
    ], (event) => {
      const target = getEventTarget(event);
      if (!target) {
        return;
      }
      const id = scope.nodeIds.get(target);
      if (id === void 0 || getNodePrivacyLevel(target, configuration.defaultPrivacyLevel) === NodePrivacyLevel.HIDDEN) {
        return;
      }
      mediaInteractionCb(assembleIncrementalSnapshot(IncrementalSource.MediaInteraction, {
        id,
        type: event.type === "play" ? MediaInteractionType.Play : MediaInteractionType.Pause
      }));
    }, {
      capture: true,
      passive: true
    });
  }
  var init_trackMediaInteraction = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMediaInteraction.js"() {
      init_esm();
      init_esm2();
      init_types();
      init_eventsUtils();
      init_assembly2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackStyleSheet.js
  function trackStyleSheet(scope, styleSheetCb) {
    function checkStyleSheetAndCallback(styleSheet, callback) {
      if (!styleSheet || !styleSheet.ownerNode) {
        return;
      }
      const id = scope.nodeIds.get(styleSheet.ownerNode);
      if (id === void 0) {
        return;
      }
      callback(id);
    }
    const instrumentationStoppers = [
      instrumentMethod(CSSStyleSheet.prototype, "insertRule", ({ target: styleSheet, parameters: [rule, index] }) => {
        checkStyleSheetAndCallback(styleSheet, (id) => styleSheetCb(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
          id,
          adds: [{ rule, index }]
        })));
      }),
      instrumentMethod(CSSStyleSheet.prototype, "deleteRule", ({ target: styleSheet, parameters: [index] }) => {
        checkStyleSheetAndCallback(styleSheet, (id) => styleSheetCb(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
          id,
          removes: [{ index }]
        })));
      })
    ];
    if (typeof CSSGroupingRule !== "undefined") {
      instrumentGroupingCSSRuleClass(CSSGroupingRule);
    } else {
      instrumentGroupingCSSRuleClass(CSSMediaRule);
      instrumentGroupingCSSRuleClass(CSSSupportsRule);
    }
    function instrumentGroupingCSSRuleClass(cls) {
      instrumentationStoppers.push(instrumentMethod(cls.prototype, "insertRule", ({ target: styleSheet, parameters: [rule, index] }) => {
        checkStyleSheetAndCallback(styleSheet.parentStyleSheet, (id) => {
          const path = getPathToNestedCSSRule(styleSheet);
          if (path) {
            path.push(index || 0);
            styleSheetCb(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
              id,
              adds: [{ rule, index: path }]
            }));
          }
        });
      }), instrumentMethod(cls.prototype, "deleteRule", ({ target: styleSheet, parameters: [index] }) => {
        checkStyleSheetAndCallback(styleSheet.parentStyleSheet, (id) => {
          const path = getPathToNestedCSSRule(styleSheet);
          if (path) {
            path.push(index);
            styleSheetCb(assembleIncrementalSnapshot(IncrementalSource.StyleSheetRule, {
              id,
              removes: [{ index: path }]
            }));
          }
        });
      }));
    }
    return {
      stop: () => {
        instrumentationStoppers.forEach((stopper) => stopper.stop());
      }
    };
  }
  function getPathToNestedCSSRule(rule) {
    const path = [];
    let currentRule = rule;
    while (currentRule.parentRule) {
      const rules2 = Array.from(currentRule.parentRule.cssRules);
      const index2 = rules2.indexOf(currentRule);
      path.unshift(index2);
      currentRule = currentRule.parentRule;
    }
    if (!currentRule.parentStyleSheet) {
      return;
    }
    const rules = Array.from(currentRule.parentStyleSheet.cssRules);
    const index = rules.indexOf(currentRule);
    path.unshift(index);
    return path;
  }
  var init_trackStyleSheet = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackStyleSheet.js"() {
      init_esm();
      init_types();
      init_assembly2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackFocus.js
  function trackFocus(configuration, focusCb) {
    return addEventListeners(configuration, window, [
      "focus",
      "blur"
      /* DOM_EVENT.BLUR */
    ], () => {
      focusCb({
        data: { has_focus: document.hasFocus() },
        type: RecordType.Focus,
        timestamp: timeStampNow()
      });
    });
  }
  var init_trackFocus = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackFocus.js"() {
      init_esm();
      init_types();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackFrustration.js
  function trackFrustration(lifeCycle, frustrationCb, recordIds) {
    const frustrationSubscription = lifeCycle.subscribe(12, (data) => {
      var _a, _b;
      if (data.rawRumEvent.type === RumEventType.ACTION && data.rawRumEvent.action.type === ActionType.CLICK && ((_b = (_a = data.rawRumEvent.action.frustration) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.length) && "events" in data.domainContext && data.domainContext.events && data.domainContext.events.length) {
        frustrationCb({
          timestamp: data.rawRumEvent.date,
          type: RecordType.FrustrationRecord,
          data: {
            frustrationTypes: data.rawRumEvent.action.frustration.type,
            recordIds: data.domainContext.events.map((e) => recordIds.getIdForEvent(e))
          }
        });
      }
    });
    return {
      stop: () => {
        frustrationSubscription.unsubscribe();
      }
    };
  }
  var init_trackFrustration = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackFrustration.js"() {
      init_esm2();
      init_types();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackViewEnd.js
  function trackViewEnd(lifeCycle, viewEndCb) {
    const viewEndSubscription = lifeCycle.subscribe(5, () => {
      viewEndCb({
        timestamp: timeStampNow(),
        type: RecordType.ViewEnd
      });
    });
    return {
      stop: () => {
        viewEndSubscription.unsubscribe();
      }
    };
  }
  var init_trackViewEnd = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackViewEnd.js"() {
      init_esm();
      init_types();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationUtils.js
  function getElementInputValue(element, nodePrivacyLevel) {
    const tagName = element.tagName;
    const value = element.value;
    if (shouldMaskNode(element, nodePrivacyLevel)) {
      const type = element.type;
      if (tagName === "INPUT" && (type === "button" || type === "submit" || type === "reset")) {
        return value;
      } else if (!value || tagName === "OPTION") {
        return;
      }
      return CENSORED_STRING_MARK;
    }
    if (tagName === "OPTION" || tagName === "SELECT") {
      return element.value;
    }
    if (tagName !== "INPUT" && tagName !== "TEXTAREA") {
      return;
    }
    return value;
  }
  function switchToAbsoluteUrl(cssText, cssHref) {
    return cssText.replace(URL_IN_CSS_REF, (matchingSubstring, singleQuote, urlWrappedInSingleQuotes, doubleQuote, urlWrappedInDoubleQuotes, urlNotWrappedInQuotes) => {
      const url = urlWrappedInSingleQuotes || urlWrappedInDoubleQuotes || urlNotWrappedInQuotes;
      if (!cssHref || !url || ABSOLUTE_URL.test(url) || DATA_URI.test(url)) {
        return matchingSubstring;
      }
      const quote = singleQuote || doubleQuote || "";
      return `url(${quote}${makeUrlAbsolute(url, cssHref)}${quote})`;
    });
  }
  function makeUrlAbsolute(url, baseUrl) {
    try {
      return buildUrl(url, baseUrl).href;
    } catch (_a) {
      return url;
    }
  }
  function getValidTagName(tagName) {
    const processedTagName = tagName.toLowerCase().trim();
    if (TAG_NAME_REGEX.test(processedTagName)) {
      return "div";
    }
    return processedTagName;
  }
  function censoredImageForSize(width, height) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' style='background-color:silver'%3E%3C/svg%3E`;
  }
  var URL_IN_CSS_REF, ABSOLUTE_URL, DATA_URI, TAG_NAME_REGEX;
  var init_serializationUtils = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationUtils.js"() {
      init_esm();
      init_esm2();
      URL_IN_CSS_REF = /url\((?:(')([^']*)'|(")([^"]*)"|([^)]*))\)/gm;
      ABSOLUTE_URL = /^[A-Za-z]+:|^\/\//;
      DATA_URI = /^["']?data:.*,/i;
      TAG_NAME_REGEX = /[^a-z1-6-_]/;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeStyleSheets.js
  function serializeStyleSheets(cssStyleSheets) {
    if (cssStyleSheets === void 0 || cssStyleSheets.length === 0) {
      return void 0;
    }
    return cssStyleSheets.map((cssStyleSheet) => {
      const rules = cssStyleSheet.cssRules || cssStyleSheet.rules;
      const cssRules = Array.from(rules, (cssRule) => cssRule.cssText);
      const styleSheet = {
        cssRules,
        disabled: cssStyleSheet.disabled || void 0,
        media: cssStyleSheet.media.length > 0 ? Array.from(cssStyleSheet.media) : void 0
      };
      return styleSheet;
    });
  }
  var init_serializeStyleSheets = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeStyleSheets.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeAttribute.js
  function serializeAttribute(element, nodePrivacyLevel, attributeName, configuration) {
    if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      return null;
    }
    const attributeValue = element.getAttribute(attributeName);
    const tagName = element.tagName;
    if (shouldMaskAttribute(tagName, attributeName, attributeValue, nodePrivacyLevel, configuration)) {
      if (tagName === "IMG") {
        const image = element;
        if (image.naturalWidth > 0) {
          return censoredImageForSize(image.naturalWidth, image.naturalHeight);
        }
        const { width, height } = element.getBoundingClientRect();
        if (width > 0 || height > 0) {
          return censoredImageForSize(width, height);
        }
        return CENSORED_IMG_MARK;
      }
      if (tagName === "SOURCE") {
        return CENSORED_IMG_MARK;
      }
      return CENSORED_STRING_MARK;
    }
    if (!attributeValue || typeof attributeValue !== "string") {
      return attributeValue;
    }
    return sanitizeIfLongDataUrl(attributeValue, MAX_ATTRIBUTE_VALUE_CHAR_LENGTH);
  }
  var MAX_ATTRIBUTE_VALUE_CHAR_LENGTH;
  var init_serializeAttribute = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeAttribute.js"() {
      init_esm2();
      init_serializationUtils();
      MAX_ATTRIBUTE_VALUE_CHAR_LENGTH = 1e6;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationStats.js
  function createSerializationStats() {
    return {
      cssText: {
        count: 0,
        max: 0,
        sum: 0
      },
      serializationDuration: {
        count: 0,
        max: 0,
        sum: 0
      }
    };
  }
  function updateSerializationStats(stats, metric, value) {
    stats[metric].count += 1;
    stats[metric].max = Math.max(stats[metric].max, value);
    stats[metric].sum += value;
  }
  function aggregateSerializationStats(aggregateStats, stats) {
    for (const metric of ["cssText", "serializationDuration"]) {
      aggregateStats[metric].count += stats[metric].count;
      aggregateStats[metric].max = Math.max(aggregateStats[metric].max, stats[metric].max);
      aggregateStats[metric].sum += stats[metric].sum;
    }
  }
  var init_serializationStats = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationStats.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeAttributes.js
  function serializeAttributes(element, nodePrivacyLevel, options) {
    if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      return {};
    }
    const safeAttrs = {};
    const tagName = getValidTagName(element.tagName);
    const doc = element.ownerDocument;
    for (let i = 0; i < element.attributes.length; i += 1) {
      const attribute = element.attributes.item(i);
      const attributeName = attribute.name;
      const attributeValue = serializeAttribute(element, nodePrivacyLevel, attributeName, options.configuration);
      if (attributeValue !== null) {
        safeAttrs[attributeName] = attributeValue;
      }
    }
    if (element.value && (tagName === "textarea" || tagName === "select" || tagName === "option" || tagName === "input")) {
      const formValue = getElementInputValue(element, nodePrivacyLevel);
      if (formValue !== void 0) {
        safeAttrs.value = formValue;
      }
    }
    if (tagName === "option" && nodePrivacyLevel === NodePrivacyLevel.ALLOW) {
      const optionElement = element;
      if (optionElement.selected) {
        safeAttrs.selected = optionElement.selected;
      }
    }
    if (tagName === "link") {
      const stylesheet = Array.from(doc.styleSheets).find((s) => s.href === element.href);
      const cssText = getCssRulesString(stylesheet);
      if (cssText && stylesheet) {
        updateSerializationStats(options.serializationContext.serializationStats, "cssText", cssText.length);
        safeAttrs._cssText = cssText;
      }
    }
    if (tagName === "style" && element.sheet) {
      const cssText = getCssRulesString(element.sheet);
      if (cssText) {
        updateSerializationStats(options.serializationContext.serializationStats, "cssText", cssText.length);
        safeAttrs._cssText = cssText;
      }
    }
    const inputElement = element;
    if (tagName === "input" && (inputElement.type === "radio" || inputElement.type === "checkbox")) {
      if (nodePrivacyLevel === NodePrivacyLevel.ALLOW) {
        safeAttrs.checked = !!inputElement.checked;
      } else if (shouldMaskNode(inputElement, nodePrivacyLevel)) {
        delete safeAttrs.checked;
      }
    }
    if (tagName === "audio" || tagName === "video") {
      const mediaElement = element;
      safeAttrs.rr_mediaState = mediaElement.paused ? "paused" : "played";
    }
    let scrollTop;
    let scrollLeft;
    const serializationContext = options.serializationContext;
    switch (serializationContext.status) {
      case 0:
        scrollTop = Math.round(element.scrollTop);
        scrollLeft = Math.round(element.scrollLeft);
        if (scrollTop || scrollLeft) {
          serializationContext.elementsScrollPositions.set(element, { scrollTop, scrollLeft });
        }
        break;
      case 1:
        if (serializationContext.elementsScrollPositions.has(element)) {
          ;
          ({ scrollTop, scrollLeft } = serializationContext.elementsScrollPositions.get(element));
        }
        break;
    }
    if (scrollLeft) {
      safeAttrs.rr_scrollLeft = scrollLeft;
    }
    if (scrollTop) {
      safeAttrs.rr_scrollTop = scrollTop;
    }
    return safeAttrs;
  }
  function getCssRulesString(cssStyleSheet) {
    if (!cssStyleSheet) {
      return null;
    }
    let rules;
    try {
      rules = cssStyleSheet.rules || cssStyleSheet.cssRules;
    } catch (_a) {
    }
    if (!rules) {
      return null;
    }
    const styleSheetCssText = Array.from(rules, isSafari() ? getCssRuleStringForSafari : getCssRuleString).join("");
    return switchToAbsoluteUrl(styleSheetCssText, cssStyleSheet.href);
  }
  function getCssRuleStringForSafari(rule) {
    if (isCSSStyleRule(rule) && rule.selectorText.includes(":")) {
      const escapeColon = /(\[[\w-]+[^\\])(:[^\]]+\])/g;
      return rule.cssText.replace(escapeColon, "$1\\$2");
    }
    return getCssRuleString(rule);
  }
  function getCssRuleString(rule) {
    return isCSSImportRule(rule) && getCssRulesString(rule.styleSheet) || rule.cssText;
  }
  function isCSSImportRule(rule) {
    return "styleSheet" in rule;
  }
  function isCSSStyleRule(rule) {
    return "selectorText" in rule;
  }
  var init_serializeAttributes = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeAttributes.js"() {
      init_esm2();
      init_esm();
      init_serializationUtils();
      init_serializeAttribute();
      init_serializationStats();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeNode.js
  function serializeNodeWithId(node, parentNodePrivacyLevel, options) {
    const serializedNode = serializeNode(node, parentNodePrivacyLevel, options);
    if (!serializedNode) {
      return null;
    }
    const id = options.scope.nodeIds.assign(node);
    const serializedNodeWithId = serializedNode;
    serializedNodeWithId.id = id;
    if (options.serializedNodeIds) {
      options.serializedNodeIds.add(id);
    }
    return serializedNodeWithId;
  }
  function serializeChildNodes(node, parentNodePrivacyLevel, options) {
    const result = [];
    forEachChildNodes(node, (childNode) => {
      const serializedChildNode = serializeNodeWithId(childNode, parentNodePrivacyLevel, options);
      if (serializedChildNode) {
        result.push(serializedChildNode);
      }
    });
    return result;
  }
  function serializeNode(node, parentNodePrivacyLevel, options) {
    switch (node.nodeType) {
      case node.DOCUMENT_NODE:
        return serializeDocumentNode(node, parentNodePrivacyLevel, options);
      case node.DOCUMENT_FRAGMENT_NODE:
        return serializeDocumentFragmentNode(node, parentNodePrivacyLevel, options);
      case node.DOCUMENT_TYPE_NODE:
        return serializeDocumentTypeNode(node);
      case node.ELEMENT_NODE:
        return serializeElementNode(node, parentNodePrivacyLevel, options);
      case node.TEXT_NODE:
        return serializeTextNode(node, parentNodePrivacyLevel);
      case node.CDATA_SECTION_NODE:
        return serializeCDataNode();
    }
  }
  function serializeDocumentNode(document2, parentNodePrivacyLevel, options) {
    return {
      type: NodeType.Document,
      childNodes: serializeChildNodes(document2, parentNodePrivacyLevel, options),
      adoptedStyleSheets: serializeStyleSheets(document2.adoptedStyleSheets)
    };
  }
  function serializeDocumentFragmentNode(element, parentNodePrivacyLevel, options) {
    const isShadowRoot = isNodeShadowRoot(element);
    if (isShadowRoot) {
      options.serializationContext.shadowRootsController.addShadowRoot(element);
    }
    return {
      type: NodeType.DocumentFragment,
      childNodes: serializeChildNodes(element, parentNodePrivacyLevel, options),
      isShadowRoot,
      adoptedStyleSheets: isShadowRoot ? serializeStyleSheets(element.adoptedStyleSheets) : void 0
    };
  }
  function serializeDocumentTypeNode(documentType) {
    return {
      type: NodeType.DocumentType,
      name: documentType.name,
      publicId: documentType.publicId,
      systemId: documentType.systemId
    };
  }
  function serializeElementNode(element, parentNodePrivacyLevel, options) {
    const tagName = getValidTagName(element.tagName);
    const isSVG = isSVGElement(element) || void 0;
    const nodePrivacyLevel = reducePrivacyLevel(getNodeSelfPrivacyLevel(element), parentNodePrivacyLevel);
    if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
      const { width, height } = element.getBoundingClientRect();
      return {
        type: NodeType.Element,
        tagName,
        attributes: {
          rr_width: `${width}px`,
          rr_height: `${height}px`,
          [PRIVACY_ATTR_NAME]: PRIVACY_ATTR_VALUE_HIDDEN
        },
        childNodes: [],
        isSVG
      };
    }
    if (nodePrivacyLevel === NodePrivacyLevel.IGNORE) {
      return;
    }
    const attributes = serializeAttributes(element, nodePrivacyLevel, options);
    let childNodes = [];
    if (hasChildNodes(element) && // Do not serialize style children as the css rules are already in the _cssText attribute
    tagName !== "style") {
      childNodes = serializeChildNodes(element, nodePrivacyLevel, options);
    }
    return {
      type: NodeType.Element,
      tagName,
      attributes,
      childNodes,
      isSVG
    };
  }
  function isSVGElement(el) {
    return el.tagName === "svg" || el instanceof SVGElement;
  }
  function serializeTextNode(textNode, parentNodePrivacyLevel) {
    const textContent = getTextContent(textNode, parentNodePrivacyLevel);
    if (textContent === void 0) {
      return;
    }
    return {
      type: NodeType.Text,
      textContent
    };
  }
  function serializeCDataNode() {
    return {
      type: NodeType.CDATA,
      textContent: ""
    };
  }
  var init_serializeNode = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeNode.js"() {
      init_esm2();
      init_types();
      init_serializationUtils();
      init_serializeStyleSheets();
      init_serializeAttributes();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeDocument.js
  function serializeDocument(document2, configuration, scope, serializationContext) {
    const serializationStart = timeStampNow();
    const serializedNode = serializeNodeWithId(document2, configuration.defaultPrivacyLevel, {
      serializationContext,
      configuration,
      scope
    });
    updateSerializationStats(serializationContext.serializationStats, "serializationDuration", elapsed(serializationStart, timeStampNow()));
    return serializedNode;
  }
  var init_serializeDocument = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializeDocument.js"() {
      init_esm();
      init_serializeNode();
      init_serializationStats();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationScope.js
  function createSerializationScope(nodeIds) {
    return { nodeIds };
  }
  var init_serializationScope = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/serializationScope.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/serialization/index.js
  var init_serialization = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/serialization/index.js"() {
      init_serializationUtils();
      init_serializeDocument();
      init_serializeNode();
      init_serializeAttribute();
      init_serializationScope();
      init_serializationStats();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackInput.js
  function trackInput(configuration, scope, inputCb, target = document) {
    const defaultPrivacyLevel = configuration.defaultPrivacyLevel;
    const lastInputStateMap = /* @__PURE__ */ new WeakMap();
    const isShadowRoot = target !== document;
    const { stop: stopEventListeners } = addEventListeners(
      configuration,
      target,
      // The 'input' event bubbles across shadow roots, so we don't have to listen for it on shadow
      // roots since it will be handled by the event listener that we did add to the document. Only
      // the 'change' event is blocked and needs to be handled on shadow roots.
      isShadowRoot ? [
        "change"
        /* DOM_EVENT.CHANGE */
      ] : [
        "input",
        "change"
        /* DOM_EVENT.CHANGE */
      ],
      (event) => {
        const target2 = getEventTarget(event);
        if (target2 instanceof HTMLInputElement || target2 instanceof HTMLTextAreaElement || target2 instanceof HTMLSelectElement) {
          onElementChange(target2);
        }
      },
      {
        capture: true,
        passive: true
      }
    );
    let stopPropertySetterInstrumentation;
    if (!isShadowRoot) {
      const instrumentationStoppers = [
        instrumentSetter(HTMLInputElement.prototype, "value", onElementChange),
        instrumentSetter(HTMLInputElement.prototype, "checked", onElementChange),
        instrumentSetter(HTMLSelectElement.prototype, "value", onElementChange),
        instrumentSetter(HTMLTextAreaElement.prototype, "value", onElementChange),
        instrumentSetter(HTMLSelectElement.prototype, "selectedIndex", onElementChange)
      ];
      stopPropertySetterInstrumentation = () => {
        instrumentationStoppers.forEach((stopper) => stopper.stop());
      };
    } else {
      stopPropertySetterInstrumentation = noop;
    }
    return {
      stop: () => {
        stopPropertySetterInstrumentation();
        stopEventListeners();
      }
    };
    function onElementChange(target2) {
      const nodePrivacyLevel = getNodePrivacyLevel(target2, defaultPrivacyLevel);
      if (nodePrivacyLevel === NodePrivacyLevel.HIDDEN) {
        return;
      }
      const type = target2.type;
      let inputState;
      if (type === "radio" || type === "checkbox") {
        if (shouldMaskNode(target2, nodePrivacyLevel)) {
          return;
        }
        inputState = { isChecked: target2.checked };
      } else {
        const value = getElementInputValue(target2, nodePrivacyLevel);
        if (value === void 0) {
          return;
        }
        inputState = { text: value };
      }
      cbWithDedup(target2, inputState, scope);
      const name = target2.name;
      if (type === "radio" && name && target2.checked) {
        document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`).forEach((el) => {
          if (el !== target2) {
            cbWithDedup(el, { isChecked: false }, scope);
          }
        });
      }
    }
    function cbWithDedup(target2, inputState, scope2) {
      const id = scope2.nodeIds.get(target2);
      if (id === void 0) {
        return;
      }
      const lastInputState = lastInputStateMap.get(target2);
      if (!lastInputState || lastInputState.text !== inputState.text || lastInputState.isChecked !== inputState.isChecked) {
        lastInputStateMap.set(target2, inputState);
        inputCb(assembleIncrementalSnapshot(IncrementalSource.Input, {
          id,
          ...inputState
        }));
      }
    }
  }
  var init_trackInput = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackInput.js"() {
      init_esm();
      init_esm2();
      init_types();
      init_eventsUtils();
      init_serialization();
      init_assembly2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/mutationBatch.js
  function createMutationBatch(processMutationBatch) {
    let cancelScheduledFlush = noop;
    let pendingMutations = [];
    function flush() {
      cancelScheduledFlush();
      processMutationBatch(pendingMutations);
      pendingMutations = [];
    }
    const { throttled: throttledFlush, cancel: cancelThrottle } = throttle(flush, MUTATION_PROCESS_MIN_DELAY, {
      leading: false
    });
    return {
      addMutations: (mutations) => {
        if (pendingMutations.length === 0) {
          cancelScheduledFlush = requestIdleCallback(throttledFlush, { timeout: MUTATION_PROCESS_MAX_DELAY });
        }
        pendingMutations.push(...mutations);
      },
      flush,
      stop: () => {
        cancelScheduledFlush();
        cancelThrottle();
      }
    };
  }
  var MUTATION_PROCESS_MAX_DELAY, MUTATION_PROCESS_MIN_DELAY;
  var init_mutationBatch = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/mutationBatch.js"() {
      init_esm();
      MUTATION_PROCESS_MAX_DELAY = 100;
      MUTATION_PROCESS_MIN_DELAY = 16;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMutation.js
  function trackMutation(mutationCallback, configuration, scope, shadowRootsController, target) {
    const MutationObserver = getMutationObserverConstructor();
    if (!MutationObserver) {
      return { stop: noop, flush: noop };
    }
    const mutationBatch = createMutationBatch((mutations) => {
      processMutations(mutations.concat(observer2.takeRecords()), mutationCallback, configuration, scope, shadowRootsController);
    });
    const observer2 = new MutationObserver(monitor(mutationBatch.addMutations));
    observer2.observe(target, {
      attributeOldValue: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true
    });
    return {
      stop: () => {
        observer2.disconnect();
        mutationBatch.stop();
      },
      flush: () => {
        mutationBatch.flush();
      }
    };
  }
  function processMutations(mutations, mutationCallback, configuration, scope, shadowRootsController) {
    const nodePrivacyLevelCache = /* @__PURE__ */ new Map();
    mutations.filter((mutation) => mutation.type === "childList").forEach((mutation) => {
      mutation.removedNodes.forEach((removedNode) => {
        traverseRemovedShadowDom(removedNode, shadowRootsController.removeShadowRoot);
      });
    });
    const filteredMutations = mutations.filter((mutation) => mutation.target.isConnected && scope.nodeIds.areAssignedForNodeAndAncestors(mutation.target) && getNodePrivacyLevel(mutation.target, configuration.defaultPrivacyLevel, nodePrivacyLevelCache) !== NodePrivacyLevel.HIDDEN);
    const serializationStats = createSerializationStats();
    const { adds, removes, hasBeenSerialized } = processChildListMutations(filteredMutations.filter((mutation) => mutation.type === "childList"), configuration, scope, serializationStats, shadowRootsController, nodePrivacyLevelCache);
    const texts = processCharacterDataMutations(filteredMutations.filter((mutation) => mutation.type === "characterData" && !hasBeenSerialized(mutation.target)), configuration, scope, nodePrivacyLevelCache);
    const attributes = processAttributesMutations(filteredMutations.filter((mutation) => mutation.type === "attributes" && !hasBeenSerialized(mutation.target)), configuration, scope, nodePrivacyLevelCache);
    if (!texts.length && !attributes.length && !removes.length && !adds.length) {
      return;
    }
    mutationCallback(assembleIncrementalSnapshot(IncrementalSource.Mutation, { adds, removes, texts, attributes }), serializationStats);
  }
  function processChildListMutations(mutations, configuration, scope, serializationStats, shadowRootsController, nodePrivacyLevelCache) {
    const addedAndMovedNodes = /* @__PURE__ */ new Set();
    const removedNodes = /* @__PURE__ */ new Map();
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        addedAndMovedNodes.add(node);
      });
      mutation.removedNodes.forEach((node) => {
        if (!addedAndMovedNodes.has(node)) {
          removedNodes.set(node, mutation.target);
        }
        addedAndMovedNodes.delete(node);
      });
    }
    const sortedAddedAndMovedNodes = Array.from(addedAndMovedNodes);
    sortAddedAndMovedNodes(sortedAddedAndMovedNodes);
    const serializedNodeIds = /* @__PURE__ */ new Set();
    const serializationContext = {
      status: 2,
      serializationStats,
      shadowRootsController
    };
    const addedNodeMutations = [];
    for (const node of sortedAddedAndMovedNodes) {
      if (hasBeenSerialized(node)) {
        continue;
      }
      const parentNodePrivacyLevel = getNodePrivacyLevel(node.parentNode, configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
      if (parentNodePrivacyLevel === NodePrivacyLevel.HIDDEN || parentNodePrivacyLevel === NodePrivacyLevel.IGNORE) {
        continue;
      }
      const serializationStart = timeStampNow();
      const serializedNode = serializeNodeWithId(node, parentNodePrivacyLevel, {
        serializedNodeIds,
        serializationContext,
        configuration,
        scope
      });
      updateSerializationStats(serializationStats, "serializationDuration", elapsed(serializationStart, timeStampNow()));
      if (!serializedNode) {
        continue;
      }
      const parentNode = getParentNode(node);
      addedNodeMutations.push({
        nextId: getNextSibling(node),
        parentId: scope.nodeIds.get(parentNode),
        node: serializedNode
      });
    }
    const removedNodeMutations = [];
    removedNodes.forEach((parent, node) => {
      const parentId = scope.nodeIds.get(parent);
      const id = scope.nodeIds.get(node);
      if (parentId !== void 0 && id !== void 0) {
        removedNodeMutations.push({ parentId, id });
      }
    });
    return { adds: addedNodeMutations, removes: removedNodeMutations, hasBeenSerialized };
    function hasBeenSerialized(node) {
      const id = scope.nodeIds.get(node);
      return id !== void 0 && serializedNodeIds.has(id);
    }
    function getNextSibling(node) {
      let nextSibling = node.nextSibling;
      while (nextSibling) {
        const id = scope.nodeIds.get(nextSibling);
        if (id !== void 0) {
          return id;
        }
        nextSibling = nextSibling.nextSibling;
      }
      return null;
    }
  }
  function processCharacterDataMutations(mutations, configuration, scope, nodePrivacyLevelCache) {
    var _a;
    const textMutations = [];
    const handledNodes = /* @__PURE__ */ new Set();
    const filteredMutations = mutations.filter((mutation) => {
      if (handledNodes.has(mutation.target)) {
        return false;
      }
      handledNodes.add(mutation.target);
      return true;
    });
    for (const mutation of filteredMutations) {
      const value = mutation.target.textContent;
      if (value === mutation.oldValue) {
        continue;
      }
      const id = scope.nodeIds.get(mutation.target);
      if (id === void 0) {
        continue;
      }
      const parentNodePrivacyLevel = getNodePrivacyLevel(getParentNode(mutation.target), configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
      if (parentNodePrivacyLevel === NodePrivacyLevel.HIDDEN || parentNodePrivacyLevel === NodePrivacyLevel.IGNORE) {
        continue;
      }
      textMutations.push({
        id,
        value: (_a = getTextContent(mutation.target, parentNodePrivacyLevel)) !== null && _a !== void 0 ? _a : null
      });
    }
    return textMutations;
  }
  function processAttributesMutations(mutations, configuration, scope, nodePrivacyLevelCache) {
    const attributeMutations = [];
    const handledElements = /* @__PURE__ */ new Map();
    const filteredMutations = mutations.filter((mutation) => {
      const handledAttributes = handledElements.get(mutation.target);
      if (handledAttributes && handledAttributes.has(mutation.attributeName)) {
        return false;
      }
      if (!handledAttributes) {
        handledElements.set(mutation.target, /* @__PURE__ */ new Set([mutation.attributeName]));
      } else {
        handledAttributes.add(mutation.attributeName);
      }
      return true;
    });
    const emittedMutations = /* @__PURE__ */ new Map();
    for (const mutation of filteredMutations) {
      const uncensoredValue = mutation.target.getAttribute(mutation.attributeName);
      if (uncensoredValue === mutation.oldValue) {
        continue;
      }
      const id = scope.nodeIds.get(mutation.target);
      if (id === void 0) {
        continue;
      }
      const privacyLevel = getNodePrivacyLevel(mutation.target, configuration.defaultPrivacyLevel, nodePrivacyLevelCache);
      const attributeValue = serializeAttribute(mutation.target, privacyLevel, mutation.attributeName, configuration);
      let transformedValue;
      if (mutation.attributeName === "value") {
        const inputValue = getElementInputValue(mutation.target, privacyLevel);
        if (inputValue === void 0) {
          continue;
        }
        transformedValue = inputValue;
      } else if (typeof attributeValue === "string") {
        transformedValue = attributeValue;
      } else {
        transformedValue = null;
      }
      let emittedMutation = emittedMutations.get(mutation.target);
      if (!emittedMutation) {
        emittedMutation = { id, attributes: {} };
        attributeMutations.push(emittedMutation);
        emittedMutations.set(mutation.target, emittedMutation);
      }
      emittedMutation.attributes[mutation.attributeName] = transformedValue;
    }
    return attributeMutations;
  }
  function sortAddedAndMovedNodes(nodes) {
    nodes.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        return -1;
      } else if (position & Node.DOCUMENT_POSITION_CONTAINS) {
        return 1;
      } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return 1;
      } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return -1;
      }
      return 0;
    });
  }
  function traverseRemovedShadowDom(removedNode, shadowDomRemovedCallback) {
    if (isNodeShadowHost(removedNode)) {
      shadowDomRemovedCallback(removedNode.shadowRoot);
    }
    forEachChildNodes(removedNode, (childNode) => traverseRemovedShadowDom(childNode, shadowDomRemovedCallback));
  }
  var init_trackMutation = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/trackMutation.js"() {
      init_esm();
      init_esm2();
      init_types();
      init_serialization();
      init_mutationBatch();
      init_assembly2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/trackers/index.js
  var init_trackers = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/trackers/index.js"() {
      init_trackMove();
      init_trackMouseInteraction();
      init_trackScroll();
      init_trackViewportResize();
      init_trackMediaInteraction();
      init_trackStyleSheet();
      init_trackFocus();
      init_trackFrustration();
      init_trackViewEnd();
      init_trackInput();
      init_trackMutation();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/elementsScrollPositions.js
  function createElementsScrollPositions() {
    const scrollPositionsByElement = /* @__PURE__ */ new WeakMap();
    return {
      set(element, scrollPositions) {
        if (element === document && !document.scrollingElement) {
          return;
        }
        scrollPositionsByElement.set(element === document ? document.scrollingElement : element, scrollPositions);
      },
      get(element) {
        return scrollPositionsByElement.get(element);
      },
      has(element) {
        return scrollPositionsByElement.has(element);
      }
    };
  }
  var init_elementsScrollPositions = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/elementsScrollPositions.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/shadowRootsController.js
  var initShadowRootsController;
  var init_shadowRootsController = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/shadowRootsController.js"() {
      init_trackers();
      initShadowRootsController = (configuration, scope, callback, elementsScrollPositions) => {
        const controllerByShadowRoot = /* @__PURE__ */ new Map();
        const shadowRootsController = {
          addShadowRoot: (shadowRoot) => {
            if (controllerByShadowRoot.has(shadowRoot)) {
              return;
            }
            const mutationTracker = trackMutation(callback, configuration, scope, shadowRootsController, shadowRoot);
            const inputTracker = trackInput(configuration, scope, callback, shadowRoot);
            const scrollTracker = trackScroll(configuration, scope, callback, elementsScrollPositions, shadowRoot);
            controllerByShadowRoot.set(shadowRoot, {
              flush: () => mutationTracker.flush(),
              stop: () => {
                mutationTracker.stop();
                inputTracker.stop();
                scrollTracker.stop();
              }
            });
          },
          removeShadowRoot: (shadowRoot) => {
            const entry = controllerByShadowRoot.get(shadowRoot);
            if (!entry) {
              return;
            }
            entry.stop();
            controllerByShadowRoot.delete(shadowRoot);
          },
          stop: () => {
            controllerByShadowRoot.forEach(({ stop }) => stop());
          },
          flush: () => {
            controllerByShadowRoot.forEach(({ flush }) => flush());
          }
        };
        return shadowRootsController;
      };
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/startFullSnapshots.js
  function startFullSnapshots(elementsScrollPositions, shadowRootsController, lifeCycle, configuration, scope, flushMutations, emit) {
    const takeFullSnapshot = (timestamp, status) => {
      const { width, height } = getViewportDimension();
      emit({
        data: {
          height,
          href: window.location.href,
          width
        },
        type: RecordType.Meta,
        timestamp
      });
      emit({
        data: {
          has_focus: document.hasFocus()
        },
        type: RecordType.Focus,
        timestamp
      });
      const serializationStats = createSerializationStats();
      const serializationContext = {
        status,
        elementsScrollPositions,
        serializationStats,
        shadowRootsController
      };
      emit({
        data: {
          node: serializeDocument(document, configuration, scope, serializationContext),
          initialOffset: {
            left: getScrollX(),
            top: getScrollY()
          }
        },
        type: RecordType.FullSnapshot,
        timestamp
      }, serializationStats);
      if (window.visualViewport) {
        emit({
          data: getVisualViewport(window.visualViewport),
          type: RecordType.VisualViewport,
          timestamp
        });
      }
    };
    takeFullSnapshot(
      timeStampNow(),
      0
      /* SerializationContextStatus.INITIAL_FULL_SNAPSHOT */
    );
    const { unsubscribe } = lifeCycle.subscribe(2, (view) => {
      flushMutations();
      takeFullSnapshot(
        view.startClocks.timeStamp,
        1
        /* SerializationContextStatus.SUBSEQUENT_FULL_SNAPSHOT */
      );
    });
    return {
      stop: unsubscribe
    };
  }
  var init_startFullSnapshots = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/startFullSnapshots.js"() {
      init_esm2();
      init_esm();
      init_types();
      init_serialization();
      init_viewports();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/recordIds.js
  function initRecordIds() {
    const recordIds = /* @__PURE__ */ new WeakMap();
    let nextId = 1;
    return {
      getIdForEvent(event) {
        if (!recordIds.has(event)) {
          recordIds.set(event, nextId++);
        }
        return recordIds.get(event);
      }
    };
  }
  var init_recordIds = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/recordIds.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/nodeIds.js
  function createNodeIds() {
    const nodeIds = /* @__PURE__ */ new WeakMap();
    let nextNodeId = 1;
    const get = (node) => nodeIds.get(node);
    return {
      assign: (node) => {
        let nodeId = get(node);
        if (nodeId === void 0) {
          nodeId = nextNodeId++;
          nodeIds.set(node, nodeId);
        }
        return nodeId;
      },
      get,
      areAssignedForNodeAndAncestors: (node) => {
        let current = node;
        while (current) {
          if (get(current) === void 0 && !isNodeShadowRoot(current)) {
            return false;
          }
          current = getParentNode(current);
        }
        return true;
      }
    };
  }
  var init_nodeIds = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/nodeIds.js"() {
      init_esm2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/record.js
  function record(options) {
    const { emit, configuration, lifeCycle } = options;
    if (!emit) {
      throw new Error("emit function is required");
    }
    const emitAndComputeStats = (record2, stats) => {
      emit(record2, stats);
      sendToExtension("record", { record: record2 });
      const view = options.viewHistory.findView();
      addRecord(view.id);
    };
    const elementsScrollPositions = createElementsScrollPositions();
    const scope = createSerializationScope(createNodeIds());
    const shadowRootsController = initShadowRootsController(configuration, scope, emitAndComputeStats, elementsScrollPositions);
    const { stop: stopFullSnapshots } = startFullSnapshots(elementsScrollPositions, shadowRootsController, lifeCycle, configuration, scope, flushMutations, emitAndComputeStats);
    function flushMutations() {
      shadowRootsController.flush();
      mutationTracker.flush();
    }
    const recordIds = initRecordIds();
    const mutationTracker = trackMutation(emitAndComputeStats, configuration, scope, shadowRootsController, document);
    const trackers = [
      mutationTracker,
      trackMove(configuration, scope, emitAndComputeStats),
      trackMouseInteraction(configuration, scope, emitAndComputeStats, recordIds),
      trackScroll(configuration, scope, emitAndComputeStats, elementsScrollPositions, document),
      trackViewportResize(configuration, emitAndComputeStats),
      trackInput(configuration, scope, emitAndComputeStats),
      trackMediaInteraction(configuration, scope, emitAndComputeStats),
      trackStyleSheet(scope, emitAndComputeStats),
      trackFocus(configuration, emitAndComputeStats),
      trackVisualViewportResize(configuration, emitAndComputeStats),
      trackFrustration(lifeCycle, emitAndComputeStats, recordIds),
      trackViewEnd(lifeCycle, (viewEndRecord) => {
        flushMutations();
        emitAndComputeStats(viewEndRecord);
      })
    ];
    return {
      stop: () => {
        shadowRootsController.stop();
        trackers.forEach((tracker) => tracker.stop());
        stopFullSnapshots();
      },
      flushMutations,
      shadowRootsController
    };
  }
  var init_record = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/record.js"() {
      init_esm();
      init_replayStats();
      init_trackers();
      init_elementsScrollPositions();
      init_shadowRootsController();
      init_startFullSnapshots();
      init_recordIds();
      init_serialization();
      init_nodeIds();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/record/index.js
  var init_record2 = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/record/index.js"() {
      init_record();
      init_serialization();
      init_serialization();
      init_elementsScrollPositions();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/buildReplayPayload.js
  function buildReplayPayload(data, metadata, stats, rawSegmentBytesCount) {
    const formData = new FormData();
    formData.append("segment", new Blob([data], {
      type: "application/octet-stream"
    }), `${metadata.session.id}-${metadata.start}`);
    const metadataAndSegmentSizes = {
      raw_segment_size: rawSegmentBytesCount,
      compressed_segment_size: data.byteLength,
      ...metadata
    };
    const serializedMetadataAndSegmentSizes = JSON.stringify(metadataAndSegmentSizes);
    formData.append("event", new Blob([serializedMetadataAndSegmentSizes], { type: "application/json" }));
    return {
      data: formData,
      bytesCount: data.byteLength,
      cssText: stats.cssText,
      isFullSnapshot: metadata.index_in_view === 0,
      rawSize: rawSegmentBytesCount,
      recordCount: metadata.records_count,
      serializationDuration: stats.serializationDuration
    };
  }
  var init_buildReplayPayload = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/buildReplayPayload.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/segment.js
  function createSegment({ context, creationReason, encoder }) {
    let encodedBytesCount = 0;
    const viewId = context.view.id;
    const indexInView = getSegmentsCount(viewId);
    const metadata = {
      start: Infinity,
      end: -Infinity,
      creation_reason: creationReason,
      records_count: 0,
      has_full_snapshot: false,
      index_in_view: indexInView,
      source: "browser",
      ...context
    };
    const serializationStats = createSerializationStats();
    addSegment(viewId);
    function addRecord2(record2, stats, callback) {
      metadata.start = Math.min(metadata.start, record2.timestamp);
      metadata.end = Math.max(metadata.end, record2.timestamp);
      metadata.records_count += 1;
      metadata.has_full_snapshot || (metadata.has_full_snapshot = record2.type === RecordType.FullSnapshot);
      if (stats) {
        aggregateSerializationStats(serializationStats, stats);
      }
      const prefix = encoder.isEmpty ? '{"records":[' : ",";
      encoder.write(prefix + JSON.stringify(record2), (additionalEncodedBytesCount) => {
        encodedBytesCount += additionalEncodedBytesCount;
        callback(encodedBytesCount);
      });
    }
    function flush(callback) {
      if (encoder.isEmpty) {
        throw new Error("Empty segment flushed");
      }
      encoder.write(`],${JSON.stringify(metadata).slice(1)}
`);
      encoder.finish((encoderResult) => {
        addWroteData(metadata.view.id, encoderResult.rawBytesCount);
        callback(metadata, serializationStats, encoderResult);
      });
    }
    return { addRecord: addRecord2, flush };
  }
  var init_segment = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/segment.js"() {
      init_types();
      init_replayStats();
      init_record2();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/segmentCollection.js
  function startSegmentCollection(lifeCycle, configuration, sessionManager, viewHistory, httpRequest, encoder) {
    return doStartSegmentCollection(lifeCycle, () => computeSegmentContext(configuration.applicationId, sessionManager, viewHistory), httpRequest, encoder);
  }
  function doStartSegmentCollection(lifeCycle, getSegmentContext, httpRequest, encoder) {
    let state2 = {
      status: 0,
      nextSegmentCreationReason: "init"
    };
    const { unsubscribe: unsubscribeViewCreated } = lifeCycle.subscribe(2, () => {
      flushSegment("view_change");
    });
    const { unsubscribe: unsubscribePageMayExit } = lifeCycle.subscribe(11, (pageMayExitEvent) => {
      flushSegment(pageMayExitEvent.reason);
    });
    function flushSegment(flushReason) {
      if (state2.status === 1) {
        state2.segment.flush((metadata, stats, encoderResult) => {
          const payload = buildReplayPayload(encoderResult.output, metadata, stats, encoderResult.rawBytesCount);
          if (isPageExitReason(flushReason)) {
            httpRequest.sendOnExit(payload);
          } else {
            httpRequest.send(payload);
          }
        });
        clearTimeout(state2.expirationTimeoutId);
      }
      if (flushReason !== "stop") {
        state2 = {
          status: 0,
          nextSegmentCreationReason: flushReason
        };
      } else {
        state2 = {
          status: 2
        };
      }
    }
    return {
      addRecord: (record2, stats) => {
        if (state2.status === 2) {
          return;
        }
        if (state2.status === 0) {
          const context = getSegmentContext();
          if (!context) {
            return;
          }
          state2 = {
            status: 1,
            segment: createSegment({ encoder, context, creationReason: state2.nextSegmentCreationReason }),
            expirationTimeoutId: setTimeout(() => {
              flushSegment("segment_duration_limit");
            }, SEGMENT_DURATION_LIMIT)
          };
        }
        state2.segment.addRecord(record2, stats, (encodedBytesCount) => {
          if (encodedBytesCount > SEGMENT_BYTES_LIMIT) {
            flushSegment("segment_bytes_limit");
          }
        });
      },
      stop: () => {
        flushSegment("stop");
        unsubscribeViewCreated();
        unsubscribePageMayExit();
      }
    };
  }
  function computeSegmentContext(applicationId, sessionManager, viewHistory) {
    const session = sessionManager.findTrackedSession();
    const viewContext = viewHistory.findView();
    if (!session || !viewContext) {
      return void 0;
    }
    return {
      application: {
        id: applicationId
      },
      session: {
        id: session.id
      },
      view: {
        id: viewContext.id
      }
    };
  }
  var SEGMENT_DURATION_LIMIT, SEGMENT_BYTES_LIMIT;
  var init_segmentCollection = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/segmentCollection.js"() {
      init_esm();
      init_buildReplayPayload();
      init_segment();
      SEGMENT_DURATION_LIMIT = 5 * ONE_SECOND;
      SEGMENT_BYTES_LIMIT = 6e4;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/startSegmentTelemetry.js
  function startSegmentTelemetry(telemetry, requestObservable) {
    if (!telemetry.metricsEnabled) {
      return { stop: noop };
    }
    const { unsubscribe } = requestObservable.subscribe((requestEvent) => {
      if (requestEvent.type === "failure" || requestEvent.type === "queue-full" || requestEvent.type === "success" && requestEvent.payload.isFullSnapshot) {
        const metrics = createSegmentMetrics(requestEvent.type, requestEvent.bandwidth, requestEvent.payload);
        addTelemetryMetrics("Segment network request metrics", { metrics });
      }
    });
    return {
      stop: unsubscribe
    };
  }
  function createSegmentMetrics(result, bandwidthStats, payload) {
    return {
      cssText: {
        count: payload.cssText.count,
        max: payload.cssText.max,
        sum: payload.cssText.sum
      },
      isFullSnapshot: payload.isFullSnapshot,
      ongoingRequests: {
        count: bandwidthStats.ongoingRequestCount,
        totalSize: bandwidthStats.ongoingByteCount
      },
      recordCount: payload.recordCount,
      result,
      serializationDuration: {
        count: payload.serializationDuration.count,
        max: payload.serializationDuration.max,
        sum: payload.serializationDuration.sum
      },
      size: {
        compressed: payload.bytesCount,
        raw: payload.rawSize
      }
    };
  }
  var init_startSegmentTelemetry = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/startSegmentTelemetry.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/index.js
  var init_segmentCollection2 = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/segmentCollection/index.js"() {
      init_segmentCollection();
      init_segmentCollection();
      init_startSegmentTelemetry();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/startRecordBridge.js
  function startRecordBridge(viewHistory) {
    const bridge = getEventBridge();
    return {
      addRecord: (record2) => {
        const view = viewHistory.findView();
        bridge.send("record", record2, view.id);
      }
    };
  }
  var init_startRecordBridge = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/startRecordBridge.js"() {
      init_esm();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/boot/startRecording.js
  var startRecording_exports = {};
  __export(startRecording_exports, {
    startRecording: () => startRecording
  });
  function startRecording(lifeCycle, configuration, sessionManager, viewHistory, encoder, telemetry, httpRequest) {
    const cleanupTasks2 = [];
    const reportError = (error) => {
      lifeCycle.notify(14, { error });
      addTelemetryDebug("Error reported to customer", { "error.message": error.message });
    };
    const replayRequest = httpRequest || createHttpRequest([configuration.sessionReplayEndpointBuilder], reportError, SEGMENT_BYTES_LIMIT);
    let addRecord2;
    if (!canUseEventBridge()) {
      const segmentCollection = startSegmentCollection(lifeCycle, configuration, sessionManager, viewHistory, replayRequest, encoder);
      addRecord2 = segmentCollection.addRecord;
      cleanupTasks2.push(segmentCollection.stop);
      const segmentTelemetry = startSegmentTelemetry(telemetry, replayRequest.observable);
      cleanupTasks2.push(segmentTelemetry.stop);
    } else {
      ;
      ({ addRecord: addRecord2 } = startRecordBridge(viewHistory));
    }
    const { stop: stopRecording } = record({
      emit: addRecord2,
      configuration,
      lifeCycle,
      viewHistory
    });
    cleanupTasks2.push(stopRecording);
    return {
      stop: () => {
        cleanupTasks2.forEach((task) => task());
      }
    };
  }
  var init_startRecording = __esm({
    "node_modules/@openobserve/browser-rum/esm/boot/startRecording.js"() {
      init_esm();
      init_record2();
      init_segmentCollection2();
      init_startRecordBridge();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getNumberOfSamples.js
  function getNumberOfSamples(samples) {
    let numberOfSamples = 0;
    for (const sample of samples) {
      if (sample.stackId !== void 0) {
        numberOfSamples++;
      }
    }
    return numberOfSamples;
  }
  var init_getNumberOfSamples = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getNumberOfSamples.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/longTaskRegistry.js
  function setLongTaskId(longTaskId, startTime) {
    registry.set(startTime, longTaskId);
  }
  function getLongTaskId(startTime) {
    return registry.get(startTime);
  }
  function cleanupLongTaskRegistryAfterCollection(collectionRelativeTime) {
    for (const performanceStartTime of registry.keys()) {
      if (performanceStartTime < collectionRelativeTime) {
        registry.delete(performanceStartTime);
      }
    }
  }
  var registry;
  var init_longTaskRegistry = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/longTaskRegistry.js"() {
      registry = /* @__PURE__ */ new Map();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/profilingCorrelation.js
  function mayStoreLongTaskIdForProfilerCorrelation({ rawRumEvent, startTime }) {
    if (rawRumEvent.type !== RumEventType.LONG_TASK) {
      return;
    }
    const longTaskId = rawRumEvent.long_task.id;
    setLongTaskId(longTaskId, startTime);
  }
  var init_profilingCorrelation = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/profilingCorrelation.js"() {
      init_esm2();
      init_longTaskRegistry();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getDefaultViewName.js
  function getDefaultViewName(viewPathUrl) {
    if (!viewPathUrl) {
      return "/";
    }
    return viewPathUrl.replace(PATH_MIXED_ALPHANUMERICS, "/?");
  }
  var PATH_MIXED_ALPHANUMERICS;
  var init_getDefaultViewName = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getDefaultViewName.js"() {
      PATH_MIXED_ALPHANUMERICS = /\/(?![vV]\d{1,2}\/)([^/\d?]*\d+[^/?]*)/g;
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getCustomOrDefaultViewName.js
  var getCustomOrDefaultViewName;
  var init_getCustomOrDefaultViewName = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/utils/getCustomOrDefaultViewName.js"() {
      init_getDefaultViewName();
      getCustomOrDefaultViewName = (customViewName, viewPathUrl) => customViewName || getDefaultViewName(viewPathUrl);
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/transport/buildProfileEventAttributes.js
  function buildProfileEventAttributes(profilerTrace, applicationId, sessionId) {
    const attributes = {
      application: {
        id: applicationId
      }
    };
    if (sessionId) {
      attributes.session = {
        id: sessionId
      };
    }
    const { ids, names } = extractViewIdsAndNames(profilerTrace.views);
    if (ids.length) {
      attributes.view = {
        id: ids,
        name: names
      };
    }
    const longTaskIds = profilerTrace.longTasks.map((longTask) => longTask.id).filter((id) => id !== void 0);
    if (longTaskIds.length) {
      attributes.long_task = { id: longTaskIds };
    }
    return attributes;
  }
  function extractViewIdsAndNames(views) {
    const result = { ids: [], names: [] };
    for (const view of views) {
      result.ids.push(view.viewId);
      if (view.viewName) {
        result.names.push(view.viewName);
      }
    }
    result.names = Array.from(new Set(result.names));
    return result;
  }
  var init_buildProfileEventAttributes = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/transport/buildProfileEventAttributes.js"() {
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/transport/assembly.js
  function assembleProfilingPayload(profilerTrace, configuration, sessionId) {
    const event = buildProfileEvent(profilerTrace, configuration, sessionId);
    return {
      event,
      "wall-time.json": profilerTrace
    };
  }
  function buildProfileEvent(profilerTrace, configuration, sessionId) {
    const tags = buildTags(configuration);
    const profileAttributes = buildProfileEventAttributes(profilerTrace, configuration.applicationId, sessionId);
    const profileEventTags = buildProfileEventTags(tags);
    const profileEvent = {
      ...profileAttributes,
      attachments: ["wall-time.json"],
      start: new Date(profilerTrace.startClocks.timeStamp).toISOString(),
      end: new Date(profilerTrace.endClocks.timeStamp).toISOString(),
      family: "chrome",
      runtime: "chrome",
      format: "json",
      version: 4,
      // Ingestion event version (not the version application tag)
      tags_profiler: profileEventTags.join(","),
      _oo: {
        clock_drift: currentDrift()
      }
    };
    return profileEvent;
  }
  function buildProfileEventTags(tags) {
    const profileEventTags = tags.concat(["language:javascript", "runtime:chrome", "family:chrome", "host:browser"]);
    return profileEventTags;
  }
  var init_assembly3 = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/transport/assembly.js"() {
      init_esm();
      init_buildProfileEventAttributes();
    }
  });

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/profiler.js
  var profiler_exports = {};
  __export(profiler_exports, {
    DEFAULT_RUM_PROFILER_CONFIGURATION: () => DEFAULT_RUM_PROFILER_CONFIGURATION,
    createRumProfiler: () => createRumProfiler
  });
  function createRumProfiler(configuration, lifeCycle, session, profilingContextManager, createEncoder, profilerConfiguration = DEFAULT_RUM_PROFILER_CONFIGURATION) {
    const transport = createFormDataTransport(
      configuration,
      lifeCycle,
      createEncoder,
      6
      /* DeflateEncoderStreamId.PROFILING */
    );
    const isLongAnimationFrameEnabled = supportPerformanceTimingEvent(RumPerformanceEntryType.LONG_ANIMATION_FRAME);
    let lastViewEntry;
    const globalCleanupTasks = [];
    let instance = { state: "stopped" };
    function start(viewEntry) {
      if (instance.state === "running") {
        return;
      }
      lastViewEntry = viewEntry ? {
        startClocks: viewEntry.startClocks,
        viewId: viewEntry.id,
        viewName: getCustomOrDefaultViewName(viewEntry.name, document.location.pathname)
      } : void 0;
      globalCleanupTasks.push(addEventListener(configuration, window, "visibilitychange", handleVisibilityChange).stop, addEventListener(configuration, window, "beforeunload", handleBeforeUnload).stop);
      startNextProfilerInstance();
    }
    async function stop() {
      await stopProfilerInstance("stopped");
      globalCleanupTasks.forEach((task) => task());
      cleanupLongTaskRegistryAfterCollection(clocksNow().relative);
      profilingContextManager.set({ status: "stopped", error_reason: void 0 });
    }
    function addEventListeners2(existingInstance) {
      if (existingInstance.state === "running") {
        return {
          cleanupTasks: existingInstance.cleanupTasks,
          observer: existingInstance.observer
        };
      }
      const cleanupTasks2 = [];
      let observer2;
      if (configuration.trackLongTasks) {
        observer2 = new PerformanceObserver(handlePerformance);
        observer2.observe({
          entryTypes: [getLongTaskEntryType()]
        });
        const rawEventCollectedSubscription = lifeCycle.subscribe(12, (data) => {
          mayStoreLongTaskIdForProfilerCorrelation(data);
        });
        cleanupTasks2.push(() => observer2 === null || observer2 === void 0 ? void 0 : observer2.disconnect());
        cleanupTasks2.push(rawEventCollectedSubscription.unsubscribe);
      }
      const viewUpdatedSubscription = lifeCycle.subscribe(2, (view) => {
        const viewEntry = {
          viewId: view.id,
          // Note: `viewName` is only filled when users use manual view creation via `startView` method.
          viewName: getCustomOrDefaultViewName(view.name, document.location.pathname),
          startClocks: view.startClocks
        };
        collectViewEntry(viewEntry);
        lastViewEntry = viewEntry;
      });
      cleanupTasks2.push(viewUpdatedSubscription.unsubscribe);
      return {
        cleanupTasks: cleanupTasks2,
        observer: observer2
      };
    }
    function startNextProfilerInstance() {
      const globalThisProfiler = getGlobalObject().Profiler;
      if (!globalThisProfiler) {
        profilingContextManager.set({ status: "error", error_reason: "not-supported-by-browser" });
        throw new Error("RUM Profiler is not supported in this browser.");
      }
      collectProfilerInstance(instance).catch(monitorError);
      const { cleanupTasks: cleanupTasks2, observer: observer2 } = addEventListeners2(instance);
      let profiler;
      try {
        profiler = new globalThisProfiler({
          sampleInterval: profilerConfiguration.sampleIntervalMs,
          // Keep buffer size at 1.5 times of minimum required to collect data for a profiling instance
          maxBufferSize: Math.round(profilerConfiguration.collectIntervalMs * 1.5 / profilerConfiguration.sampleIntervalMs)
        });
      } catch (e) {
        if (e instanceof Error && e.message.includes("disabled by Document Policy")) {
          display.warn("[OO_RUM] Profiler startup failed. Ensure your server includes the `Document-Policy: js-profiling` response header when serving HTML pages.", e);
          profilingContextManager.set({ status: "error", error_reason: "missing-document-policy-header" });
        } else {
          profilingContextManager.set({ status: "error", error_reason: "unexpected-exception" });
        }
        return;
      }
      profilingContextManager.set({ status: "running", error_reason: void 0 });
      instance = {
        state: "running",
        startClocks: clocksNow(),
        profiler,
        timeoutId: setTimeout(startNextProfilerInstance, profilerConfiguration.collectIntervalMs),
        longTasks: [],
        views: [],
        cleanupTasks: cleanupTasks2,
        observer: observer2
      };
      collectViewEntry(lastViewEntry);
      profiler.addEventListener("samplebufferfull", handleSampleBufferFull);
    }
    async function collectProfilerInstance(lastInstance) {
      var _a, _b;
      if (lastInstance.state !== "running") {
        return;
      }
      handleLongTaskEntries((_b = (_a = lastInstance.observer) === null || _a === void 0 ? void 0 : _a.takeRecords()) !== null && _b !== void 0 ? _b : []);
      clearTimeout(lastInstance.timeoutId);
      lastInstance.profiler.removeEventListener("samplebufferfull", handleSampleBufferFull);
      const { startClocks, longTasks, views } = lastInstance;
      const collectClocks = clocksNow();
      await lastInstance.profiler.stop().then((trace) => {
        const endClocks = clocksNow();
        const hasLongTasks = longTasks.length > 0;
        const isBelowDurationThreshold = elapsed(startClocks.timeStamp, endClocks.timeStamp) < profilerConfiguration.minProfileDurationMs;
        const isBelowSampleThreshold = getNumberOfSamples(trace.samples) < profilerConfiguration.minNumberOfSamples;
        if (!hasLongTasks && (isBelowDurationThreshold || isBelowSampleThreshold)) {
          return;
        }
        handleProfilerTrace(
          // Enrich trace with time and instance data
          Object.assign(trace, {
            startClocks,
            endClocks,
            clocksOrigin: clocksOrigin(),
            longTasks,
            views,
            sampleInterval: profilerConfiguration.sampleIntervalMs
          })
        );
        cleanupLongTaskRegistryAfterCollection(collectClocks.relative);
      }).catch(monitorError);
    }
    async function stopProfilerInstance(nextState) {
      if (instance.state !== "running") {
        return;
      }
      instance.cleanupTasks.forEach((cleanupTask) => cleanupTask());
      await collectProfilerInstance(instance);
      instance = { state: nextState };
    }
    function collectViewEntry(viewEntry) {
      if (instance.state !== "running" || !viewEntry) {
        return;
      }
      instance.views.push(viewEntry);
    }
    function handleProfilerTrace(trace) {
      var _a;
      const sessionId = (_a = session.findTrackedSession()) === null || _a === void 0 ? void 0 : _a.id;
      const payload = assembleProfilingPayload(trace, configuration, sessionId);
      void transport.send(payload);
    }
    function handleSampleBufferFull() {
      startNextProfilerInstance();
    }
    function handlePerformance(list) {
      handleLongTaskEntries(list.getEntries());
    }
    function handleLongTaskEntries(entries) {
      if (instance.state !== "running") {
        return;
      }
      for (const entry of entries) {
        if (entry.duration < profilerConfiguration.sampleIntervalMs) {
          continue;
        }
        const startClocks = relativeToClocks(entry.startTime);
        const longTaskId = getLongTaskId(startClocks.relative);
        instance.longTasks.push({
          id: longTaskId,
          duration: entry.duration,
          entryType: entry.entryType,
          startClocks
        });
      }
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && instance.state === "running") {
        stopProfilerInstance("paused").catch(monitorError);
      } else if (document.visibilityState === "visible" && instance.state === "paused") {
        startNextProfilerInstance();
      }
    }
    function handleBeforeUnload() {
      startNextProfilerInstance();
    }
    function getLongTaskEntryType() {
      return isLongAnimationFrameEnabled ? "long-animation-frame" : "longtask";
    }
    function isStopped() {
      return instance.state === "stopped";
    }
    function isRunning() {
      return instance.state === "running";
    }
    function isPaused() {
      return instance.state === "paused";
    }
    return { start, stop, isStopped, isRunning, isPaused };
  }
  var DEFAULT_RUM_PROFILER_CONFIGURATION;
  var init_profiler = __esm({
    "node_modules/@openobserve/browser-rum/esm/domain/profiling/profiler.js"() {
      init_esm();
      init_esm2();
      init_getNumberOfSamples();
      init_longTaskRegistry();
      init_profilingCorrelation();
      init_getCustomOrDefaultViewName();
      init_assembly3();
      DEFAULT_RUM_PROFILER_CONFIGURATION = {
        sampleIntervalMs: 10,
        // Sample stack trace every 10ms
        collectIntervalMs: 6e4,
        // Collect data every minute
        minProfileDurationMs: 5e3,
        // Require at least 5 seconds of profile data to reduce noise and cost
        minNumberOfSamples: 50
        // Require at least 50 samples (~500 ms) to report a profile to reduce noise and cost
      };
    }
  });

  // node_modules/@openobserve/browser-rum/esm/entries/main.js
  init_esm();
  init_esm2();

  // node_modules/@openobserve/browser-rum/esm/boot/recorderApi.js
  init_esm();
  init_replayStats();

  // node_modules/@openobserve/browser-rum/esm/domain/deflate/deflateEncoder.js
  init_esm();
  function createDeflateEncoder(configuration, worker, streamId) {
    let rawBytesCount = 0;
    let compressedData = [];
    let compressedDataTrailer;
    let isEmpty = true;
    let nextWriteActionId = 0;
    const pendingWriteActions = [];
    const { stop: removeMessageListener } = addEventListener(configuration, worker, "message", ({ data: workerResponse }) => {
      if (workerResponse.type !== "wrote" || workerResponse.streamId !== streamId) {
        return;
      }
      const nextPendingAction = pendingWriteActions[0];
      if (nextPendingAction) {
        if (nextPendingAction.id === workerResponse.id) {
          pendingWriteActions.shift();
          rawBytesCount += workerResponse.additionalBytesCount;
          compressedData.push(workerResponse.result);
          compressedDataTrailer = workerResponse.trailer;
          if (nextPendingAction.writeCallback) {
            nextPendingAction.writeCallback(workerResponse.result.byteLength);
          } else if (nextPendingAction.finishCallback) {
            nextPendingAction.finishCallback();
          }
        } else if (nextPendingAction.id < workerResponse.id) {
          removeMessageListener();
        }
      }
    });
    function consumeResult() {
      const output = compressedData.length === 0 ? new Uint8Array(0) : concatBuffers(compressedData.concat(compressedDataTrailer));
      const result = {
        rawBytesCount,
        output,
        outputBytesCount: output.byteLength,
        encoding: "deflate"
      };
      rawBytesCount = 0;
      compressedData = [];
      return result;
    }
    function sendResetIfNeeded() {
      if (!isEmpty) {
        worker.postMessage({
          action: "reset",
          streamId
        });
        isEmpty = true;
      }
    }
    return {
      isAsync: true,
      get isEmpty() {
        return isEmpty;
      },
      write(data, callback) {
        worker.postMessage({
          action: "write",
          id: nextWriteActionId,
          data,
          streamId
        });
        pendingWriteActions.push({
          id: nextWriteActionId,
          writeCallback: callback,
          data
        });
        isEmpty = false;
        nextWriteActionId += 1;
      },
      finish(callback) {
        sendResetIfNeeded();
        if (!pendingWriteActions.length) {
          callback(consumeResult());
        } else {
          pendingWriteActions.forEach((pendingWriteAction) => {
            delete pendingWriteAction.writeCallback;
          });
          pendingWriteActions[pendingWriteActions.length - 1].finishCallback = () => callback(consumeResult());
        }
      },
      finishSync() {
        sendResetIfNeeded();
        const pendingData = pendingWriteActions.map((pendingWriteAction) => pendingWriteAction.data).join("");
        pendingWriteActions.length = 0;
        return { ...consumeResult(), pendingData };
      },
      estimateEncodedBytesCount(data) {
        return data.length / 8;
      },
      stop() {
        removeMessageListener();
      }
    };
  }

  // node_modules/@openobserve/browser-rum/esm/domain/deflate/deflateWorker.js
  init_esm();

  // node_modules/@openobserve/browser-rum/esm/domain/scriptLoadingError.js
  init_esm();
  function reportScriptLoadingError({ configuredUrl, error, source, scriptType }) {
    display.error(`${source} failed to start: an error occurred while initializing the ${scriptType}:`, error);
    if (error instanceof Event || error instanceof Error && isMessageCspRelated(error.message)) {
      let baseMessage;
      if (configuredUrl) {
        baseMessage = `Please make sure the ${scriptType} URL ${configuredUrl} is correct and CSP is correctly configured.`;
      } else {
        baseMessage = "Please make sure CSP is correctly configured.";
      }
      display.error(`${baseMessage} See documentation at ${DOCS_ORIGIN}/integrations/content_security_policy_logs/#use-csp-with-real-user-monitoring-and-session-replay`);
    } else if (scriptType === "worker") {
      addTelemetryError(error);
    }
  }
  function isMessageCspRelated(message) {
    return message.includes("Content Security Policy") || // Related to `require-trusted-types-for` CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for
    message.includes("requires 'TrustedScriptURL'");
  }

  // node_modules/@openobserve/browser-rum/esm/domain/deflate/deflateWorker.js
  var INITIALIZATION_TIME_OUT_DELAY = 30 * ONE_SECOND;
  function createDeflateWorker(configuration) {
    return new Worker(configuration.workerUrl || URL.createObjectURL(new Blob(['(()=>{function t(t){if(1===t.length)return t[0];const e=t.reduce((t,e)=>t+e.length,0),a=new Uint8Array(e);let n=0;for(const e of t)a.set(e,n),n+=e.length;return a}function e(t){for(var e=t.length;--e>=0;)t[e]=0}var a=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),n=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]),r=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]),i=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),s=Array(576);e(s);var h=Array(60);e(h);var l=Array(512);e(l);var _=Array(256);e(_);var o=Array(29);e(o);var d,u,f,c=Array(30);function p(t,e,a,n,r){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=n,this.max_length=r,this.has_stree=t&&t.length}function g(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}e(c);var v=function(t){return t<256?l[t]:l[256+(t>>>7)]},w=function(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255},m=function(t,e,a){t.bi_valid>16-a?(t.bi_buf|=e<<t.bi_valid&65535,w(t,t.bi_buf),t.bi_buf=e>>16-t.bi_valid,t.bi_valid+=a-16):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a)},b=function(t,e,a){m(t,a[2*e],a[2*e+1])},y=function(t,e){var a=0;do{a|=1&t,t>>>=1,a<<=1}while(--e>0);return a>>>1},z=function(t,e,a){var n,r,i=Array(16),s=0;for(n=1;n<=15;n++)i[n]=s=s+a[n-1]<<1;for(r=0;r<=e;r++){var h=t[2*r+1];0!==h&&(t[2*r]=y(i[h]++,h))}},k=function(t){var e;for(e=0;e<286;e++)t.dyn_ltree[2*e]=0;for(e=0;e<30;e++)t.dyn_dtree[2*e]=0;for(e=0;e<19;e++)t.bl_tree[2*e]=0;t.dyn_ltree[512]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0},x=function(t){t.bi_valid>8?w(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0},A=function(t,e,a,n){var r=2*e,i=2*a;return t[r]<t[i]||t[r]===t[i]&&n[e]<=n[a]},U=function(t,e,a){for(var n=t.heap[a],r=a<<1;r<=t.heap_len&&(r<t.heap_len&&A(e,t.heap[r+1],t.heap[r],t.depth)&&r++,!A(e,n,t.heap[r],t.depth));)t.heap[a]=t.heap[r],a=r,r<<=1;t.heap[a]=n},B=function(t,e,r){var i,s,h,l,d=0;if(0!==t.last_lit)do{i=t.pending_buf[t.d_buf+2*d]<<8|t.pending_buf[t.d_buf+2*d+1],s=t.pending_buf[t.l_buf+d],d++,0===i?b(t,s,e):(h=_[s],b(t,h+256+1,e),0!==(l=a[h])&&(s-=o[h],m(t,s,l)),i--,h=v(i),b(t,h,r),0!==(l=n[h])&&(i-=c[h],m(t,i,l)))}while(d<t.last_lit);b(t,256,e)},I=function(t,e){var a,n,r,i=e.dyn_tree,s=e.stat_desc.static_tree,h=e.stat_desc.has_stree,l=e.stat_desc.elems,_=-1;for(t.heap_len=0,t.heap_max=573,a=0;a<l;a++)0!==i[2*a]?(t.heap[++t.heap_len]=_=a,t.depth[a]=0):i[2*a+1]=0;for(;t.heap_len<2;)i[2*(r=t.heap[++t.heap_len]=_<2?++_:0)]=1,t.depth[r]=0,t.opt_len--,h&&(t.static_len-=s[2*r+1]);for(e.max_code=_,a=t.heap_len>>1;a>=1;a--)U(t,i,a);r=l;do{a=t.heap[1],t.heap[1]=t.heap[t.heap_len--],U(t,i,1),n=t.heap[1],t.heap[--t.heap_max]=a,t.heap[--t.heap_max]=n,i[2*r]=i[2*a]+i[2*n],t.depth[r]=(t.depth[a]>=t.depth[n]?t.depth[a]:t.depth[n])+1,i[2*a+1]=i[2*n+1]=r,t.heap[1]=r++,U(t,i,1)}while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],function(t,e){var a,n,r,i,s,h,l=e.dyn_tree,_=e.max_code,o=e.stat_desc.static_tree,d=e.stat_desc.has_stree,u=e.stat_desc.extra_bits,f=e.stat_desc.extra_base,c=e.stat_desc.max_length,p=0;for(i=0;i<=15;i++)t.bl_count[i]=0;for(l[2*t.heap[t.heap_max]+1]=0,a=t.heap_max+1;a<573;a++)(i=l[2*l[2*(n=t.heap[a])+1]+1]+1)>c&&(i=c,p++),l[2*n+1]=i,n>_||(t.bl_count[i]++,s=0,n>=f&&(s=u[n-f]),h=l[2*n],t.opt_len+=h*(i+s),d&&(t.static_len+=h*(o[2*n+1]+s)));if(0!==p){do{for(i=c-1;0===t.bl_count[i];)i--;t.bl_count[i]--,t.bl_count[i+1]+=2,t.bl_count[c]--,p-=2}while(p>0);for(i=c;0!==i;i--)for(n=t.bl_count[i];0!==n;)(r=t.heap[--a])>_||(l[2*r+1]!==i&&(t.opt_len+=(i-l[2*r+1])*l[2*r],l[2*r+1]=i),n--)}}(t,e),z(i,_,t.bl_count)},E=function(t,e,a){var n,r,i=-1,s=e[1],h=0,l=7,_=4;for(0===s&&(l=138,_=3),e[2*(a+1)+1]=65535,n=0;n<=a;n++)r=s,s=e[2*(n+1)+1],++h<l&&r===s||(h<_?t.bl_tree[2*r]+=h:0!==r?(r!==i&&t.bl_tree[2*r]++,t.bl_tree[32]++):h<=10?t.bl_tree[34]++:t.bl_tree[36]++,h=0,i=r,0===s?(l=138,_=3):r===s?(l=6,_=3):(l=7,_=4))},C=function(t,e,a){var n,r,i=-1,s=e[1],h=0,l=7,_=4;for(0===s&&(l=138,_=3),n=0;n<=a;n++)if(r=s,s=e[2*(n+1)+1],!(++h<l&&r===s)){if(h<_)do{b(t,r,t.bl_tree)}while(0!==--h);else 0!==r?(r!==i&&(b(t,r,t.bl_tree),h--),b(t,16,t.bl_tree),m(t,h-3,2)):h<=10?(b(t,17,t.bl_tree),m(t,h-3,3)):(b(t,18,t.bl_tree),m(t,h-11,7));h=0,i=r,0===s?(l=138,_=3):r===s?(l=6,_=3):(l=7,_=4)}},D=!1,M=function(t,e,a,n){m(t,0+(n?1:0),3),function(t,e,a){x(t),w(t,a),w(t,~a),t.pending_buf.set(t.window.subarray(e,e+a),t.pending),t.pending+=a}(t,e,a)},j=M,L=function(t,e,a,n){for(var r=65535&t,i=t>>>16&65535,s=0;0!==a;){a-=s=a>2e3?2e3:a;do{i=i+(r=r+e[n++]|0)|0}while(--s);r%=65521,i%=65521}return r|i<<16},S=new Uint32Array(function(){for(var t,e=[],a=0;a<256;a++){t=a;for(var n=0;n<8;n++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t}return e}()),T=function(t,e,a,n){var r=S,i=n+a;t^=-1;for(var s=n;s<i;s++)t=t>>>8^r[255&(t^e[s])];return-1^t},O={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"},q=j,F=function(t,e,a){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&a,t.last_lit++,0===e?t.dyn_ltree[2*a]++:(t.matches++,e--,t.dyn_ltree[2*(_[a]+256+1)]++,t.dyn_dtree[2*v(e)]++),t.last_lit===t.lit_bufsize-1},G=-2,H=258,J=262,K=103,N=113,P=666,Q=function(t,e){return t.msg=O[e],e},R=function(t){return(t<<1)-(t>4?9:0)},V=function(t){for(var e=t.length;--e>=0;)t[e]=0},W=function(t,e,a){return(e<<t.hash_shift^a)&t.hash_mask},X=function(t){var e=t.state,a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(t.output.set(e.pending_buf.subarray(e.pending_out,e.pending_out+a),t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0))},Y=function(t,e){(function(t,e,a,n){var r,l,_=0;t.level>0?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,a=4093624447;for(e=0;e<=31;e++,a>>>=1)if(1&a&&0!==t.dyn_ltree[2*e])return 0;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return 1;for(e=32;e<256;e++)if(0!==t.dyn_ltree[2*e])return 1;return 0}(t)),I(t,t.l_desc),I(t,t.d_desc),_=function(t){var e;for(E(t,t.dyn_ltree,t.l_desc.max_code),E(t,t.dyn_dtree,t.d_desc.max_code),I(t,t.bl_desc),e=18;e>=3&&0===t.bl_tree[2*i[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),r=t.opt_len+3+7>>>3,(l=t.static_len+3+7>>>3)<=r&&(r=l)):r=l=a+5,a+4<=r&&-1!==e?M(t,e,a,n):4===t.strategy||l===r?(m(t,2+(n?1:0),3),B(t,s,h)):(m(t,4+(n?1:0),3),function(t,e,a,n){var r;for(m(t,e-257,5),m(t,a-1,5),m(t,n-4,4),r=0;r<n;r++)m(t,t.bl_tree[2*i[r]+1],3);C(t,t.dyn_ltree,e-1),C(t,t.dyn_dtree,a-1)}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,_+1),B(t,t.dyn_ltree,t.dyn_dtree)),k(t),n&&x(t)})(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,X(t.strm)},Z=function(t,e){t.pending_buf[t.pending++]=e},$=function(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e},tt=function(t,e,a,n){var r=t.avail_in;return r>n&&(r=n),0===r?0:(t.avail_in-=r,e.set(t.input.subarray(t.next_in,t.next_in+r),a),1===t.state.wrap?t.adler=L(t.adler,e,r,a):2===t.state.wrap&&(t.adler=T(t.adler,e,r,a)),t.next_in+=r,t.total_in+=r,r)},et=function(t,e){var a,n,r=t.max_chain_length,i=t.strstart,s=t.prev_length,h=t.nice_match,l=t.strstart>t.w_size-J?t.strstart-(t.w_size-J):0,_=t.window,o=t.w_mask,d=t.prev,u=t.strstart+H,f=_[i+s-1],c=_[i+s];t.prev_length>=t.good_match&&(r>>=2),h>t.lookahead&&(h=t.lookahead);do{if(_[(a=e)+s]===c&&_[a+s-1]===f&&_[a]===_[i]&&_[++a]===_[i+1]){i+=2,a++;do{}while(_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&_[++i]===_[++a]&&i<u);if(n=H-(u-i),i=u-H,n>s){if(t.match_start=e,s=n,n>=h)break;f=_[i+s-1],c=_[i+s]}}}while((e=d[e&o])>l&&0!==--r);return s<=t.lookahead?s:t.lookahead},at=function(t){var e,a,n,r,i,s=t.w_size;do{if(r=t.window_size-t.lookahead-t.strstart,t.strstart>=s+(s-J)){t.window.set(t.window.subarray(s,s+s),0),t.match_start-=s,t.strstart-=s,t.block_start-=s,e=a=t.hash_size;do{n=t.head[--e],t.head[e]=n>=s?n-s:0}while(--a);e=a=s;do{n=t.prev[--e],t.prev[e]=n>=s?n-s:0}while(--a);r+=s}if(0===t.strm.avail_in)break;if(a=tt(t.strm,t.window,t.strstart+t.lookahead,r),t.lookahead+=a,t.lookahead+t.insert>=3)for(i=t.strstart-t.insert,t.ins_h=t.window[i],t.ins_h=W(t,t.ins_h,t.window[i+1]);t.insert&&(t.ins_h=W(t,t.ins_h,t.window[i+3-1]),t.prev[i&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=i,i++,t.insert--,!(t.lookahead+t.insert<3)););}while(t.lookahead<J&&0!==t.strm.avail_in)},nt=function(t,e){for(var a,n;;){if(t.lookahead<J){if(at(t),t.lookahead<J&&0===e)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=W(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-J&&(t.match_length=et(t,a)),t.match_length>=3)if(n=F(t,t.strstart-t.match_start,t.match_length-3),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=3){t.match_length--;do{t.strstart++,t.ins_h=W(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart}while(0!==--t.match_length);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=W(t,t.ins_h,t.window[t.strstart+1]);else n=F(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(n&&(Y(t,!1),0===t.strm.avail_out))return 1}return t.insert=t.strstart<2?t.strstart:2,4===e?(Y(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(Y(t,!1),0===t.strm.avail_out)?1:2},rt=function(t,e){for(var a,n,r;;){if(t.lookahead<J){if(at(t),t.lookahead<J&&0===e)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=W(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=2,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-J&&(t.match_length=et(t,a),t.match_length<=5&&(1===t.strategy||3===t.match_length&&t.strstart-t.match_start>4096)&&(t.match_length=2)),t.prev_length>=3&&t.match_length<=t.prev_length){r=t.strstart+t.lookahead-3,n=F(t,t.strstart-1-t.prev_match,t.prev_length-3),t.lookahead-=t.prev_length-1,t.prev_length-=2;do{++t.strstart<=r&&(t.ins_h=W(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart)}while(0!==--t.prev_length);if(t.match_available=0,t.match_length=2,t.strstart++,n&&(Y(t,!1),0===t.strm.avail_out))return 1}else if(t.match_available){if((n=F(t,0,t.window[t.strstart-1]))&&Y(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return 1}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(n=F(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<2?t.strstart:2,4===e?(Y(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(Y(t,!1),0===t.strm.avail_out)?1:2};function it(t,e,a,n,r){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=n,this.func=r}var st=[new it(0,0,0,0,function(t,e){var a=65535;for(a>t.pending_buf_size-5&&(a=t.pending_buf_size-5);;){if(t.lookahead<=1){if(at(t),0===t.lookahead&&0===e)return 1;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var n=t.block_start+a;if((0===t.strstart||t.strstart>=n)&&(t.lookahead=t.strstart-n,t.strstart=n,Y(t,!1),0===t.strm.avail_out))return 1;if(t.strstart-t.block_start>=t.w_size-J&&(Y(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,4===e?(Y(t,!0),0===t.strm.avail_out?3:4):(t.strstart>t.block_start&&(Y(t,!1),t.strm.avail_out),1)}),new it(4,4,8,4,nt),new it(4,5,16,8,nt),new it(4,6,32,32,nt),new it(4,4,16,16,rt),new it(8,16,32,32,rt),new it(8,16,128,128,rt),new it(8,32,128,256,rt),new it(32,128,258,1024,rt),new it(32,258,258,4096,rt)];function ht(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=8,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new Uint16Array(1146),this.dyn_dtree=new Uint16Array(122),this.bl_tree=new Uint16Array(78),V(this.dyn_ltree),V(this.dyn_dtree),V(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new Uint16Array(16),this.heap=new Uint16Array(573),V(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new Uint16Array(573),V(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}for(var lt=function(t){var e,i=function(t){if(!t||!t.state)return Q(t,G);t.total_in=t.total_out=0,t.data_type=2;var e=t.state;return e.pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?42:N,t.adler=2===e.wrap?0:1,e.last_flush=0,function(t){D||(function(){var t,e,i,g,v,w=Array(16);for(i=0,g=0;g<28;g++)for(o[g]=i,t=0;t<1<<a[g];t++)_[i++]=g;for(_[i-1]=g,v=0,g=0;g<16;g++)for(c[g]=v,t=0;t<1<<n[g];t++)l[v++]=g;for(v>>=7;g<30;g++)for(c[g]=v<<7,t=0;t<1<<n[g]-7;t++)l[256+v++]=g;for(e=0;e<=15;e++)w[e]=0;for(t=0;t<=143;)s[2*t+1]=8,t++,w[8]++;for(;t<=255;)s[2*t+1]=9,t++,w[9]++;for(;t<=279;)s[2*t+1]=7,t++,w[7]++;for(;t<=287;)s[2*t+1]=8,t++,w[8]++;for(z(s,287,w),t=0;t<30;t++)h[2*t+1]=5,h[2*t]=y(t,5);d=new p(s,a,257,286,15),u=new p(h,n,0,30,15),f=new p([],r,0,19,7)}(),D=!0),t.l_desc=new g(t.dyn_ltree,d),t.d_desc=new g(t.dyn_dtree,u),t.bl_desc=new g(t.bl_tree,f),t.bi_buf=0,t.bi_valid=0,k(t)}(e),0}(t);return 0===i&&((e=t.state).window_size=2*e.w_size,V(e.head),e.max_lazy_match=st[e.level].max_lazy,e.good_match=st[e.level].good_length,e.nice_match=st[e.level].nice_length,e.max_chain_length=st[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=2,e.match_available=0,e.ins_h=0),i},_t=function(t,e){var a,n;if(!t||!t.state||e>5||e<0)return t?Q(t,G):G;var r=t.state;if(!t.output||!t.input&&0!==t.avail_in||r.status===P&&4!==e)return Q(t,0===t.avail_out?-5:G);r.strm=t;var i=r.last_flush;if(r.last_flush=e,42===r.status)if(2===r.wrap)t.adler=0,Z(r,31),Z(r,139),Z(r,8),r.gzhead?(Z(r,(r.gzhead.text?1:0)+(r.gzhead.hcrc?2:0)+(r.gzhead.extra?4:0)+(r.gzhead.name?8:0)+(r.gzhead.comment?16:0)),Z(r,255&r.gzhead.time),Z(r,r.gzhead.time>>8&255),Z(r,r.gzhead.time>>16&255),Z(r,r.gzhead.time>>24&255),Z(r,9===r.level?2:r.strategy>=2||r.level<2?4:0),Z(r,255&r.gzhead.os),r.gzhead.extra&&r.gzhead.extra.length&&(Z(r,255&r.gzhead.extra.length),Z(r,r.gzhead.extra.length>>8&255)),r.gzhead.hcrc&&(t.adler=T(t.adler,r.pending_buf,r.pending,0)),r.gzindex=0,r.status=69):(Z(r,0),Z(r,0),Z(r,0),Z(r,0),Z(r,0),Z(r,9===r.level?2:r.strategy>=2||r.level<2?4:0),Z(r,3),r.status=N);else{var h=8+(r.w_bits-8<<4)<<8;h|=(r.strategy>=2||r.level<2?0:r.level<6?1:6===r.level?2:3)<<6,0!==r.strstart&&(h|=32),h+=31-h%31,r.status=N,$(r,h),0!==r.strstart&&($(r,t.adler>>>16),$(r,65535&t.adler)),t.adler=1}if(69===r.status)if(r.gzhead.extra){for(a=r.pending;r.gzindex<(65535&r.gzhead.extra.length)&&(r.pending!==r.pending_buf_size||(r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),X(t),a=r.pending,r.pending!==r.pending_buf_size));)Z(r,255&r.gzhead.extra[r.gzindex]),r.gzindex++;r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),r.gzindex===r.gzhead.extra.length&&(r.gzindex=0,r.status=73)}else r.status=73;if(73===r.status)if(r.gzhead.name){a=r.pending;do{if(r.pending===r.pending_buf_size&&(r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),X(t),a=r.pending,r.pending===r.pending_buf_size)){n=1;break}n=r.gzindex<r.gzhead.name.length?255&r.gzhead.name.charCodeAt(r.gzindex++):0,Z(r,n)}while(0!==n);r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),0===n&&(r.gzindex=0,r.status=91)}else r.status=91;if(91===r.status)if(r.gzhead.comment){a=r.pending;do{if(r.pending===r.pending_buf_size&&(r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),X(t),a=r.pending,r.pending===r.pending_buf_size)){n=1;break}n=r.gzindex<r.gzhead.comment.length?255&r.gzhead.comment.charCodeAt(r.gzindex++):0,Z(r,n)}while(0!==n);r.gzhead.hcrc&&r.pending>a&&(t.adler=T(t.adler,r.pending_buf,r.pending-a,a)),0===n&&(r.status=K)}else r.status=K;if(r.status===K&&(r.gzhead.hcrc?(r.pending+2>r.pending_buf_size&&X(t),r.pending+2<=r.pending_buf_size&&(Z(r,255&t.adler),Z(r,t.adler>>8&255),t.adler=0,r.status=N)):r.status=N),0!==r.pending){if(X(t),0===t.avail_out)return r.last_flush=-1,0}else if(0===t.avail_in&&R(e)<=R(i)&&4!==e)return Q(t,-5);if(r.status===P&&0!==t.avail_in)return Q(t,-5);if(0!==t.avail_in||0!==r.lookahead||0!==e&&r.status!==P){var l=2===r.strategy?function(t,e){for(var a;;){if(0===t.lookahead&&(at(t),0===t.lookahead)){if(0===e)return 1;break}if(t.match_length=0,a=F(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(Y(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,4===e?(Y(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(Y(t,!1),0===t.strm.avail_out)?1:2}(r,e):3===r.strategy?function(t,e){for(var a,n,r,i,s=t.window;;){if(t.lookahead<=H){if(at(t),t.lookahead<=H&&0===e)return 1;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=3&&t.strstart>0&&(n=s[r=t.strstart-1])===s[++r]&&n===s[++r]&&n===s[++r]){i=t.strstart+H;do{}while(n===s[++r]&&n===s[++r]&&n===s[++r]&&n===s[++r]&&n===s[++r]&&n===s[++r]&&n===s[++r]&&n===s[++r]&&r<i);t.match_length=H-(i-r),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=3?(a=F(t,1,t.match_length-3),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=F(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(Y(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,4===e?(Y(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(Y(t,!1),0===t.strm.avail_out)?1:2}(r,e):st[r.level].func(r,e);if(3!==l&&4!==l||(r.status=P),1===l||3===l)return 0===t.avail_out&&(r.last_flush=-1),0;if(2===l&&(1===e?function(t){m(t,2,3),b(t,256,s),function(t){16===t.bi_valid?(w(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}(t)}(r):5!==e&&(q(r,0,0,!1),3===e&&(V(r.head),0===r.lookahead&&(r.strstart=0,r.block_start=0,r.insert=0))),X(t),0===t.avail_out))return r.last_flush=-1,0}return 4!==e?0:r.wrap<=0?1:(2===r.wrap?(Z(r,255&t.adler),Z(r,t.adler>>8&255),Z(r,t.adler>>16&255),Z(r,t.adler>>24&255),Z(r,255&t.total_in),Z(r,t.total_in>>8&255),Z(r,t.total_in>>16&255),Z(r,t.total_in>>24&255)):($(r,t.adler>>>16),$(r,65535&t.adler)),X(t),r.wrap>0&&(r.wrap=-r.wrap),0!==r.pending?0:1)},ot=function(t){if(!t||!t.state)return G;var e=t.state.status;return 42!==e&&69!==e&&73!==e&&91!==e&&e!==K&&e!==N&&e!==P?Q(t,G):(t.state=null,e===N?Q(t,-3):0)},dt=new Uint8Array(256),ut=0;ut<256;ut++)dt[ut]=ut>=252?6:ut>=248?5:ut>=240?4:ut>=224?3:ut>=192?2:1;dt[254]=dt[254]=1;var ft=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0},ct=Object.prototype.toString;function pt(){this.options={level:-1,method:8,chunkSize:16384,windowBits:15,memLevel:8,strategy:0};var t=this.options;t.raw&&t.windowBits>0?t.windowBits=-t.windowBits:t.gzip&&t.windowBits>0&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new ft,this.strm.avail_out=0;var e,a,n=function(t,e,a,n,r,i){if(!t)return G;var s=1;if(-1===e&&(e=6),n<0?(s=0,n=-n):n>15&&(s=2,n-=16),r<1||r>9||8!==a||n<8||n>15||e<0||e>9||i<0||i>4)return Q(t,G);8===n&&(n=9);var h=new ht;return t.state=h,h.strm=t,h.wrap=s,h.gzhead=null,h.w_bits=n,h.w_size=1<<h.w_bits,h.w_mask=h.w_size-1,h.hash_bits=r+7,h.hash_size=1<<h.hash_bits,h.hash_mask=h.hash_size-1,h.hash_shift=~~((h.hash_bits+3-1)/3),h.window=new Uint8Array(2*h.w_size),h.head=new Uint16Array(h.hash_size),h.prev=new Uint16Array(h.w_size),h.lit_bufsize=1<<r+6,h.pending_buf_size=4*h.lit_bufsize,h.pending_buf=new Uint8Array(h.pending_buf_size),h.d_buf=1*h.lit_bufsize,h.l_buf=3*h.lit_bufsize,h.level=e,h.strategy=i,h.method=a,lt(t)}(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(0!==n)throw Error(O[n]);if(t.header&&(e=this.strm,a=t.header,e&&e.state&&(2!==e.state.wrap||(e.state.gzhead=a))),t.dictionary){var r;if(r="[object ArrayBuffer]"===ct.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,0!==(n=function(t,e){var a=e.length;if(!t||!t.state)return G;var n=t.state,r=n.wrap;if(2===r||1===r&&42!==n.status||n.lookahead)return G;if(1===r&&(t.adler=L(t.adler,e,a,0)),n.wrap=0,a>=n.w_size){0===r&&(V(n.head),n.strstart=0,n.block_start=0,n.insert=0);var i=new Uint8Array(n.w_size);i.set(e.subarray(a-n.w_size,a),0),e=i,a=n.w_size}var s=t.avail_in,h=t.next_in,l=t.input;for(t.avail_in=a,t.next_in=0,t.input=e,at(n);n.lookahead>=3;){var _=n.strstart,o=n.lookahead-2;do{n.ins_h=W(n,n.ins_h,n.window[_+3-1]),n.prev[_&n.w_mask]=n.head[n.ins_h],n.head[n.ins_h]=_,_++}while(--o);n.strstart=_,n.lookahead=2,at(n)}return n.strstart+=n.lookahead,n.block_start=n.strstart,n.insert=n.lookahead,n.lookahead=0,n.match_length=n.prev_length=2,n.match_available=0,t.next_in=h,t.input=l,t.avail_in=s,n.wrap=r,0}(this.strm,r)))throw Error(O[n]);this._dict_set=!0}}function gt(t,e,a){try{t.postMessage({type:"errored",error:e,streamId:a})}catch(n){t.postMessage({type:"errored",error:e+"",streamId:a})}}function vt(t){const e=t.strm.adler;return new Uint8Array([3,0,e>>>24&255,e>>>16&255,e>>>8&255,255&e])}pt.prototype.push=function(t,e){var a,n,r=this.strm,i=this.options.chunkSize;if(this.ended)return!1;for(n=e===~~e?e:!0===e?4:0,"[object ArrayBuffer]"===ct.call(t)?r.input=new Uint8Array(t):r.input=t,r.next_in=0,r.avail_in=r.input.length;;)if(0===r.avail_out&&(r.output=new Uint8Array(i),r.next_out=0,r.avail_out=i),(2===n||3===n)&&r.avail_out<=6)this.onData(r.output.subarray(0,r.next_out)),r.avail_out=0;else{if(1===(a=_t(r,n)))return r.next_out>0&&this.onData(r.output.subarray(0,r.next_out)),a=ot(this.strm),this.onEnd(a),this.ended=!0,0===a;if(0!==r.avail_out){if(n>0&&r.next_out>0)this.onData(r.output.subarray(0,r.next_out)),r.avail_out=0;else if(0===r.avail_in)break}else this.onData(r.output)}return!0},pt.prototype.onData=function(t){this.chunks.push(t)},pt.prototype.onEnd=function(t){0===t&&(this.result=function(t){for(var e=0,a=0,n=t.length;a<n;a++)e+=t[a].length;for(var r=new Uint8Array(e),i=0,s=0,h=t.length;i<h;i++){var l=t[i];r.set(l,s),s+=l.length}return r}(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},function(e=self){try{const a=new Map;e.addEventListener("message",n=>{try{const r=function(e,a){switch(a.action){case"init":return{type:"initialized",version:"0.3.1"};case"write":{let n=e.get(a.streamId);n||(n=new pt,e.set(a.streamId,n));const r=n.chunks.length,i=function(t){if("function"==typeof TextEncoder&&TextEncoder.prototype.encode)return(new TextEncoder).encode(t);let e,a,n,r,i,s=t.length,h=0;for(r=0;r<s;r++)a=t.charCodeAt(r),55296==(64512&a)&&r+1<s&&(n=t.charCodeAt(r+1),56320==(64512&n)&&(a=65536+(a-55296<<10)+(n-56320),r++)),h+=a<128?1:a<2048?2:a<65536?3:4;for(e=new Uint8Array(h),i=0,r=0;i<h;r++)a=t.charCodeAt(r),55296==(64512&a)&&r+1<s&&(n=t.charCodeAt(r+1),56320==(64512&n)&&(a=65536+(a-55296<<10)+(n-56320),r++)),a<128?e[i++]=a:a<2048?(e[i++]=192|a>>>6,e[i++]=128|63&a):a<65536?(e[i++]=224|a>>>12,e[i++]=128|a>>>6&63,e[i++]=128|63&a):(e[i++]=240|a>>>18,e[i++]=128|a>>>12&63,e[i++]=128|a>>>6&63,e[i++]=128|63&a);return e}(a.data);return n.push(i,2),{type:"wrote",id:a.id,streamId:a.streamId,result:t(n.chunks.slice(r)),trailer:vt(n),additionalBytesCount:i.length}}case"reset":e.delete(a.streamId)}}(a,n.data);r&&e.postMessage(r)}catch(t){gt(e,t,n.data&&"streamId"in n.data?n.data.streamId:void 0)}})}catch(t){gt(e,t)}}()})();'])));
  }
  var state = {
    status: 0
    /* DeflateWorkerStatus.Nil */
  };
  function startDeflateWorker(configuration, source, onInitializationFailure, createDeflateWorkerImpl = createDeflateWorker) {
    if (state.status === 0) {
      doStartDeflateWorker(configuration, source, createDeflateWorkerImpl);
    }
    switch (state.status) {
      case 1:
        state.initializationFailureCallbacks.push(onInitializationFailure);
        return state.worker;
      case 3:
        return state.worker;
    }
  }
  function getDeflateWorkerStatus() {
    return state.status;
  }
  function doStartDeflateWorker(configuration, source, createDeflateWorkerImpl = createDeflateWorker) {
    try {
      const worker = createDeflateWorkerImpl(configuration);
      const { stop: removeErrorListener } = addEventListener(configuration, worker, "error", (error) => {
        onError(configuration, source, error);
      });
      const { stop: removeMessageListener } = addEventListener(configuration, worker, "message", ({ data }) => {
        if (data.type === "errored") {
          onError(configuration, source, data.error, data.streamId);
        } else if (data.type === "initialized") {
          onInitialized(data.version);
        }
      });
      worker.postMessage({ action: "init" });
      setTimeout(() => onTimeout(source), INITIALIZATION_TIME_OUT_DELAY);
      const stop = () => {
        removeErrorListener();
        removeMessageListener();
      };
      state = { status: 1, worker, stop, initializationFailureCallbacks: [] };
    } catch (error) {
      onError(configuration, source, error);
    }
  }
  function onTimeout(source) {
    if (state.status === 1) {
      display.error(`${source} failed to start: a timeout occurred while initializing the Worker`);
      state.initializationFailureCallbacks.forEach((callback) => callback());
      state = {
        status: 2
        /* DeflateWorkerStatus.Error */
      };
    }
  }
  function onInitialized(version) {
    if (state.status === 1) {
      state = { status: 3, worker: state.worker, stop: state.stop, version };
    }
  }
  function onError(configuration, source, error, streamId) {
    if (state.status === 1 || state.status === 0) {
      reportScriptLoadingError({
        configuredUrl: configuration.workerUrl,
        error,
        source,
        scriptType: "worker"
      });
      if (state.status === 1) {
        state.initializationFailureCallbacks.forEach((callback) => callback());
      }
      state = {
        status: 2
        /* DeflateWorkerStatus.Error */
      };
    } else {
      addTelemetryError(error, {
        worker_version: state.status === 3 && state.version,
        stream_id: streamId
      });
    }
  }

  // node_modules/@openobserve/browser-rum/esm/boot/isBrowserSupported.js
  function isBrowserSupported() {
    return (
      // Array.from is a bit less supported by browsers than CSSSupportsRule, but has higher chances
      // to be polyfilled. Test for both to be more confident. We could add more things if we find out
      // this test is not sufficient.
      typeof Array.from === "function" && typeof CSSSupportsRule === "function" && typeof URL.createObjectURL === "function" && "forEach" in NodeList.prototype
    );
  }

  // node_modules/@openobserve/browser-rum/esm/boot/postStartStrategy.js
  init_esm();

  // node_modules/@openobserve/browser-rum/esm/domain/getSessionReplayLink.js
  init_esm2();
  function getSessionReplayLink(configuration, sessionManager, viewHistory, isRecordingStarted) {
    const session = sessionManager.findTrackedSession();
    const errorType = getErrorType(session, isRecordingStarted);
    const viewContext = viewHistory.findView();
    return getSessionReplayUrl(configuration, {
      viewContext,
      errorType,
      session
    });
  }
  function getErrorType(session, isRecordingStarted) {
    if (!isBrowserSupported()) {
      return "browser-not-supported";
    }
    if (!session) {
      return "rum-not-tracked";
    }
    if (session.sessionReplay === 0) {
      return "incorrect-session-plan";
    }
    if (!isRecordingStarted) {
      return "replay-not-started";
    }
  }

  // node_modules/@openobserve/browser-rum/esm/domain/startRecorderInitTelemetry.js
  init_esm();
  function startRecorderInitTelemetry(telemetry, observable) {
    if (!telemetry.metricsEnabled) {
      return { stop: noop };
    }
    let startContext;
    let documentReadyDuration;
    let recorderSettledDuration;
    const { unsubscribe } = observable.subscribe((event) => {
      switch (event.type) {
        case "start":
          startContext = { forced: event.forced, timestamp: timeStampNow() };
          documentReadyDuration = void 0;
          recorderSettledDuration = void 0;
          break;
        case "document-ready":
          if (startContext) {
            documentReadyDuration = elapsed(startContext.timestamp, timeStampNow());
          }
          break;
        case "recorder-settled":
          if (startContext) {
            recorderSettledDuration = elapsed(startContext.timestamp, timeStampNow());
          }
          break;
        case "aborted":
        case "deflate-encoder-load-failed":
        case "recorder-load-failed":
        case "succeeded":
          unsubscribe();
          if (startContext) {
            addTelemetryMetrics("Recorder init metrics", {
              metrics: createRecorderInitMetrics(startContext.forced, recorderSettledDuration, elapsed(startContext.timestamp, timeStampNow()), event.type, documentReadyDuration)
            });
          }
          break;
      }
    });
    return { stop: unsubscribe };
  }
  function createRecorderInitMetrics(forced, loadRecorderModuleDuration, recorderInitDuration, result, waitForDocReadyDuration) {
    return {
      forced,
      loadRecorderModuleDuration,
      recorderInitDuration,
      result,
      waitForDocReadyDuration
    };
  }

  // node_modules/@openobserve/browser-rum/esm/boot/postStartStrategy.js
  function createPostStartStrategy2(configuration, lifeCycle, sessionManager, viewHistory, loadRecorder, getOrCreateDeflateEncoder, telemetry) {
    let status = 0;
    let stopRecording;
    lifeCycle.subscribe(9, () => {
      if (status === 2 || status === 3) {
        stop();
        status = 1;
      }
    });
    lifeCycle.subscribe(10, () => {
      if (status === 1) {
        start();
      }
    });
    const observable = new Observable();
    startRecorderInitTelemetry(telemetry, observable);
    const doStart = async (forced) => {
      observable.notify({ type: "start", forced });
      const [startRecordingImpl] = await Promise.all([
        notifyWhenSettled(observable, { type: "recorder-settled" }, loadRecorder()),
        notifyWhenSettled(observable, { type: "document-ready" }, asyncRunOnReadyState(configuration, "interactive"))
      ]);
      if (status !== 2) {
        observable.notify({ type: "aborted" });
        return;
      }
      if (!startRecordingImpl) {
        status = 0;
        observable.notify({ type: "recorder-load-failed" });
        return;
      }
      const deflateEncoder = getOrCreateDeflateEncoder();
      if (!deflateEncoder) {
        status = 0;
        observable.notify({ type: "deflate-encoder-load-failed" });
        return;
      }
      ;
      ({ stop: stopRecording } = startRecordingImpl(lifeCycle, configuration, sessionManager, viewHistory, deflateEncoder, telemetry));
      status = 3;
      observable.notify({ type: "succeeded" });
    };
    function start(options) {
      const session = sessionManager.findTrackedSession();
      if (canStartRecording(session, options)) {
        status = 1;
        return;
      }
      if (isRecordingInProgress(status)) {
        return;
      }
      status = 2;
      const forced = shouldForceReplay(session, options) || false;
      doStart(forced).catch(monitorError);
      if (forced) {
        sessionManager.setForcedReplay();
      }
    }
    function stop() {
      if (status === 3) {
        stopRecording === null || stopRecording === void 0 ? void 0 : stopRecording();
      }
      status = 0;
    }
    return {
      start,
      stop,
      getSessionReplayLink() {
        return getSessionReplayLink(
          configuration,
          sessionManager,
          viewHistory,
          status !== 0
          /* RecorderStatus.Stopped */
        );
      },
      isRecording: () => status === 3
    };
  }
  function canStartRecording(session, options) {
    return !session || session.sessionReplay === 0 && (!options || !options.force);
  }
  function isRecordingInProgress(status) {
    return status === 2 || status === 3;
  }
  function shouldForceReplay(session, options) {
    return options && options.force && session.sessionReplay === 0;
  }
  async function notifyWhenSettled(observable, event, promise) {
    try {
      return await promise;
    } finally {
      observable.notify(event);
    }
  }

  // node_modules/@openobserve/browser-rum/esm/boot/preStartStrategy.js
  init_esm();
  function createPreStartStrategy2() {
    let status = 0;
    return {
      strategy: {
        start() {
          status = 1;
        },
        stop() {
          status = 2;
        },
        isRecording: () => false,
        getSessionReplayLink: noop
      },
      shouldStartImmediately(configuration) {
        return status === 1 || status === 0 && !configuration.startSessionReplayRecordingManually;
      }
    };
  }

  // node_modules/@openobserve/browser-rum/esm/boot/recorderApi.js
  function makeRecorderApi(loadRecorder, createDeflateWorkerImpl) {
    if (canUseEventBridge() && !bridgeSupports(
      "records"
      /* BridgeCapability.RECORDS */
    ) || !isBrowserSupported()) {
      return {
        start: noop,
        stop: noop,
        getReplayStats: () => void 0,
        onRumStart: noop,
        isRecording: () => false,
        getSessionReplayLink: () => void 0
      };
    }
    let { strategy, shouldStartImmediately } = createPreStartStrategy2();
    return {
      start: (options) => strategy.start(options),
      stop: () => strategy.stop(),
      getSessionReplayLink: () => strategy.getSessionReplayLink(),
      onRumStart,
      isRecording: () => (
        // The worker is started optimistically, meaning we could have started to record but its
        // initialization fails a bit later. This could happen when:
        // * the worker URL (blob or plain URL) is blocked by CSP in Firefox only (Chromium and Safari
        // throw an exception when instantiating the worker, and IE doesn't care about CSP)
        // * the browser fails to load the worker in case the workerUrl is used
        // * an unexpected error occurs in the Worker before initialization, ex:
        //   * a runtime exception collected by monitor()
        //   * a syntax error notified by the browser via an error event
        // * the worker is unresponsive for some reason and timeouts
        //
        // It is not expected to happen often. Nonetheless, the "replayable" status on RUM events is
        // an important part of the Openobserve App:
        // * If we have a false positive (we set has_replay: true even if no replay data is present),
        // we might display broken links to the Session Replay player.
        // * If we have a false negative (we don't set has_replay: true even if replay data is
        // available), it is less noticeable because no link will be displayed.
        //
        // Thus, it is better to have false negative, so let's make sure the worker is correctly
        // initialized before advertizing that we are recording.
        //
        // In the future, when the compression worker will also be used for RUM data, this will be
        // less important since no RUM event will be sent when the worker fails to initialize.
        getDeflateWorkerStatus() === 3 && strategy.isRecording()
      ),
      getReplayStats: (viewId) => getDeflateWorkerStatus() === 3 ? getReplayStats(viewId) : void 0
    };
    function onRumStart(lifeCycle, configuration, sessionManager, viewHistory, worker, telemetry) {
      let cachedDeflateEncoder;
      function getOrCreateDeflateEncoder() {
        if (!cachedDeflateEncoder) {
          worker !== null && worker !== void 0 ? worker : worker = startDeflateWorker(configuration, "Datadog Session Replay", () => {
            strategy.stop();
          }, createDeflateWorkerImpl);
          if (worker) {
            cachedDeflateEncoder = createDeflateEncoder(
              configuration,
              worker,
              1
              /* DeflateEncoderStreamId.REPLAY */
            );
          }
        }
        return cachedDeflateEncoder;
      }
      strategy = createPostStartStrategy2(configuration, lifeCycle, sessionManager, viewHistory, loadRecorder, getOrCreateDeflateEncoder, telemetry);
      if (shouldStartImmediately(configuration)) {
        strategy.start();
      }
    }
  }

  // node_modules/@openobserve/browser-rum/esm/boot/lazyLoadRecorder.js
  async function lazyLoadRecorder(importRecorderImpl = importRecorder) {
    try {
      return await importRecorderImpl();
    } catch (error) {
      reportScriptLoadingError({
        error,
        source: "Recorder",
        scriptType: "module"
      });
    }
  }
  async function importRecorder() {
    const module = await Promise.resolve().then(() => (init_startRecording(), startRecording_exports));
    return module.startRecording;
  }

  // node_modules/@openobserve/browser-rum/esm/boot/profilerApi.js
  init_esm2();
  init_esm();

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/profilingSupported.js
  init_esm();
  function isProfilingSupported() {
    const globalThis2 = getGlobalObject();
    const globalThisProfiler = globalThis2.Profiler;
    return globalThisProfiler !== void 0;
  }

  // node_modules/@openobserve/browser-rum/esm/domain/profiling/profilingContext.js
  init_esm();
  init_esm2();
  var startProfilingContext = (hooks) => {
    let currentContext = {
      status: "starting"
    };
    hooks.register(0, ({ eventType }) => {
      if (eventType !== RumEventType.VIEW && eventType !== RumEventType.LONG_TASK) {
        return SKIPPED;
      }
      return {
        type: eventType,
        _oo: {
          profiling: currentContext
        }
      };
    });
    return {
      get: () => currentContext,
      set: (newContext) => {
        currentContext = newContext;
      }
    };
  };

  // node_modules/@openobserve/browser-rum/esm/boot/lazyLoadProfiler.js
  async function lazyLoadProfiler(importProfilerImpl = importProfiler) {
    try {
      return await importProfilerImpl();
    } catch (error) {
      reportScriptLoadingError({
        error,
        source: "Profiler",
        scriptType: "module"
      });
    }
  }
  async function importProfiler() {
    const module = await Promise.resolve().then(() => (init_profiler(), profiler_exports));
    return module.createRumProfiler;
  }

  // node_modules/@openobserve/browser-rum/esm/boot/profilerApi.js
  function makeProfilerApi() {
    let profiler;
    function onRumStart(lifeCycle, hooks, configuration, sessionManager, viewHistory, createEncoder) {
      const session = sessionManager.findTrackedSession();
      if (!session) {
        return;
      }
      if (!isSampled(session.id, configuration.profilingSampleRate)) {
        return;
      }
      const profilingContextManager = startProfilingContext(hooks);
      if (!isProfilingSupported()) {
        profilingContextManager.set({
          status: "error",
          error_reason: "not-supported-by-browser"
        });
        return;
      }
      lazyLoadProfiler().then((createRumProfiler2) => {
        if (!createRumProfiler2) {
          addTelemetryDebug("[OO_RUM] Failed to lazy load the RUM Profiler");
          profilingContextManager.set({ status: "error", error_reason: "failed-to-lazy-load" });
          return;
        }
        profiler = createRumProfiler2(configuration, lifeCycle, sessionManager, profilingContextManager, createEncoder);
        profiler.start(viewHistory.findView());
      }).catch(monitorError);
    }
    return {
      onRumStart,
      stop: () => {
        profiler === null || profiler === void 0 ? void 0 : profiler.stop().catch(monitorError);
      }
    };
  }

  // node_modules/@openobserve/browser-rum/esm/entries/main.js
  var recorderApi = makeRecorderApi(lazyLoadRecorder);
  var profilerApi = makeProfilerApi();
  var openobserveRum = makeRumPublicApi(startRum, recorderApi, profilerApi, {
    startDeflateWorker,
    createDeflateEncoder,
    sdkName: "rum"
  });
  defineGlobal(getGlobalObject(), "OO_RUM", openobserveRum);

  // node_modules/@openobserve/browser-logs/esm/entries/main.js
  init_esm();

  // node_modules/@openobserve/browser-logs/esm/boot/logsPublicApi.js
  init_esm();

  // node_modules/@openobserve/browser-logs/esm/domain/logger.js
  init_esm();

  // node_modules/@openobserve/browser-logs/esm/domain/logger/isAuthorized.js
  function isAuthorized(status, handlerType, logger) {
    const loggerHandler = logger.getHandler();
    const sanitizedHandlerType = Array.isArray(loggerHandler) ? loggerHandler : [loggerHandler];
    return STATUS_PRIORITIES[status] >= STATUS_PRIORITIES[logger.getLevel()] && sanitizedHandlerType.includes(handlerType);
  }
  var StatusType = {
    ok: "ok",
    debug: "debug",
    info: "info",
    notice: "notice",
    warn: "warn",
    error: "error",
    critical: "critical",
    alert: "alert",
    emerg: "emerg"
  };
  var STATUS_PRIORITIES = {
    [StatusType.ok]: 0,
    [StatusType.debug]: 1,
    [StatusType.info]: 2,
    [StatusType.notice]: 4,
    [StatusType.warn]: 5,
    [StatusType.error]: 6,
    [StatusType.critical]: 7,
    [StatusType.alert]: 8,
    [StatusType.emerg]: 9
  };

  // node_modules/@openobserve/browser-logs/esm/domain/createErrorFieldFromRawError.js
  function createErrorFieldFromRawError(rawError, {
    /**
     * Set this to `true` to include the error message in the error field. In most cases, the error
     * message is already included in the log message, so we don't need to include it again.
     */
    includeMessage = false
  } = {}) {
    return {
      stack: rawError.stack,
      kind: rawError.type,
      message: includeMessage ? rawError.message : void 0,
      causes: rawError.causes,
      fingerprint: rawError.fingerprint,
      handling: rawError.handling
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/logger.js
  var __decorate = function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var HandlerType = {
    console: "console",
    http: "http",
    silent: "silent"
  };
  var STATUSES = Object.keys(StatusType);
  var Logger = class {
    constructor(handleLogStrategy, name, handlerType = HandlerType.http, level = StatusType.debug, loggerContext = {}) {
      this.handleLogStrategy = handleLogStrategy;
      this.handlerType = handlerType;
      this.level = level;
      this.contextManager = createContextManager("logger");
      this.tags = [];
      this.contextManager.setContext(loggerContext);
      if (name) {
        this.contextManager.setContextProperty("logger", { name });
      }
    }
    logImplementation(message, messageContext, status = StatusType.info, error, handlingStack) {
      const sanitizedMessageContext = sanitize(messageContext);
      let context;
      if (error !== void 0 && error !== null) {
        const rawError = computeRawError({
          originalError: error,
          nonErrorPrefix: "Provided",
          source: ErrorSource.LOGGER,
          handling: "handled",
          startClocks: clocksNow()
        });
        context = combine({
          error: createErrorFieldFromRawError(rawError, { includeMessage: true })
        }, rawError.context, sanitizedMessageContext);
      } else {
        context = sanitizedMessageContext;
      }
      this.handleLogStrategy({
        message: sanitize(message),
        context,
        status
      }, this, handlingStack);
    }
    log(message, messageContext, status = StatusType.info, error) {
      let handlingStack;
      if (isAuthorized(status, HandlerType.http, this)) {
        handlingStack = createHandlingStack("log");
      }
      this.logImplementation(message, messageContext, status, error, handlingStack);
    }
    setContext(context) {
      this.contextManager.setContext(context);
    }
    getContext() {
      return this.contextManager.getContext();
    }
    setContextProperty(key, value) {
      this.contextManager.setContextProperty(key, value);
    }
    removeContextProperty(key) {
      this.contextManager.removeContextProperty(key);
    }
    clearContext() {
      this.contextManager.clearContext();
    }
    addTag(key, value) {
      this.tags.push(buildTag(key, value));
    }
    removeTagsWithKey(key) {
      const sanitizedKey = sanitizeTag(key);
      this.tags = this.tags.filter((tag) => tag !== sanitizedKey && !tag.startsWith(`${sanitizedKey}:`));
    }
    getTags() {
      return this.tags.slice();
    }
    setHandler(handler) {
      this.handlerType = handler;
    }
    getHandler() {
      return this.handlerType;
    }
    setLevel(level) {
      this.level = level;
    }
    getLevel() {
      return this.level;
    }
  };
  __decorate([
    monitored
  ], Logger.prototype, "logImplementation", null);
  Logger.prototype.ok = createLoggerMethod(StatusType.ok);
  Logger.prototype.debug = createLoggerMethod(StatusType.debug);
  Logger.prototype.info = createLoggerMethod(StatusType.info);
  Logger.prototype.notice = createLoggerMethod(StatusType.notice);
  Logger.prototype.warn = createLoggerMethod(StatusType.warn);
  Logger.prototype.error = createLoggerMethod(StatusType.error);
  Logger.prototype.critical = createLoggerMethod(StatusType.critical);
  Logger.prototype.alert = createLoggerMethod(StatusType.alert);
  Logger.prototype.emerg = createLoggerMethod(StatusType.emerg);
  function createLoggerMethod(status) {
    return function(message, messageContext, error) {
      let handlingStack;
      if (isAuthorized(status, HandlerType.http, this)) {
        handlingStack = createHandlingStack("log");
      }
      this.logImplementation(message, messageContext, status, error, handlingStack);
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/contexts/commonContext.js
  init_esm();
  function buildCommonContext() {
    if (isWorkerEnvironment) {
      return {};
    }
    return {
      view: {
        referrer: document.referrer,
        url: window.location.href
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/boot/preStartLogs.js
  init_esm();

  // node_modules/@openobserve/browser-logs/esm/domain/configuration.js
  init_esm();
  var DEFAULT_REQUEST_ERROR_RESPONSE_LENGTH_LIMIT = 32 * ONE_KIBI_BYTE;
  function validateAndBuildLogsConfiguration(initConfiguration, errorStack) {
    if (initConfiguration.usePciIntake === true && initConfiguration.site && initConfiguration.site !== "datadoghq.com") {
      display.warn("PCI compliance for Logs is only available for Datadog organizations in the US1 site. Default intake will be used.");
    }
    const baseConfiguration = validateAndBuildConfiguration(initConfiguration, errorStack);
    const forwardConsoleLogs = validateAndBuildForwardOption(initConfiguration.forwardConsoleLogs, objectValues(ConsoleApiName), "Forward Console Logs");
    const forwardReports = validateAndBuildForwardOption(initConfiguration.forwardReports, objectValues(RawReportType), "Forward Reports");
    if (!baseConfiguration || !forwardConsoleLogs || !forwardReports) {
      return;
    }
    if (initConfiguration.forwardErrorsToLogs && !forwardConsoleLogs.includes(ConsoleApiName.error)) {
      forwardConsoleLogs.push(ConsoleApiName.error);
    }
    return {
      forwardErrorsToLogs: initConfiguration.forwardErrorsToLogs !== false,
      forwardConsoleLogs,
      forwardReports,
      requestErrorResponseLengthLimit: DEFAULT_REQUEST_ERROR_RESPONSE_LENGTH_LIMIT,
      ...baseConfiguration
    };
  }
  function validateAndBuildForwardOption(option, allowedValues, label) {
    if (option === void 0) {
      return [];
    }
    if (!(option === "all" || Array.isArray(option) && option.every((api) => allowedValues.includes(api)))) {
      display.error(`${label} should be "all" or an array with allowed values "${allowedValues.join('", "')}"`);
      return;
    }
    return option === "all" ? allowedValues : removeDuplicates(option);
  }
  function serializeLogsConfiguration(configuration) {
    const baseSerializedInitConfiguration = serializeConfiguration(configuration);
    return {
      forward_errors_to_logs: configuration.forwardErrorsToLogs,
      forward_console_logs: configuration.forwardConsoleLogs,
      forward_reports: configuration.forwardReports,
      use_pci_intake: configuration.usePciIntake,
      ...baseSerializedInitConfiguration
    };
  }

  // node_modules/@openobserve/browser-logs/esm/boot/preStartLogs.js
  function createPreStartStrategy3(getCommonContext, trackingConsentState, doStartLogs) {
    const bufferApiCalls = createBoundedBuffer();
    const globalContext = buildGlobalContextManager();
    bufferContextCalls(globalContext, CustomerContextKey.globalContext, bufferApiCalls);
    const accountContext = buildAccountContextManager();
    bufferContextCalls(accountContext, CustomerContextKey.accountContext, bufferApiCalls);
    const userContext = buildUserContextManager();
    bufferContextCalls(userContext, CustomerContextKey.userContext, bufferApiCalls);
    let cachedInitConfiguration;
    let cachedConfiguration;
    const trackingConsentStateSubscription = trackingConsentState.observable.subscribe(tryStartLogs);
    function tryStartLogs() {
      if (!cachedConfiguration || !cachedInitConfiguration || !trackingConsentState.isGranted()) {
        return;
      }
      trackingConsentStateSubscription.unsubscribe();
      const startLogsResult = doStartLogs(cachedInitConfiguration, cachedConfiguration);
      bufferApiCalls.drain(startLogsResult);
    }
    return {
      init(initConfiguration, errorStack) {
        if (!initConfiguration) {
          display.error("Missing configuration");
          return;
        }
        initFeatureFlags(initConfiguration.enableExperimentalFeatures);
        if (canUseEventBridge()) {
          initConfiguration = overrideInitConfigurationForBridge2(initConfiguration);
        }
        cachedInitConfiguration = initConfiguration;
        addTelemetryConfiguration(serializeLogsConfiguration(initConfiguration));
        if (cachedConfiguration) {
          displayAlreadyInitializedError("OO_LOGS", initConfiguration);
          return;
        }
        const configuration = validateAndBuildLogsConfiguration(initConfiguration, errorStack);
        if (!configuration) {
          return;
        }
        cachedConfiguration = configuration;
        initFetchObservable().subscribe(noop);
        trackingConsentState.tryToInit(configuration.trackingConsent);
        tryStartLogs();
      },
      get initConfiguration() {
        return cachedInitConfiguration;
      },
      globalContext,
      accountContext,
      userContext,
      getInternalContext: noop,
      handleLog(message, statusType, handlingStack, context = getCommonContext(), date = timeStampNow()) {
        bufferApiCalls.add((startLogsResult) => startLogsResult.handleLog(message, statusType, handlingStack, context, date));
      }
    };
  }
  function overrideInitConfigurationForBridge2(initConfiguration) {
    return { ...initConfiguration, clientToken: "empty" };
  }

  // node_modules/@openobserve/browser-logs/esm/boot/logsPublicApi.js
  function makeLogsPublicApi(startLogsImpl) {
    const trackingConsentState = createTrackingConsentState();
    const bufferedDataObservable = startBufferingData().observable;
    let strategy = createPreStartStrategy3(buildCommonContext, trackingConsentState, (initConfiguration, configuration) => {
      const startLogsResult = startLogsImpl(configuration, buildCommonContext, trackingConsentState, bufferedDataObservable);
      strategy = createPostStartStrategy3(initConfiguration, startLogsResult);
      return startLogsResult;
    });
    const getStrategy = () => strategy;
    const customLoggers = {};
    const mainLogger = new Logger((...params) => strategy.handleLog(...params));
    return makePublicApi({
      logger: mainLogger,
      init: (initConfiguration) => {
        const errorStack = new Error().stack;
        callMonitored(() => strategy.init(initConfiguration, errorStack));
      },
      setTrackingConsent: monitor((trackingConsent) => {
        trackingConsentState.update(trackingConsent);
        addTelemetryUsage({ feature: "set-tracking-consent", tracking_consent: trackingConsent });
      }),
      getGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.getContext),
      setGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContext),
      setGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.setContextProperty),
      removeGlobalContextProperty: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.removeContextProperty),
      clearGlobalContext: defineContextMethod(getStrategy, CustomerContextKey.globalContext, ContextManagerMethod.clearContext),
      createLogger: monitor((name, conf = {}) => {
        customLoggers[name] = new Logger((...params) => strategy.handleLog(...params), sanitize(name), conf.handler, conf.level, sanitize(conf.context));
        return customLoggers[name];
      }),
      getLogger: monitor((name) => customLoggers[name]),
      getInitConfiguration: monitor(() => deepClone(strategy.initConfiguration)),
      getInternalContext: monitor((startTime) => strategy.getInternalContext(startTime)),
      setUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContext),
      getUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.getContext),
      setUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.setContextProperty),
      removeUserProperty: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.removeContextProperty),
      clearUser: defineContextMethod(getStrategy, CustomerContextKey.userContext, ContextManagerMethod.clearContext),
      setAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContext),
      getAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.getContext),
      setAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.setContextProperty),
      removeAccountProperty: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.removeContextProperty),
      clearAccount: defineContextMethod(getStrategy, CustomerContextKey.accountContext, ContextManagerMethod.clearContext)
    });
  }
  function createPostStartStrategy3(initConfiguration, startLogsResult) {
    return {
      init: (initConfiguration2) => {
        displayAlreadyInitializedError("OO_LOGS", initConfiguration2);
      },
      initConfiguration,
      ...startLogsResult
    };
  }

  // node_modules/@openobserve/browser-logs/esm/boot/startLogs.js
  init_esm();

  // node_modules/@openobserve/browser-logs/esm/domain/logsSessionManager.js
  init_esm();
  var LOGS_SESSION_KEY2 = "logs";
  function startLogsSessionManager(configuration, trackingConsentState) {
    const sessionManager = startSessionManager(configuration, LOGS_SESSION_KEY2, (rawTrackingType) => computeTrackingType2(configuration, rawTrackingType), trackingConsentState);
    return {
      findTrackedSession: (startTime, options = { returnInactive: false }) => {
        const session = sessionManager.findSession(startTime, options);
        return session && session.trackingType === "1" ? {
          id: session.id,
          anonymousId: session.anonymousId
        } : void 0;
      },
      expireObservable: sessionManager.expireObservable
    };
  }
  function startLogsSessionManagerStub(configuration) {
    const isTracked = computeTrackingType2(configuration) === "1";
    const session = isTracked ? {} : void 0;
    return {
      findTrackedSession: () => session,
      expireObservable: new Observable()
    };
  }
  function computeTrackingType2(configuration, rawTrackingType) {
    if (hasValidLoggerSession(rawTrackingType)) {
      return rawTrackingType;
    }
    if (!performDraw(configuration.sessionSampleRate)) {
      return "0";
    }
    return "1";
  }
  function hasValidLoggerSession(trackingType) {
    return trackingType === "0" || trackingType === "1";
  }

  // node_modules/@openobserve/browser-logs/esm/domain/assembly.js
  init_esm();
  function startLogsAssembly(configuration, lifeCycle, hooks, getCommonContext, reportError, eventRateLimit) {
    const statusWithCustom = STATUSES.concat(["custom"]);
    const logRateLimiters = {};
    statusWithCustom.forEach((status) => {
      logRateLimiters[status] = createEventRateLimiter(status, reportError, eventRateLimit);
    });
    lifeCycle.subscribe(0, ({ rawLogsEvent, messageContext = void 0, savedCommonContext = void 0, domainContext, ootags = [] }) => {
      var _a, _b;
      const startTime = getRelativeTime(rawLogsEvent.date);
      const commonContext = savedCommonContext || getCommonContext();
      const defaultLogsEventAttributes = hooks.triggerHook(0, {
        startTime
      });
      if (defaultLogsEventAttributes === DISCARDED) {
        return;
      }
      const defaultDdtags = buildTags(configuration);
      const log = combine({
        view: commonContext.view
      }, defaultLogsEventAttributes, rawLogsEvent, messageContext, {
        ootags: defaultDdtags.concat(ootags).join(",")
      });
      if (((_a = configuration.beforeSend) === null || _a === void 0 ? void 0 : _a.call(configuration, log, domainContext)) === false || log.origin !== ErrorSource.AGENT && ((_b = logRateLimiters[log.status]) !== null && _b !== void 0 ? _b : logRateLimiters["custom"]).isLimitReached()) {
        return;
      }
      lifeCycle.notify(1, log);
    });
  }

  // node_modules/@openobserve/browser-logs/esm/domain/console/consoleCollection.js
  init_esm();
  var LogStatusForApi = {
    [ConsoleApiName.log]: StatusType.info,
    [ConsoleApiName.debug]: StatusType.debug,
    [ConsoleApiName.info]: StatusType.info,
    [ConsoleApiName.warn]: StatusType.warn,
    [ConsoleApiName.error]: StatusType.error
  };
  function startConsoleCollection(configuration, lifeCycle) {
    const consoleSubscription = initConsoleObservable(configuration.forwardConsoleLogs).subscribe((log) => {
      var _a;
      const collectedData = {
        rawLogsEvent: {
          date: timeStampNow(),
          message: log.message,
          origin: ErrorSource.CONSOLE,
          error: log.error && createErrorFieldFromRawError(log.error),
          status: LogStatusForApi[log.api]
        },
        messageContext: (_a = log.error) === null || _a === void 0 ? void 0 : _a.context,
        domainContext: {
          handlingStack: log.handlingStack
        }
      };
      lifeCycle.notify(0, collectedData);
    });
    return {
      stop: () => {
        consoleSubscription.unsubscribe();
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/report/reportCollection.js
  init_esm();
  function startReportCollection(configuration, lifeCycle) {
    const reportSubscription = initReportObservable(configuration, configuration.forwardReports).subscribe((rawError) => {
      let message = rawError.message;
      let error;
      const status = rawError.originalError.type === "deprecation" ? StatusType.warn : StatusType.error;
      if (status === StatusType.error) {
        error = createErrorFieldFromRawError(rawError);
      } else if (rawError.stack) {
        message += ` Found in ${getFileFromStackTraceString(rawError.stack)}`;
      }
      lifeCycle.notify(0, {
        rawLogsEvent: {
          date: timeStampNow(),
          message,
          origin: ErrorSource.REPORT,
          error,
          status
        }
      });
    });
    return {
      stop: () => {
        reportSubscription.unsubscribe();
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/networkError/networkErrorCollection.js
  init_esm();
  function startNetworkErrorCollection(configuration, lifeCycle) {
    if (!configuration.forwardErrorsToLogs) {
      return { stop: noop };
    }
    const xhrSubscription = (isWorkerEnvironment ? new Observable() : initXhrObservable(configuration)).subscribe((context) => {
      if (context.state === "complete") {
        handleResponse(RequestType.XHR, context);
      }
    });
    const fetchSubscription = initFetchObservable({
      responseBodyAction: (context) => isNetworkError(context) ? 2 : 0
    }).subscribe((context) => {
      if (context.state === "resolve") {
        handleResponse(RequestType.FETCH, context);
      }
    });
    function isNetworkError(request) {
      return !isIntakeUrl(request.url) && (isRejected(request) || isServerError(request.status));
    }
    function handleResponse(type, request) {
      if (!isNetworkError(request)) {
        return;
      }
      const stack = "error" in request && request.error ? toStackTraceString(computeStackTrace(request.error)) : request.responseBody || "Failed to load";
      const domainContext = {
        isAborted: request.isAborted,
        handlingStack: request.handlingStack
      };
      lifeCycle.notify(0, {
        rawLogsEvent: {
          message: `${format(type)} error ${request.method} ${request.url}`,
          date: request.startClocks.timeStamp,
          error: {
            stack: safeTruncate(stack, configuration.requestErrorResponseLengthLimit, "..."),
            // We don't know if the error was handled or not, so we set it to undefined
            handling: void 0
          },
          http: {
            method: request.method,
            // Cast resource method because of case mismatch cf issue RUMF-1152
            status_code: request.status,
            url: request.url
          },
          status: StatusType.error,
          origin: ErrorSource.NETWORK
        },
        domainContext
      });
    }
    return {
      stop: () => {
        xhrSubscription.unsubscribe();
        fetchSubscription.unsubscribe();
      }
    };
  }
  function isRejected(request) {
    return request.status === 0 && request.responseType !== "opaque";
  }
  function format(type) {
    if (RequestType.XHR === type) {
      return "XHR";
    }
    return "Fetch";
  }

  // node_modules/@openobserve/browser-logs/esm/domain/runtimeError/runtimeErrorCollection.js
  init_esm();
  function startRuntimeErrorCollection(configuration, lifeCycle, bufferedDataObservable) {
    if (!configuration.forwardErrorsToLogs) {
      return { stop: noop };
    }
    const rawErrorSubscription = bufferedDataObservable.subscribe((bufferedData) => {
      if (bufferedData.type === 0) {
        const error = bufferedData.error;
        lifeCycle.notify(0, {
          rawLogsEvent: {
            message: error.message,
            date: error.startClocks.timeStamp,
            error: createErrorFieldFromRawError(error),
            origin: ErrorSource.SOURCE,
            status: StatusType.error
          },
          messageContext: error.context
        });
      }
    });
    return {
      stop: () => {
        rawErrorSubscription.unsubscribe();
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/lifeCycle.js
  init_esm();
  var LifeCycle2 = AbstractLifeCycle;

  // node_modules/@openobserve/browser-logs/esm/domain/logger/loggerCollection.js
  init_esm();
  function startLoggerCollection(lifeCycle) {
    function handleLog(logsMessage, logger, handlingStack, savedCommonContext, savedDate) {
      const messageContext = combine(logger.getContext(), logsMessage.context);
      if (isAuthorized(logsMessage.status, HandlerType.console, logger)) {
        displayInConsole(logsMessage, messageContext);
      }
      if (isAuthorized(logsMessage.status, HandlerType.http, logger)) {
        const rawLogEventData = {
          rawLogsEvent: {
            date: savedDate || timeStampNow(),
            message: logsMessage.message,
            status: logsMessage.status,
            origin: ErrorSource.LOGGER
          },
          messageContext,
          savedCommonContext,
          ootags: logger.getTags()
        };
        if (handlingStack) {
          rawLogEventData.domainContext = { handlingStack };
        }
        lifeCycle.notify(0, rawLogEventData);
      }
    }
    return {
      handleLog
    };
  }
  var loggerToConsoleApiName = {
    [StatusType.ok]: ConsoleApiName.debug,
    [StatusType.debug]: ConsoleApiName.debug,
    [StatusType.info]: ConsoleApiName.info,
    [StatusType.notice]: ConsoleApiName.info,
    [StatusType.warn]: ConsoleApiName.warn,
    [StatusType.error]: ConsoleApiName.error,
    [StatusType.critical]: ConsoleApiName.error,
    [StatusType.alert]: ConsoleApiName.error,
    [StatusType.emerg]: ConsoleApiName.error
  };
  function displayInConsole({ status, message }, messageContext) {
    originalConsoleMethods[loggerToConsoleApiName[status]].call(globalConsole, message, messageContext);
  }

  // node_modules/@openobserve/browser-logs/esm/transport/startLogsBatch.js
  init_esm();
  function startLogsBatch(configuration, lifeCycle, reportError, pageMayExitObservable, session) {
    const endpoints = [configuration.logsEndpointBuilder];
    if (configuration.replica) {
      endpoints.push(configuration.replica.logsEndpointBuilder);
    }
    const batch = createBatch({
      encoder: createIdentityEncoder(),
      request: createHttpRequest(endpoints, reportError),
      flushController: createFlushController({
        pageMayExitObservable,
        sessionExpireObservable: session.expireObservable
      })
    });
    lifeCycle.subscribe(1, (serverLogsEvent) => {
      batch.add(serverLogsEvent);
    });
    return batch;
  }

  // node_modules/@openobserve/browser-logs/esm/transport/startLogsBridge.js
  init_esm();
  function startLogsBridge(lifeCycle) {
    const bridge = getEventBridge();
    lifeCycle.subscribe(1, (serverLogsEvent) => {
      bridge.send("log", serverLogsEvent);
    });
  }

  // node_modules/@openobserve/browser-logs/esm/domain/contexts/internalContext.js
  function startInternalContext2(sessionManager) {
    return {
      get: (startTime) => {
        const trackedSession = sessionManager.findTrackedSession(startTime);
        if (trackedSession) {
          return {
            session_id: trackedSession.id
          };
        }
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/reportError.js
  init_esm();
  function startReportError(lifeCycle) {
    return (error) => {
      lifeCycle.notify(0, {
        rawLogsEvent: {
          message: error.message,
          date: error.startClocks.timeStamp,
          origin: ErrorSource.AGENT,
          status: StatusType.error
        }
      });
      addTelemetryDebug("Error reported to customer", { "error.message": error.message });
    };
  }

  // node_modules/@openobserve/browser-logs/esm/domain/hooks.js
  init_esm();
  var createHooks2 = abstractHooks;

  // node_modules/@openobserve/browser-logs/esm/domain/contexts/rumInternalContext.js
  init_esm();
  function startRUMInternalContext(hooks) {
    const browserWindow = globalObject;
    hooks.register(0, ({ startTime }) => {
      const internalContext = getRUMInternalContext(startTime);
      if (!internalContext) {
        return SKIPPED;
      }
      return internalContext;
    });
    hooks.register(1, ({ startTime }) => {
      var _a, _b;
      const internalContext = getRUMInternalContext(startTime);
      if (!internalContext) {
        return SKIPPED;
      }
      return {
        application: { id: internalContext.application_id },
        view: { id: (_a = internalContext.view) === null || _a === void 0 ? void 0 : _a.id },
        action: { id: (_b = internalContext.user_action) === null || _b === void 0 ? void 0 : _b.id }
      };
    });
    function getRUMInternalContext(startTime) {
      const willSyntheticsInjectRumResult = willSyntheticsInjectRum();
      const rumSource = willSyntheticsInjectRumResult ? browserWindow.OO_RUM_SYNTHETICS : browserWindow.OO_RUM;
      const rumContext = getInternalContextFromRumGlobal(startTime, rumSource);
      if (rumContext) {
        return rumContext;
      }
    }
    function getInternalContextFromRumGlobal(startTime, rumGlobal) {
      if (rumGlobal && rumGlobal.getInternalContext) {
        return rumGlobal.getInternalContext(startTime);
      }
    }
  }

  // node_modules/@openobserve/browser-logs/esm/domain/contexts/sessionContext.js
  init_esm();
  function startSessionContext2(hooks, configuration, sessionManager) {
    hooks.register(0, ({ startTime }) => {
      const session = sessionManager.findTrackedSession(startTime);
      const isSessionTracked = sessionManager.findTrackedSession(startTime, { returnInactive: true });
      if (!isSessionTracked) {
        return DISCARDED;
      }
      return {
        service: configuration.service,
        session_id: session ? session.id : void 0,
        session: session ? { id: session.id } : void 0
      };
    });
    hooks.register(1, ({ startTime }) => {
      const session = sessionManager.findTrackedSession(startTime);
      if (!session || !session.id) {
        return SKIPPED;
      }
      return {
        session: { id: session.id }
      };
    });
  }

  // node_modules/@openobserve/browser-logs/esm/domain/contexts/trackingConsentContext.js
  init_esm();
  function startTrackingConsentContext2(hooks, trackingConsentState) {
    function isConsented() {
      const wasConsented = trackingConsentState.isGranted();
      if (!wasConsented) {
        return DISCARDED;
      }
      return SKIPPED;
    }
    hooks.register(0, isConsented);
    hooks.register(1, isConsented);
  }

  // node_modules/@openobserve/browser-logs/esm/boot/startLogs.js
  var LOGS_STORAGE_KEY = "logs";
  function startLogs(configuration, getCommonContext, trackingConsentState, bufferedDataObservable) {
    const lifeCycle = new LifeCycle2();
    const hooks = createHooks2();
    const cleanupTasks2 = [];
    lifeCycle.subscribe(1, (log) => sendToExtension("logs", log));
    const reportError = startReportError(lifeCycle);
    const pageMayExitObservable = isWorkerEnvironment ? new Observable() : createPageMayExitObservable(configuration);
    const telemetry = startTelemetry("browser-logs-sdk", configuration, hooks, reportError, pageMayExitObservable, createIdentityEncoder);
    cleanupTasks2.push(telemetry.stop);
    const session = configuration.sessionStoreStrategyType && !canUseEventBridge() && !willSyntheticsInjectRum() ? startLogsSessionManager(configuration, trackingConsentState) : startLogsSessionManagerStub(configuration);
    startTrackingConsentContext2(hooks, trackingConsentState);
    startSessionContext2(hooks, configuration, session);
    const accountContext = startAccountContext(hooks, configuration, LOGS_STORAGE_KEY);
    const userContext = startUserContext(hooks, configuration, session, LOGS_STORAGE_KEY);
    const globalContext = startGlobalContext(hooks, configuration, LOGS_STORAGE_KEY, false);
    startRUMInternalContext(hooks);
    startNetworkErrorCollection(configuration, lifeCycle);
    startRuntimeErrorCollection(configuration, lifeCycle, bufferedDataObservable);
    bufferedDataObservable.unbuffer();
    startConsoleCollection(configuration, lifeCycle);
    startReportCollection(configuration, lifeCycle);
    const { handleLog } = startLoggerCollection(lifeCycle);
    startLogsAssembly(configuration, lifeCycle, hooks, getCommonContext, reportError);
    if (!canUseEventBridge()) {
      const { stop: stopLogsBatch } = startLogsBatch(configuration, lifeCycle, reportError, pageMayExitObservable, session);
      cleanupTasks2.push(() => stopLogsBatch());
    } else {
      startLogsBridge(lifeCycle);
    }
    const internalContext = startInternalContext2(session);
    return {
      handleLog,
      getInternalContext: internalContext.get,
      accountContext,
      globalContext,
      userContext,
      stop: () => {
        cleanupTasks2.forEach((task) => task());
      }
    };
  }

  // node_modules/@openobserve/browser-logs/esm/entries/main.js
  var openobserveLogs = makeLogsPublicApi(startLogs);
  defineGlobal(getGlobalObject(), "OO_LOGS", openobserveLogs);

  // frontend/main.js
  var config = window.__OPENOBSERVE_RUM__ || {};
  var hasRequiredConfig = Boolean(
    config.enabled && config.clientToken && config.applicationId && config.site && config.organizationIdentifier
  );
  if (!hasRequiredConfig) {
    window.__OPENOBSERVE_RUM_STATE__ = {
      initialized: false,
      reason: "missing-config",
      config
    };
  } else {
    const options = {
      clientToken: config.clientToken,
      applicationId: config.applicationId,
      site: config.site,
      service: config.service || "php-storefront-web",
      env: config.env || "poc",
      version: config.version || "0.0.1",
      organizationIdentifier: config.organizationIdentifier,
      insecureHTTP: Boolean(config.insecureHTTP),
      apiVersion: config.apiVersion || "v1"
    };
    openobserveRum.init({
      applicationId: options.applicationId,
      clientToken: options.clientToken,
      site: options.site,
      organizationIdentifier: options.organizationIdentifier,
      service: options.service,
      env: options.env,
      version: options.version,
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: true,
      apiVersion: options.apiVersion,
      insecureHTTP: options.insecureHTTP,
      defaultPrivacyLevel: "mask-user-input",
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100
    });
    openobserveLogs.init({
      clientToken: options.clientToken,
      site: options.site,
      organizationIdentifier: options.organizationIdentifier,
      service: options.service,
      env: options.env,
      version: options.version,
      forwardErrorsToLogs: true,
      insecureHTTP: options.insecureHTTP,
      apiVersion: options.apiVersion
    });
    window.__setOpenObserveUser = (user) => {
      if (!user || !user.email) {
        return;
      }
      openobserveRum.setUser({
        id: user.id || user.email,
        name: user.name || user.email,
        email: user.email
      });
      openobserveLogs.logger.info("OpenObserve user context updated", {
        email: user.email,
        id: user.id || user.email
      });
    };
    window.__setOpenObserveUser({
      id: "anonymous",
      name: "Anonymous Visitor",
      email: "anonymous@example.local"
    });
    openobserveRum.startSessionReplayRecording();
    openobserveLogs.logger.info("OpenObserve browser SDK initialized", {
      applicationId: options.applicationId,
      service: options.service
    });
    window.__OPENOBSERVE_RUM_STATE__ = {
      initialized: true,
      service: options.service,
      site: options.site,
      logsInitialized: true
    };
  }
})();
