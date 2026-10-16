import React from 'react'

/* Tiny, dependency-free, XSS-safe markdown renderer.
   Handles the subset LLMs actually emit: headings, bold, italic, inline code,
   fenced code blocks, bullet/numbered lists, links, and paragraphs.
   Never injects raw HTML — everything is built from React nodes. */

function inline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // order matters: code first so ** inside code isn't bolded
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('`')) nodes.push(<code key={`${keyBase}-${i}`} style={{ background: 'var(--bg-elevated, rgba(127,127,127,.15))', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9em' }}>{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('**')) nodes.push(<strong key={`${keyBase}-${i}`}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*')) nodes.push(<em key={`${keyBase}-${i}`}>{tok.slice(1, -1)}</em>)
    else { // link
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!
      nodes.push(<a key={`${keyBase}-${i}`} href={lm[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover, #818cf8)' }}>{lm[1]}</a>)
    }
    last = m.index + tok.length; i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function Markdown({ text }: { text: string }) {
  const lines = (text || '').replace(/\r/g, '').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0, key = 0
  while (i < lines.length) {
    const line = lines[i]
    // fenced code block
    if (line.trim().startsWith('```')) {
      const buf: string[] = []; i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++ }
      i++
      blocks.push(<pre key={key++} style={{ background: 'var(--bg-elevated, rgba(127,127,127,.12))', padding: 12, borderRadius: 8, overflowX: 'auto', fontSize: 13, fontFamily: 'var(--font-mono, monospace)', margin: '8px 0' }}>{buf.join('\n')}</pre>)
      continue
    }
    // heading
    const h = /^(#{1,4})\s+(.*)/.exec(line)
    if (h) { const lvl = h[1].length; blocks.push(<div key={key++} style={{ fontWeight: 700, fontSize: lvl <= 2 ? 16 : 14, margin: '10px 0 4px' }}>{inline(h[2], `h${key}`)}</div>); i++; continue }
    // list (consecutive * - or numbered)
    if (/^\s*([*-]|\d+\.)\s+/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\s*([*-]|\d+\.)\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*([*-]|\d+\.)\s+/, '')
        items.push(<li key={items.length} style={{ margin: '2px 0' }}>{inline(content, `li${key}-${items.length}`)}</li>)
        i++
      }
      blocks.push(<ul key={key++} style={{ margin: '6px 0', paddingLeft: 20 }}>{items}</ul>)
      continue
    }
    // blank line
    if (line.trim() === '') { i++; continue }
    // paragraph (gather until blank)
    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^\s*([*-]|\d+\.)\s+/.test(lines[i]) && !lines[i].trim().startsWith('```') && !/^#{1,4}\s/.test(lines[i])) { para.push(lines[i]); i++ }
    blocks.push(<p key={key++} style={{ margin: '6px 0', lineHeight: 1.55 }}>{inline(para.join(' '), `p${key}`)}</p>)
  }
  return <div>{blocks}</div>
}
