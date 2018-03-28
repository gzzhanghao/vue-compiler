export default function Runtime(options) {
  return component => {
    const scriptExports = {}

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

    if (component.cssModules) {

    }

    if (component.styles) {

      if (scriptOptions.functional) {
        const originalRender = scriptOptions.render
        scriptOptions._injectStyles = hook
        scriptOptions.render = function renderWithStyleInjection(h, context) {
          hook.call(context)
          return originalRender(h, context)
        }
      } else {
        scriptOptions.beforeCreate = [].concat(scriptOptions.beforeCreate || [], hook)
      }

      function hook() {
        for (const style of component.styles) {
          options.injectStyle(style, component.scopeId)
        }
      }
    }

    const component = { exports: scriptExports, options: scriptOptions }

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
          block(component)
        }
      }
    }

    return component.exports
  }
}

function load(factory) {
  const module = { exports: {} }
  factory.call(null, module, module.exports)
  return module.exports
}

script: (module, exports),
template: {
  render: (),
  staticRenderFns: [
    (),
  ],
},
functional: true,
hasScopedStyles: true,
styles: [],
customBlocks: [
  (module, exports),
],
scopeId: 'data-v-xxxx',
