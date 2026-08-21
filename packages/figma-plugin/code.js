/**
 * Lists — fills selected text layers with realistic mock data.
 *
 * The UI iframe does the fetching (the plugin sandbox has no fetch), posts
 * items back here, and this side writes them into the selection. Every text
 * node's font must be loaded before `characters` can be set — including each
 * font in a mixed-font node — or the assignment throws.
 */

const UI = { width: 340, height: 480 }

figma.showUI(__html__, UI)

function textNodesInSelection() {
  const found = []
  const walk = (node) => {
    if (node.type === 'TEXT') {
      found.push(node)
      return
    }
    if ('children' in node) for (const child of node.children) walk(child)
  }
  for (const node of figma.currentPage.selection) walk(node)
  // Top-to-bottom, then left-to-right, so filling reads the way the layout
  // does rather than in selection order.
  return found.sort((a, b) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x))
}

async function loadFontsFor(node) {
  const fonts = node.getRangeAllFontNames(0, node.characters.length || 1)
  await Promise.all(fonts.map((f) => figma.loadFontAsync(f)))
}

function reportSelection() {
  figma.ui.postMessage({ type: 'selection', count: textNodesInSelection().length })
}

figma.on('selectionchange', reportSelection)

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'ready') {
    reportSelection()
    return
  }

  if (msg.type !== 'fill') return

  const nodes = textNodesInSelection()
  if (nodes.length === 0) {
    figma.notify('Select one or more text layers first')
    figma.ui.postMessage({ type: 'done' })
    return
  }

  const items = msg.items || []
  if (items.length === 0) {
    figma.notify('No items came back for that list')
    figma.ui.postMessage({ type: 'done' })
    return
  }

  let filled = 0
  let skipped = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    try {
      await loadFontsFor(node)
      node.characters = String(items[i % items.length])
      filled++
    } catch (err) {
      // Missing fonts and locked/read-only layers throw here; skip that
      // layer rather than aborting the whole fill.
      skipped++
    }
  }

  figma.notify(
    skipped === 0
      ? `Filled ${filled} layer${filled === 1 ? '' : 's'}`
      : `Filled ${filled}, skipped ${skipped} (missing font or locked)`,
  )
  figma.ui.postMessage({ type: 'done' })
}
