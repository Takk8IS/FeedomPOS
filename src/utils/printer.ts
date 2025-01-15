import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BarcodeType,
  PrinterOptions,
} from 'node-thermal-printer'
import { getSettings } from '../database/settingsService'

interface PrinterSettings {
  printerType: '80mm' | '58mm'
  printerName: string
  interface?: string
  characterSet?: CharacterSet
  removeSpecialCharacters?: boolean
  lineCharacter?: string
  width?: number
  encoding?: string
  driver?: string
}

interface ReceiptOptions {
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  doubleHeight?: boolean
  doubleWidth?: boolean
  invert?: boolean
  underline?: boolean
}

interface BarcodeOptions {
  type?: BarcodeType
  width?: number
  height?: number
  position?: 'off' | 'above' | 'below' | 'both'
  includeText?: boolean
  font?: 'A' | 'B'
}

let printer: ThermalPrinter | null = null

/**
 * Configura a impressora térmica
 * @throws Error se a configuração falhar
 */
export async function setupPrinter(): Promise<void> {
  try {
    const settings = await getSettings()

    const printerOptions: PrinterOptions = {
      type: settings.printerType === '80mm' ? PrinterTypes.EPSON : PrinterTypes.STAR,
      interface: `printer:${settings.printerName}`,
      characterSet: settings.characterSet || CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: settings.removeSpecialCharacters ?? false,
      lineCharacter: settings.lineCharacter || '=',
      width: settings.printerType === '80mm' ? 48 : 32,
      encoding: 'GB18030',
      driver: process.platform === 'win32' ? 'windriver' : 'printer',
    }

    printer = new ThermalPrinter(printerOptions)
    await printer.isPrinterConnected()

    console.log('Printer setup completed successfully')
  } catch (error) {
    console.error('Failed to setup printer:', error)
    throw new Error('Failed to setup printer')
  }
}

/**
 * Imprime um recibo
 * @param content Conteúdo do recibo
 * @param options Opções de formatação
 * @throws Error se a impressão falhar
 */
export async function printReceipt(content: string, options: ReceiptOptions = {}): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized')
  }

  try {
    await ensurePrinterConnection()

    switch (options.align) {
      case 'left':
        printer.alignLeft()
        break
      case 'center':
        printer.alignCenter()
        break
      case 'right':
        printer.alignRight()
        break
    }

    if (options.bold) printer.bold(true)
    if (options.doubleHeight) printer.setTextDoubleHeight()
    if (options.doubleWidth) printer.setTextDoubleWidth()
    if (options.invert) printer.invert(true)
    if (options.underline) printer.underline(true)

    printer.println(content)

    // Reset formatting
    printer.bold(false)
    printer.setTextNormal()
    printer.invert(false)
    printer.underline(false)

    printer.cut()
    await printer.execute()

    console.log('Receipt printed successfully')
  } catch (error) {
    console.error('Failed to print receipt:', error)
    throw new Error('Failed to print receipt')
  }
}

/**
 * Imprime um código de barras
 * @param barcode Código de barras
 * @param options Opções do código de barras
 * @throws Error se a impressão falhar
 */
export async function printBarcode(barcode: string, options: BarcodeOptions = {}): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized')
  }

  try {
    await ensurePrinterConnection()

    printer.alignCenter()

    printer.printBarcode(barcode, options.type || BarcodeType.EAN13, {
      width: options.width || 2,
      height: options.height || 100,
      position: options.position || 'below',
      includeText: options.includeText ?? true,
      font: options.font || 'A',
    })

    printer.cut()
    await printer.execute()

    console.log('Barcode printed successfully')
  } catch (error) {
    console.error('Failed to print barcode:', error)
    throw new Error('Failed to print barcode')
  }
}

/**
 * Verifica a conexão com a impressora
 * @throws Error se a impressora não estiver conectada
 */
async function ensurePrinterConnection(): Promise<void> {
  if (!printer) {
    throw new Error('Printer is not initialized')
  }

  try {
    const isConnected = await printer.isPrinterConnected()
    if (!isConnected) {
      throw new Error('Printer is not connected')
    }
  } catch (error) {
    console.error('Printer connection check failed:', error)
    throw new Error('Printer connection check failed')
  }
}

/**
 * Reinicia a impressora
 * @throws Error se a reinicialização falhar
 */
export async function resetPrinter(): Promise<void> {
  try {
    if (printer) {
      await printer.clear()
    }
    await setupPrinter()
  } catch (error) {
    console.error('Failed to reset printer:', error)
    throw new Error('Failed to reset printer')
  }
}

/**
 * Verifica se a impressora está pronta
 * @returns true se a impressora estiver pronta para uso
 */
export async function isPrinterReady(): Promise<boolean> {
  try {
    if (!printer) {
      return false
    }
    return await printer.isPrinterConnected()
  } catch (error) {
    console.error('Printer status check failed:', error)
    return false
  }
}

// Limpa recursos quando o aplicativo é fechado
process.on('exit', () => {
  if (printer) {
    printer.clear().catch(console.error)
  }
})

export type { PrinterSettings, ReceiptOptions, BarcodeOptions }
