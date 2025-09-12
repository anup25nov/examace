import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDisplayProps {
  imagePath: string;
  alt?: string;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
  showZoom?: boolean;
  showDownload?: boolean;
  caption?: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imagePath,
  alt = "Question image",
  className = "",
  maxWidth = "100%",
  maxHeight = "400px",
  showZoom = true,
  showDownload = true,
  caption
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Construct the full image path
  const fullImagePath = imagePath.startsWith('/') 
    ? imagePath 
    : `/logos/${imagePath}`;

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullImagePath;
    link.download = imagePath.split('/').pop() || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fullImagePath, '_blank');
  };

  if (imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center",
        className
      )}>
        <div className="space-y-2">
          <div className="text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Image not found</p>
          <p className="text-xs text-muted-foreground/70">{imagePath}</p>
        </div>
      </div>
    );
  }

  const imageElement = (
    <div className={cn("relative group", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <img
        src={fullImagePath}
        alt={alt}
        className={cn(
          "rounded-lg shadow-sm transition-all duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          showZoom && "cursor-zoom-in hover:shadow-md"
        )}
        style={{
          maxWidth,
          maxHeight,
          width: 'auto',
          height: 'auto'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Action buttons overlay */}
      {(showZoom || showDownload) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          {showZoom && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <div className="relative">
                  <img
                    src={fullImagePath}
                    alt={alt}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: '80vh' }}
                  />
                  {caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 rounded-b-lg">
                      <p className="text-sm">{caption}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {showDownload && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={handleDownload}
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </div>
      )}
    </div>
  );

  return imageElement;
};

export default ImageDisplay;
