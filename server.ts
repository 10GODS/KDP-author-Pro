import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import epub from "epub-gen-memory";
import path from "path";

const db = new Database("ebooks.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  const PORT = 3000;

  // API Routes
  app.get("/api/books", (req, res) => {
    const books = db.prepare("SELECT * FROM books ORDER BY created_at DESC").all();
    res.json(books);
  });

  app.post("/api/books", (req, res) => {
    const { title, author } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO books (id, title, author) VALUES (?, ?, ?)").run(id, title || "Untitled Book", author || "Anonymous");
    res.json({ id, title, author });
  });

  app.get("/api/books/:id", (req, res) => {
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const chapters = db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index ASC").all(req.params.id);
    res.json({ ...book, chapters });
  });

  app.put("/api/books/:id", (req, res) => {
    const { title, author, cover_image } = req.body;
    db.prepare("UPDATE books SET title = ?, author = ?, cover_image = ? WHERE id = ?").run(title, author, cover_image, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/books/:id", (req, res) => {
    db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/books/:id/chapters", (req, res) => {
    const { title } = req.body;
    const id = uuidv4();
    const lastChapter = db.prepare("SELECT MAX(order_index) as max_idx FROM chapters WHERE book_id = ?").get(req.params.id);
    const nextIdx = (lastChapter?.max_idx || 0) + 1;
    db.prepare("INSERT INTO chapters (id, book_id, title, content, order_index) VALUES (?, ?, ?, ?, ?)").run(id, req.params.id, title || "New Chapter", "", nextIdx);
    res.json({ id, title, order_index: nextIdx });
  });

  app.put("/api/chapters/:id", (req, res) => {
    const { title, content } = req.body;
    db.prepare("UPDATE chapters SET title = ?, content = ? WHERE id = ?").run(title, content, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/chapters/:id", (req, res) => {
    db.prepare("DELETE FROM chapters WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/books/:id/export", async (req, res) => {
    try {
      const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
      const chapters = db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index ASC").all(req.params.id);

      if (!book) return res.status(404).json({ error: "Book not found" });

      const options = {
        title: book.title,
        author: book.author,
        cover: book.cover_image || undefined,
      };

      const content = chapters.map(ch => ({
        title: ch.title,
        data: ch.content
      }));

      const epubBuffer = await epub(options, content);
      
      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Disposition', `attachment; filename="${book.title.replace(/\s+/g, '_')}.epub"`);
      res.send(epubBuffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to generate EPUB" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
