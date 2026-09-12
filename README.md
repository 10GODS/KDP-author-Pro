# KDP Author Pro

**KDP Author Pro** is a professional-grade ebook creator designed specifically for authors preparing content for Kindle Direct Publishing (KDP) and other ebook distribution platforms. 

With this application, you can easily manage your ebook projects from a single intuitive dashboard, write chapters using a rich text editor, upload custom cover art, and export your final work as a standard EPUB file.

## 🚀 Features

- **Project Dashboard**: Manage multiple ebook drafts seamlessly.
- **Chapter Organization**: Add, rename, and delete chapters on the fly.
- **Rich Text Editor**: A built-in editor that supports bold, italics, underlining, headers, lists, and inline images.
- **Cover Image Support**: Upload and preview your custom cover image.
- **EPUB Export Engine**: Automatically compile your book—chapters and cover included—into an EPUB format that is accepted by Amazon KDP, Apple Books, and Google Play Books.
- **Local SQLite Database**: Your work is auto-saved locally in a lightweight SQLite database (`ebooks.db`), so you never lose your progress.

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, React Quill
- **Backend**: Node.js, Express
- **Database**: SQLite (via `better-sqlite3`)
- **Compilation**: `epub-gen-memory`
- **Build Tool**: Vite, TSX

## 💻 Running Locally

To run the application locally on your machine, you'll need Node.js installed.

1. Clone this repository.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

To build for production:
```bash
npm run build
npm start
```

## 💖 Support the Project

If you find this tool helpful for writing and publishing your ebooks, consider buying me a coffee to support further development!

[![Buy me a coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/kumarrsgisw)
