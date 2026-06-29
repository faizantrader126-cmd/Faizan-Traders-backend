import { useState, useEffect } from "react";
import { 
  FolderOpen as FolderOpenIcon, Search as SearchIcon, Grid as GridIcon, List as ListIcon, 
  ArrowUpDown as ArrowUpDownIcon, Image as ImageIcon, FileAudio as FileAudioIcon, 
  FileVideo as FileVideoIcon, FileText as FileTextIcon, Folder as FolderIcon, 
  RefreshCw as RefreshCwIcon, HelpCircle as HelpCircleIcon, X as XIcon 
} from "lucide-react";
import { FileMetadata, StorageStats } from "../types";
import Metrics from "./Metrics";
import UploadBox from "./UploadBox";
import FileCard from "./FileCard";
import PreviewModal from "./PreviewModal";

interface FileManagerProps {
  onSelectFile?: (file: FileMetadata) => void;
  isModalMode?: boolean;
  onClose?: () => void;
  allowedCategories?: string[]; // e.g. ["image"]
}

export default function FileManager({ onSelectFile, isModalMode = false, onClose, allowedCategories }: FileManagerProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalFiles: 0,
    totalSize: 0,
    categories: { image: 0, audio: 0, video: 0, document: 0, other: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Preview overlay
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  // Load all files
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files from storage");
      const data: FileMetadata[] = await res.json();
      setFiles(data);
      
      // Load stats as well
      const statsRes = await fetch("/api/stats");
      if (statsRes.ok) {
        const statsData: StorageStats = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle upload
  const handleUpload = async (selectedFiles: File[], notes: string): Promise<boolean> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append("files", file);
      });
      formData.append("notes", notes);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload request failed");
      
      await fetchFiles();
      return true;
    } catch (err) {
      console.error("Upload error:", err);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle edit original name & notes
  const handleEdit = async (id: string, originalname: string, notes: string): Promise<void> => {
    try {
      const res = await fetch(`/api/files/${id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalname, notes }),
      });

      if (!res.ok) throw new Error("Edit request failed");
      await fetchFiles();
    } catch (err) {
      console.error("Error editing file:", err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete request failed");
      await fetchFiles();
      
      // If deleted file was currently being previewed, close preview
      if (previewFile && previewFile.id === id) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  // Process sorting & filtering
  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.originalname.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (file.notes && file.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // If we specify allowedCategories (e.g. only images for product manager), filter strictly
    const isAllowedByCategory = !allowedCategories || allowedCategories.includes(file.category);
    
    const matchesCategory = 
      selectedCategory === "all" ? isAllowedByCategory : file.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    }
    if (sortBy === "size-desc") {
      return b.size - a.size;
    }
    if (sortBy === "size-asc") {
      return a.size - b.size;
    }
    if (sortBy === "name-asc") {
      return a.originalname.localeCompare(b.originalname);
    }
    if (sortBy === "name-desc") {
      return b.originalname.localeCompare(a.originalname);
    }
    return 0;
  });

  const content = (
    <div className="space-y-6">
      {/* Metrics Panel */}
      {!isModalMode && <Metrics stats={stats} />}

      {/* Row 1: Upload Box & Stats (Condensed if modal) */}
      <div className={`grid grid-cols-1 ${isModalMode ? "" : "lg:grid-cols-12"} gap-6`}>
        {!isModalMode && (
          <div className="lg:col-span-12">
            <UploadBox onUploadStart={handleUpload} isUploading={isUploading} />
          </div>
        )}
        {isModalMode && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">Upload New Assets Directly</p>
            <UploadBox onUploadStart={handleUpload} isUploading={isUploading} />
          </div>
        )}
      </div>

      {/* Row 2: File List and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          {/* Search Input */}
          <div className="relative flex-grow max-w-md">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search file name or custom description notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 shadow-inner"
            />
          </div>

          {/* View, Sort, Status Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 shadow-inner">
              <ArrowUpDownIcon className="h-4 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-slate-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="size-desc">Largest Size</option>
                <option value="size-asc">Smallest Size</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            {/* View Layout Switcher */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex space-x-1 shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="Grid View"
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "All Items", count: stats.totalFiles, icon: <FolderIcon className="h-3.5 w-3.5" /> },
            { id: "image", label: "Images", count: stats.categories.image, icon: <ImageIcon className="h-3.5 w-3.5 text-blue-400" /> },
            { id: "audio", label: "Audio Files", count: stats.categories.audio, icon: <FileAudioIcon className="h-3.5 w-3.5 text-purple-400" /> },
            { id: "video", label: "Videos", count: stats.categories.video, icon: <FileVideoIcon className="h-3.5 w-3.5 text-rose-400" /> },
            { id: "document", label: "Documents", count: stats.categories.document, icon: <FileTextIcon className="h-3.5 w-3.5 text-amber-400" /> },
            { id: "other", label: "Others", count: stats.categories.other, icon: <HelpCircleIcon className="h-3.5 w-3.5 text-slate-400" /> },
          ]
            .filter(tab => !allowedCategories || tab.id === "all" || allowedCategories.includes(tab.id))
            .map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                  selectedCategory === tab.id
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-md shadow-indigo-500/5"
                    : "bg-slate-950/40 hover:bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 bg-slate-950/80 text-slate-500 rounded-md text-[10px] font-bold border border-slate-800/60">
                  {tab.count}
                </span>
              </button>
            ))}
        </div>

        {/* File Grid/List Render Stage */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCwIcon className="h-8 w-8 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Retrieving Vault index...</p>
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800/60 rounded-xl bg-slate-950/20 p-8 flex flex-col items-center justify-center">
            <FolderOpenIcon className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-400">No files located</h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1 mx-auto">
              {searchQuery || selectedCategory !== "all" 
                ? "Adjust search keywords or filter criteria to find other files." 
                : "Upload documents, soundtracks, motion videos, or images to begin."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {isModalMode && (
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Double click or click the file card preview to select this image for your product!</span>
              </p>
            )}
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-3"
            }>
              {sortedFiles.map(file => (
                <div 
                  key={file.id} 
                  onDoubleClick={() => onSelectFile && onSelectFile(file)}
                  className={onSelectFile ? "cursor-pointer ring-offset-slate-950 hover:ring-2 hover:ring-indigo-500 rounded-xl transition-all" : ""}
                >
                  <FileCard
                    file={file}
                    viewMode={viewMode}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onPreview={(f) => {
                      if (onSelectFile) {
                        // In selection mode, clicking selects it!
                        onSelectFile(f);
                      } else {
                        setPreviewFile(f);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Full immersive preview overlay */}
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );

  if (isModalMode) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center space-x-3">
              <FolderOpenIcon className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Select Image from Vault</h3>
                <p className="text-[10px] text-slate-400">Choose an existing uploaded file or upload a new one below</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Main content scroll body */}
          <div className="p-6 overflow-y-auto flex-grow bg-slate-950/20">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
