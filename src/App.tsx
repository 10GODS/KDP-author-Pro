/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Book as BookIcon, 
  Plus, 
  Trash2, 
  Download, 
  ChevronLeft, 
  Save, 
  Image as ImageIcon,
  FileText,
  BookOpen,
  Coffee
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from './lib/utils';
import { Book, Chapter } from './types';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(data);
  };

  const openCreateModal = () => {
    setNewBookTitle('');
    setNewBookAuthor('');
    setIsCreateModalOpen(true);
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) return;
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newBookTitle, author: newBookAuthor || 'Author Name' })
    });
    const newBook = await res.json();
    fetchBooks();
    openBook(newBook.id);
    setIsCreateModalOpen(false);
  };

  const openBook = async (id: string) => {
    const res = await fetch(`/api/books/${id}`);
    const data = await res.json();
    setSelectedBook(data);
    setView('editor');
    if (data.chapters && data.chapters.length > 0) {
      setSelectedChapter(data.chapters[0]);
    } else {
      setSelectedChapter(null);
    }
  };

  const addChapter = async () => {
    if (!selectedBook) return;
    const res = await fetch(`/api/books/${selectedBook.id}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chapter' })
    });
    const newChapter = await res.json();
    const updatedBookRes = await fetch(`/api/books/${selectedBook.id}`);
    const updatedBook = await updatedBookRes.json();
    setSelectedBook(updatedBook);
    setSelectedChapter(updatedBook.chapters.find((c: Chapter) => c.id === newChapter.id));
  };

  const saveChapter = async () => {
    if (!selectedChapter) return;
    setIsSaving(true);
    try {
      await fetch(`/api/chapters/${selectedChapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: selectedChapter.title, 
          content: selectedChapter.content 
        })
      });
      // Refresh book data to keep chapters in sync
      const res = await fetch(`/api/books/${selectedBook?.id}`);
      const data = await res.json();
      setSelectedBook(data);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteChapter = (id: string) => {
    setChapterToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;
    await fetch(`/api/chapters/${chapterToDelete}`, { method: 'DELETE' });
    const res = await fetch(`/api/books/${selectedBook?.id}`);
    const data = await res.json();
    setSelectedBook(data);
    if (selectedChapter?.id === chapterToDelete) {
      setSelectedChapter(data.chapters[0] || null);
    }
    setIsDeleteModalOpen(false);
    setChapterToDelete(null);
  };

  const exportEbook = async () => {
    if (!selectedBook) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/export`, { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedBook.title}.epub`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBook) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await fetch(`/api/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...selectedBook, 
          cover_image: base64 
        })
      });
      openBook(selectedBook.id);
    };
    reader.readAsDataURL(file);
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] p-8 font-sans text-[#141414]">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-serif italic mb-2">KDP Author Pro</h1>
              <p className="text-sm uppercase tracking-widest opacity-50">Your Professional Ebook Studio</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="https://buymeacoffee.com/kumarrsgisw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#FFDD00] text-black font-medium px-5 py-3 rounded-full hover:bg-opacity-90 transition-all shadow-sm"
              >
                <Coffee size={20} />
                <span>Buy me a coffee</span>
              </a>
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-[#141414] text-white px-6 py-3 rounded-full hover:bg-opacity-80 transition-all"
              >
                <Plus size={20} />
                <span>Create New Book</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div 
                key={book.id}
                onClick={() => openBook(book.id)}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-black/5"
              >
                <div className="aspect-[3/4] bg-[#E4E3E0] relative overflow-hidden">
                  {book.cover_image ? (
                    <img 
                      src={book.cover_image} 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                      <BookIcon size={64} />
                      <span className="mt-4 font-serif italic">No Cover</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium uppercase tracking-widest text-sm">Open Editor</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif italic mb-1">{book.title}</h3>
                  <p className="text-sm opacity-50">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-black/5 flex flex-col">
        <div className="p-6 border-b border-black/5">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-all mb-6"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-14 bg-[#E4E3E0] rounded-md overflow-hidden flex-shrink-0">
              {selectedBook?.cover_image && (
                <img src={selectedBook.cover_image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-serif italic truncate">{selectedBook?.title}</h2>
              <p className="text-xs opacity-50 truncate">{selectedBook?.author}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Chapters</span>
            <button 
              onClick={addChapter}
              className="p-1 hover:bg-black/5 rounded-full transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          {selectedBook?.chapters?.map((chapter) => (
            <div 
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                selectedChapter?.id === chapter.id 
                  ? "bg-[#141414] text-white shadow-lg" 
                  : "hover:bg-black/5"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className="flex-shrink-0 opacity-50" />
                <span className="text-sm truncate">{chapter.title}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeleteChapter(chapter.id);
                }}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded-md transition-all",
                  selectedChapter?.id === chapter.id ? "text-white" : "text-red-500"
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-black/5 space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 cursor-pointer transition-all text-sm">
            <ImageIcon size={18} className="opacity-50" />
            <span>Upload Cover</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
          </label>
          <button 
            onClick={exportEbook}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-[#141414] text-white p-3 rounded-xl hover:bg-opacity-80 disabled:opacity-50 transition-all text-sm"
          >
            <Download size={18} />
            <span>{isExporting ? 'Compiling...' : 'Export EPUB'}</span>
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col bg-white">
        {selectedChapter ? (
          <>
            <header className="p-6 border-b border-black/5 flex justify-between items-center">
              <input 
                type="text"
                value={selectedChapter.title}
                onChange={(e) => setSelectedChapter({ ...selectedChapter, title: e.target.value })}
                className="text-2xl font-serif italic bg-transparent border-none outline-none focus:ring-0 w-full"
                placeholder="Chapter Title"
              />
              <button 
                onClick={saveChapter}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-sm font-medium"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </header>
            <div className="flex-1 overflow-hidden p-8 flex justify-center">
              <div className="w-full max-w-3xl h-full flex flex-col">
                <ReactQuill 
                  theme="snow"
                  value={selectedChapter.content}
                  onChange={(content) => setSelectedChapter({ ...selectedChapter, content })}
                  className="h-full flex flex-col"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <BookOpen size={64} />
            <p className="mt-4 font-serif italic">Select or create a chapter to start writing</p>
          </div>
        )}
      </main>

      <style>{`
        .ql-container.ql-snow {
          border: none !important;
          font-family: 'Georgia', serif;
          font-size: 18px;
          line-height: 1.6;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
          padding: 12px !important;
        }
        .ql-editor {
          padding: 2rem 0 !important;
        }
      `}</style>

      {/* Create Book Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-serif italic mb-4">Create New Book</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                <input 
                  type="text" 
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Enter book title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input 
                  type="text" 
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Enter author name"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim()}
                className="px-4 py-2 bg-[#141414] text-white rounded-xl hover:bg-opacity-80 disabled:opacity-50 transition-all"
              >
                Create Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chapter Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-serif italic mb-2">Delete Chapter?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this chapter? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteChapter}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
