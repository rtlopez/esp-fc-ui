import { useCallback, useRef } from "react"

const download = (blob: Blob, filename: string): void => {
  const a = document.createElement('a')
  a.setAttribute('href', URL.createObjectURL(blob))
  a.setAttribute('download', filename)
  a.click()
}

const dateStr = (d: Date = new Date()): string => {
  const iso = d.toISOString(); // "2025-09-24T13:45:30.123Z"
  const safe = iso.replace(/[-:TZ.]/g, "").slice(2, 14);
  return safe.slice(0, 6) + "_" + safe.slice(6)
}

export const useBlobAccumulator = (mimeType?: string) => {
  const chunksRef = useRef<ArrayBuffer[]>([])
  const totalLengthRef = useRef(0)

  // append chunk
  const append = useCallback((chunk: ArrayBuffer) => {
    chunksRef.current.push(chunk)
    totalLengthRef.current += chunk.byteLength
  }, [])

  // clear buffer
  const clear = useCallback(() => {
    chunksRef.current = []
    totalLengthRef.current = 0
  }, [])

  // build blob
  const finalize = useCallback(() => {
    const blob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined)
    clear()
    return blob
  }, [mimeType, clear])

  const getArrayBuffer = useCallback((): ArrayBuffer => {
    const out = new Uint8Array(totalLengthRef.current)
    let offset = 0
    for (const c of chunksRef.current) {
      out.set(new Uint8Array(c), offset)
      offset += c.byteLength
    }
    clear()
    return out.buffer
  }, [clear])

  return {
    append,
    clear,
    finalize,
    getArrayBuffer,
    download,
    dateStr,
  }
}
