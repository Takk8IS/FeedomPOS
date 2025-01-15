import JsBarcode from 'jsbarcode'

export interface BarcodeOptions {
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'EAN8' | 'CODE39' | 'ITF14'
  width?: number
  height?: number
  displayValue?: boolean
  text?: string
  fontOptions?: string
  font?: string
  textAlign?: 'center' | 'left' | 'right'
  textPosition?: 'bottom' | 'top'
  textMargin?: number
  fontSize?: number
  background?: string
  lineColor?: string
  margin?: number
}

export interface BarcodeValidationResult {
  isValid: boolean
  message?: string
}

/**
 * Generates a barcode image as a data URL
 * @param value The value to encode in the barcode
 * @param options Barcode generation options
 * @returns Data URL of the generated barcode image
 * @throws Error if the value is invalid
 */
export function generateBarcode(value: string, options: BarcodeOptions = {}): string {
  if (!validateBarcode(value)) {
    throw new Error('Invalid barcode value')
  }

  const defaultOptions: Required<BarcodeOptions> = {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    text: value,
    fontOptions: '',
    font: 'monospace',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,
    fontSize: 20,
    background: '#ffffff',
    lineColor: '#000000',
    margin: 10,
  }

  const mergedOptions = { ...defaultOptions, ...options }
  const canvas = document.createElement('canvas')

  try {
    JsBarcode(canvas, value, mergedOptions)
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Failed to generate barcode:', error)
    throw new Error('Failed to generate barcode')
  }
}

/**
 * Prints a barcode
 * @param value The value to encode in the barcode
 * @param copies Number of copies to print
 * @param options Barcode generation options
 * @returns Promise that resolves when printing is complete
 * @throws Error if printing fails
 */
export async function printBarcode(
  value: string,
  copies = 1,
  options: BarcodeOptions = {}
): Promise<void> {
  if (copies < 1) {
    throw new Error('Number of copies must be greater than 0')
  }

  const barcodeImage = generateBarcode(value, options)
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    throw new Error('Failed to open print window')
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Print Barcode</title>
        <style>
          body {
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          img {
            margin: 10px 0;
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${Array.from({ length: copies }, () => `<img src="${barcodeImage}" alt="Barcode" />`).join('')}
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()

  try {
    // Wait for images to load
    await new Promise<void>((resolve) => {
      const images = printWindow.document.getElementsByTagName('img')
      let loadedImages = 0

      const checkAllImagesLoaded = () => {
        loadedImages++
        if (loadedImages === images.length) {
          resolve()
        }
      }

      Array.from(images).forEach((img) => {
        if (img.complete) {
          checkAllImagesLoaded()
        } else {
          img.addEventListener('load', checkAllImagesLoaded)
          img.addEventListener('error', () => {
            throw new Error('Failed to load barcode image')
          })
        }
      })
    })

    await printWindow.print()
    printWindow.close()
  } catch (error) {
    printWindow.close()
    console.error('Failed to print barcode:', error)
    throw new Error('Failed to print barcode')
  }
}

/**
 * Validates a barcode value
 * @param value The value to validate
 * @returns Validation result with status and message
 */
export function validateBarcode(value: string): BarcodeValidationResult {
  if (!value || typeof value !== 'string') {
    return {
      isValid: false,
      message: 'Barcode value must be a non-empty string',
    }
  }

  // Length validation
  if (value.length < 6 || value.length > 14) {
    return {
      isValid: false,
      message: 'Barcode length must be between 6 and 14 characters',
    }
  }

  // Character validation
  if (!/^[0-9]+$/.test(value)) {
    return {
      isValid: false,
      message: 'Barcode must contain only numbers',
    }
  }

  // Check digit validation for specific formats
  if (value.length === 13) {
    try {
      const checkDigit = calculateEAN13CheckDigit(value.slice(0, 12))
      if (parseInt(value[12]) !== checkDigit) {
        return {
          isValid: false,
          message: 'Invalid EAN-13 check digit',
        }
      }
    } catch (error) {
      return {
        isValid: false,
        message: 'Failed to validate check digit',
      }
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Calculates the check digit for EAN-13 barcodes
 * @param value The first 12 digits of the barcode
 * @returns The check digit
 */
function calculateEAN13CheckDigit(value: string): number {
  if (value.length !== 12) {
    throw new Error('Value must be exactly 12 digits')
  }

  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(value[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit
}
