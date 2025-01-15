import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSettings, updateSettings } from '../../database/settingsService';
import LanguageSelector from '../components/LanguageSelector';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';

interface Settings {
  businessName: string;
  businessAddress: string;
  taxRate: number;
  currency: string;
  language: string;
  lowStockThreshold: number;
  theme: 'light' | 'dark';
  useBarcode: boolean;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    businessName: '',
    businessAddress: '',
    taxRate: 0,
    currency: 'USD',
    language: 'en',
    lowStockThreshold: 10,
    theme: 'light',
    useBarcode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(t('settings.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (name: keyof Settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettings(settings);
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-3xl font-bold">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.businessInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">{t('settings.businessName')}</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessAddress">{t('settings.businessAddress')}</Label>
            <Input
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.financialSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxRate">{t('settings.taxRate')}</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">{t('settings.currency')}</Label>
            <Select
              id="currency"
              value={settings.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
            >
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="EUR">EUR</Select.Option>
              <Select.Option value="GBP">GBP</Select.Option>
              {/* Add more currency options as needed */}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.systemSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <LanguageSelector />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">{t('settings.lowStockThreshold')}</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={settings.lowStockThreshold}
              onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">{t('settings.theme')}</Label>
            <Select
              id="theme"
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark') => handleInputChange('theme', value)}
            >
              <Select.Option value="light">{t('settings.lightTheme')}</Select.Option>
              <Select.Option value="dark">{t('settings.darkTheme')}</Select.Option>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useBarcode"
              checked={settings.useBarcode}
              onCheckedChange={(checked) => handleInputChange('useBarcode', checked)}
            />
            <Label htmlFor="useBarcode">{t('settings.useBarcode')}</Label>
          </div>
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('settings.saving') : t('settings.saveSettings')}
        </Button>
      </CardFooter>
    </form>
  );
};

export default Settings;
