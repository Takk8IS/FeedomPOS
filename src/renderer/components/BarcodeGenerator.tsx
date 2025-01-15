import React, { useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from './ui/toast';
import { useTranslation } from 'react-i18next';

interface BarcodeGeneratorProps {
  onGenerate: (barcode: string) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onGenerate }) => {
  const [barcodeValue, setBarcodeValue] = useState('');
  const { t } = useTranslation();

  const generateBarcode = () => {
    if (barcodeValue) {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, barcodeValue, { format: 'EAN13' });
        onGenerate(barcodeValue);
        toast.success(t('barcodeGenerator.success'));
      } catch (error) {
        console.error('Error generating barcode:', error);
        toast.error(t('barcodeGenerator.error'));
      }
    } else {
      toast.error(t('barcodeGenerator.emptyValue'));
    }
  };

  return (
    <div className="barcode-generator space-y-4">
      <Input
        value={barcodeValue}
        onChange={setBarcodeValue}
        placeholder={t('barcodeGenerator.placeholder')}
      />
      <Button onClick={generateBarcode}>{t('barcodeGenerator.generate')}</Button>
    </div>
  );
};

export default BarcodeGenerator;
