import React, { useState } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeGeneratorProps {
  onGenerate: (barcode: string) => void
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onGenerate }) => {
  const [barcodeValue, setBarcodeValue] = useState('')

  const generateBarcode = () => {
    if (barcodeValue) {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, barcodeValue, { format: 'EAN13' })
      onGenerate(barcodeValue)
    }
  }

  return (
    <div className="barcode-generator">
      <input
        type="text"
        value={barcodeValue}
        onChange={(e) => setBarcodeValue(e.target.value)}
        placeholder="Enter barcode value"
      />
      <button onClick={generateBarcode}>Generate Barcode</button>
    </div>
  )
}

export default BarcodeGenerator
