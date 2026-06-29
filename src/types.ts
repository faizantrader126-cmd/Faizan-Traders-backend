export interface FileMetadata {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  category: "image" | "audio" | "video" | "document" | "other";
  notes?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  categories: {
    image: number;
    audio: number;
    video: number;
    document: number;
    other: number;
  };
}

export interface QueueItem {
  id: string;
  file: File;
  progress: number; // 0 to 100
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}
