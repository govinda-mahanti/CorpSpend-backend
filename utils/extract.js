// utils/extract.js
import mammoth from "mammoth";
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";
import Tesseract from "tesseract.js";
import pdfPoppler from "pdf-poppler";

const require = createRequire(import.meta.url);

/* =========================================================
   pdf-parse (safe loader)
   ========================================================= */
const pdfParseModule = require("pdf-parse");
const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;

/* =========================================================
   Helpers
   ========================================================= */
const isPdf = (file) => file.mimetype === "application/pdf";
const isImage = (file) => file.mimetype.startsWith("image/");

/* =========================================================
   OCR helpers (INLINE)
   ========================================================= */

// OCR image buffer
const ocrImageBuffer = async (buffer) => {
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });
  return text?.trim() || "";
};

// OCR PDF buffer → PDF → images → OCR
const ocrPdfBuffer = async (buffer) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");

  fs.writeFileSync(pdfPath, buffer);

  // ✅ CORRECT API
  await pdfPoppler.convert(pdfPath, {
    format: "png",
    out_dir: tempDir,
    out_prefix: "page",
    page: null,
  });

  const imageFiles = fs
    .readdirSync(tempDir)
    .filter((f) => f.endsWith(".png"));

  let fullText = "";

  for (const img of imageFiles) {
    const {
      data: { text },
    } = await Tesseract.recognize(
      path.join(tempDir, img),
      "eng",
      { logger: () => {} }
    );

    fullText += "\n" + text;
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  return fullText.trim();
};

/* =========================================================
   MAIN: Extract text from PDF / Image / DOCX
   ========================================================= */
export const extractReceiptText = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file input");
  }

  // ---------- PDF ----------
  if (isPdf(file)) {
    let text = "";

    try {
      const data = await pdfParse(file.buffer);
      text = data.text?.trim() || "";
    } catch {}

    if (text && text.length > 10) {
      return text;
    }

    console.log("⚠️ No text found in PDF, running OCR...");
    return await ocrPdfBuffer(file.buffer);
  }

  // ---------- IMAGE ----------
  if (isImage(file)) {
    console.log("🖼 Image detected, running OCR...");
    return await ocrImageBuffer(file.buffer);
  }

  // ---------- DOCX ----------
  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return result.value?.trim() || "";
  }

  throw new Error("Unsupported file type");
};

/* =========================================================
   Receipt Response Schema
   ========================================================= */
export const receiptResponseSchema = {
  category: "Other",              
  description: null,             
  amountOriginal: null,          
  currencyOriginal: null,         
  amountConverted: null,          
  dateIncurred: null,             
  receiptUrl: null,             
  merchantName: null,
  paymentMethod: null,
  subtotal: null,
  taxAmount: null,
  items: []
};


/* =========================================================
   LLM Helpers
   ========================================================= */
export const extractLLMText = (response) => {
  if (response?.choices?.[0]?.message?.content) {
    return response.choices[0].message.content;
  }
  if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  return null;
};

export const formatGroqResponse = (llmResponse, schema) => {
  let rawText = extractLLMText(llmResponse);

  if (!rawText) {
    throw new Error("Empty response from LLM");
  }

  rawText = rawText
    .replace(/```json|```/g, "")
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .trim();

  const parsed = JSON.parse(rawText);

  const formatted = {};
  for (const key of Object.keys(schema)) {
    formatted[key] = parsed[key] ?? schema[key];
  }

  return formatted;
};
