// HTML 白名单消毒：后台可编辑的富文本片段在渲染前过滤，只保留极少数排版标签。
// 即使持有写权限的令牌泄露，也无法向前台访客注入脚本。
const ALLOWED_TAGS = new Set(['EM', 'STRONG', 'B', 'I', 'BR'])
const DROP_ENTIRELY = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'IMG', 'SVG', 'FORM', 'INPUT'])

export function sanitizeHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(String(html), 'text/html')
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== 1) continue // 只处理元素节点，文本原样保留
      walk(child)
      if (DROP_ENTIRELY.has(child.tagName)) {
        child.remove()
      } else if (ALLOWED_TAGS.has(child.tagName)) {
        while (child.attributes.length) child.removeAttribute(child.attributes[0].name)
      } else {
        child.replaceWith(...child.childNodes)
      }
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}
