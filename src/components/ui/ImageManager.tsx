import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Copy, Search, Image as ImageIcon } from 'lucide-react';
import { db } from '../../lib/supabase';

interface ImageManagerProps {
  onSelect?: (url: string) => void;
  onClose: () => void;
}

interface ImageItem {
  filename: string;
  size: number;
  createdAt: string;
}

export default function ImageManager({ onSelect, onClose }: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await db.getContentManageImages();
      setImages(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load images' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await db.uploadContentImage(file);
      setMessage({ type: 'success', text: 'Image uploaded' });
      await loadImages();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      await db.deleteContentImage(filename);
      setImages(prev => prev.filter(i => i.filename !== filename));
      setMessage({ type: 'success', text: 'Image deleted' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  const handleCopyUrl = (filename: string) => {
    const url = `/api/content-manage/images/${filename}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied' });
  };

  const filtered = images.filter(img =>
    !search || img.filename.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-black text-white">Image Manager</h2>
            <span className="text-[10px] text-slate-500">{images.length} images</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/50">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images..."
              className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>

        {message && (
          <div className={`mx-5 mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold ${
            message.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              {search ? 'No images match your search' : 'No images uploaded yet'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((img) => (
                <div key={img.filename} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="aspect-square bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/api/content-manage/images/${img.filename}`}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-[9px] text-slate-500 truncate" title={img.filename}>{img.filename}</p>
                    <p className="text-[9px] text-slate-600">{formatSize(img.size)}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {onSelect && (
                      <button
                        onClick={() => { onSelect(`/api/content-manage/images/${img.filename}`); onClose(); }}
                        className="px-2 py-1 bg-teal-500 text-white text-[9px] font-black rounded-lg hover:bg-teal-400 transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyUrl(img.filename)}
                      className="p-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(img.filename)}
                      className="p-1.5 bg-rose-500/80 text-white rounded-lg hover:bg-rose-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
