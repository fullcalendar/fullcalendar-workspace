/*
Serializes DOM into stable, diffable text for the DOM snapshot tool (scripts/bin/dom-snapshot.js).
Generated ids are rewritten to tokens in order of first appearance, classnames and attributes are
sorted, and numbers in inline styles are rounded, so that two runs at the same commit match.
*/

// attributes whose values are (space-separated lists of) element ids
const ID_ATTRS = new Set([
  'id',
  'for',
  'headers',
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
])

const INDENT = '  '

export function serializeEls(els: Element[]): string {
  const idTokens = new Map<string, string>()
  const lines: string[] = []

  for (const el of els) {
    serializeNode(el, 0, idTokens, lines)
  }

  return lines.join('\n') + '\n'
}

function serializeNode(node: Node, depth: number, idTokens: Map<string, string>, lines: string[]): void {
  const indent = INDENT.repeat(depth)

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent

    if (text.trim()) {
      lines.push(indent + JSON.stringify(text))
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const tagName = el.tagName.toLowerCase()
    const attrStrs = serializeAttrs(el, idTokens)
    const openTag = '<' + [tagName, ...attrStrs].join(' ') + '>'
    const childNodes = Array.from(el.childNodes).filter((childNode) => (
      childNode.nodeType === Node.ELEMENT_NODE ||
      (childNode.nodeType === Node.TEXT_NODE && childNode.textContent.trim())
    ))

    if (!childNodes.length) {
      lines.push(indent + openTag + `</${tagName}>`)
    } else {
      lines.push(indent + openTag)

      for (const childNode of childNodes) {
        serializeNode(childNode, depth + 1, idTokens, lines)
      }

      lines.push(indent + `</${tagName}>`)
    }
  }
  // comments and other node types are dropped
}

function serializeAttrs(el: Element, idTokens: Map<string, string>): string[] {
  const attrStrs: string[] = []
  const attrs = Array.from(el.attributes).sort((a, b) => a.name.localeCompare(b.name))

  for (const attr of attrs) {
    let { value } = attr

    if (attr.name === 'class') {
      value = value.split(/\s+/).filter(Boolean).sort().join(' ')

      if (!value) {
        continue
      }
    } else if (attr.name === 'style') {
      value = serializeStyle((el as HTMLElement).style)

      if (!value) {
        continue
      }
    } else if (ID_ATTRS.has(attr.name)) {
      value = value.split(/\s+/).filter(Boolean).map((id) => tokenizeId(id, idTokens)).join(' ')
    }

    attrStrs.push(`${attr.name}=${JSON.stringify(value)}`)
  }

  return attrStrs
}

function serializeStyle(style: CSSStyleDeclaration): string {
  const declarations: string[] = []

  for (let i = 0; i < style.length; i += 1) {
    const propName = style.item(i)
    const priority = style.getPropertyPriority(propName)

    declarations.push(
      propName + ': ' + roundNumbers(style.getPropertyValue(propName)) + (priority ? ' !' + priority : ''),
    )
  }

  return declarations.sort().join('; ')
}

// rounds to 0.1, so sub-pixel measurement noise doesn't produce diffs
function roundNumbers(str: string): string {
  return str.replace(/-?\d*\.\d+/g, (numStr) => {
    const rounded = Math.round(parseFloat(numStr) * 10) / 10
    return String(rounded === 0 ? 0 : rounded) // avoid "-0"
  })
}

function tokenizeId(id: string, idTokens: Map<string, string>): string {
  let token = idTokens.get(id)

  if (!token) {
    token = `#id${idTokens.size + 1}`
    idTokens.set(id, token)
  }

  return token
}
