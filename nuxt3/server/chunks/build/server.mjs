import { version, unref, inject, useSSRContext, createApp, effectScope, reactive, hasInjectionContext, getCurrentInstance, defineAsyncComponent, provide, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, toRef, computed, defineComponent, h, isReadonly, isRef, isShallow, isReactive, toRaw, mergeProps } from 'vue';
import { d as useRuntimeConfig$1, $ as $fetch, w as withQuery, l as hasProtocol, p as parseURL, m as isScriptProtocol, j as joinURL, h as createError$1, n as sanitizeStatusCode, o as createHooks, q as isEqual, r as stringifyParsedURL, t as stringifyQuery, v as parseQuery } from '../runtime.mjs';
import { getActiveHead } from 'unhead';
import { defineHeadPlugin } from '@unhead/shared';
import { ssrRenderSuspense, ssrRenderComponent, ssrRenderVNode, ssrRenderAttrs } from 'vue/server-renderer';
import i18n from 'i18next';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';

function createContext$1(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers$1.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers$1.delete(onLeave);
      }
    }
  };
}
function createNamespace$1(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext$1({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$2 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$2] || (_globalThis$1[globalKey$2] = createNamespace$1());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey$1 = "__unctx_async_handlers__";
const asyncHandlers$1 = _globalThis$1[asyncHandlersKey$1] || (_globalThis$1[asyncHandlersKey$1] = /* @__PURE__ */ new Set());

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app", {
  asyncContext: false
});
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.10.3";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      once: /* @__PURE__ */ new Set(),
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn)),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin.dependsOn) == null ? void 0 : _a2.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.push(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
// @__NO_SIDE_EFFECTS__
function tryUseNuxtApp() {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  return nuxtAppInstance || null;
}
// @__NO_SIDE_EFFECTS__
function useNuxtApp() {
  const nuxtAppInstance = /* @__PURE__ */ tryUseNuxtApp();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return (/* @__PURE__ */ useNuxtApp()).$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = /* @__PURE__ */ useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, (/* @__PURE__ */ useNuxtApp())._route);
  }
  return (/* @__PURE__ */ useNuxtApp())._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if ((/* @__PURE__ */ useNuxtApp())._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const protocol = parseURL(toPath).protocol;
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = /* @__PURE__ */ useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef((/* @__PURE__ */ useNuxtApp()).payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const error2 = useError();
    if (false)
      ;
    error2.value = error2.value || nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
version.startsWith("3");
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref, lastKey = "") {
  if (ref instanceof Promise)
    return ref;
  const root = resolveUnref(ref);
  if (!ref || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput(v, k)];
      })
    );
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  if (!head && "production" !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => (/* @__PURE__ */ useNuxtApp()).vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const router_CaKIoANnI2 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      error: []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false)
          ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          var _a;
          const route2 = router.resolve(props.to);
          return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        var _a;
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
        }
        nuxtApp._processingMiddleware = true;
        if (!((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext)) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    (/* @__PURE__ */ useNuxtApp()).ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_KgADcZ0jPj,
  router_CaKIoANnI2,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY
];
var MarkAsReadModes;
(function(MarkAsReadModes2) {
  MarkAsReadModes2["AUTOMATIC"] = "AUTOMATIC";
  MarkAsReadModes2["MANUAL"] = "MANUAL";
  MarkAsReadModes2["MANUAL_AND_CLICK"] = "MANUAL_AND_CLICK";
})(MarkAsReadModes || (MarkAsReadModes = {}));
var PopupPosition;
(function(PopupPosition2) {
  PopupPosition2["TopLeft"] = "topLeft";
  PopupPosition2["TopRight"] = "topRight";
  PopupPosition2["LeftTop"] = "leftTop";
  PopupPosition2["LeftBottom"] = "leftBottom";
  PopupPosition2["BottomLeft"] = "bottomLeft";
  PopupPosition2["BottomRight"] = "bottomRight";
  PopupPosition2["RightTop"] = "rightTop";
  PopupPosition2["RightBottom"] = "rightBottom";
})(PopupPosition || (PopupPosition = {}));
var PushProviders;
(function(PushProviders2) {
  PushProviders2["FCM"] = "FCM";
  PushProviders2["APN"] = "APN";
})(PushProviders || (PushProviders = {}));
var timeAgo = function(timeDifference, i18nInstance) {
  if (timeDifference < 0) {
    return i18nInstance.t("just_now");
  } else {
    var seconds = Math.round(timeDifference) / 1e3;
    var minutes2 = Math.round(seconds / 60);
    var hours2 = Math.round(seconds / (60 * 60));
    var days2 = Math.round(seconds / (60 * 60 * 24));
    var months2 = Math.round(seconds / (60 * 60 * 24 * 30));
    var years2 = Math.round(seconds / (60 * 60 * 24 * 30 * 365.25));
    if (years2 > 0) {
      return "".concat(years2, " ").concat(years2 === 1 ? i18nInstance.t("year") : i18nInstance.t("years"), " ").concat(i18nInstance.t("ago"));
    } else if (months2 > 0) {
      return "".concat(months2, " ").concat(months2 === 1 ? i18nInstance.t("month") : i18nInstance.t("months"), " ").concat(i18nInstance.t("ago"));
    } else if (days2 > 0) {
      return "".concat(days2, " ").concat(days2 === 1 ? i18nInstance.t("day") : i18nInstance.t("days"), " ").concat(i18nInstance.t("ago"));
    } else if (hours2 > 0) {
      return "".concat(hours2, " ").concat(hours2 === 1 ? i18nInstance.t("hour") : i18nInstance.t("hours"), " ").concat(i18nInstance.t("ago"));
    } else if (minutes2 > 0) {
      return "".concat(minutes2, " ").concat(minutes2 === 1 ? i18nInstance.t("minute") : i18nInstance.t("minutes"), " ").concat(i18nInstance.t("ago"));
    } else {
      return i18nInstance.t("just_now");
    }
  }
};
const no_more_notifications$4 = "No more notifications to load";
const notifications$4 = "Notifications";
const notification_settings$4 = "Notification Settings";
const mark_all_as_read$4 = "Mark all as read";
const no_notifications$4 = "You don't have any notifications!";
const notification_preferences$4 = "Notification Preferences";
const click_here$4 = "Click here";
const necessary_permissions_push_notifications$4 = "to give us the necessary browser permissions to send you push notifications.";
const do_you_want_to_receive_push_notifications$4 = "Do you want to receive push notifications?";
const yes$4 = "Yes";
const no_thanks$4 = "No, thanks";
const expand$4 = "expand";
const there_are_no_notifications_to_configure$4 = "There are no notifications to configure.";
const mark_as_read$4 = "Mark as read";
const ago$4 = "ago";
const year$4 = "year";
const years$4 = "years";
const month$4 = "month";
const months$4 = "months";
const day$4 = "day";
const days$4 = "days";
const hour$4 = "hour";
const hours$4 = "hours";
const minute$4 = "minute";
const minutes$4 = "minutes";
const just_now$4 = "just now";
const enUS = {
  no_more_notifications: no_more_notifications$4,
  notifications: notifications$4,
  notification_settings: notification_settings$4,
  mark_all_as_read: mark_all_as_read$4,
  no_notifications: no_notifications$4,
  notification_preferences: notification_preferences$4,
  click_here: click_here$4,
  necessary_permissions_push_notifications: necessary_permissions_push_notifications$4,
  do_you_want_to_receive_push_notifications: do_you_want_to_receive_push_notifications$4,
  yes: yes$4,
  no_thanks: no_thanks$4,
  expand: expand$4,
  there_are_no_notifications_to_configure: there_are_no_notifications_to_configure$4,
  mark_as_read: mark_as_read$4,
  ago: ago$4,
  year: year$4,
  years: years$4,
  month: month$4,
  months: months$4,
  day: day$4,
  days: days$4,
  hour: hour$4,
  hours: hours$4,
  minute: minute$4,
  minutes: minutes$4,
  just_now: just_now$4
};
const no_more_notifications$3 = "No hay más notificaciones para cargar";
const notifications$3 = "Notificaciones";
const notification_settings$3 = "Configuración de notificaciones";
const mark_all_as_read$3 = "Marcar todas como leídas";
const no_notifications$3 = "¡No tienes ninguna notificación!";
const notification_preferences$3 = "Preferencias de notificación";
const click_here$3 = "Haz clic aquí";
const necessary_permissions_push_notifications$3 = "para darnos los permisos necesarios del navegador para enviarte notificaciones push.";
const do_you_want_to_receive_push_notifications$3 = "¿Quieres recibir notificaciones push?";
const yes$3 = "Sí";
const no_thanks$3 = "No, gracias";
const expand$3 = "expandir";
const there_are_no_notifications_to_configure$3 = "No hay notificaciones para configurar.";
const mark_as_read$3 = "Marcar como leída";
const ago$3 = "hace";
const year$3 = "año";
const years$3 = "años";
const month$3 = "mes";
const months$3 = "meses";
const day$3 = "día";
const days$3 = "días";
const hour$3 = "hora";
const hours$3 = "horas";
const minute$3 = "minuto";
const minutes$3 = "minutos";
const just_now$3 = "justo ahora";
const esES = {
  no_more_notifications: no_more_notifications$3,
  notifications: notifications$3,
  notification_settings: notification_settings$3,
  mark_all_as_read: mark_all_as_read$3,
  no_notifications: no_notifications$3,
  notification_preferences: notification_preferences$3,
  click_here: click_here$3,
  necessary_permissions_push_notifications: necessary_permissions_push_notifications$3,
  do_you_want_to_receive_push_notifications: do_you_want_to_receive_push_notifications$3,
  yes: yes$3,
  no_thanks: no_thanks$3,
  expand: expand$3,
  there_are_no_notifications_to_configure: there_are_no_notifications_to_configure$3,
  mark_as_read: mark_as_read$3,
  ago: ago$3,
  year: year$3,
  years: years$3,
  month: month$3,
  months: months$3,
  day: day$3,
  days: days$3,
  hour: hour$3,
  hours: hours$3,
  minute: minute$3,
  minutes: minutes$3,
  just_now: just_now$3
};
const no_more_notifications$2 = "Plus de notifications à charger";
const notifications$2 = "Notifications";
const notification_settings$2 = "Paramètres de notification";
const mark_all_as_read$2 = "Marquer tout comme lu";
const no_notifications$2 = "Vous n'avez aucune notification !";
const notification_preferences$2 = "Préférences de notification";
const click_here$2 = "Cliquez ici";
const necessary_permissions_push_notifications$2 = "pour nous donner les autorisations de navigateur nécessaires pour vous envoyer des notifications push.";
const do_you_want_to_receive_push_notifications$2 = "Voulez-vous recevoir des notifications push ?";
const yes$2 = "Oui";
const no_thanks$2 = "Non, merci";
const expand$2 = "développer";
const there_are_no_notifications_to_configure$2 = "Il n'y a pas de notifications à configurer.";
const mark_as_read$2 = "Marquer comme lu";
const ago$2 = "il y a";
const year$2 = "an";
const years$2 = "ans";
const month$2 = "mois";
const months$2 = "mois";
const day$2 = "jour";
const days$2 = "jours";
const hour$2 = "heure";
const hours$2 = "heures";
const minute$2 = "minute";
const minutes$2 = "minutes";
const just_now$2 = "à l'instant";
const frFR = {
  no_more_notifications: no_more_notifications$2,
  notifications: notifications$2,
  notification_settings: notification_settings$2,
  mark_all_as_read: mark_all_as_read$2,
  no_notifications: no_notifications$2,
  notification_preferences: notification_preferences$2,
  click_here: click_here$2,
  necessary_permissions_push_notifications: necessary_permissions_push_notifications$2,
  do_you_want_to_receive_push_notifications: do_you_want_to_receive_push_notifications$2,
  yes: yes$2,
  no_thanks: no_thanks$2,
  expand: expand$2,
  there_are_no_notifications_to_configure: there_are_no_notifications_to_configure$2,
  mark_as_read: mark_as_read$2,
  ago: ago$2,
  year: year$2,
  years: years$2,
  month: month$2,
  months: months$2,
  day: day$2,
  days: days$2,
  hour: hour$2,
  hours: hours$2,
  minute: minute$2,
  minutes: minutes$2,
  just_now: just_now$2
};
const no_more_notifications$1 = "Non ci sono altre notifiche da caricare";
const notifications$1 = "Notifiche";
const notification_settings$1 = "Impostazioni notifiche";
const mark_all_as_read$1 = "Segna tutto come letto";
const no_notifications$1 = "Non hai nessuna notifica!";
const notification_preferences$1 = "Preferenze notifiche";
const click_here$1 = "Clicca qui";
const necessary_permissions_push_notifications$1 = "per darci i permessi necessari del browser per inviarti notifiche push.";
const do_you_want_to_receive_push_notifications$1 = "Vuoi ricevere notifiche push?";
const yes$1 = "Sì";
const no_thanks$1 = "No, grazie";
const expand$1 = "espandi";
const there_are_no_notifications_to_configure$1 = "Non ci sono notifiche da configurare.";
const mark_as_read$1 = "Segna come letto";
const ago$1 = "fa";
const year$1 = "anno";
const years$1 = "anni";
const month$1 = "mese";
const months$1 = "mesi";
const day$1 = "giorno";
const days$1 = "giorni";
const hour$1 = "ora";
const hours$1 = "ore";
const minute$1 = "minuto";
const minutes$1 = "minuti";
const just_now$1 = "proprio ora";
const itIT = {
  no_more_notifications: no_more_notifications$1,
  notifications: notifications$1,
  notification_settings: notification_settings$1,
  mark_all_as_read: mark_all_as_read$1,
  no_notifications: no_notifications$1,
  notification_preferences: notification_preferences$1,
  click_here: click_here$1,
  necessary_permissions_push_notifications: necessary_permissions_push_notifications$1,
  do_you_want_to_receive_push_notifications: do_you_want_to_receive_push_notifications$1,
  yes: yes$1,
  no_thanks: no_thanks$1,
  expand: expand$1,
  there_are_no_notifications_to_configure: there_are_no_notifications_to_configure$1,
  mark_as_read: mark_as_read$1,
  ago: ago$1,
  year: year$1,
  years: years$1,
  month: month$1,
  months: months$1,
  day: day$1,
  days: days$1,
  hour: hour$1,
  hours: hours$1,
  minute: minute$1,
  minutes: minutes$1,
  just_now: just_now$1
};
const no_more_notifications = "Não há mais notificações para carregar";
const notifications = "Notificações";
const notification_settings = "Configurações de Notificações";
const mark_all_as_read = "Marcar todas como lidas";
const no_notifications = "Você não tem nenhuma notificação!";
const notification_preferences = "Preferências de Notificações";
const click_here = "Clique aqui";
const necessary_permissions_push_notifications = "para nos dar as permissões necessárias do navegador para enviar-lhe notificações push.";
const do_you_want_to_receive_push_notifications = "Você quer receber notificações push?";
const yes = "Sim";
const no_thanks = "Não, obrigado";
const expand = "expandir";
const there_are_no_notifications_to_configure = "Não há notificações para configurar.";
const mark_as_read = "Marcar como lida";
const ago = "atrás";
const year = "ano";
const years = "anos";
const month = "mês";
const months = "meses";
const day = "dia";
const days = "dias";
const hour = "hora";
const hours = "horas";
const minute = "minuto";
const minutes = "minutos";
const just_now = "agora mesmo";
const ptBR = {
  no_more_notifications,
  notifications,
  notification_settings,
  mark_all_as_read,
  no_notifications,
  notification_preferences,
  click_here,
  necessary_permissions_push_notifications,
  do_you_want_to_receive_push_notifications,
  yes,
  no_thanks,
  expand,
  there_are_no_notifications_to_configure,
  mark_as_read,
  ago,
  year,
  years,
  month,
  months,
  day,
  days,
  hour,
  hours,
  minute,
  minutes,
  just_now
};
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var defaultRestAPIUrl = "https://api.notificationapi.com";
var defaultWebSocket = "wss://ws.notificationapi.com";
var NOTIFICATION_REQUEST_COUNT = 50;
var supportedLanguages = [
  "en-US",
  "es-ES",
  "fr-FR",
  "it-IT",
  "pt-BR"
];
var supportedLanguagesFile = {
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "it-IT": itIT,
  "pt-BR": ptBR
};
var PAGE_SIZE = 5;
function position(popup, popupInner, button, popupPosition) {
  var position2 = popupPosition.toString();
  var maxHeight = (void 0).documentElement.clientHeight + "px";
  var top = "auto";
  var bottom = "auto";
  var left = "auto";
  var right = "auto";
  if ((void 0).innerWidth < 768) {
    top = -button.getBoundingClientRect().top + "px";
    bottom = -((void 0).documentElement.clientHeight - button.getBoundingClientRect().bottom) + "px";
    left = -button.getBoundingClientRect().left + "px";
    right = -((void 0).documentElement.clientWidth - button.getBoundingClientRect().right) + "px";
  } else {
    if (position2.startsWith("top")) {
      bottom = button.clientHeight + 10 + "px";
      maxHeight = button.getBoundingClientRect().top - 20 + "px";
    }
    if (position2.startsWith("bottom")) {
      bottom = "auto";
      top = button.clientHeight + 10 + "px";
      maxHeight = (void 0).innerHeight - button.getBoundingClientRect().bottom - 40 + "px";
    }
    if (position2.startsWith("left")) {
      left = "auto";
      right = button.clientWidth + 10 + "px";
    }
    if (position2.startsWith("right")) {
      right = "auto";
      left = button.clientWidth + 10 + "px";
    }
    if (position2.endsWith("Top")) {
      top = "auto";
      bottom = "0px";
      maxHeight = button.getBoundingClientRect().bottom - 20 + "px";
    }
    if (position2.endsWith("Bottom")) {
      bottom = "auto";
      top = "0px";
      maxHeight = (void 0).innerHeight - button.getBoundingClientRect().top - 40 + "px";
    }
    if (position2.endsWith("Left")) {
      left = "auto";
      right = "0px";
    }
    if (position2.endsWith("Right")) {
      right = "auto";
      left = "0px";
    }
  }
  popup.style.top = top;
  popup.style.bottom = bottom;
  popup.style.left = left;
  popup.style.right = right;
  popupInner.style.maxHeight = maxHeight;
}
var NotificationAPIClient = function() {
  function NotificationAPIClient2(options) {
    var _this = this;
    var _a, _b;
    this.destroy = function() {
      var _a2;
      (_a2 = _this.websocket) === null || _a2 === void 0 ? void 0 : _a2.close();
      Object.values(_this.elements).map(function(e) {
        e && e.remove();
      });
    };
    this.identify = function(user) {
      return __awaiter(_this, void 0, void 0, function() {
        var _a2, clientId, userId, userIdHash, url, authToken;
        return __generator(this, function(_b2) {
          switch (_b2.label) {
            case 0:
              _a2 = this.state.initOptions, clientId = _a2.clientId, userId = _a2.userId, userIdHash = _a2.userIdHash;
              if (user.id && user.id !== userId) {
                console.error('The userId "'.concat(user.id, '" does not match the userId "').concat(userId, '" provided in the init options. Cancelling action to prevent mistakes.'));
                return [2];
              }
              url = "".concat(this.state.restBaseURL, "/").concat(encodeURIComponent(clientId), "/users/").concat(encodeURIComponent(userId));
              authToken = "Basic " + btoa("".concat(encodeURIComponent(clientId), ":").concat(encodeURIComponent(userId), ":").concat(userIdHash !== null && userIdHash !== void 0 ? userIdHash : ""));
              return [4, fetch(url, {
                body: JSON.stringify(user),
                headers: {
                  "content-type": "application/json",
                  Authorization: authToken
                },
                method: "POST"
              })];
            case 1:
              _b2.sent();
              return [2];
          }
        });
      });
    };
    this.askForWebPushPermission = function() {
      if ("serviceWorker" in void 0) {
        (void 0).serviceWorker.register("/notificationapi-service-worker.js").then(function(registration) {
          return __awaiter(_this, void 0, void 0, function() {
            var _this2 = this;
            return __generator(this, function(_a2) {
              Notification.requestPermission().then(function(permission) {
                return __awaiter(_this2, void 0, void 0, function() {
                  var _this3 = this;
                  return __generator(this, function(_a3) {
                    switch (_a3.label) {
                      case 0:
                        if (!(permission === "granted"))
                          return [3, 2];
                        return [4, registration.pushManager.subscribe({
                          userVisibleOnly: true,
                          applicationServerKey: this.state.webPushSettings.applicationServerKey
                        }).then(function(res) {
                          return __awaiter(_this3, void 0, void 0, function() {
                            var body;
                            return __generator(this, function(_a4) {
                              switch (_a4.label) {
                                case 0:
                                  body = {
                                    webPushTokens: [
                                      {
                                        sub: {
                                          endpoint: res.toJSON().endpoint,
                                          keys: res.toJSON().keys
                                        }
                                      }
                                    ]
                                  };
                                  return [4, this.identify(body)];
                                case 1:
                                  _a4.sent();
                                  return [2];
                              }
                            });
                          });
                        })];
                      case 1:
                        _a3.sent();
                        _a3.label = 2;
                      case 2:
                        return [2];
                    }
                  });
                });
              });
              return [2];
            });
          });
        });
      }
    };
    this.showInApp = function(options2) {
      var _a2;
      _this.state.inappOptions = options2;
      var root = (void 0).getElementById(options2.root);
      if (!root) {
        console.error('There are no HTML elements with id="'.concat(options2.root, '" on the page.'));
        return;
      }
      _this.elements.root = root;
      if (options2.popupPosition && !Object.values(PopupPosition).includes(options2.popupPosition)) {
        console.error('"'.concat(options2.popupPosition, '" is not a valid position. Valid positions: ').concat(Object.values(PopupPosition).join(", ")));
        return;
      }
      if (root.hasChildNodes()) {
        root.innerHTML = "";
      }
      var container = (void 0).createElement("div");
      container.classList.add("notificationapi-container");
      root.appendChild(container);
      _this.elements.popup = (void 0).createElement("div");
      var popup = _this.elements.popup;
      popup.classList.add("notificationapi-popup");
      if (options2.inline) {
        popup.classList.add("inline");
      } else {
        popup.classList.add("popup");
        popup.classList.add("hovering");
        popup.classList.add("closed");
        var button = (void 0).createElement("button");
        button.classList.add("notificationapi-button");
        button.innerHTML = '<span class="icon-bell-o"></span>';
        container.appendChild(button);
        button.onclick = function() {
          if (popup.classList.contains("closed")) {
            _this.openInAppPopup();
          } else {
            _this.closeInAppPopup();
          }
        };
        _this.elements.button = button;
        (void 0).addEventListener("click", function(e) {
          var _a3, _b2, _c;
          var clickedPopup = (_a3 = e.target.closest(".notificationapi-popup")) !== null && _a3 !== void 0 ? _a3 : false;
          var clickedButton = (_b2 = e.target.closest(".notificationapi-button")) !== null && _b2 !== void 0 ? _b2 : false;
          var clickedPreferences = (_c = e.target.closest(".notificationapi-preferences-container")) !== null && _c !== void 0 ? _c : false;
          if (!clickedButton && !clickedPopup && !clickedPreferences && !_this.elements.notificationMenu) {
            popup.classList.add("closed");
          }
        });
        var unread = (void 0).createElement("div");
        unread.classList.add("notificationapi-unread");
        button.appendChild(unread);
        _this.elements.unread = unread;
        _this.setInAppUnread(_this.state.unread);
      }
      container.appendChild(popup);
      (void 0).addEventListener("click", function(e) {
        var _a3;
        var clickedNotificationMenuButton = (_a3 = e.target.closest(".notificationapi-notification-menu-button")) !== null && _a3 !== void 0 ? _a3 : false;
        if (!clickedNotificationMenuButton && _this.elements.notificationMenu) {
          _this.elements.notificationMenu.remove();
          _this.elements.notificationMenu = void 0;
        }
      });
      _this.elements.popupInner = (void 0).createElement("div");
      var popupInner = _this.elements.popupInner;
      popupInner.classList.add("notificationapi-popup-inner");
      popup.appendChild(popupInner);
      _this.elements.popupInner = popupInner;
      _this.elements.header = (void 0).createElement("div");
      var headerCloseButton = (void 0).createElement("button");
      headerCloseButton.classList.add("notificationapi-close-button");
      headerCloseButton.addEventListener("click", function() {
        _this.closeInAppPopup();
      });
      _this.elements.header.appendChild(headerCloseButton);
      var headerHeading = (void 0).createElement("h1");
      headerHeading.innerHTML = i18n.t("notifications");
      _this.elements.header.appendChild(headerHeading);
      var headerPreferencesButton = (void 0).createElement("button");
      headerPreferencesButton.classList.add("notificationapi-preferences-button");
      headerPreferencesButton.innerHTML = '<span class="icon-cog"></span>';
      headerPreferencesButton.title = i18n.t("notification_settings");
      headerPreferencesButton.addEventListener("click", function() {
        _this.showUserPreferences();
      });
      _this.elements.header.appendChild(headerPreferencesButton);
      if (options2.markAsReadMode && options2.markAsReadMode !== MarkAsReadModes.AUTOMATIC) {
        var headerReadAllButton = (void 0).createElement("button");
        headerReadAllButton.classList.add("notificationapi-readAll-button");
        headerReadAllButton.innerHTML = '<span class="icon-check"></span>';
        headerReadAllButton.title = i18n.t("mark_all_as_read");
        headerReadAllButton.addEventListener("click", function() {
          _this.readAll();
        });
        _this.elements.header.appendChild(headerReadAllButton);
      }
      _this.elements.header.classList.add("notificationapi-header");
      popupInner.appendChild(_this.elements.header);
      var loading = (void 0).createElement("div");
      loading.classList.add("notificationapi-loading");
      var icon = (void 0).createElement("span");
      icon.classList.add("icon-spinner8", "spinner");
      loading.appendChild(icon);
      popupInner.appendChild(loading);
      _this.elements.notificationsLoading = loading;
      _this.elements.footer = (void 0).createElement("div");
      if (options2.paginated) {
        _this.state.pageSize = (_a2 = options2.pageSize) !== null && _a2 !== void 0 ? _a2 : PAGE_SIZE;
        var prevButton = (void 0).createElement("button");
        prevButton.classList.add("notificationapi-prev-button");
        prevButton.innerHTML = "<";
        prevButton.disabled = true;
        prevButton.addEventListener("click", function() {
          _this.changePage(_this.state.currentPage - 1);
        });
        _this.elements.prevButton = prevButton;
        var nextButton = (void 0).createElement("button");
        nextButton.classList.add("notificationapi-next-button");
        nextButton.innerHTML = ">";
        nextButton.disabled = true;
        nextButton.addEventListener("click", function() {
          _this.changePage(_this.state.currentPage + 1);
        });
        _this.elements.nextButton = nextButton;
        _this.elements.footer.appendChild(prevButton);
        _this.elements.footer.appendChild(nextButton);
      }
      _this.elements.footer.classList.add("notificationapi-footer");
      popupInner.appendChild(_this.elements.footer);
      _this.addNotificationsToState(_this.state.notifications);
      if (!options2.paginated) {
        popupInner.onscroll = function() {
          if (popupInner.scrollTop + popupInner.clientHeight >= popupInner.scrollHeight - 100) {
            _this.requestMoreNotifications();
          }
        };
      }
      _this.sendWSMessage({
        route: "inapp_web/unread_count"
      });
      _this.sendWSMessage({
        route: "inapp_web/notifications",
        payload: {
          count: NOTIFICATION_REQUEST_COUNT
        }
      });
      if (_this.websocket) {
        var ws = _this.websocket;
        ws.addEventListener("message", function(m) {
          var body = JSON.parse(m.data);
          if (!body || !body.route) {
            return;
          }
          if (body.route === "inapp_web/unread_count") {
            var message = body;
            _this.websocketHandlers.unreadCount(message);
          }
          if (body.route === "inapp_web/notifications") {
            var message = body;
            _this.websocketHandlers.notifications(message);
          }
          if (body.route === "inapp_web/new_notifications") {
            var message = body;
            _this.websocketHandlers.newNotifications(message);
          }
        });
      }
    };
    this.elements = {};
    this.state = {
      initOptions: options,
      lastNotificationsRequestAt: 0,
      notifications: [],
      unread: 0,
      oldestNotificationsDate: "",
      currentPage: 0,
      pageSize: 999999,
      webPushSettings: {
        applicationServerKey: "",
        askForWebPushPermission: false
      },
      restBaseURL: (_a = options.restBaseURL) !== null && _a !== void 0 ? _a : defaultRestAPIUrl
    };
    var translationsObject = supportedLanguages.reduce(function(acc, language) {
      acc[language] = {
        translation: supportedLanguagesFile[language]
      };
      return acc;
    }, {});
    i18n.init({
      resources: translationsObject,
      lng: this.state.initOptions.language,
      fallbackLng: "en-US"
    });
    this.websocketHandlers = {
      notifications: function(message) {
        var notifications2 = message.payload.notifications;
        _this.state.lastResponseNotificationsCount = notifications2.length;
        if (_this.elements.notificationsLoading) {
          _this.elements.notificationsLoading.remove();
          delete _this.elements.notificationsLoading;
        }
        _this.addNotificationsToState(notifications2);
        if (notifications2.length < NOTIFICATION_REQUEST_COUNT && !_this.elements.empty && _this.elements.popupInner) {
          if (_this.state.inappOptions && !_this.state.inappOptions.paginated) {
            var noMore = (void 0).createElement("div");
            noMore.innerHTML = i18n.t("no_more_notifications");
            noMore.classList.add("notificationapi-nomore");
            _this.elements.popupInner.append(noMore);
          }
        }
        _this.renderNotifications();
      },
      newNotifications: function(message) {
        var beforeCount = _this.state.notifications.length;
        if (_this.elements.notificationsLoading) {
          _this.elements.notificationsLoading.remove();
          delete _this.elements.notificationsLoading;
        }
        _this.addNotificationsToState(message.payload.notifications);
        _this.renderNotifications();
        var afterCount = _this.state.notifications.length;
        _this.setInAppUnread(_this.state.unread + afterCount - beforeCount);
      },
      unreadCount: function(message) {
        _this.setInAppUnread(message.payload.count);
      },
      userPreferences: function(message) {
        if (_this.elements.preferencesLoading) {
          _this.elements.preferencesLoading.remove();
          delete _this.elements.preferencesLoading;
        }
        _this.renderPreferences(message.payload.userPreferences);
      }
    };
    if (!options.clientId || options.clientId === "undefined") {
      console.error("Invalid clientId.");
      return;
    }
    if (!options.userId || options.userId === "undefined") {
      console.error("Invalid userId.");
      return;
    }
    if (options.websocket !== false) {
      var websocketAddress = "".concat((_b = options.websocket) !== null && _b !== void 0 ? _b : defaultWebSocket, "?envId=").concat(encodeURIComponent(options.clientId), "&userId=").concat(encodeURIComponent(options.userId)).concat(options.userIdHash ? "&userIdHash=" + encodeURIComponent(options.userIdHash) : "");
      this.websocket = new WebSocket(websocketAddress);
      this.websocket.addEventListener("message", function(m) {
        var body = JSON.parse(m.data);
        if (!body || !body.route) {
          return;
        }
        if (body.route === "environment/data") {
          var message = body;
          _this.state.webPushSettings.applicationServerKey = message.payload.applicationServerKey;
          if ("Notification" in void 0 && Notification.permission === "granted") {
            _this.state.webPushSettings.askForWebPushPermission = false;
          } else {
            _this.state.webPushSettings.askForWebPushPermission = message.payload.askForWebPushPermission;
            _this.state.webPushSettings.askForWebPushPermission ? _this.renderWebPushOptIn() : null;
          }
        }
      });
      this.sendWSMessage({
        route: "environment/data"
      });
    }
  }
  NotificationAPIClient2.prototype.requestMoreNotifications = function() {
    if (this.websocket && (/* @__PURE__ */ new Date()).getTime() - this.state.lastNotificationsRequestAt >= 500 && (this.state.lastResponseNotificationsCount === void 0 || this.state.lastResponseNotificationsCount >= NOTIFICATION_REQUEST_COUNT)) {
      this.state.lastNotificationsRequestAt = (/* @__PURE__ */ new Date()).getTime();
      var moreNotificationsRequest = {
        route: "inapp_web/notifications",
        payload: {
          before: this.state.oldestNotificationsDate,
          count: NOTIFICATION_REQUEST_COUNT
        }
      };
      this.sendWSMessage(moreNotificationsRequest);
    }
  };
  NotificationAPIClient2.prototype.showUserPreferences = function(options) {
    var _this = this;
    if (!this.elements.preferencesContainer) {
      var root = (void 0).getElementsByTagName("body")[0];
      if (options === null || options === void 0 ? void 0 : options.parent) {
        var parentElement = (void 0).getElementById(options.parent);
        if (!parentElement) {
          console.error('There are no HTML elements with id="'.concat(options.parent, '" on the page.'));
        } else {
          root = parentElement;
        }
      }
      var container_1 = (void 0).createElement("div");
      container_1.classList.add("notificationapi-preferences-container");
      if (options === null || options === void 0 ? void 0 : options.parent)
        container_1.classList.add("inline");
      this.elements.preferencesContainer = container_1;
      root.appendChild(container_1);
      var backdrop = (void 0).createElement("div");
      backdrop.classList.add("notificationapi-preferences-backdrop");
      backdrop.addEventListener("click", function() {
        container_1.classList.add("closed");
      });
      container_1.appendChild(backdrop);
      var popup = (void 0).createElement("div");
      popup.classList.add("notificationapi-preferences-popup");
      container_1.appendChild(popup);
      this.elements.preferencesPopup = popup;
      var close_1 = (void 0).createElement("button");
      close_1.classList.add("notificationapi-preferences-close");
      close_1.addEventListener("click", function() {
        container_1.classList.add("closed");
      });
      popup.appendChild(close_1);
      var title = (void 0).createElement("h1");
      title.innerHTML = i18n.t("notification_preferences");
      popup.appendChild(title);
      if (this.state.webPushSettings.askForWebPushPermission) {
        var message = (void 0).createElement("p");
        message.innerHTML = '<a href="#" class="click-here">'.concat(i18n.t("click_here"), "</a> ").concat(i18n.t("necessary_permissions_push_notifications"));
        message.classList.add("notificationapi-preferences-web-push-opt-in");
        popup.appendChild(message);
        message.addEventListener("click", function(event) {
          event.preventDefault();
          _this.askForWebPushPermission();
        });
      }
      var loading = (void 0).createElement("div");
      loading.classList.add("notificationapi-loading");
      var icon = (void 0).createElement("span");
      icon.classList.add("icon-spinner8", "spinner");
      loading.appendChild(icon);
      popup.appendChild(loading);
      this.elements.preferencesLoading = loading;
      if (this.websocket) {
        var ws = this.websocket;
        ws.addEventListener("message", function(m) {
          var body = JSON.parse(m.data);
          if (!body || !body.route) {
            return;
          }
          if (body.route === "user_preferences/preferences") {
            var message2 = body;
            _this.websocketHandlers.userPreferences(message2);
          }
        });
      }
    } else {
      this.elements.preferencesContainer.classList.remove("closed");
    }
    this.sendWSMessage({
      route: "user_preferences/get_preferences"
    });
  };
  NotificationAPIClient2.prototype.getUserPreferences = function() {
    return __awaiter(this, void 0, void 0, function() {
      var message;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            this.sendWSMessage({
              route: "user_preferences/get_preferences"
            });
            return [4, this.websocketMessageReceived("user_preferences/preferences")];
          case 1:
            message = _a.sent();
            return [2, message.payload.userPreferences];
        }
      });
    });
  };
  NotificationAPIClient2.prototype.patchUserPreference = function(notificationId, channel, state, subNotificationId) {
    var message = {
      route: "user_preferences/patch_preferences",
      payload: [
        {
          notificationId,
          channelPreferences: [
            {
              channel,
              state
            }
          ]
        }
      ]
    };
    if (subNotificationId) {
      message.payload[0].subNotificationId = subNotificationId;
    }
    this.sendWSMessage(message);
  };
  NotificationAPIClient2.prototype.openInAppPopup = function() {
    var _a;
    if (this.elements.popup && this.elements.popupInner && this.elements.button && this.state.inappOptions && !this.state.inappOptions.inline) {
      position(this.elements.popup, this.elements.popupInner, this.elements.button, (_a = this.state.inappOptions.popupPosition) !== null && _a !== void 0 ? _a : PopupPosition.RightBottom);
      this.elements.popup.classList.remove("closed");
      if (!this.state.inappOptions.markAsReadMode || this.state.inappOptions.markAsReadMode === MarkAsReadModes.AUTOMATIC) {
        this.readAll();
      }
    }
  };
  NotificationAPIClient2.prototype.readAll = function() {
    this.setInAppUnread(0);
    this.state.notifications.map(function(n) {
      n.seen = true;
    });
    this.sendWSMessage({
      route: "inapp_web/unread_clear"
    });
    if (this.state.inappOptions && this.state.inappOptions.markAsReadMode && this.state.inappOptions.markAsReadMode !== MarkAsReadModes.AUTOMATIC && this.elements.popupInner) {
      this.elements.popupInner.querySelectorAll(".unseen").forEach(function(e) {
        e.classList.remove("unseen");
      });
    }
  };
  NotificationAPIClient2.prototype.closeInAppPopup = function() {
    if (this.elements.popup && this.state.inappOptions && !this.state.inappOptions.inline) {
      this.elements.popup.classList.add("closed");
    }
  };
  NotificationAPIClient2.prototype.setInAppUnread = function(count) {
    this.state.unread = count;
    if (this.elements.unread && this.state.inappOptions && !this.state.inappOptions.inline) {
      if (count === 0) {
        this.elements.unread.classList.add("hidden");
      } else {
        this.elements.unread.classList.remove("hidden");
      }
      if (count < 100) {
        this.elements.unread.innerHTML = count + "";
      } else {
        this.elements.unread.innerHTML = "+99";
      }
    }
  };
  NotificationAPIClient2.prototype.addNotificationsToState = function(notifications2) {
    var _this = this;
    var newNotifications = notifications2.filter(function(n) {
      var found = _this.state.notifications.find(function(existingN) {
        return existingN.id === n.id;
      });
      return found ? false : true;
    });
    this.state.notifications = this.state.notifications.concat(newNotifications);
    this.state.notifications.sort(function(a, b) {
      return Date.parse(b.date) - Date.parse(a.date);
    });
    if (this.state.notifications.length > 0)
      this.state.oldestNotificationsDate = this.state.notifications[this.state.notifications.length - 1].date;
    if (this.state.notifications.length === 0 && !this.elements.empty && !this.elements.notificationsLoading && this.elements.header) {
      var empty = (void 0).createElement("div");
      empty.classList.add("notificationapi-empty");
      empty.innerHTML = i18n.t("no_notifications");
      this.elements.header.after(empty);
      this.elements.empty = empty;
    }
    if (newNotifications.length > 0 && this.elements.empty) {
      this.elements.empty.remove();
      delete this.elements.empty;
    }
  };
  NotificationAPIClient2.prototype.getPageCount = function() {
    return Math.max(1, Math.ceil(this.state.notifications.length / this.state.pageSize));
  };
  NotificationAPIClient2.prototype.changePage = function(pageNumber) {
    this.state.currentPage = pageNumber;
    if (this.state.currentPage >= this.getPageCount() - 2) {
      this.requestMoreNotifications();
    }
    this.renderNotifications();
  };
  NotificationAPIClient2.prototype.renderNotifications = function() {
    var header = this.elements.header;
    var popupInner = this.elements.popupInner;
    if (!header || !popupInner || !this.state.inappOptions)
      return;
    var page = this.state.currentPage;
    var pageSize = this.state.pageSize;
    if (this.state.inappOptions.paginated) {
      popupInner.querySelectorAll(".notificationapi-notification").forEach(function(el2) {
        el2.remove();
      });
    }
    for (var i = page * pageSize; i < this.state.notifications.length && i < page * pageSize + pageSize; i++) {
      var n = this.state.notifications[i];
      if (popupInner.querySelector('[data-notification-id="'.concat(n.id, '"]'))) {
        continue;
      }
      var el = this.generateNotificationElement(n);
      if (i === page * pageSize) {
        header.insertAdjacentElement("afterend", el);
      } else {
        var preNotificationEl = popupInner.querySelector('[data-notification-id="'.concat(this.state.notifications[i - 1].id, '"]'));
        if (preNotificationEl) {
          preNotificationEl.insertAdjacentElement("afterend", el);
        } else {
          console.error("error finding previous notification", this.state.notifications[i - 1]);
        }
      }
    }
    if (this.elements.prevButton) {
      this.elements.prevButton.disabled = page === 0;
    }
    if (this.elements.nextButton) {
      this.elements.nextButton.disabled = page >= this.state.notifications.length / pageSize - 1;
    }
  };
  NotificationAPIClient2.prototype.generateNotificationElement = function(n) {
    var _this = this;
    var notification = (void 0).createElement("a");
    notification.setAttribute("data-notification-id", n.id);
    notification.classList.add("notificationapi-notification");
    if (n.redirectURL) {
      notification.href = n.redirectURL;
    }
    var notificationImageContainer = (void 0).createElement("div");
    notificationImageContainer.classList.add("notificationapi-notification-imageContainer");
    if (n.imageURL) {
      var notificationImage = (void 0).createElement("img");
      notificationImage.classList.add("notificationapi-notification-image");
      notificationImage.src = n.imageURL;
      notificationImageContainer.appendChild(notificationImage);
    } else {
      var notificationIcon = (void 0).createElement("span");
      notificationIcon.classList.add("icon-commenting-o");
      notificationIcon.classList.add("notificationapi-notification-defaultIcon");
      notificationImageContainer.appendChild(notificationIcon);
    }
    notification.appendChild(notificationImageContainer);
    var notificationMetaContainer = (void 0).createElement("div");
    notificationMetaContainer.classList.add("notificationapi-notification-metaContainer");
    var notificationTitle = (void 0).createElement("p");
    notificationTitle.classList.add("notificationapi-notification-title");
    notificationTitle.innerHTML = n.title;
    notificationMetaContainer.appendChild(notificationTitle);
    var date = (void 0).createElement("p");
    date.classList.add("notificationapi-notification-date");
    date.innerHTML = timeAgo(Date.now() - new Date(n.date).getTime(), i18n);
    notificationMetaContainer.appendChild(date);
    notification.appendChild(notificationMetaContainer);
    if (!n.seen) {
      notification.classList.add("unseen");
    }
    if (this.state.inappOptions && this.state.inappOptions.markAsReadMode && this.state.inappOptions.markAsReadMode !== MarkAsReadModes.AUTOMATIC) {
      var menuButton = (void 0).createElement("button");
      menuButton.classList.add("notificationapi-notification-menu-button");
      menuButton.innerHTML = '<span class="icon-ellipsis-h"></span>';
      menuButton.addEventListener("click", function(e) {
        var _a;
        e.preventDefault();
        (_a = _this.elements.notificationMenu) === null || _a === void 0 ? void 0 : _a.remove();
        var menu = (void 0).createElement("div");
        menu.classList.add("notificationapi-notification-menu");
        var item = (void 0).createElement("button");
        item.classList.add("notificationapi-notification-menu-item");
        item.innerHTML = '<span class="icon-check"></span><span class="notificationapi-notification-menu-item-text">'.concat(i18n.t("mark_as_read"), "</span>");
        item.addEventListener("click", function(e2) {
          e2.preventDefault();
          notification.classList.remove("unseen");
          _this.setInAppUnread(_this.state.unread - 1);
          _this.sendWSMessage({
            route: "inapp_web/unread_clear",
            payload: {
              notificationId: n.id
            }
          });
        });
        menu.appendChild(item);
        notification.appendChild(menu);
        _this.elements.notificationMenu = menu;
      });
      notification.appendChild(menuButton);
    }
    if (this.state.inappOptions && this.state.inappOptions.markAsReadMode === MarkAsReadModes.MANUAL_AND_CLICK) {
      notification.addEventListener("click", function(e) {
        var element = e.target;
        var menuWasClicked = element.classList.contains("notificationapi-notification-menu-button") || element.classList.contains("notificationapi-notification-menu") || element.closest(".notificationapi-notification-menu-button") || element.closest(".notificationapi-notification-menu");
        if (!menuWasClicked) {
          notification.classList.remove("unseen");
          _this.setInAppUnread(_this.state.unread - 1);
          _this.sendWSMessage({
            route: "inapp_web/unread_clear",
            payload: {
              notificationId: n.id
            }
          });
        }
      });
    }
    return notification;
  };
  NotificationAPIClient2.prototype.renderPreferences = function(preferences) {
    var _this = this;
    var _a;
    if (!this.elements.preferencesPopup)
      return;
    var popup = this.elements.preferencesPopup;
    var validPreferences = preferences.filter(function(p) {
      return p.settings.length > 0;
    });
    if (validPreferences.length === 0 && !this.elements.preferencesEmpty) {
      var empty = (void 0).createElement("div");
      empty.classList.add("notificationapi-preferences-empty");
      empty.innerHTML = i18n.t("there_are_no_notifications_to_configure");
      popup.appendChild(empty);
      this.elements.preferencesEmpty = empty;
      return;
    }
    (_a = this.elements.preferencesGrid) === null || _a === void 0 ? void 0 : _a.remove();
    this.elements.preferencesGrid = void 0;
    var grid = (void 0).createElement("div");
    grid.classList.add("notificationapi-preferences-grid");
    this.elements.preferencesGrid = grid;
    popup.appendChild(grid);
    var channels = {};
    validPreferences.map(function(p) {
      p.settings.map(function(s) {
        if (!channels[s.channel])
          channels[s.channel] = s.channelName;
      });
    });
    var row = 1;
    Object.values(channels).map(function(v, i) {
      var channel = (void 0).createElement("div");
      channel.innerHTML = v;
      channel.classList.add("notificationapi-preferences-channel", "notificationapi-preferences-col".concat(i + 2), "notificationapi-preferences-row".concat(row));
      grid.appendChild(channel);
    });
    row++;
    validPreferences.map(function(pref) {
      var title = (void 0).createElement("div");
      title.classList.add("notificationapi-preferences-title", "notificationapi-preferences-col1", "notificationapi-preferences-row".concat(row));
      title.innerHTML = pref.title;
      grid.appendChild(title);
      pref.settings.map(function(s) {
        var toggle = (void 0).createElement("div");
        var col2 = Object.keys(channels).indexOf(s.channel) + 2;
        toggle.classList.add("notificationapi-preferences-toggle", "notificationapi-preferences-col".concat(col2), "notificationapi-preferences-row".concat(row));
        toggle.setAttribute("data-notificationId", pref.notificationId);
        toggle.setAttribute("data-channel", s.channel);
        var label = (void 0).createElement("label");
        label.classList.add("switch");
        toggle.appendChild(label);
        var input = (void 0).createElement("input");
        input.setAttribute("type", "checkbox");
        input.checked = s.state;
        label.appendChild(input);
        var i = (void 0).createElement("i");
        label.appendChild(i);
        input.addEventListener("change", function() {
          grid.querySelectorAll('.notificationapi-preferences-subtoggle[data-notificationid="'.concat(pref.notificationId, '"][data-channel="').concat(s.channel, '"] input')).forEach(function(e) {
            e.disabled = !input.checked;
          });
          _this.patchUserPreference(pref.notificationId, s.channel, input.checked);
        });
        grid.appendChild(toggle);
      });
      row++;
      if (pref.subNotificationPreferences && pref.subNotificationPreferences.length > 0) {
        var expand2 = (void 0).createElement("button");
        expand2.innerHTML = i18n.t("expand");
        expand2.setAttribute("data-notificationId", pref.notificationId);
        var col = Object.keys(channels).length + 2;
        expand2.classList.add("notificationapi-preferences-expand", "notificationapi-preferences-col".concat(col), "notificationapi-preferences-row".concat(row - 1));
        expand2.addEventListener("click", function(e) {
          var expand22 = e.target;
          var notificationId = expand22.getAttribute("data-notificationId");
          popup.querySelectorAll('[data-notificationId="'.concat(notificationId, '"][data-subNotificationId]')).forEach(function(e2) {
            e2.classList.toggle("closed");
          });
        });
        grid.appendChild(expand2);
        pref.subNotificationPreferences.map(function(subPref) {
          var title2 = (void 0).createElement("div");
          title2.classList.add("notificationapi-preferences-subtitle", "notificationapi-preferences-col1", "notificationapi-preferences-row".concat(row), "closed");
          title2.setAttribute("data-subNotificationId", subPref.subNotificationId);
          title2.setAttribute("data-notificationId", pref.notificationId);
          title2.innerHTML = subPref.title;
          grid.appendChild(title2);
          subPref.settings.map(function(s) {
            var toggle = (void 0).createElement("div");
            var col2 = Object.keys(channels).indexOf(s.channel) + 2;
            toggle.classList.add("notificationapi-preferences-subtoggle", "notificationapi-preferences-col".concat(col2), "notificationapi-preferences-row".concat(row), "closed");
            toggle.setAttribute("data-notificationId", subPref.notificationId);
            toggle.setAttribute("data-subNotificationId", subPref.subNotificationId);
            toggle.setAttribute("data-channel", s.channel);
            var label = (void 0).createElement("label");
            label.classList.add("switch", "small");
            toggle.appendChild(label);
            var input = (void 0).createElement("input");
            input.setAttribute("type", "checkbox");
            input.checked = s.state;
            if (pref.settings.find(function(ps) {
              return ps.channel === s.channel && ps.state === false;
            }))
              input.disabled = true;
            label.appendChild(input);
            var i = (void 0).createElement("i");
            label.appendChild(i);
            input.addEventListener("change", function() {
              _this.patchUserPreference(pref.notificationId, s.channel, input.checked, subPref.subNotificationId);
            });
            grid.appendChild(toggle);
          });
          row++;
        });
      }
    });
  };
  NotificationAPIClient2.prototype.renderWebPushOptIn = function() {
    var _this = this;
    var localStorageAskForWebPushPermission = JSON.parse(localStorage.getItem("askForWebPushPermission") || "true");
    if (!this.elements.header || !localStorageAskForWebPushPermission) {
      return;
    }
    var optInContainer = (void 0).createElement("div");
    optInContainer.classList.add("notificationapi-opt-in-container");
    var optInMessage = (void 0).createElement("div");
    optInMessage.innerHTML = i18n.t("do_you_want_to_receive_push_notifications");
    optInMessage.classList.add("notificationapi-opt-in-message");
    optInContainer.appendChild(optInMessage);
    var allowButton = (void 0).createElement("button");
    allowButton.innerHTML = i18n.t("yes");
    allowButton.classList.add("notificationapi-allow-button");
    allowButton.addEventListener("click", function() {
      _this.askForWebPushPermission();
      localStorage.setItem("askForWebPushPermission", "false");
      optInContainer.style.display = "none";
    });
    optInContainer.appendChild(allowButton);
    var noThanksButton = (void 0).createElement("button");
    noThanksButton.innerHTML = i18n.t("no_thanks");
    noThanksButton.classList.add("notificationapi-no-thanks-button");
    noThanksButton.addEventListener("click", function() {
      localStorage.setItem("askForWebPushPermission", "false");
      optInContainer.style.display = "none";
    });
    optInContainer.appendChild(noThanksButton);
    this.elements.header.appendChild(optInContainer);
  };
  NotificationAPIClient2.prototype.sendWSMessage = function(request) {
    if (!this.websocket)
      return;
    var ws = this.websocket;
    if (ws.readyState == ws.OPEN) {
      ws.send(JSON.stringify(request));
    } else {
      ws.addEventListener("open", function() {
        ws.send(JSON.stringify(request));
      });
    }
  };
  NotificationAPIClient2.prototype.websocketMessageReceived = function(route) {
    return __awaiter(this, void 0, void 0, function() {
      var ws;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            return [4, this.websocketOpened()];
          case 1:
            ws = _a.sent();
            return [2, new Promise(function(resolve) {
              ws.addEventListener("message", function(message) {
                var body = JSON.parse(message.data);
                if (body && body.route && body.route === route) {
                  resolve(body);
                }
              });
            })];
        }
      });
    });
  };
  NotificationAPIClient2.prototype.websocketOpened = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      if (!_this.websocket)
        reject("Websocket is not present.");
      else {
        var ws = _this.websocket;
        if (ws.readyState == ws.OPEN) {
          resolve(ws);
        }
      }
    });
  };
  return NotificationAPIClient2;
}();
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$2 = {
  name: "NotificationAPIComponent",
  mounted() {
    this.notificationapi = new NotificationAPIClient({
      clientId: "54jas9ae4omlbbq3s0u0d9spui",
      userId: "sahand"
    });
    this.notificationapi.showInApp({
      root: "container",
      // Use the ref as the root element
      popupPosition: PopupPosition.BottomRight
    });
  }
};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    ref: "containerRef",
    id: "container"
  }, _attrs))} data-v-a4e09578></div>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-a4e09578"]]);
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-7HGgzNkz.mjs').then((r) => r.default || r));
    const _Error = defineAsyncComponent(() => import('./error-500-DjykPhz0.mjs').then((r) => r.default || r));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1;
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = defineAsyncComponent(() => import('./island-renderer-2fFm1Ajy.mjs').then((r) => r.default || r));
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RootComponent = _sfc_main;
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error = nuxt.payload.error || createError(error);
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

export { _export_sfc as _, useRuntimeConfig as a, createError as c, entry$1 as default, injectHead as i, navigateTo as n, resolveUnrefHeadInput as r, useRouter as u };
//# sourceMappingURL=server.mjs.map
