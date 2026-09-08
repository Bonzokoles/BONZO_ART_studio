
import React, { useCallback } from 'react';
import type { UploadedFile } from '../types';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { fileToBase64 } from '../services/geminiService';

interface ImageUploadProps {
  id?: string;
  onFileUpload: (file: UploadedFile) => void;
  uploadedFile: UploadedFile | null;
  setUploadedFile: (file: UploadedFile | null) => void;
  label: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  id = 'image-upload',
  onFileUpload,
  uploadedFile,
  setUploadedFile,
  label,
}) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const { base64, mimeType } = await fileToBase64(file);
      const uploaded = { base64, mimeType, preview: URL.createObjectURL(file) };
      setUploadedFile(uploaded);
      onFileUpload(uploaded);
    }
  };

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        const { base64, mimeType } = await fileToBase64(file);
        const uploaded = { base64, mimeType, preview: URL.createObjectURL(file) };
        setUploadedFile(uploaded);
        onFileUpload(uploaded);
      }
    },
    [onFileUpload, setUploadedFile]
  );

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setUploadedFile(null);
  };

  return (
    <div id={id} className="w-full font-mono text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[#888888] uppercase tracking-wider text-[11px]">{label}</label>
        {uploadedFile && (
          <span className="text-[#00ff66] text-[10px]">[LOADED: {uploadedFile.mimeType}]</span>
        )}
      </div>

      {uploadedFile ? (
        <div className="relative border border-[#333333] bg-[#0d0d0d] p-2">
          <div className="relative aspect-video max-h-64 w-full bg-[#000000] border border-[#222222] flex items-center justify-center overflow-hidden">
            <img
              src={uploadedFile.preview}
              alt="Source Upload"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            id="clear-upload-btn"
            onClick={clearFile}
            className="absolute top-3 right-3 px-2 py-1 bg-[#1a1a1a] text-[#ff3333] border border-[#ff3333]/50 hover:bg-[#ff3333] hover:text-[#ffffff] text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center space-x-1"
            aria-label="Remove image"
          >
            <X size={12} />
            <span>[CLEAR]</span>
          </button>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-36 px-4 bg-[#111111] border border-dashed border-[#444444] hover:border-[#00e5ff] hover:bg-[#141414] transition-colors cursor-pointer text-center"
        >
          <div className="flex flex-col items-center space-y-1.5 text-[#888888]">
            <UploadCloud size={24} className="text-[#00e5ff]" />
            <div className="text-xs text-[#cccccc]">
              DRAG &amp; DROP IMAGE OR <span className="text-[#00e5ff] underline">BROWSE</span>
            </div>
            <div className="text-[10px] text-[#666666]">
              FORMATS: PNG, JPG, WEBP, GIF (MAX 10MB)
            </div>
          </div>
          <input
            type="file"
            name="file_upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
};

