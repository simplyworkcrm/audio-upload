import React, { useState, useRef } from 'react';
import { Upload, X, FileAudio, Film, CheckCircle2, AlertCircle } from 'lucide-react';

interface MediaFile {
  file: File;
  previewUrl: string;
  status: 'ready' | 'uploading' | 'done' | 'error';
  type: 'audio' | 'video';
  errorMessage?: string;
}

const API_BASE = 'https://api1.simplyworkcrm.com/api:xyNb4DPW';
const MAX_SIZE_MB = 200;

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    user_id: params.get('user_id') || undefined,
    user_name: params.get('user_name') || undefined,
  };
}

export default function App() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user_id, user_name } = getUrlParams();

  if (!user_id || !user_name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-purple-300">Valid <code>user_id</code> and <code>user_name</code> parameters are required.</p>
        </div>
      </div>
    );
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: MediaFile[] = [];

    for (const file of fileList) {
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      const isTooLarge = file.size > MAX_SIZE_MB * 1024 * 1024;

      if ((isAudio || isVideo) && !isTooLarge) {
        newFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
          status: 'ready',
          type: isVideo ? 'video' : 'audio',
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(files[index].previewUrl);
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading', errorMessage: undefined } : f))
    );

    const item = files[index];
    const formData = new FormData();
    formData.append('media', item.file);
    if (user_id) formData.append('user_id', user_id);
    if (user_name) formData.append('user_name', user_name);

    try {
      const uploadUrl = `${API_BASE}/media/upload/${item.type}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorBody.slice(0, 120)}`);
      }

      await response.json();
      setFiles(prev => prev.map((f, i) => (i === index ? { ...f, status: 'done' } : f)));
    } catch (err: any) {
      setFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', errorMessage: err.message } : f
        )
      );
    }
  };

  const uploadAll = () => {
    files.forEach((f, i) => {
      if (f.status === 'ready') {
        uploadFile(i);
      }
    });
  };

  const clearDone = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  const readyCount = files.filter(f => f.status === 'ready').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Media Upload</h1>
          <p className="text-purple-300">Drop or select your audio &amp; video files to upload</p>
          <div className="mt-3 inline-flex items-center gap-3 bg-white/10 backdrop-blur rounded-full px-5 py-2 border border-white/10">
            <span className="text-purple-300 text-sm">User:</span>
            <span className="text-white text-sm font-semibold">{user_name}</span>
            <span className="text-purple-500 text-xs">ID: {user_id}</span>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-500/20 scale-[1.02]'
              : 'border-purple-500/50 bg-white/5 hover:border-purple-400 hover:bg-white/10'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-purple-400 mb-4" />
          <p className="text-white text-lg font-medium">Drag &amp; drop audio or video files here</p>
          <p className="text-purple-300 text-sm mt-1">or click to browse</p>
          <p className="text-purple-400/60 text-xs mt-3">MP3, WAV, OGG, M4A, MP4, MOV, AVI, WEBM &middot; Max {MAX_SIZE_MB}MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,video/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10"
              >
                {/* Top row: icon, name, size, status, remove */}
                <div className="flex items-center gap-4">
                  {item.type === 'video'
                    ? <Film className="w-8 h-8 text-pink-400 flex-shrink-0" />
                    : <FileAudio className="w-8 h-8 text-purple-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-purple-300 text-xs">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB &middot; {item.type.toUpperCase()}
                    </p>
                    {item.errorMessage && (
                      <p className="text-red-400 text-xs mt-1">{item.errorMessage}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />}
                  {item.status === 'uploading' && <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                  {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-purple-400 hover:text-white transition-colors flex-shrink-0"
                    disabled={item.status === 'uploading'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview */}
                {item.type === 'video' ? (
                  <video
                    src={item.previewUrl}
                    controls
                    className="w-full rounded-lg max-h-64"
                  />
                ) : (
                  <audio src={item.previewUrl} controls className="w-full h-8" />
                )}

                {/* Retry for errored files */}
                {item.status === 'error' && (
                  <button
                    onClick={() => uploadFile(index)}
                    className="self-end text-sm px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {readyCount > 0 && (
                <button
                  onClick={uploadAll}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Upload {readyCount} File{readyCount > 1 ? 's' : ''}
                </button>
              )}
              {doneCount > 0 && (
                <button
                  onClick={clearDone}
                  className="py-3 px-6 bg-green-600/80 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Clear Done
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="text-center text-sm space-y-1">
              {doneCount > 0 && (
                <p className="text-green-400">
                  {doneCount} file{doneCount > 1 ? 's' : ''} uploaded successfully
                </p>
              )}
              {errorCount > 0 && (
                <p className="text-red-400">
                  {errorCount} file{errorCount > 1 ? 's' : ''} failed
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
