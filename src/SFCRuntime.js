/*
  type ComponentDescriptor = {

    file?: string;

    scopeId?: string;

    functional?: boolean;

    script?: ModuleDefinition;

    templates?: Array<Function>;

    styles?: { [media: string]: { code: string; map?: SourceMapObject } };

    cssModules?: { [key: string]: { [key: string]: string } };

    injectStyle?: (css: string, map: SourceMapObject, media: string): void;

    moduleIdentifier?: ModuleIdentifier;

    customBlocks?: Array<ModuleDefinition>;

    hotReloadApi?: Webpack.HotModuleReplacementAPI;
  };

  type ModuleDefinition = Function | any;

  type StyleDescriptor = {

    code: string;

    map?: SourceMapObject;

    media?: string;
  };
*/

/**
 * @param {ComponentDescriptor} options
 */
export default function SFCRuntime(options) {
  let vueModule
  let vueExports = {}

  if (options.script) {
    vueModule = evaluateModule(options.script)
    vueExports = vueModule.default || {}
  }

  let vueOptions = vueExports

  if (typeof vueOptions === 'function') {
    vueOptions = vueExports.options
  }

  if (options.file) {
    vueOptions.__file = options.file
  }

  if (options.scopeId) {
    vueOptions._scopeId = options.scopeId
  }

  if (options.functional) {
    vueOptions.functional = options.functional
  }

  if (options.templates) {
    vueOptions.render = options.templates[0]
    vueOptions.staticRenderFns = options.templates.slice(1)
  }

  if (options.moduleIdentifier) {
    hookRender(registerComponent)
    options._ssrRegister = registerComponent
  } else if (options.styles || options.cssModules) {
    hookRender(injectStyles)
  }

  for (const block of options.customBlocks || []) {
    const moduleDefinition = evaluateModule(block).default

    if (typeof moduleDefinition === 'function') {
      moduleDefinition(vueOptions)
    }
  }

  function registerComponent(ctx) {
    const context =
      ctx || // cached call
      (this.$vnode && this.$vnode.ssrContext) || // stateful
      (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
    // 2.2 with runInNewContext: true
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
      context = __VUE_SSR_CONTEXT__
    }
    // inject component styles
    if (options.styles || options.cssModules) {
      injectStyles.call(this, context)
    }
    // register component module identifier for async chunk inferrence
    if (context && context._registeredComponents) {
      context._registeredComponents.add(moduleIdentifier)
    }
  }

  function injectStyles() {
    for (const module of Object.keys(options.cssModules || {})) {
      if (options.hotReloadApi) {
        Object.defineProperty(this, module, { get: () => options.cssModules[module] })
      } else {
        this[module] = options.cssModules[module]
      }
    }
    for (const media of Object.keys(options.styles || {})) {
      options.injectStyle(options.styles[media].code, options.styles[media].map, media)
    }
  }

  return { vueModule, vueExports, vueOptions, options }
}

function evaluateModule(definition) {
  const module = { exports: {} }
  definition(module, module.exports)
  const { exports } = module
  if (exports && exports.__esModule) {
    return exports
  }
  return { default: exports }
}

function hookRender(hook) {
  if (!vueOptions.functional) {
    vueOptions.beforeCreate = [].concat(vueOptions.beforeCreate || [], hook)
    return
  }
  const existing = vueOptions.render
  vueOptions._injectStyles = hook
  vueOptions.render = function renderWithStyleInjection(h, ctx) {
    hook.call(ctx)
    existing.call(this, h, ctx)
  }
}
