import PostCSS from 'postcss'
import SelectorParser from 'postcss-selector-parser'

export default PostCSS.plugin('postcss-scope', options => root => {
  root.each(function rewriteSelector(node) {

    if (!node.selector) {
      // handle media queries
      if (node.type === 'atrule' && node.name === 'media') {
        node.each(rewriteSelector)
      }
      return
    }

    node.selector = SelectorParser(selectors => {
      selectors.each(selector => {
        let node = null

        selector.each(n => {
          if (n.type !== 'pseudo') {
            node = n
          }
        })

        if (node) {
          selector.insertAfter(node, SelectorParser.attribute({ attribute: options.scopeId }))
        }
      })
    }).process(node.selector).result
  })
})
