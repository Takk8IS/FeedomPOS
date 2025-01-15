import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { getSettings } from '../database/settingsService';
import { app } from 'electron';

interface CashDrawerOptions {
  baudRate: number;
  dataBits: 8;
  stopBits: 1;
  parity: 'none';
  rtscts: boolean;
  xon: boolean;
  xoff: boolean;
  xany: boolean;
}

// Standard command to open the drawer
const OPEN_DRAWER_COMMAND = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

let cashDrawer: SerialPort | null = null;

/**
 * Sets up the cash drawer
 * @throws Error if the setup fails
 */
export async function setupCashDrawer(): Promise<void> {
  try {
    const settings = await getSettings();

    if (!settings.useCashDrawer) {
      console.log('Cash drawer is disabled in settings');
      return;
    }

    if (!settings.cashDrawerPort) {
      throw new Error('Cash drawer port is not configured');
    }

    const options: SerialPortOpenOptions<CashDrawerOptions> = {
      path: settings.cashDrawerPort,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      rtscts: false,
      xon: false,
      xoff: false,
      xany: false,
    };

    cashDrawer = new SerialPort(options);

    cashDrawer.on('error', (error: Error) => {
      console.error('Cash drawer error:', error);
      cashDrawer = null;
    });

    cashDrawer.on('open', () => {
      console.log('Cash drawer connected successfully');
    });
  } catch (error) {
    console.error('Failed to setup cash drawer:', error);
    throw new Error(
      `Failed to setup cash drawer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Opens the cash drawer
 * @returns Promise that resolves when the drawer is opened or rejects if there's an error
 * @throws Error if the drawer is not set up or if there's an error opening it
 */
export function openCashDrawer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!cashDrawer) {
      reject(new Error('Cash drawer is not set up'));
      return;
    }

    if (!cashDrawer.isOpen) {
      reject(new Error('Cash drawer port is not open'));
      return;
    }

    cashDrawer.write(OPEN_DRAWER_COMMAND, (writeError) => {
      if (writeError) {
        reject(new Error(`Failed to open cash drawer: ${writeError.message}`));
        return;
      }

      cashDrawer.drain((drainError) => {
        if (drainError) {
          reject(new Error(`Failed to flush cash drawer buffer: ${drainError.message}`));
          return;
        }

        console.log('Cash drawer opened successfully');
        resolve();
      });
    });
  });
}

/**
 * Closes the connection to the cash drawer
 * @returns Promise that resolves when the connection is closed
 */
export function closeCashDrawerConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!cashDrawer) {
      resolve();
      return;
    }

    cashDrawer.close((error) => {
      if (error) {
        console.error('Error closing cash drawer connection:', error);
        reject(error);
        return;
      }

      cashDrawer = null;
      console.log('Cash drawer connection closed');
      resolve();
    });
  });
}

/**
 * Checks if the cash drawer is set up and ready
 * @returns true if the drawer is ready for use
 */
export function isCashDrawerReady(): boolean {
  return cashDrawer !== null && cashDrawer.isOpen;
}

/**
 * Resets the connection to the cash drawer
 * @returns Promise that resolves when the drawer is reset
 */
export async function resetCashDrawer(): Promise<void> {
  await closeCashDrawerConnection();
  await setupCashDrawer();
}

// Ensure the connection is closed when the app is about to quit
app.on('before-quit', () => {
  if (cashDrawer && cashDrawer.isOpen) {
    cashDrawer.close();
  }
});
