import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BarcodeType,
  PrinterOptions,
} from 'node-thermal-printer';
import { getSettings } from '../database/settingsService';

export interface PrinterSettings {
  printerType: '80mm' | '58mm';
  printerName: string;
  interface?: string;
  characterSet?: CharacterSet;
  removeSpecialCharacters?: boolean;
  lineCharacter?: string;
  width?: number;
  encoding?: string;
  driver?: string;
}

export interface ReceiptOptions {
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
  invert?: boolean;
  underline?: boolean;
}

export interface BarcodeOptions {
  type?: BarcodeType;
  width?: number;
  height?: number;
  position?: 'off' | 'above' | 'below' | 'both';
  includeText?: boolean;
  font?: 'A' | 'B';
}

let printer: ThermalPrinter | null = null;

/**
 * Sets up the thermal printer
 * @throws Error if setup fails
 */
export async function setupPrinter(): Promise<void> {
  try {
    const settings = await getSettings();

    const printerOptions: PrinterOptions = {
      type: settings.printerType === '80mm' ? PrinterTypes.EPSON : PrinterTypes.STAR,
      interface: `printer:${settings.printerName}`,
      characterSet: settings.characterSet || CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: settings.removeSpecialCharacters ?? false,
      lineCharacter: settings.lineCharacter || '=',
      width: settings.printerType === '80mm' ? 48 : 32,
      encoding: 'GB18030',
      driver: process.platform === 'win32' ? 'windriver' : 'printer',
    };

    printer = new ThermalPrinter(printerOptions);
    const isConnected = await printer.isPrinterConnected();

    if (!isConnected) {
      throw new Error('Printer is not connected');
    }

    console.log('Printer setup completed successfully');
  } catch (error) {
    console.error('Failed to setup printer:', error);
    throw new Error(
      `Failed to setup printer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Prints a receipt
 * @param content Receipt content
 * @param options Formatting options
 * @throws Error if printing fails
 */
export async function printReceipt(content: string, options: ReceiptOptions = {}): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized');
  }

  try {
    await ensurePrinterConnection();

    applyReceiptOptions(options);

    printer.println(content);

    // Reset formatting
    resetFormatting();

    printer.cut();
    await printer.execute();

    console.log('Receipt printed successfully');
  } catch (error) {
    console.error('Failed to print receipt:', error);
    throw new Error(
      `Failed to print receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Prints a barcode
 * @param barcode Barcode content
 * @param options Barcode options
 * @throws Error if printing fails
 */
export async function printBarcode(barcode: string, options: BarcodeOptions = {}): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized');
  }

  try {
    await ensurePrinterConnection();

    printer.alignCenter();

    printer.printBarcode(barcode, options.type || BarcodeType.EAN13, {
      width: options.width || 2,
      height: options.height || 100,
      position: options.position || 'below',
      includeText: options.includeText ?? true,
      font: options.font || 'A',
    });

    printer.cut();
    await printer.execute();

    console.log('Barcode printed successfully');
  } catch (error) {
    console.error('Failed to print barcode:', error);
    throw new Error(
      `Failed to print barcode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Ensures printer connection
 * @throws Error if printer is not connected
 */
async function ensurePrinterConnection(): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized');
  }

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error('Printer is not connected');
    }
  } catch (error) {
    console.error('Printer connection check failed:', error);
    throw new Error(
      `Printer connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Applies receipt formatting options
 * @param options Formatting options
 */
function applyReceiptOptions(options: ReceiptOptions): void {
  if (!printer) return;

  switch (options.align) {
    case 'left':
      printer.alignLeft();
      break;
    case 'center':
      printer.alignCenter();
      break;
    case 'right':
      printer.alignRight();
      break;
  }

  if (options.bold) printer.bold(true);
  if (options.doubleHeight) printer.setTextDoubleHeight();
  if (options.doubleWidth) printer.setTextDoubleWidth();
  if (options.invert) printer.invert(true);
  if (options.underline) printer.underline(true);
}

/**
 * Resets printer formatting
 */
function resetFormatting(): void {
  if (!printer) return;

  printer.bold(false);
  printer.setTextNormal();
  printer.invert(false);
  printer.underline(false);
  printer.alignLeft();
}

/**
 * Resets the printer
 * @throws Error if reset fails
 */
export async function resetPrinter(): Promise<void> {
  try {
    if (printer) {
      await printer.clear();
    }
    await setupPrinter();
  } catch (error) {
    console.error('Failed to reset printer:', error);
    throw new Error(
      `Failed to reset printer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Checks if the printer is ready
 * @returns true if the printer is ready for use
 */
export async function isPrinterReady(): Promise<boolean> {
  try {
    if (!printer) {
      return false;
    }
    return await printer.isPrinterConnected();
  } catch (error) {
    console.error('Printer status check failed:', error);
    return false;
  }
}

/**
 * Prints a test page
 * @throws Error if printing fails
 */
export async function printTestPage(): Promise<void> {
  try {
    if (!printer) {
      throw new Error('Printer is not initialized');
    }

    await ensurePrinterConnection();

    printer.alignCenter();
    printer.println('Test Page');
    printer.drawLine();

    printer.alignLeft();
    printer.println('Normal text');
    printer.bold(true);
    printer.println('Bold text');
    printer.bold(false);
    printer.setTextDoubleHeight();
    printer.println('Double height text');
    printer.setTextDoubleWidth();
    printer.println('Double width text');
    printer.setTextNormal();
    printer.invert(true);
    printer.println('Inverted text');
    printer.invert(false);
    printer.underline(true);
    printer.println('Underlined text');
    printer.underline(false);

    printer.drawLine();

    printer.alignCenter();
    printer.printBarcode('1234567890128', BarcodeType.EAN13);

    printer.cut();
    await printer.execute();

    console.log('Test page printed successfully');
  } catch (error) {
    console.error('Failed to print test page:', error);
    throw new Error(
      `Failed to print test page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Clear resources when the app is closed
process.on('exit', () => {
  if (printer) {
    printer.clear().catch(console.error);
  }
});

export type { PrinterSettings, ReceiptOptions, BarcodeOptions };
