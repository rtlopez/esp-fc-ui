//import JSZip from "jszip"
import * as zip from "@zip.js/zip.js"
import CryptoJS from 'crypto-js'

export const isZipFile = (arrayBuffer: ArrayBuffer): boolean => {
  if (arrayBuffer.byteLength < 4) return false
  // ZIP file header: 50 4B 03 04
  return new Uint8Array(arrayBuffer.slice(0, 4)).every((byte, index) => [0x50, 0x4B, 0x03, 0x04][index] === byte)
}

export const extractZipFile = async (arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  // check if it is a zip file by checking first 4 bytes
  if (isZipFile(arrayBuffer)) {

    // const zipContent = await JSZip.loadAsync(arrayBuffer, {
    //   checkCRC32: true
    // });

    // // enumerate files
    // const files = Object.keys(zipContent.files)
    // console.log('Files in ZIP:', zipContent.files)
    // if (files.length === 0) throw new Error('ZIP archive is empty')
    // const firstFileName = files[0]

    // // extract first file from zip
    // const file = zipContent.file(firstFileName)
    // if (!file) throw new Error(`No file found ${firstFileName} in the ZIP archive`)

    // // read as ArrayBuffer
    // const extracted = await file.async('arraybuffer');

    // Utwórz ZipReader z pliku Blob
    const reader = new zip.ZipReader(new zip.BlobReader(new Blob([arrayBuffer])));
    
    const entries = await reader.getEntries();
    if (entries.length === 0) throw new Error("ZIP archive is empty")
    const entry = entries[0] as zip.FileEntry
    if(!entry || entry?.directory) throw new Error("Invalid ZIP entry")
  
    const extracted = await entry.arrayBuffer();

    await reader.close();

    //console.log(new Uint8Array(extracted).slice(0, 32));

    return extracted
  }

  return arrayBuffer
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
