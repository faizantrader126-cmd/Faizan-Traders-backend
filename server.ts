import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

// Interfaces
interface FileMetadata {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  category: "image" | "audio" | "video" | "document" | "other";
  notes?: string;
}

const app = express();
const PORT = 3000;

// Setup directories and DB file
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_FILE = path.join(process.cwd(), "uploads_db.json");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to read database
function readDatabase(): FileMetadata[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read database, resetting to empty:", err);
    return [];
  }
}

// Helper to write database
function writeDatabase(data: FileMetadata[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to database:", err);
  }
}

// Helper to map mimetype to category
function getCategory(mimetype: string, originalname: string): "image" | "audio" | "video" | "document" | "other" {
  const mime = mimetype.toLowerCase();
  const ext = path.extname(originalname).toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  const docExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".json", ".csv", ".rtf"];
  if (mime.startsWith("text/") || mime.includes("pdf") || mime.includes("document") || mime.includes("sheet") || mime.includes("presentation") || docExtensions.includes(ext)) {
    return "document";
  }

  return "other";
}

// Configure Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware for parsing JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all API endpoints to allow Vercel frontends to connect
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve uploaded files statically with correct headers (support content disposition & range requests)
app.use("/uploads", express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Support playing media directly in browser
    res.setHeader("Accept-Ranges", "bytes");
  }
}));

// API Routes

// 1. GET all files and system stats
app.get("/api/files", (req, res) => {
  const files = readDatabase();
  res.json(files);
});

// 2. GET general server stats
app.get("/api/stats", (req, res) => {
  const files = readDatabase();
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const categoriesCount = {
    image: files.filter(f => f.category === "image").length,
    audio: files.filter(f => f.category === "audio").length,
    video: files.filter(f => f.category === "video").length,
    document: files.filter(f => f.category === "document").length,
    other: files.filter(f => f.category === "other").length,
  };

  res.json({
    totalFiles: files.length,
    totalSize,
    categories: categoriesCount
  });
});

// 3. POST upload multiple files
app.post("/api/upload", upload.array("files"), (req, res) => {
  try {
    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const db = readDatabase();
    const newFiles: FileMetadata[] = [];

    uploadedFiles.forEach(file => {
      const metadata: FileMetadata = {
        id: Math.random().toString(36).substring(2, 11),
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        category: getCategory(file.mimetype, file.originalname),
        notes: (req.body.notes as string) || ""
      };
      newFiles.push(metadata);
      db.push(metadata);
    });

    writeDatabase(db);
    res.status(201).json({
      message: `${newFiles.length} file(s) uploaded successfully!`,
      files: newFiles
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    res.status(500).json({ error: err.message || "Something went wrong during upload" });
  }
});

// 4. POST edit file notes or originalname
app.post("/api/files/:id/edit", (req, res) => {
  const { id } = req.params;
  const { originalname, notes } = req.body;

  const db = readDatabase();
  const fileIndex = db.findIndex(f => f.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found" });
  }

  if (originalname !== undefined && originalname.trim() !== "") {
    db[fileIndex].originalname = originalname.trim();
  }
  if (notes !== undefined) {
    db[fileIndex].notes = notes.trim();
  }

  writeDatabase(db);
  res.json({ message: "File updated successfully", file: db[fileIndex] });
});

// 5. DELETE a file
app.delete("/api/files/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const fileIndex = db.findIndex(f => f.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found" });
  }

  const fileInfo = db[fileIndex];
  const filePath = path.join(UPLOADS_DIR, fileInfo.filename);

  // Delete from disk
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete file from disk: ${filePath}`, err);
  }

  // Delete from DB
  db.splice(fileIndex, 1);
  writeDatabase(db);

  res.json({ message: "File deleted successfully" });
});

// Setup Vite or production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
