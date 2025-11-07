import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Download, X, FileText, File } from 'lucide-react';

interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType?: string;
}

export function FileViewer({ open, onClose, fileName, fileUrl, fileType }: FileViewerProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
  const isPDF = fileType === 'application/pdf' || fileName.endsWith('.pdf');
  const isText = fileType?.startsWith('text/') || /\.(txt|md|json|xml|csv)$/i.test(fileName);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate flex-1 mr-4">{fileName}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" onClick={onClose} variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[70vh]">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          ) : isPDF ? (
            <iframe
              src={fileUrl}
              className="w-full h-[70vh] border-0"
              title={fileName}
            />
          ) : isText ? (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              <code>{fileUrl}</code>
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <File className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
