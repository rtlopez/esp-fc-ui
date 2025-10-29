import CryptoJS from 'crypto-js'
import JSZip from 'jszip'

export type FirmwareVersion = {
  version: string
  file: string
  board: string
  group: string
  checksum?: string
  url?: string
}

export const isZipFile = (arrayBuffer: ArrayBuffer): boolean => {
  if (arrayBuffer.byteLength < 4) return false
  // ZIP file header: 50 4B 03 04
  return new Uint8Array(arrayBuffer.slice(0, 4)).every((byte, index) => [0x50, 0x4B, 0x03, 0x04][index] === byte)
}

export const extractZipFile = async (zipBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  if (!isZipFile(zipBuffer)) return zipBuffer
  const zip = new JSZip()
  await zip.loadAsync(zipBuffer)
  for (const [filename, file] of Object.entries(zip.files)) {
    if (!filename.endsWith('.bin')) continue
    return (await file.async('nodebuffer')).buffer as ArrayBuffer
  }
  throw new Error('Invalid zip contents')
}

export const packZipFile = async ( buffer: ArrayBuffer, filename: string): Promise<ArrayBuffer> => {
  if (isZipFile(buffer)) return buffer
  const zip = new JSZip()
  zip.file(filename, buffer)
  return await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9 // maksymalna kompresja
    }
  })
}

export const toBinaryString = (arrayBuffer: ArrayBuffer|string): string => {
  if (typeof arrayBuffer === 'string') return arrayBuffer

  // do not use! breaks image data, works different in browser and node
  //const textDecoder = new TextDecoder('latin1')
  //return textDecoder.decode(arrayBuffer)

  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)

  // reference implementation
  // for (let i = 0; i < bytes.length; i++) {
  //   binary += String.fromCharCode(bytes[i])
  // }

  // optimized for large files
  const chunkSize = 0x8000; // 32k, safe for apply
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary
}

export const toArrayBuffer = (str: string): ArrayBuffer => {
  const len = str.length
  const buffer = new ArrayBuffer(len)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < len; i++) {
    view[i] = str.charCodeAt(i)
  }
  return buffer
}

export const calcChecksum = (data: ArrayBuffer | string): string => {
  let wordArray = null
  if (data instanceof ArrayBuffer) {
    wordArray = CryptoJS.lib.WordArray.create(data)
  }
  else if (typeof data === 'string') {
    wordArray = CryptoJS.enc.Latin1.parse(data)
  } else {
    throw new Error('Invalid data type for checksum calculation')
  }
  return CryptoJS.MD5(wordArray).toString()
}

export const validateChecksum = (data: ArrayBuffer | string, expected?: string): boolean => {
  if (!expected) return true
  const checksum = calcChecksum(data)
  const valid = expected === checksum
  if (!valid) {
    console.error(`Checksum mismatch! Expected: ${expected}, got: ${checksum}`)
  }
  return valid
}


export const getRemoteFirmware = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Unable to download firmware: ${response.statusText}`)
  return await response.arrayBuffer()
}

export const getLocalFirmware = async (file: File): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      if (!reader.result) {
        reject(new Error('Failed to read file'))
        return
      }
      resolve(reader.result as ArrayBuffer)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
