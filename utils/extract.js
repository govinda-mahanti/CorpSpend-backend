// utils/extract.js
import mammoth from "mammoth";
import { createRequire } from "module";
import fs from "fs";
import Tesseract from "tesseract.js";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";


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
  } = await Tesseract.recognize(
    new Uint8Array(buffer),
    "eng",
    { logger: () => {} }
  );
  return text?.trim() || "";
};

const ocrPdfBuffer = async () => {
  throw new Error(
    "Scanned PDF detected. OCR for scanned PDFs is not supported without canvas/Docker."
  );
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
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(file.buffer),
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  text = text.trim();

  if (text.length > 20) {
    return text;
  }

  console.log("⚠️ Scanned PDF detected → OCR fallback");
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
