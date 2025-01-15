import { ipcMain, IpcMainEvent } from 'electron';

export function setupBarcodeScanner(): void {
  ipcMain.on('barcode-scanned', (event: IpcMainEvent, barcode: string) => {
    // Handle the scanned barcode
    console.log('Barcode scanned:', barcode);
    // TODO: Implement logic here to search for the product and add it to the cart
    // This should be done by sending a message back to the renderer process
    event.reply('barcode-processed', { barcode, success: true });
  });
}

export function removeBarcodeListener(): void {
  ipcMain.removeAllListeners('barcode-scanned');
}

// Ensure the listener is removed when the app is about to quit
app.on('before-quit', removeBarcodeListener);
