import '@testing-library/jest-dom/vitest'

/**
 * jsdom ships no canvas implementation, so `HTMLCanvasElement.getContext`
 * throws "Not implemented" and floods the test output. The `CharacterCanvas`
 * component already tolerates a missing context, but components that mount it
 * (e.g. the app-shell test) would still emit the noisy error. Provide a tiny
 * no-op 2D context stub so those tests exercise the real mount path quietly.
 *
 * This is a test-only shim — nothing here runs in the browser build.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => {}
  const stub2dContext = () =>
    new Proxy(
      {
        canvas: { width: 300, height: 240 },
        setTransform: noop,
        getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      } as Record<string, unknown>,
      {
        get(target, prop) {
          if (prop in target) return target[prop as string]
          // Any other member is a callable no-op (drawing primitives, etc.).
          return noop
        },
      },
    )

  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    kind: string,
  ) {
    const ctx = kind === '2d' ? (stub2dContext() as unknown as CanvasRenderingContext2D) : null
    // Keep the stub's canvas pointer aligned with the actual element.
    if (ctx) (ctx as unknown as { canvas: HTMLCanvasElement }).canvas = this
    return ctx
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}
