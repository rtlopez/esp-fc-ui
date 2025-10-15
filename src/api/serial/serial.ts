
export const SERIAL_FILTERS = [
  // Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
  // the IDs will be labeled `vid` and `pid`, respectively
  { usbVendorId: 0x1a86, usbProductId: 0x7523 }, // USB Serial
  { usbVendorId: 0x10c4, usbProductId: 0xea60 }, // USB Serial CP2104
  { usbVendorId: 0x303a, usbProductId: 0x0002 }, // Jtag/serial esp32-s2 soala
  { usbVendorId: 0x303a, usbProductId: 0x1001 }, // Jtag/serial
  { usbVendorId: 0x2e8a, usbProductId: 0x000f }, // RPI Pico
]
