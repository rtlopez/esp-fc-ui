import { useCallback, useRef, useState } from "react"

export function useBlobAccumulator(mimeType?: string) {
  const chunksRef = useRef<Uint8Array[]>([])
  const totalLengthRef = useRef(0)
  const [blob, setBlob] = useState<Blob | null>(null)

  // append chunk
  const append = useCallback((chunk: Uint8Array) => {
    chunksRef.current.push(chunk)
    totalLengthRef.current += chunk.byteLength
  }, [])

  // build blob
  const finalize = useCallback(() => {
    const newBlob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined)
    setBlob(newBlob)
    return newBlob
  }, [mimeType])

  // optional: make ArrayBuffer
  const getArrayBuffer = useCallback((): ArrayBuffer => {
    const out = new Uint8Array(totalLengthRef.current)
    let offset = 0
    for (const c of chunksRef.current) {
      out.set(c, offset)
      offset += c.byteLength
    }
    return out.buffer
  }, [])

  // clear buffer
  const clear = useCallback(() => {
    chunksRef.current = []
    totalLengthRef.current = 0
    setBlob(null)
  }, [])

  return {
    append,
    finalize,
    getArrayBuffer,
    clear,
    blob,
  }
}
