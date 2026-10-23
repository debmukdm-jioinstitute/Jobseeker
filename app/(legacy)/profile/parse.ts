// Browser-only. The resume is read here on the user's device and never uploaded; only keywords leave this module.
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
let pdfLib: Promise<any> | undefined;
const loadPdfJs = () =>
  (pdfLib ??= new Promise((res, rej) => {
    const w = window as any;
    if (w.pdfjsLib) return res(w.pdfjsLib);
    const s = document.createElement("script");
    s.src = PDFJS + "pdf.min.js";
    s.onload = () => { w.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; res(w.pdfjsLib); };
    s.onerror = () => { pdfLib = undefined; rej(new Error("Could not load the PDF reader. Check your connection, or upload a .docx or .txt instead.")); };
    document.head.appendChild(s);
  }));

async function pdfText(buf: ArrayBuffer) {
  const pdf = await (await loadPdfJs()).getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) out += (await (await pdf.getPage(i)).getTextContent()).items.map((x: any) => x.str + (x.hasEOL ? "\n" : " ")).join("") + "\n"; // keep line breaks: the CV parser needs them
  return out;
}

// .docx is a zip; read word/document.xml via the central directory and inflate it natively.
async function docxText(buf: ArrayBuffer) {
  const u = new Uint8Array(buf), dv = new DataView(buf);
  let e = u.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("This .docx file looks damaged.");
  let p = dv.getUint32(e + 16, true);
  for (let i = dv.getUint16(e + 10, true); i > 0 && dv.getUint32(p, true) === 0x02014b50; i--) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    if (new TextDecoder().decode(u.subarray(p + 46, p + 46 + nlen)) === "word/document.xml") {
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const data = u.subarray(start, start + size);
      const xml = method === 0 ? new TextDecoder().decode(data) : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
      return xml.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'");
    }
    p += 46 + nlen + xlen + clen;
  }
  throw new Error("No text found in this .docx file.");
}

export async function readResume(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("File is over 5 MB. Upload a smaller one.");
  const name = file.name.toLowerCase();
  const text = name.endsWith(".pdf") || file.type === "application/pdf" ? await pdfText(await file.arrayBuffer())
    : name.endsWith(".docx") ? await docxText(await file.arrayBuffer())
    : /\.(txt|md|text)$/.test(name) || file.type.startsWith("text/") ? await file.text()
    : (() => { throw new Error("Upload a PDF, DOCX or TXT file (old .doc files are not supported; save as PDF or DOCX)."); })();
  if (text.trim().length < 30) throw new Error("No readable text found. If this is a scanned image, upload a text-based PDF or a DOCX.");
  return text;
}
