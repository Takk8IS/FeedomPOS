export type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'EAN8' | 'CODE39' | 'ITF14';

export interface BarcodeOptions {
  format?: BarcodeFormat;
  // ... (rest of the interface remains unchanged)
}

interface BarcodeValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Calculates the check digit for EAN-13 barcodes
 * @param value The first 12 digits of the barcode
 * @returns The check digit
 */
function calculateEAN13CheckDigit(value: string): number {
  if (value.length !== 12) {
    throw new Error('Value must be exactly 12 digits');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(value[i]);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * Calculates the check digit for UPC barcodes
 * @param value The first 11 digits of the barcode
 * @returns The check digit
 */
function calculateUPCCheckDigit(value: string): number {
  if (value.length !== 11) {
    throw new Error('Value must be exactly 11 digits');
  }

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(value[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * Generates a random barcode value
 * @param format The barcode format to generate
 * @returns A valid random barcode value
 */
export function generateRandomBarcode(format: BarcodeFormat = 'EAN13'): string {
  let value: string;
  switch (format) {
    case 'EAN13':
      value = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      const checkDigit = calculateEAN13CheckDigit(value);
      value += checkDigit;
      break;
    case 'UPC':
      value = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
      const upcCheckDigit = calculateUPCCheckDigit(value);
      value += upcCheckDigit;
      break;
    default:
      value = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  }
  return value;
}

export function validateBarcode(
  value: string,
  format: BarcodeFormat = 'CODE128',
): BarcodeValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      isValid: false,
      message: 'Barcode value must be a non-empty string',
    };
  }

  // Character validation
  if (!/^[0-9]+$/.test(value)) {
    return {
      isValid: false,
      message: 'Barcode must contain only numbers',
    };
  }

  // Format-specific validation
  switch (format) {
    case 'EAN13':
      if (value.length !== 13) {
        return {
          isValid: false,
          message: 'EAN-13 barcode must be exactly 13 digits',
        };
      }
      try {
        const checkDigit = calculateEAN13CheckDigit(value.slice(0, 12));
        if (parseInt(value[12]) !== checkDigit) {
          return {
            isValid: false,
            message: 'Invalid EAN-13 check digit',
          };
        }
      } catch (error) {
        return {
          isValid: false,
          message: 'Failed to validate check digit',
        };
      }
      break;
    case 'UPC':
      if (value.length !== 12) {
        return {
          isValid: false,
          message: 'UPC barcode must be exactly 12 digits',
        };
      }
      try {
        const checkDigit = calculateUPCCheckDigit(value.slice(0, 11));
        if (parseInt(value[11]) !== checkDigit) {
          return {
            isValid: false,
            message: 'Invalid UPC check digit',
          };
        }
      } catch (error) {
        return {
          isValid: false,
          message: 'Failed to validate check digit',
        };
      }
      break;
    default:
      if (value.length < 6 || value.length > 14) {
        return {
          isValid: false,
          message: 'Barcode length must be between 6 and 14 characters',
        };
      }
  }

  return {
    isValid: true,
  };
}
