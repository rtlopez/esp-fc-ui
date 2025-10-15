import { useCallback, useRef, useState } from "react"

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
  const chunksRef = useRef<Uint8Array<ArrayBuffer>[]>([])
  const totalLengthRef = useRef(0)
  const [blob, setBlob] = useState<Blob | null>(null)

  // append chunk
  const append = useCallback((chunk: Uint8Array<ArrayBuffer>) => {
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
    download,
    dateStr,
    blob,
  }
}
