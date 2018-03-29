export default function Runtime(options) {
  return component => {
    let scriptExports = {}

    if (component.script) {
      scriptExports = load(component.script)
    }

    let scriptOptions = scriptExports

    if (scriptExports.__esModule) {
      scriptOptions = scriptExports.default
    }

    if (typeof scriptOptions === 'function') {
      scriptOptions = scriptOptions.component
    }

    if (component.template) {
      scriptOptions.render = component.template.render
      scriptOptions.staticRenderFns = component.template.staticRenderFns
      scriptOptions._compiled = true
    }

    if (component.functional) {
      scriptOptions.functional = true
    }

    if (component.file) {
      scriptOptions.__file = component.file
    }

    if (component.hasScopedStyles) {
      scriptOptions._scopeId = component.scopeId
    }

    const module = { exports: scriptExports, options: scriptOptions }

    if (component.inlineStyles || component.cssModules) {

      module.hook = function() {
        if (component.inlineStyles) {
          options.injectStyles(component.inlineStyles, component.scopeId)
        }
        if (component.cssModules) {
          for (const name of Object.keys(component.cssModules)) {
            this[name] = component.cssModules[name]
          }
        }
      }
    }

    if (component.hotAPI && options.hookModule) {
      options.hookModule(component, module)
    }

    if (module.hook) {
      if (scriptOptions.functional) {
        const originalRender = scriptOptions.render
        scriptOptions._injectStyles = module.hook
        scriptOptions.render = function renderWithStyleInjection(h, context) {
          module.hook.call(context)
          return originalRender(h, context)
        }
      } else {
        scriptOptions.beforeCreate = [].concat(scriptOptions.beforeCreate || [], module.hook)
      }
    }

    if (component.customBlocks) {
      for (const factory of component.customBlocks || []) {
        let block = load(factory)
        if (!block) {
          continue
        }
        if (block.__esModule) {
          block = block.default
        }
        if (typeof block === 'function') {
          block(module)
        }
      }
    }

    return module.exports
  }
}

function load(factory) {
  const module = { exports: {} }
  factory.call(null, module, module.exports)
  return module.exports
}
