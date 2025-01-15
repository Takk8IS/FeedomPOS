import { ipcMain } from 'electron'

export function setupBarcodeScanner() {
  ipcMain.on('barcode-scanned', (event, barcode) => {
    // Handle the scanned barcode
    console.log('Barcode scanned:', barcode)
    // You can implement logic here to search for the product and add it to the cart
  })
}
