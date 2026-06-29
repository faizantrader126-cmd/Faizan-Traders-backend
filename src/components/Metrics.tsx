import { HardDrive, Image, FileAudio, FileVideo, FileText, FolderOpen } from "lucide-react";
import { StorageStats } from "../types";
import { formatBytes } from "../utils";

interface MetricsProps {
  stats: StorageStats;
}

export default function Metrics({ stats }: MetricsProps) {
  const totalSizeStr = formatBytes(stats.totalSize);
  const totalFiles = stats.totalFiles;

  // Compute category percentages
  const total = stats.totalFiles || 1;
  const pImage = (stats.categories.image / total) * 100;
  const pAudio = (stats.categories.audio / total) * 100;
  const pVideo = (stats.categories.video / total) * 100;
  const pDocument = (stats.categories.document / total) * 100;
  const pOther = (stats.categories.other / total) * 100;

  return (
    <div id="metrics-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Storage Limit */}
        <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Storage Used</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{totalSizeStr}</p>
          </div>
        </div>

        {/* Metric 2: Total Files */}
        <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Uploaded Files</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{totalFiles}</p>
          </div>
        </div>

        {/* Metric 3: Fast Summary */}
        <div className="flex flex-col justify-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category Highlights</p>
          <div className="flex items-center space-x-3 text-sm font-medium">
            <span className="flex items-center text-blue-400"><Image className="h-3.5 w-3.5 mr-1" /> {stats.categories.image}</span>
            <span className="flex items-center text-purple-400"><FileAudio className="h-3.5 w-3.5 mr-1" /> {stats.categories.audio}</span>
            <span className="flex items-center text-rose-400"><FileVideo className="h-3.5 w-3.5 mr-1" /> {stats.categories.video}</span>
            <span className="flex items-center text-amber-400"><FileText className="h-3.5 w-3.5 mr-1" /> {stats.categories.document}</span>
          </div>
        </div>
      </div>

      {/* Visual Percentage Bar */}
      <div className="mt-6 pt-6 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium mb-2">
          <span>Storage Composition</span>
          <span>{totalFiles} Items</span>
        </div>
        
        {/* Progress bar stack */}
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
          {stats.totalFiles === 0 ? (
            <div className="w-full bg-slate-800 h-full rounded-full" />
          ) : (
            <>
              {pImage > 0 && <div style={{ width: `${pImage}%` }} className="bg-blue-500 h-full transition-all duration-300" title={`Images: ${stats.categories.image}`} />}
              {pAudio > 0 && <div style={{ width: `${pAudio}%` }} className="bg-purple-500 h-full transition-all duration-300" title={`Audio: ${stats.categories.audio}`} />}
              {pVideo > 0 && <div style={{ width: `${pVideo}%` }} className="bg-rose-500 h-full transition-all duration-300" title={`Videos: ${stats.categories.video}`} />}
              {pDocument > 0 && <div style={{ width: `${pDocument}%` }} className="bg-amber-500 h-full transition-all duration-300" title={`Documents: ${stats.categories.document}`} />}
              {pOther > 0 && <div style={{ width: `${pOther}%` }} className="bg-slate-500 h-full transition-all duration-300" title={`Others: ${stats.categories.other}`} />}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
            <span>Images ({stats.categories.image})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
            <span>Audio ({stats.categories.audio})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
            <span>Video ({stats.categories.video})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            <span>Documents ({stats.categories.document})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500 inline-block" />
            <span>Others ({stats.categories.other})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
