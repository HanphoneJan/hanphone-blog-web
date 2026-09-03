let gateActive = false
const settledWaiters = new Set<() => void>()
const rangeCache = new WeakMap<FontFace, [number, number][]>()

function parseRangeToken(token: string): [number, number] | null {
  const match = /^u\+([0-9a-f?]+)(?:-([0-9a-f?]+))?$/i.exec(token.trim())
  if (!match) return null
  const lo = parseInt(match[1].replace(/\?/g, '0'), 16)
  const hiHex = (match[2] !== undefined ? match[2] : match[1]).replace(/\?/g, 'f')
  return [lo, parseInt(hiHex, 16)]
}

function getFaceRanges(face: FontFace): [number, number][] {
  const cached = rangeCache.get(face)
  if (cached) return cached
  const ranges: [number, number][] = []
  for (const token of face.unicodeRange.split(',')) {
    const range = parseRangeToken(token)
    if (range) ranges.push(range)
  }
  rangeCache.set(face, ranges)
  return ranges
}

function collectNeededFaces(text: string): FontFace[] {
  const needed: FontFace[] = []
  if (!text) return needed
  const codePoints: number[] = []
  for (const char of text) codePoints.push(char.codePointAt(0) as number)
  document.fonts.forEach(face => {
    if (face.status === 'loaded' || face.status === 'loading') return
    const ranges = getFaceRanges(face)
    if (ranges.length === 0) return
    for (const cp of codePoints) {
      for (const [lo, hi] of ranges) {
        if (cp >= lo && cp <= hi) {
          needed.push(face)
          return
        }
      }
    }
  })
  return needed
}

export async function settleFonts(capMs: number): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const text = document.body ? document.body.textContent : ''
  const cap = new Promise<void>(resolve => setTimeout(resolve, capMs))
  const loadAll = async () => {
    for (let round = 0; round < 2; round++) {
      const faces = collectNeededFaces(text)
      if (faces.length === 0) return
      await Promise.allSettled(faces.map(face => face.load()))
    }
  }
  await Promise.race([loadAll(), cap])
}

export function isGateActive(): boolean {
  return gateActive
}

export function whenGateSettled(callback: () => void): () => void {
  if (!gateActive) {
    callback()
    return () => {}
  }
  settledWaiters.add(callback)
  return () => {
    settledWaiters.delete(callback)
  }
}

export function beginGate(): void {
  gateActive = true
  document.documentElement.classList.add('fonts-loading')
}

export function endGate(): void {
  if (!gateActive) return
  gateActive = false
  document.documentElement.classList.remove('fonts-loading')
  const waiters = Array.from(settledWaiters)
  settledWaiters.clear()
  waiters.forEach(callback => callback())
}

export function startInitialGate(): void {
  if (gateActive) return
  beginGate()
  void settleFonts(2500).finally(() => endGate())
  window.setTimeout(() => endGate(), 4000)
}

if (typeof window !== 'undefined') {
  startInitialGate()
}
