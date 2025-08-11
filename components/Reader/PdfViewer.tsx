import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';

type PdfViewerProps = {
  fileUrl: string;
  plugins?: any[];
};

export default function PdfViewer({ fileUrl, plugins = [] }: PdfViewerProps): React.ReactElement {
  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <Viewer key={fileUrl} fileUrl={fileUrl} theme={{ theme: 'dark' }} plugins={plugins as any} />
    </Worker>
  );
} 