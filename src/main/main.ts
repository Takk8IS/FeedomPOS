import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import isDev from 'electron-is-dev'
import { setupDatabase, backupDatabase } from '../database/db'
import { setupPrinter } from '../utils/printer'
import { setupBarcodeScanner } from '../utils/barcodeScanner'
import { setupCashDrawer } from '../utils/cashDrawer'
import { setupIntegrations } from '../utils/integrations'
import { createUser, validateUser } from '../database/userService'
import { getSettings, updateSettings } from '../database/settingsService'
import { exportUserManual } from '../utils/userManual'
import { setupI18n } from '../utils/i18n'
import { generateFinancialReport, generateReport } from '../database/reportService'
import { createQuote, updateQuote, deleteQuote } from '../database/salesService'
import { Order, OrderStatus } from '../shared/types/order'
import { Appointment } from '../shared/types/appointment'
import { Quote } from '../shared/types/quote'
import { Refund } from '../shared/types/refund'
import { Subscription } from '../shared/types/subscription'
import { Settings } from '../shared/types/settings'
import { User, UserCredentials } from '../shared/types/user'
import { createOrder, updateOrderStatus, deleteOrder } from '../database/orderService'
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../database/appointmentService'
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '../database/subscriptionService'

let mainWindow: BrowserWindow | null = null

async function createWindow(): Promise<void> {
  try {
    await setupDatabase()
    await setupIntegrations()
    await setupI18n()

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    })

    const startUrl = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`

    await mainWindow.loadURL(startUrl)

    if (isDev) {
      mainWindow.webContents.openDevTools()
    }

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    await Promise.all([setupPrinter(), setupBarcodeScanner(), setupCashDrawer()])
  } catch (error) {
    console.error('Failed to create window:', error)
    app.quit()
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('backup-database', async () => {
  try {
    await backupDatabase()
    return { success: true, message: 'Database backup successful' }
  } catch (error) {
    console.error('Database backup failed:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-user', async (_, userData: Omit<User, 'id'>) => {
  try {
    const userId = await createUser(userData)
    return { success: true, userId }
  } catch (error) {
    console.error('User creation failed:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('validate-user', async (_, credentials: UserCredentials) => {
  try {
    const user = await validateUser(credentials.username, credentials.password)
    return { success: true, user }
  } catch (error) {
    console.error('User validation failed:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('get-settings', async () => {
  try {
    const settings = await getSettings()
    return { success: true, settings }
  } catch (error) {
    console.error('Failed to get settings:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('update-settings', async (_, settings: Settings) => {
  try {
    await updateSettings(settings)
    return { success: true, message: 'Settings updated successfully' }
  } catch (error) {
    console.error('Failed to update settings:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('export-user-manual', async () => {
  try {
    const manualPath = await exportUserManual()
    return { success: true, manualPath }
  } catch (error) {
    console.error('Failed to export user manual:', error)
    return { success: false, message: String(error) }
  }
})

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual'

ipcMain.handle('generate-report', async (_, period: ReportPeriod, params: unknown) => {
  try {
    const report = await generateReport(period, params)
    return { success: true, report }
  } catch (error) {
    console.error(`Failed to generate ${period} report:`, error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-quote', async (_, quoteData: Omit<Quote, 'id'>) => {
  try {
    const quoteId = await createQuote(quoteData)
    return { success: true, quoteId }
  } catch (error) {
    console.error('Failed to create quote:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('update-quote', async (_, quoteData: Quote) => {
  try {
    await updateQuote(quoteData)
    return { success: true, message: 'Quote updated successfully' }
  } catch (error) {
    console.error('Failed to update quote:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('delete-quote', async (_, quoteId: number) => {
  try {
    await deleteQuote(quoteId)
    return { success: true, message: 'Quote deleted successfully' }
  } catch (error) {
    console.error('Failed to delete quote:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-order', async (_, orderData: Omit<Order, 'id'>) => {
  try {
    const orderId = await createOrder(orderData)
    return { success: true, orderId }
  } catch (error) {
    console.error('Failed to create order:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('update-order-status', async (_, orderId: number, status: OrderStatus) => {
  try {
    await updateOrderStatus(orderId, status)
    return { success: true, message: 'Order status updated successfully' }
  } catch (error) {
    console.error('Failed to update order status:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('delete-order', async (_, orderId: number) => {
  try {
    await deleteOrder(orderId)
    return { success: true, message: 'Order deleted successfully' }
  } catch (error) {
    console.error('Failed to delete order:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-appointment', async (_, appointmentData: Omit<Appointment, 'id'>) => {
  try {
    const appointmentId = await createAppointment(appointmentData)
    return { success: true, appointmentId }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('update-appointment', async (_, appointmentData: Appointment) => {
  try {
    await updateAppointment(appointmentData)
    return { success: true, message: 'Appointment updated successfully' }
  } catch (error) {
    console.error('Failed to update appointment:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('delete-appointment', async (_, appointmentId: number) => {
  try {
    await deleteAppointment(appointmentId)
    return { success: true, message: 'Appointment deleted successfully' }
  } catch (error) {
    console.error('Failed to delete appointment:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-refund', async (_, refundData: Omit<Refund, 'id'>) => {
  try {
    const refundId = await createRefund(refundData)
    return { success: true, refundId }
  } catch (error) {
    console.error('Failed to create refund:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('create-subscription', async (_, subscriptionData: Omit<Subscription, 'id'>) => {
  try {
    const subscriptionId = await createSubscription(subscriptionData)
    return { success: true, subscriptionId }
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('update-subscription', async (_, subscriptionData: Subscription) => {
  try {
    await updateSubscription(subscriptionData)
    return { success: true, message: 'Subscription updated successfully' }
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return { success: false, message: String(error) }
  }
})

ipcMain.handle('delete-subscription', async (_, subscriptionId: number) => {
  try {
    await deleteSubscription(subscriptionId)
    return { success: true, message: 'Subscription deleted successfully' }
  } catch (error) {
    console.error('Failed to delete subscription:', error)
    return { success: false, message: String(error) }
  }
})
