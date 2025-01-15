export type Theme = 'light' | 'dark' | 'system';
export type PrinterType = 'thermal' | 'inkjet' | 'laser';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

export interface Settings {
  id: number;
  businessName: string;
  businessAddress: string;
  taxRate: number;
  currency: string;
  language: Language;
  lowStockThreshold: number;
  theme: Theme;
  printerType: PrinterType;
  printerName: string;
  useCashDrawer: boolean;
  cashDrawerPort: string;
  receiptFooter: string;
  invoiceMessage: string;
  guarantee: string;
  supportEmail: string;
  supportPhone: string;
  createdAt: Date;
  updatedAt?: Date;
  timeZone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.';
}
