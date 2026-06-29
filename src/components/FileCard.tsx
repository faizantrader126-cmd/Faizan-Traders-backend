import { useState } from "react";
import { Image, FileAudio, FileVideo, FileText, Folder, Trash2, Download, Edit3, Eye, Check, X, Calendar, HardDrive } from "lucide-react";
import { FileMetadata } from "../types";
import { formatBytes, formatDate } from "../utils";

interface FileCardProps {
  key?: string;
  file: FileMetadata;
  viewMode: "grid" | "list";
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, newName: string, newNotes: string) => Promise<void>;
  onPreview: (file: FileMetadata) => void;
}

export default function FileCard({ file, viewMode, onDelete, onEdit, onPreview }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.originalname);
  const [editNotes, setEditNotes] = useState(file.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // File URL for downloading & previewing
  const fileUrl = `/uploads/${file.filename}`;

  // Select suitable icon
  const getCategoryIcon = (category: string, className: string) => {
    switch (category) {
      case "image":
        return <Image className={`${className} text-blue-400`} />;
      case "audio":
        return <FileAudio className={`${className} text-purple-400`} />;
      case "video":
        return <FileVideo className={`${className} text-rose-400`} />;
      case "document":
        return <FileText className={`${className} text-amber-400`} />;
      default:
        return <Folder className={`${className} text-slate-400`} />;
    }
  };

  // Get background color class based on category
  const getCategoryBg = (category: string) => {
    switch (category) {
      case "image":
        return "bg-blue-500/5 border-blue-500/10";
      case "audio":
        return "bg-purple-500/5 border-purple-500/10";
      case "video":
        return "bg-rose-500/5 border-rose-500/10";
      case "document":
        return "bg-amber-500/5 border-amber-500/10";
      default:
        return "bg-slate-500/5 border-slate-500/10";
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    await onEdit(file.id, editName, editNotes);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(file.originalname);
    setEditNotes(file.notes || "");
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete(file.id);
    setIsDeleting(false);
  };

  // RENDER GRID VIEW
  if (viewMode === "grid") {
    return (
      <div
        id={`file-card-${file.id}`}
        className={`group bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-700 transition-all duration-200 flex flex-col h-full`}
      >
        {/* Visual Preview / Thumbnail Area */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/60 shrink-0">
          {file.category === "image" ? (
            <img
              src={fileUrl}
              alt={file.originalname}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => onPreview(file)}
            />
          ) : file.category === "video" ? (
            <div
              className="w-full h-full bg-slate-950 flex items-center justify-center group-hover:scale-102 transition-transform cursor-pointer relative"
              onClick={() => onPreview(file)}
            >
              <FileVideo className="h-10 w-10 text-rose-500/40 group-hover:text-rose-400/80 transition-colors" />
              <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="p-2.5 bg-slate-900/90 rounded-full border border-slate-700 text-slate-100">
                  <Eye className="h-5 w-5" />
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full bg-slate-950 flex flex-col items-center justify-center cursor-pointer p-4"
              onClick={() => onPreview(file)}
            >
              {getCategoryIcon(file.category, "h-12 w-12 mb-2")}
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                {file.mimetype.split("/")[1] || "file"}
              </span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800/80 text-[10px] font-bold text-slate-300 capitalize flex items-center space-x-1 backdrop-blur-sm shadow-md">
            {getCategoryIcon(file.category, "h-3.5 w-3.5 mr-0.5")}
            <span>{file.category}</span>
          </div>

          {/* Quick Action Overlay */}
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onPreview(file)}
              className="p-1.5 bg-slate-900/90 hover:bg-indigo-500 border border-slate-800 hover:border-indigo-400 text-slate-300 hover:text-white rounded-lg transition-all"
              title="Quick Preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <a
              href={fileUrl}
              download={file.originalname}
              className="p-1.5 bg-slate-900/90 hover:bg-emerald-500 border border-slate-800 hover:border-emerald-400 text-slate-300 hover:text-white rounded-lg transition-all"
              title="Download File"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Info Body Area */}
        <div className="p-4 flex flex-col flex-grow justify-between">
          {isEditing ? (
            <div className="space-y-3 flex-grow">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Filename</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded py-1 px-2 text-[10px] font-bold flex items-center justify-center space-x-1"
                >
                  <Check className="h-3 w-3" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded py-1 px-2 text-[10px] font-bold flex items-center justify-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              <div>
                {/* Title and notes */}
                <h3
                  className="font-semibold text-sm text-slate-100 truncate cursor-pointer hover:text-indigo-400"
                  onClick={() => onPreview(file)}
                  title={file.originalname}
                >
                  {file.originalname}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-8 font-normal">
                  {file.notes || <span className="text-slate-600 italic">No description added.</span>}
                </p>
              </div>

              {/* Sub-details */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center"><HardDrive className="h-3.5 w-3.5 mr-1 shrink-0" /> {formatBytes(file.size)}</span>
                <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1 shrink-0" /> {formatDate(file.uploadedAt)}</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {!isEditing && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {isDeleting ? (
                <div className="flex items-center space-x-1.5 w-full">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mr-auto">Sure?</span>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-slate-400 hover:text-indigo-400 flex items-center space-x-1 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER LIST VIEW
  return (
    <div
      id={`file-row-${file.id}`}
      className={`group bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 md:space-x-4`}
    >
      {/* Icon/Mini-preview and Primary Info */}
      <div className="flex items-center space-x-4 flex-grow truncate">
        {/* Preview Container */}
        <div className="h-12 w-12 bg-slate-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-800">
          {file.category === "image" ? (
            <img
              src={fileUrl}
              alt={file.originalname}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover cursor-pointer"
              onClick={() => onPreview(file)}
            />
          ) : (
            <span className="cursor-pointer" onClick={() => onPreview(file)}>
              {getCategoryIcon(file.category, "h-5 w-5")}
            </span>
          )}
        </div>

        {/* Text Area */}
        <div className="truncate flex-grow">
          {isEditing ? (
            <div className="flex items-center space-x-2 py-1">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-1/2"
              />
              <input
                type="text"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Optional notes"
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-1/3"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 p-1.5 rounded text-white"
                title="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-slate-300"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3
                  className="font-semibold text-sm text-slate-100 truncate hover:text-indigo-400 cursor-pointer"
                  onClick={() => onPreview(file)}
                >
                  {file.originalname}
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 capitalize">
                  {file.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">
                {file.notes || <span className="text-slate-600 italic">No notes.</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meta properties and action controls */}
      <div className="flex items-center justify-between md:justify-end space-x-6 shrink-0 text-slate-400">
        <div className="flex items-center space-x-4 text-xs">
          {/* File Size */}
          <span className="flex items-center font-semibold text-slate-300">
            <HardDrive className="h-3.5 w-3.5 mr-1 text-slate-500" />
            {formatBytes(file.size)}
          </span>
          {/* Date uploaded */}
          <span className="flex items-center text-slate-500">
            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-600" />
            {formatDate(file.uploadedAt)}
          </span>
        </div>

        {/* Action button grouping */}
        {!isEditing && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPreview(file)}
              className="p-1.5 bg-slate-950 border border-slate-800/80 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
            <a
              href={fileUrl}
              download={file.originalname}
              className="p-1.5 bg-slate-950 border border-slate-800/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-slate-950 border border-slate-800/80 hover:bg-amber-500/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 rounded-lg transition-all"
              title="Edit details"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            {isDeleting ? (
              <div className="flex items-center bg-slate-950 border border-rose-500/30 rounded-lg overflow-hidden text-xs">
                <button
                  onClick={handleDeleteConfirm}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[10px]"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleting(true)}
                className="p-1.5 bg-slate-950 border border-slate-800/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
