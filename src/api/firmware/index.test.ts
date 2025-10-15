import { describe, it, expect } from 'vitest'
import { toBinaryString, toArrayBuffer, getRemoteFirmware, isZipFile, calcChecksum } from './index'

describe('firmware', () => {

  describe('toBinaryString()', () => {
    it('converts an ArrayBuffer with ASCII bytes to the correct string', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = toBinaryString(bytes.buffer)
      expect(result).toBe('Hello')
    })

    it('handles empty ArrayBuffer', () => {
      const empty = new ArrayBuffer(0)
      expect(toBinaryString(empty)).toBe('')
    })

    it('decodes extended latin1 characters correctly', () => {
      // 0xE9 = 'é' in Latin1, 0xA3 = '£'
      const bytes = new Uint8Array([0xE9, 0xA3])
      const result = toBinaryString(bytes.buffer)
      expect(result).toBe('é£')
    })

    it('binary mapping', () => {
      const bytes = new Uint8Array(256)
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = i;
      }

      const result = toBinaryString(bytes.buffer)

      expect(result.length).toBe(bytes.length)
      for (let i = 0; i < bytes.length; i++) {
        //console.log(i.toString(16), bytes[i], result.charCodeAt(i), result[i], String.fromCharCode(bytes[i]))
        expect(result.charCodeAt(i) === bytes[i]).toBe(true)
        expect(result[i] === String.fromCharCode(bytes[i])).toBe(true)
      }
    })

    it('produces reproducible results for arbitrary byte data', () => {
      const bytes = new Uint8Array([255, 0, 128])
      const result = toBinaryString(bytes.buffer)

      // Should have 3 characters
      expect(result.length).toBe(3)

      // Latin1 decodes each byte as a single char (no loss)
      const encodedBack = toArrayBuffer(result)
      expect(encodedBack.byteLength).toBe(3)

      for (let i = 0; i < 3; i++) {
        expect(new Uint8Array(encodedBack)[i]).toBe(bytes[i])
      }
    })
  })

  describe('toArrayBuffer', () => {
    it('returns an ArrayBuffer of correct length', () => {
      const str = 'ABC'
      const buffer = toArrayBuffer(str)
      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBe(3)
    })

    it('encodes ASCII characters correctly', () => {
      const str = 'ABC'
      const buffer = toArrayBuffer(str)
      const bytes = new Uint8Array(buffer)
      expect(Array.from(bytes)).toEqual([65, 66, 67]) // 'A', 'B', 'C'
    })

    it('handles empty string', () => {
      const buffer = toArrayBuffer('')
      expect(buffer.byteLength).toBe(0)
    })

    it('encodes extended Latin1 characters correctly', () => {
      const str = '\x00\xFF\x80' // binary-like string
      const buffer = toArrayBuffer(str)
      const bytes = new Uint8Array(buffer)
      expect(Array.from(bytes)).toEqual([0, 255, 128])
    })

    it('does not share buffer between calls', () => {
      const buf1 = toArrayBuffer('A')
      const buf2 = toArrayBuffer('B')
      expect(buf1).not.toBe(buf2)
      expect(new Uint8Array(buf1)[0]).toBe(65)
      expect(new Uint8Array(buf2)[0]).toBe(66)
    })
  })

  describe('calcChecksum', () => {

    it('calculates MD5 for ArrayBuffer correctly', () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 128, 64])
      const md51 = calcChecksum(bytes.buffer)
      const md52 = calcChecksum(toBinaryString(bytes.buffer))

      const expected = '6e4edbafb0cc1d3f0e2dd03519f706f2'
      expect(md51).toBe(expected)
      expect(md52).toBe(expected)
    });

    it('calculates MD5 for string correctly', () => {
      const text = 'Hello, World! 123 ñ ü €'
      const md51 = calcChecksum(text)
      const md52 = calcChecksum(toArrayBuffer(text))
      const expected = '775e4a1650e1951c78cdb2aad2b562fd'
      expect(md51).toBe(expected)
      expect(md52).toBe(expected)
    });
  })

  it('calculates MD5 for big ArrayBuffer correctly', () => {
    const bytes = new Uint8Array(4096 * 100); // 400kB
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = i >= 512 ? i & 0xff : 0xff;
    }
    const md51 = calcChecksum(bytes.buffer)
    const md52 = calcChecksum(toBinaryString(bytes.buffer))

    const expected = '7628190e002e36e3d18d254a016855ef'
    expect(md51).toBe(expected)
    expect(md52).toBe(expected)
  });

  describe('isZipFile', () => {
    it('returns true for valid ZIP file header', () => {
      const zipHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x01])
      expect(isZipFile(zipHeader.buffer)).toBe(true)
    })

    it('returns false if first byte is wrong', () => {
      const wrongHeader = new Uint8Array([0x00, 0x4B, 0x03, 0x04])
      expect(isZipFile(wrongHeader.buffer)).toBe(false)
    })

    it('returns false if last byte of header is wrong', () => {
      const wrongHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x00])
      expect(isZipFile(wrongHeader.buffer)).toBe(false)
    })

    it('returns false for buffer shorter than 4 bytes', () => {
      const shortBuffer = new Uint8Array([0x50, 0x4B])
      expect(isZipFile(shortBuffer.buffer)).toBe(false)
    })

    it('returns false for completely unrelated data', () => {
      const randomData = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      expect(isZipFile(randomData.buffer)).toBe(false)
    })
  })


  describe('getRemoteFirmware()', () => {
    it('returns an ArrayBuffer when fetch succeeds', async () => {
      const mockBuffer = new ArrayBuffer(4)
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockBuffer),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await getRemoteFirmware('https://example.com/firmware.bin')

      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBe(4)
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/firmware.bin')
    })

    it('throws an error when fetch response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        arrayBuffer: vi.fn(),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(
        getRemoteFirmware('https://example.com/missing.bin')
      ).rejects.toThrow('Unable to download firmware: Not Found')
    })

    it('throws an error when fetch rejects (network failure)', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.stubGlobal('fetch', mockFetch)

      await expect(
        getRemoteFirmware('https://example.com/firmware.bin')
      ).rejects.toThrow('Network error')
    })
  })

})