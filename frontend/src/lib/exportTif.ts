import html2canvas from 'html2canvas'

/** Write a minimal uncompressed TIFF from an ImageData (24-bit RGB) */
function imageDataToTiff(imageData: ImageData): ArrayBuffer {
  const { width, height, data } = imageData
  const rowBytes = width * 3
  const padBytes = (4 - (rowBytes % 4)) % 4
  const stripBytes = (rowBytes + padBytes) * height

  const IFD_ENTRIES = 11
  const headerSize = 8
  const ifdSize = 2 + IFD_ENTRIES * 12 + 4
  const dataOffset = headerSize + ifdSize
  const totalSize = dataOffset + stripBytes

  const buf = new ArrayBuffer(totalSize)
  const view = new DataView(buf)
  let off = 0

  // TIFF header (little-endian)
  view.setUint16(off, 0x4949, true); off += 2  // 'II' = little endian
  view.setUint16(off, 42, true); off += 2       // magic
  view.setUint32(off, 8, true); off += 4        // IFD offset

  // IFD entry count
  view.setUint16(off, IFD_ENTRIES, true); off += 2

  function writeIFDEntry(tag: number, type: number, count: number, value: number) {
    view.setUint16(off, tag, true); off += 2
    view.setUint16(off, type, true); off += 2
    view.setUint32(off, count, true); off += 4
    view.setUint32(off, value, true); off += 4
  }

  writeIFDEntry(256, 4, 1, width)              // ImageWidth
  writeIFDEntry(257, 4, 1, height)             // ImageLength
  writeIFDEntry(258, 3, 1, 8)                  // BitsPerSample = 8
  writeIFDEntry(259, 3, 1, 1)                  // Compression = none
  writeIFDEntry(262, 3, 1, 2)                  // PhotometricInterpretation = RGB
  writeIFDEntry(273, 4, 1, dataOffset)         // StripOffsets
  writeIFDEntry(277, 3, 1, 3)                  // SamplesPerPixel = 3
  writeIFDEntry(278, 4, 1, height)             // RowsPerStrip
  writeIFDEntry(279, 4, 1, stripBytes)         // StripByteCounts
  writeIFDEntry(282, 5, 1, dataOffset - 8)     // XResolution (placeholder)
  writeIFDEntry(283, 5, 1, dataOffset - 8)     // YResolution (placeholder)

  view.setUint32(off, 0, true)  // Next IFD = 0 (no more IFDs)

  // Pixel data — RGBA → RGB row by row
  let pixOff = dataOffset
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      view.setUint8(pixOff++, data[src])
      view.setUint8(pixOff++, data[src + 1])
      view.setUint8(pixOff++, data[src + 2])
    }
    pixOff += padBytes
  }

  return buf
}

export async function exportFigureAsTif(figureId: string, figureNumber: number): Promise<void> {
  const el = document.querySelector(`[data-figure-id="${figureId}"]`) as HTMLElement | null
  if (!el) {
    alert('Figure not found in document. Please insert the figure first.')
    return
  }

  const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const tiffBuf = imageDataToTiff(imageData)

  const blob = new Blob([tiffBuf], { type: 'image/tiff' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Figure_${figureNumber}.tif`
  a.click()
  URL.revokeObjectURL(url)
}
