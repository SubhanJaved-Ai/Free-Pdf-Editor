import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import { exportEditedPdf } from './src/utils/pdfExporter';
import { EditorElement } from './src/store/useEditorStore';

async function testExporter() {
  // 1. Create a blank PDF as input
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  const pdfBytes = await doc.save();

  // 2. Mock elements
  const elements: EditorElement[] = [
    {
      id: 'test-shape-1',
      pageIndex: 0,
      type: 'shape',
      shapeType: 'rect',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      fillColor: '#ff0000',
      strokeColor: '#000000',
      strokeWidth: 2
    },
    {
      id: 'test-shape-2',
      pageIndex: 0,
      type: 'shape',
      shapeType: 'star',
      x: 30,
      y: 30,
      width: 20,
      height: 20,
      rotation: 45,
      opacity: 0.8,
      fillColor: '#00ff00',
      strokeColor: '#0000ff',
      strokeWidth: 4
    }
  ];

  const pageOrders = [0];
  const pageDimensions = [{ width: 595, height: 842 }];

  try {
    console.log("Calling exportEditedPdf...");
    const resultBytes = await exportEditedPdf(
      pdfBytes,
      elements,
      pageOrders,
      pageDimensions,
      { fileName: 'test.pdf', optimizeSize: false }
    );
    
    fs.writeFileSync('test_output_exporter.pdf', resultBytes);
    console.log("PDF saved successfully, size:", resultBytes.length);
  } catch (err) {
    console.error("Export Failed:", err);
  }
}

testExporter();
