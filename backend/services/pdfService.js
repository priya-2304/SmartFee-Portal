const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const RECEIPTS_DIR = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) fs.mkdirSync(RECEIPTS_DIR, { recursive: true });

const uploadPdfToCloudinary = (doc, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', 
        folder: 'SmartFee_Receipts',
        public_id: publicId,
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    doc.pipe(uploadStream);
  });
};

const UNIVERSITY_NAME = process.env.UNIVERSITY_NAME || 'Geeta University';
const BRAND = '#1e3a8a';  
const BRAND_LIGHT = '#eff6ff';
const ACCENT = '#2563eb';

const LOGO_PATH = process.env.UNIVERSITY_LOGO_PATH
  ? path.resolve(__dirname, '..', process.env.UNIVERSITY_LOGO_PATH)
  : null;
const hasLogo = !!(LOGO_PATH && fs.existsSync(LOGO_PATH));

const PAGE_W = 595.28; 
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;


const drawHeader = (doc, tag) => {
  doc.rect(0, 0, PAGE_W, 110).fill(BRAND);

  const logoBox = 78;
  if (hasLogo) {
    doc.save();
    doc.roundedRect(MARGIN, 16, logoBox, logoBox, 8).fill('#ffffff');
    doc.image(LOGO_PATH, MARGIN + 5, 21, { fit: [logoBox - 10, logoBox - 10], align: 'center', valign: 'center' });
    doc.restore();
  }

  const textX = hasLogo ? MARGIN + logoBox + 15 : MARGIN;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
    .text(UNIVERSITY_NAME, textX, 34, { width: CONTENT_W - (hasLogo ? logoBox + 15 : 0) });
  doc.font('Helvetica').fontSize(9.5).fillColor('#c7d5f5')
    .text('Department of Accounts & Finance', textX, 60);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
    .text(tag, MARGIN, 84, { width: CONTENT_W, align: 'right' });

  doc.y = 130;
};


const drawInfoCard = (doc, rows) => {
  const startY = doc.y;
  const rowH = 26;
  const cardH = rows.length * rowH + 16;

  doc.roundedRect(MARGIN, startY, CONTENT_W, cardH, 6).strokeColor('#e2e8f0').lineWidth(1).stroke();

  rows.forEach(([label, value], i) => {
    const rowY = startY + 8 + i * rowH;
    if (i % 2 === 1) {
      doc.rect(MARGIN + 1, rowY - 4, CONTENT_W - 2, rowH).fill(BRAND_LIGHT);
    }
    doc.fillColor('#64748b').font('Helvetica').fontSize(10)
      .text(label, MARGIN + 16, rowY, { width: 170 });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10.5)
      .text(String(value ?? '-'), MARGIN + 190, rowY, { width: CONTENT_W - 210 });
  });

  doc.y = startY + cardH + 20;
};

const drawAmountBanner = (doc, label, amount) => {
  const y = doc.y;
  doc.roundedRect(MARGIN, y, CONTENT_W, 54, 6).fill(BRAND_LIGHT);
  doc.fillColor('#475569').font('Helvetica').fontSize(10).text(label, MARGIN + 16, y + 12);
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(22)
    .text(`Rs. ${Number(amount).toLocaleString('en-IN')}`, MARGIN + 16, y + 25);
  doc.y = y + 54 + 20;
};


const drawFooter = (doc, disclaimer) => {
  const y = doc.y + 10;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor('#e2e8f0').lineWidth(1).stroke();

  const sealCX = PAGE_W - MARGIN - 45;
  const sealCY = y + 55;
  const sealR = 36;

  doc.circle(sealCX, sealCY, sealR).fill('#ffffff');
  if (hasLogo) {
    const boxSize = sealR * 1.3; 
    doc.image(LOGO_PATH, sealCX - boxSize / 2, sealCY - boxSize / 2, {
      fit: [boxSize, boxSize],
      align: 'center',
      valign: 'center',
    });
  }
  doc.circle(sealCX, sealCY, sealR).lineWidth(1.5).strokeColor(BRAND).stroke();
  doc.fontSize(7).fillColor(BRAND).font('Helvetica-Bold')
    .text('OFFICIAL SEAL', sealCX - sealR, sealCY + sealR + 6, { width: sealR * 2, align: 'center' });

  doc.moveTo(MARGIN, sealCY + sealR - 10).lineTo(MARGIN + 160, sealCY + sealR - 10)
    .strokeColor('#94a3b8').lineWidth(1).stroke();
  doc.fontSize(9).fillColor('#475569').font('Helvetica')
    .text('Authorized Signatory', MARGIN, sealCY + sealR - 4);

  doc.fontSize(8.5).fillColor('#94a3b8').font('Helvetica')
    .text(disclaimer, MARGIN, sealCY + sealR + 28, { width: CONTENT_W, align: 'center' });
};

