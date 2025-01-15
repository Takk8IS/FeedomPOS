import { SerialPort, SerialPortOpenOptions } from 'serialport'
import { getSettings } from '../database/settingsService'

interface CashDrawerOptions {
  baudRate: number
  dataBits: 8
  stopBits: 1
  parity: 'none'
  rtscts: boolean
  xon: boolean
  xoff: boolean
  xany: boolean
}

// Comando padrão para abrir a gaveta
const OPEN_DRAWER_COMMAND = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa])

let cashDrawer: SerialPort | null = null

/**
 * Configura a gaveta de dinheiro
 * @throws Error se a configuração falhar
 */
export async function setupCashDrawer(): Promise<void> {
  try {
    const settings = await getSettings()

    if (!settings.useCashDrawer) {
      console.log('Cash drawer is disabled in settings')
      return
    }

    if (!settings.cashDrawerPort) {
      throw new Error('Cash drawer port is not configured')
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
    }

    cashDrawer = new SerialPort(options)

    cashDrawer.on('error', (error: Error) => {
      console.error('Cash drawer error:', error)
      cashDrawer = null
    })

    cashDrawer.on('open', () => {
      console.log('Cash drawer connected successfully')
    })
  } catch (error) {
    console.error('Failed to setup cash drawer:', error)
    throw new Error(
      `Failed to setup cash drawer: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Abre a gaveta de dinheiro
 * @returns Promise que resolve quando a gaveta for aberta ou rejeita se houver erro
 * @throws Error se a gaveta não estiver configurada ou se houver erro ao abrir
 */
export function openCashDrawer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!cashDrawer) {
      const error = new Error('Cash drawer is not set up')
      console.error(error)
      reject(error)
      return
    }

    if (!cashDrawer.isOpen) {
      const error = new Error('Cash drawer port is not open')
      console.error(error)
      reject(error)
      return
    }

    cashDrawer.write(OPEN_DRAWER_COMMAND, (writeError) => {
      if (writeError) {
        const error = new Error(`Failed to open cash drawer: ${writeError.message}`)
        console.error(error)
        reject(error)
        return
      }

      cashDrawer.drain((drainError) => {
        if (drainError) {
          const error = new Error(`Failed to flush cash drawer buffer: ${drainError.message}`)
          console.error(error)
          reject(error)
          return
        }

        console.log('Cash drawer opened successfully')
        resolve()
      })
    })
  })
}

/**
 * Fecha a conexão com a gaveta de dinheiro
 * @returns Promise que resolve quando a conexão for fechada
 */
export function closeCashDrawerConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!cashDrawer) {
      resolve()
      return
    }

    cashDrawer.close((error) => {
      if (error) {
        console.error('Error closing cash drawer connection:', error)
        reject(error)
        return
      }

      cashDrawer = null
      console.log('Cash drawer connection closed')
      resolve()
    })
  })
}

/**
 * Verifica se a gaveta de dinheiro está configurada e pronta
 * @returns true se a gaveta estiver pronta para uso
 */
export function isCashDrawerReady(): boolean {
  return cashDrawer !== null && cashDrawer.isOpen
}

/**
 * Reinicia a conexão com a gaveta de dinheiro
 * @returns Promise que resolve quando a gaveta for reiniciada
 */
export async function resetCashDrawer(): Promise<void> {
  await closeCashDrawerConnection()
  await setupCashDrawer()
}

// Garantir que a conexão seja fechada quando o aplicativo for encerrado
process.on('exit', () => {
  if (cashDrawer && cashDrawer.isOpen) {
    cashDrawer.close()
  }
})

process.on('SIGINT', () => {
  closeCashDrawerConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
})
