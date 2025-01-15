import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { toast } from './ui/toast';
import { Checkbox } from './ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const { ipcRenderer } = window.require('electron');

interface Settings {
  printer_type: 'thermal' | 'dot_matrix' | 'inkjet';
  printer_name: string;
  use_cash_drawer: boolean;
  cash_drawer_port: string;
  currency_symbol: string;
  tax_rate: number;
  tax_included: boolean;
  receipt_header: string;
  receipt_footer: string;
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_location: string;
  language: string;
  theme: 'light' | 'dark';
  guaranteeText: string;
  invoiceCustomMessage: string;
}

type SettingsKey = keyof Settings;

const Settings: React.FC = () => {
  const { t } = useTranslation();
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
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedSettings = await ipcRenderer.invoke('get-settings');
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      toast.error(t('settings.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleChange = useCallback(<K extends SettingsKey>(field: K, value: Settings[K]): void => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await ipcRenderer.invoke('save-settings', settings);
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    } finally {
      setIsLoading(false);
    }
  }, [settings, t]);

  const handlePrinterTest = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await ipcRenderer.invoke('test-printer');
      toast.success(t('settings.printerTestSuccess'));
    } catch (error) {
      toast.error(t('settings.printerTestError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.printer')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printer_type">{t('settings.printerType')}</Label>
            <Select
              id="printer_type"
              value={settings.printer_type}
              onValueChange={(value) =>
                handleChange('printer_type', value as Settings['printer_type'])
              }
              disabled={isLoading}
            >
              <Select.Option value="thermal">{t('settings.thermal')}</Select.Option>
              <Select.Option value="dot_matrix">{t('settings.dotMatrix')}</Select.Option>
              <Select.Option value="inkjet">{t('settings.inkjet')}</Select.Option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer_name">{t('settings.printerName')}</Label>
            <Input
              id="printer_name"
              value={settings.printer_name}
              onChange={(e) => handleChange('printer_name', e.target.value)}
              placeholder={t('settings.printerNamePlaceholder')}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handlePrinterTest} disabled={isLoading}>
            {t('settings.testPrinter')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.cashDrawer')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use_cash_drawer"
              checked={settings.use_cash_drawer}
              onCheckedChange={(checked) => handleChange('use_cash_drawer', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="use_cash_drawer">{t('settings.useCashDrawer')}</Label>
          </div>
          {settings.use_cash_drawer && (
            <div className="space-y-2">
              <Label htmlFor="cash_drawer_port">{t('settings.cashDrawerPort')}</Label>
              <Input
                id="cash_drawer_port"
                value={settings.cash_drawer_port}
                onChange={(e) => handleChange('cash_drawer_port', e.target.value)}
                placeholder={t('settings.cashDrawerPortPlaceholder')}
                disabled={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.taxAndCurrency')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency_symbol">{t('settings.currencySymbol')}</Label>
            <Input
              id="currency_symbol"
              value={settings.currency_symbol}
              onChange={(e) => handleChange('currency_symbol', e.target.value)}
              placeholder={t('settings.currencySymbolPlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_rate">{t('settings.taxRate')}</Label>
            <Input
              id="tax_rate"
              type="number"
              value={settings.tax_rate}
              onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
              placeholder={t('settings.taxRatePlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax_included"
              checked={settings.tax_included}
              onCheckedChange={(checked) => handleChange('tax_included', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="tax_included">{t('settings.taxIncluded')}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.receipt')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt_header">{t('settings.receiptHeader')}</Label>
            <Textarea
              id="receipt_header"
              value={settings.receipt_header}
              onChange={(e) => handleChange('receipt_header', e.target.value)}
              placeholder={t('settings.receiptHeaderPlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt_footer">{t('settings.receiptFooter')}</Label>
            <Textarea
              id="receipt_footer"
              value={settings.receipt_footer}
              onChange={(e) => handleChange('receipt_footer', e.target.value)}
              placeholder={t('settings.receiptFooterPlaceholder')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.backup')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup_location">{t('settings.backupLocation')}</Label>
            <Input
              id="backup_location"
              value={settings.backup_location}
              onChange={(e) => handleChange('backup_location', e.target.value)}
              placeholder={t('settings.backupLocationPlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_backup"
              checked={settings.auto_backup}
              onCheckedChange={(checked) => handleChange('auto_backup', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="auto_backup">{t('settings.autoBackup')}</Label>
          </div>
          {settings.auto_backup && (
            <div className="space-y-2">
              <Label htmlFor="backup_frequency">{t('settings.backupFrequency')}</Label>
              <Select
                id="backup_frequency"
                value={settings.backup_frequency}
                onValueChange={(value) =>
                  handleChange('backup_frequency', value as Settings['backup_frequency'])
                }
                disabled={isLoading}
              >
                <Select.Option value="daily">{t('settings.daily')}</Select.Option>
                <Select.Option value="weekly">{t('settings.weekly')}</Select.Option>
                <Select.Option value="monthly">{t('settings.monthly')}</Select.Option>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <Select
              id="language"
              value={settings.language}
              onValueChange={(value) => handleChange('language', value)}
              disabled={isLoading}
            >
              <Select.Option value="en">{t('settings.english')}</Select.Option>
              <Select.Option value="es">{t('settings.spanish')}</Select.Option>
              <Select.Option value="fr">{t('settings.french')}</Select.Option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">{t('settings.theme')}</Label>
            <Select
              id="theme"
              value={settings.theme}
              onValueChange={(value) => handleChange('theme', value as Settings['theme'])}
              disabled={isLoading}
            >
              <Select.Option value="light">{t('settings.light')}</Select.Option>
              <Select.Option value="dark">{t('settings.dark')}</Select.Option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.additionalSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guaranteeText">{t('settings.guaranteeText')}</Label>
            <Textarea
              id="guaranteeText"
              value={settings.guaranteeText}
              onChange={(e) => handleChange('guaranteeText', e.target.value)}
              placeholder={t('settings.guaranteeTextPlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceCustomMessage">{t('settings.invoiceCustomMessage')}</Label>
            <Textarea
              id="invoiceCustomMessage"
              value={settings.invoiceCustomMessage}
              onChange={(e) => handleChange('invoiceCustomMessage', e.target.value)}
              placeholder={t('settings.invoiceCustomMessagePlaceholder')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button onClick={() => window.location.reload()} disabled={isLoading}>
          {t('settings.cancel')}
        </Button>
        <Button onClick={handleSave} variant="primary" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
