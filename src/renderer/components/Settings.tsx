import React, { useState, useEffect, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcRenderer } from 'electron'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'

interface Settings {
  printer_type: 'thermal' | 'dot_matrix' | 'inkjet'
  printer_name: string
  use_cash_drawer: boolean
  cash_drawer_port: string
  currency_symbol: string
  tax_rate: number
  tax_included: boolean
  receipt_header: string
  receipt_footer: string
  auto_backup: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_location: string
  language: string
  theme: 'light' | 'dark'
  guaranteeText: string
  invoiceCustomMessage: string
}

type SettingsKey = keyof Settings

const Settings: React.FC = () => {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Settings>({
    printer_type: 'thermal',
    printer_name: '',
    use_cash_drawer: false,
    cash_drawer_port: '',
    currency_symbol: '',
    tax_rate: 0,
    tax_included: false,
    receipt_header: '',
    receipt_footer: '',
    auto_backup: false,
    backup_frequency: 'daily',
    backup_location: '',
    language: 'en',
    theme: 'light',
    guaranteeText: '',
    invoiceCustomMessage: '',
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await ipcRenderer.invoke('get-settings')
        if (savedSettings) {
          setSettings(savedSettings)
        }
      } catch (error) {
        toast.error(t('settings.loadError'))
      }
    }

    loadSettings()
  }, [t])

  const handleChange = <K extends SettingsKey>(field: K, value: Settings[K]): void => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async (): Promise<void> => {
    try {
      await ipcRenderer.invoke('save-settings', settings)
      toast.success(t('settings.saveSuccess'))
    } catch (error) {
      toast.error(t('settings.saveError'))
    }
  }

  const handlePrinterTest = async (): Promise<void> => {
    try {
      await ipcRenderer.invoke('test-printer')
      toast.success(t('settings.printerTestSuccess'))
    } catch (error) {
      toast.error(t('settings.printerTestError'))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      {/* Printer Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.printer')}</h2>
        <Select
          value={settings.printer_type}
          onChange={(value) => handleChange('printer_type', value as Settings['printer_type'])}
        >
          <Select.Option value="thermal">{t('settings.thermal')}</Select.Option>
          <Select.Option value="dot_matrix">{t('settings.dotMatrix')}</Select.Option>
          <Select.Option value="inkjet">{t('settings.inkjet')}</Select.Option>
        </Select>
        <Input
          value={settings.printer_name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('printer_name', e.target.value)
          }
          placeholder={t('settings.printerName')}
        />
        <Button onClick={handlePrinterTest}>{t('settings.testPrinter')}</Button>
      </section>

      {/* Cash Drawer Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.cashDrawer')}</h2>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.use_cash_drawer}
            onChange={(e) => handleChange('use_cash_drawer', e.target.checked)}
          />
          <label>{t('settings.useCashDrawer')}</label>
        </div>
        {settings.use_cash_drawer && (
          <Input
            value={settings.cash_drawer_port}
            onChange={(e) => handleChange('cash_drawer_port', e.target.value)}
            placeholder={t('settings.cashDrawerPort')}
          />
        )}
      </section>

      {/* Tax and Currency Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.taxAndCurrency')}</h2>
        <Input
          value={settings.currency_symbol}
          onChange={(e) => handleChange('currency_symbol', e.target.value)}
          placeholder={t('settings.currencySymbol')}
        />
        <Input
          type="number"
          value={settings.tax_rate}
          onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
          placeholder={t('settings.taxRate')}
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.tax_included}
            onChange={(e) => handleChange('tax_included', e.target.checked)}
          />
          <label>{t('settings.taxIncluded')}</label>
        </div>
      </section>

      {/* Receipt Customization */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.receipt')}</h2>
        <Input
          value={settings.receipt_header}
          onChange={(e) => handleChange('receipt_header', e.target.value)}
          placeholder={t('settings.receiptHeader')}
        />
        <Input
          value={settings.receipt_footer}
          onChange={(e) => handleChange('receipt_footer', e.target.value)}
          placeholder={t('settings.receiptFooter')}
        />
      </section>

      {/* Backup Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.backup')}</h2>
        <Input
          value={settings.backup_location}
          onChange={(e) => handleChange('backup_location', e.target.value)}
          placeholder={t('settings.backupLocation')}
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.auto_backup}
            onChange={(e) => handleChange('auto_backup', e.target.checked)}
          />
          <label>{t('settings.autoBackup')}</label>
        </div>
        {settings.auto_backup && (
          <Select
            value={settings.backup_frequency}
            onChange={(value) =>
              handleChange('backup_frequency', value as Settings['backup_frequency'])
            }
          >
            <Select.Option value="daily">{t('settings.daily')}</Select.Option>
            <Select.Option value="weekly">{t('settings.weekly')}</Select.Option>
            <Select.Option value="monthly">{t('settings.monthly')}</Select.Option>
          </Select>
        )}
      </section>

      {/* App Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.appSettings')}</h2>
        <Select value={settings.language} onChange={(value) => handleChange('language', value)}>
          <Select.Option value="en">{t('settings.english')}</Select.Option>
          <Select.Option value="es">{t('settings.spanish')}</Select.Option>
          <Select.Option value="fr">{t('settings.french')}</Select.Option>
        </Select>
        <Select
          value={settings.theme}
          onChange={(value) => handleChange('theme', value as Settings['theme'])}
        >
          <Select.Option value="light">{t('settings.light')}</Select.Option>
          <Select.Option value="dark">{t('settings.dark')}</Select.Option>
        </Select>
      </section>

      {/* Guarantee Text and Invoice Custom Message */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('settings.additionalSettings')}</h2>
        <Input
          value={settings.guaranteeText}
          onChange={(e) => handleChange('guaranteeText', e.target.value)}
          placeholder={t('settings.guaranteeText')}
        />
        <Input
          value={settings.invoiceCustomMessage}
          onChange={(e) => handleChange('invoiceCustomMessage', e.target.value)}
          placeholder={t('settings.invoiceCustomMessage')}
        />
      </section>

      <div className="flex justify-end space-x-4">
        <Button onClick={() => window.location.reload()}>{t('settings.cancel')}</Button>
        <Button onClick={handleSave} variant="primary">
          {t('settings.save')}
        </Button>
      </div>
    </div>
  )
}

export default Settings