const generateReceiptPdf = async ({ receiptNumber, student, feeHead, amount, transactionId, paidAt }) => {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const uploadPromise = uploadPdfToCloudinary(doc, `receipt-${receiptNumber}`);

  drawHeader(doc, 'FEE PAYMENT RECEIPT');

  drawInfoCard(doc, [
    ['Receipt Number', receiptNumber],
    ['Student Name', student.name],
    ['Enrollment Number', student.enrollmentNo],
    ['Branch / Year', `${student.branch} / Year ${student.year}`],
    ['Fee Head', feeHead],
    ['Transaction ID', transactionId],
    ['Date & Time', new Date(paidAt).toLocaleString('en-IN')],
  ]);

  drawAmountBanner(doc, 'AMOUNT PAID', amount);

  doc.save();
  doc.rotate(-12, { origin: [PAGE_W - MARGIN - 90, doc.y - 90] });
  doc.roundedRect(PAGE_W - MARGIN - 140, doc.y - 105, 100, 32, 4)
    .lineWidth(2).strokeColor('#16a34a').stroke();
  doc.fontSize(15).fillColor('#16a34a').font('Helvetica-Bold')
    .text('PAID', PAGE_W - MARGIN - 140, doc.y - 97, { width: 100, align: 'center' });
  doc.restore();

  drawFooter(doc, 'This is a system-generated receipt and does not require a physical signature.');
  doc.end(); 

  return uploadPromise;
};

const generateBulkReceiptPdf = async ({ receiptNumber, student, items, totalAmount, transactionId, paidAt }) => {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const uploadPromise = uploadPdfToCloudinary(doc, `receipt-${receiptNumber}`);

  drawHeader(doc, 'FEE PAYMENT RECEIPT');

  drawInfoCard(doc, [
    ['Receipt Number', receiptNumber],
    ['Student Name', student.name],
    ['Enrollment Number', student.enrollmentNo],
    ['Branch / Year', `${student.branch} / Year ${student.year}`],
    ['Transaction ID', transactionId],
    ['Date & Time', new Date(paidAt).toLocaleString('en-IN')],
  ]);

  drawInfoCard(
    doc,
    items.map((item) => [item.feeHead, `Rs. ${Number(item.amount).toLocaleString('en-IN')}`])
  );

  drawAmountBanner(doc, 'TOTAL AMOUNT PAID', totalAmount);

  doc.save();
  doc.rotate(-12, { origin: [PAGE_W - MARGIN - 90, doc.y - 90] });
  doc.roundedRect(PAGE_W - MARGIN - 140, doc.y - 105, 100, 32, 4)
    .lineWidth(2).strokeColor('#16a34a').stroke();
  doc.fontSize(15).fillColor('#16a34a').font('Helvetica-Bold')
    .text('PAID', PAGE_W - MARGIN - 140, doc.y - 97, { width: 100, align: 'center' });
  doc.restore();

  drawFooter(doc, 'This is a system-generated receipt and does not require a physical signature.');
  doc.end(); 

  return uploadPromise;
};


const generateChallanPdf = async ({ student, feeHead, amount, dueDate, challanNo }) => {
  return new Promise((resolve, reject) => {
    const fileName = `challan-${challanNo}.pdf`;
    const filePath = path.join(RECEIPTS_DIR, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    drawHeader(doc, 'BANK FEE CHALLAN');

    drawInfoCard(doc, [
      ['Challan Number', challanNo],
      ['Student Name', student.name],
      ['Enrollment Number', student.enrollmentNo],
      ['Fee Head', feeHead],
      ['Due Date', new Date(dueDate).toDateString()],
    ]);

    drawAmountBanner(doc, 'AMOUNT PAYABLE', amount);

    drawFooter(doc, 'Pay at any designated bank branch and retain the stamped copy for your records.');

    doc.end();
    stream.on('finish', () => resolve(`/uploads/receipts/${fileName}`));
    stream.on('error', reject);
  });
};

module.exports = { generateReceiptPdf, generateBulkReceiptPdf, generateChallanPdf };