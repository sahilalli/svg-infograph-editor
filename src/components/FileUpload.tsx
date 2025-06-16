
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        onFileUpload(file);
      } else {
        toast.error('Please upload an SVG file');
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full h-full flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
        isDragActive
          ? 'bg-blue-50 border-blue-300'
          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
      }`}
    >
      <input {...getInputProps()} />
      <FileImage className="w-16 h-16 text-gray-400 mb-4" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop your SVG file here' : 'Upload SVG File'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop an SVG file or click to browse
        </p>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
      </div>
    </div>
  );
};
