import { useEffect } from "react";
import { X, Download, HardDrive, Calendar, Link, FileText, Info } from "lucide-react";
import { FileMetadata } from "../types";
import { formatBytes, formatDate } from "../utils";

interface PreviewModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export default function PreviewModal({ file, onClose }: PreviewModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const fileUrl = `/uploads/${file.filename}`;

  return (
    <div
      id="preview-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="preview-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Visual Interactive Preview Stage */}
        <div className="flex-grow bg-slate-950 flex items-center justify-center p-4 md:p-8 min-h-[300px] md:min-h-[450px] max-h-[50vh] md:max-h-none overflow-hidden relative">
          {file.category === "image" ? (
            <img
              src={fileUrl}
              alt={file.originalname}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            />
          ) : file.category === "video" ? (
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg shadow-md aspect-video"
            />
          ) : file.category === "audio" ? (
            <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md p-6 bg-slate-900/60 border border-slate-800 rounded-xl shadow-inner">
              {/* Rotating Audio Disk representation */}
              <div className="relative h-28 w-28 rounded-full bg-slate-950 flex items-center justify-center border-2 border-indigo-500/20 shadow-lg animate-spin [animation-duration:8s]">
                <div className="h-10 w-10 rounded-full bg-slate-900 border border-indigo-500/30 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                </div>
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-semibold text-slate-100 truncate max-w-xs mx-auto">
                  {file.originalname}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                  Audio Track
                </p>
              </div>
              <audio src={fileUrl} controls autoPlay className="w-full" />
            </div>
          ) : file.category === "document" ? (
            <div className="w-full h-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-inner">
              {/* If it's a basic plain text file or markdown, we can preview it. Or we use a document style sheet icon */}
              <div className="bg-slate-950 px-4 py-2 text-xs border-b border-slate-800 text-slate-500 flex items-center justify-between">
                <span>Document Sandbox</span>
                <span className="uppercase text-[10px] font-bold text-amber-500">{file.mimetype.split("/")[1] || "doc"}</span>
              </div>
              <div className="flex-grow p-6 flex flex-col items-center justify-center text-center space-y-4">
                <FileText className="h-16 w-16 text-amber-400" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm truncate max-w-sm">{file.originalname}</h4>
                  <p className="text-xs text-slate-400 mt-1">This document file is ready for download.</p>
                </div>
                {/* For PDF documents we can embed a helper preview iframe if needed, or stick to this very clean visual card with download */}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                <Info className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 text-sm truncate max-w-sm">{file.originalname}</h4>
                <p className="text-xs text-slate-400 mt-1">Generic format: ready for use.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Metadata & Controls Area */}
        <div className="w-full md:w-[350px] bg-slate-900 p-6 border-t md:border-t-0 md:border-l border-slate-800/60 flex flex-col justify-between overflow-y-auto shrink-0 max-h-[40vh] md:max-h-none">
          <div className="space-y-6">
            {/* Header: Title and Close button */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="truncate pr-4">
                <h2 className="font-bold text-lg text-slate-100 truncate" title={file.originalname}>
                  {file.originalname}
                </h2>
                <p className="text-xs text-indigo-400 font-semibold capitalize mt-0.5">
                  {file.category} File
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors shrink-0"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description / Notes Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Description / Notes
              </h3>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 text-xs text-slate-300 min-h-12 leading-relaxed whitespace-pre-wrap">
                {file.notes || <span className="text-slate-600 italic">No notes added.</span>}
              </div>
            </div>

            {/* Technical Metadata breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                File Details
              </h3>
              
              <div className="grid grid-cols-1 gap-2 text-xs font-medium">
                {/* Size */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-500 flex items-center"><HardDrive className="h-3.5 w-3.5 mr-1 text-slate-600" /> Size</span>
                  <span className="text-slate-300 font-semibold">{formatBytes(file.size)}</span>
                </div>
                {/* Date */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-500 flex items-center"><Calendar className="h-3.5 w-3.5 mr-1 text-slate-600" /> Uploaded</span>
                  <span className="text-slate-300">{formatDate(file.uploadedAt)}</span>
                </div>
                {/* Format */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-500 flex items-center"><Info className="h-3.5 w-3.5 mr-1 text-slate-600" /> Format</span>
                  <span className="text-slate-300 font-mono text-[10px]">{file.mimetype}</span>
                </div>
                {/* Safe URL name */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-500 flex items-center"><Link className="h-3.5 w-3.5 mr-1 text-slate-600" /> Vault Name</span>
                  <span className="text-slate-300 font-mono text-[10px] truncate max-w-[150px]" title={file.filename}>
                    {file.filename}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-800 mt-6">
            <a
              href={fileUrl}
              download={file.originalname}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
