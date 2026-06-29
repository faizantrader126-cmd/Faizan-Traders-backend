import React, { useState, useRef } from "react";
import { Upload, X, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatBytes } from "../utils";

interface UploadBoxProps {
  onUploadStart: (files: File[], notes: string) => Promise<boolean>;
  isUploading: boolean;
}

export default function UploadBox({ onUploadStart, isUploading }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchNotes, setBatchNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Limit check: 100MB per file
      if (file.size > 100 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 100MB limit.`);
        continue;
      }
      newFiles.push(file);
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    processFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setSelectedFiles([]);
    setBatchNotes("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const success = await onUploadStart(selectedFiles, batchNotes);
    if (success) {
      setSuccessMsg(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setSelectedFiles([]);
      setBatchNotes("");
    } else {
      setErrorMsg("Failed to upload file(s). Please try again.");
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="upload-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center space-x-2 mb-4">
        <Upload className="h-5 w-5 text-indigo-400" />
        <span>Upload New Files</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group ${
            dragActive
              ? "border-indigo-400 bg-indigo-500/10 scale-[0.99]"
              : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`p-4 rounded-full transition-colors duration-200 ${
              dragActive ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-900 text-slate-400 group-hover:text-indigo-400"
            }`}>
              <Upload className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-200">
                <span className="text-indigo-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Any file type supported (Images, Audio, Video, Docs) up to 100MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 max-h-60 overflow-y-auto space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Selected Queue ({selectedFiles.length})</span>
              <button
                type="button"
                onClick={clearQueue}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="divide-y divide-slate-900">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-3 truncate pr-4">
                    <File className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Batch Notes Field */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <label htmlFor="notes-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Add Notes/Description (Optional)
              </label>
              <input
                id="notes-input"
                type="text"
                placeholder="e.g. Project assets, presentation voiceover, etc."
                value={batchNotes}
                onChange={e => setBatchNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Trigger */}
        {selectedFiles.length > 0 && (
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/10 ${
              isUploading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer active:scale-[0.98]"
            }`}
          >
            {isUploading ? "Uploading to Vault..." : `Upload ${selectedFiles.length} File(s)`}
          </button>
        )}
      </form>
    </div>
  );
}
