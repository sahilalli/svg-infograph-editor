
import React from 'react';
import { SVGEditor } from '@/components/SVGEditor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            SVG Infographic Template Editor
          </h1>
          <p className="text-lg text-gray-600">
            Upload, edit, and extract editable templates from SVG files
          </p>
        </div>
        <SVGEditor />
      </div>
    </div>
  );
};

export default Index;
