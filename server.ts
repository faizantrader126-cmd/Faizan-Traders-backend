import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PRODUCTS, BANNER_SLIDES } from "./src/data";
import { Product, Order, BannerSlide, LayoutConfig } from "./src/types";

// Database storage file
const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  products: Product[];
  slides: BannerSlide[];
  orders: Order[];
  inquiries: {
    id: string;
    name: string;
    phone: string;
    message: string;
    created_at: string;
  }[];
  customLogo: string;
  layout?: LayoutConfig;
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

// Read database or initialize with seed data
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      // Ensure layout exists
      if (!db.layout) {
        db.layout = {
          showSlider: true,
          showCategories: true,
          showFlashSale: true,
          showTrending: true,
          showReviews: true,
          showInquiry: true,
          showFooter: true
        };
        writeDb(db);
      }
      return db;
    }
  } catch (err) {
    console.error("Error reading db.json, recreating...", err);
  }

  // Seed default data
  const defaultDb: DatabaseSchema = {
    products: PRODUCTS,
    slides: BANNER_SLIDES,
    orders: [],
    inquiries: [],
    customLogo: "",
    layout: {
      showSlider: true,
      showCategories: true,
      showFlashSale: true,
      showTrending: true,
      showReviews: true,
      showInquiry: true,
      showFooter: true
    }
  };
  writeDb(defaultDb);
  return defaultDb;
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow Cross-Origin Resource Sharing (CORS) for external frontends like Vercel
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware with large limits for base64 / image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads directory if it doesn't exist
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve uploads directory statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API Routes: Products
  app.get("/api/products", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.products });
  });

  app.post("/api/products", (req, res) => {
    try {
      const db = readDb();
      const newProduct = req.body as Product;
      
      if (!newProduct.id) {
        newProduct.id = "prod_" + Date.now();
      }
      
      // Check if product exists to update it, or add as new
      const index = db.products.findIndex(p => p.id === newProduct.id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...newProduct };
      } else {
        db.products.push(newProduct);
      }
      
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const updatedProduct = req.body as Product;
      
      const index = db.products.findIndex(p => p.id === id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...updatedProduct };
        writeDb(db);
        res.json({ success: true, data: db.products });
      } else {
        res.status(404).json({ success: false, error: "Product not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      
      db.products = db.products.filter(p => p.id !== id);
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bulk overwrite/push products (for restore default or manual upload syncs)
  app.post("/api/products/bulk", (req, res) => {
    try {
      const db = readDb();
      const updatedList = req.body as Product[];
      db.products = updatedList;
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Slides
  app.get("/api/slides", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.slides });
  });

  app.post("/api/slides", (req, res) => {
    try {
      const db = readDb();
      db.slides = req.body as BannerSlide[];
      writeDb(db);
      res.json({ success: true, data: db.slides });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Orders
  app.get("/api/orders", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.orders });
  });

  app.post("/api/orders", (req, res) => {
    try {
      const db = readDb();
      const newOrder = req.body as Order;
      if (!newOrder.id) {
        newOrder.id = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      }
      
      // Push order
      db.orders.unshift(newOrder); // Newest orders first
      writeDb(db);
      res.json({ success: true, data: newOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/orders/:id/status", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const { status } = req.body as { status: Order["status"] };
      
      const index = db.orders.findIndex(o => o.id === id);
      if (index > -1) {
        db.orders[index].status = status;
        writeDb(db);
        res.json({ success: true, data: db.orders[index] });
      } else {
        res.status(404).json({ success: false, error: "Order not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/orders/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      db.orders = db.orders.filter(o => o.id !== id);
      writeDb(db);
      res.json({ success: true, data: db.orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Inquiries / Appointments
  app.get("/api/inquiries", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.inquiries });
  });

  app.delete("/api/inquiries/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      db.inquiries = db.inquiries.filter(i => i.id !== id);
      writeDb(db);
      res.json({ success: true, data: db.inquiries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/inquiries", (req, res) => {
    try {
      const db = readDb();
      const newInquiry = req.body as { name: string; phone: string; message: string };
      const created = {
        id: "inq_" + Date.now(),
        ...newInquiry,
        created_at: new Date().toISOString()
      };
      
      db.inquiries.unshift(created);
      writeDb(db);
      res.json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Custom Store Logo & Config
  app.get("/api/logo", (req, res) => {
    const db = readDb();
    res.json({ success: true, logo: db.customLogo });
  });

  app.post("/api/logo", (req, res) => {
    try {
      const db = readDb();
      db.customLogo = req.body.logo || "";
      writeDb(db);
      res.json({ success: true, logo: db.customLogo });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Layout Config setting toggle switches
  app.get("/api/layout", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.layout });
  });

  app.post("/api/layout", (req, res) => {
    try {
      const db = readDb();
      db.layout = { ...db.layout, ...req.body } as LayoutConfig;
      writeDb(db);
      res.json({ success: true, data: db.layout });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Supabase Configuration (to make custom Supabase persistent for all visitors)
  app.get("/api/supabase-config", (req, res) => {
    const db = readDb();
    res.json({
      success: true,
      url: db.supabaseConfig?.url || "",
      anonKey: db.supabaseConfig?.anonKey || ""
    });
  });

  app.post("/api/supabase-config", (req, res) => {
    try {
      const db = readDb();
      const { url, anonKey } = req.body;
      db.supabaseConfig = {
        url: url ? url.trim() : "",
        anonKey: anonKey ? anonKey.trim() : ""
      };
      writeDb(db);
      res.json({ success: true, data: db.supabaseConfig });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Image uploader (handles base64 image strings and writes locally)
  app.post("/api/upload", (req, res) => {
    try {
      const { image, filename } = req.body as { image: string; filename?: string };
      if (!image) {
        return res.status(400).json({ success: false, error: "No image content provided" });
      }

      // If it's a data URL, strip header and save binary data
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // Assume already uploaded URL or format we can't parse directly
        return res.json({ success: true, url: image });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      const extension = mimeType.split("/")[1] || "png";
      const fileId = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const name = filename ? `${fileId}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}` : `${fileId}.${extension}`;
      const filePath = path.join(UPLOADS_DIR, name);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${name}`;
      res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite Dev Server middleware or production static build serving
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
