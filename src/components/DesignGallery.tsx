import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  RefreshCw, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { GeneratedImage } from "@/types/design";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DesignGalleryProps {
  images: GeneratedImage[];
  prompt: string;
  designDescription: string;
  onRegenerate: () => void;
  onModify: () => void;
  isLoading: boolean;
}

export function DesignGallery({
  images,
  prompt,
  designDescription,
  onRegenerate,
  onModify,
  isLoading,
}: DesignGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `architectural-design-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Image Display */}
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0 relative group">
          <div className="relative aspect-[16/10] bg-muted">
            <img
              src={images[selectedImage]?.imageUrl}
              alt={`Design variation ${selectedImage + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateImage("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateImage("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Image Counter / View Label */}
            <Badge className="absolute bottom-4 left-4">
              {images[selectedImage]?.viewLabel ?? `Variation ${selectedImage + 1}`}
            </Badge>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFullscreen(true)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleDownload(images[selectedImage]?.imageUrl, selectedImage)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Strip */}
      <div className="flex gap-3 justify-center flex-wrap">
        {images.map((image, index) => {
          const isIsometric = image.viewLabel === "Isometric View";
          return (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative rounded-lg overflow-hidden transition-all ${
                selectedImage === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
              title={image.viewLabel ?? `Variation ${index + 1}`}
            >
              <img
                src={image.imageUrl}
                alt={image.viewLabel ?? `Thumbnail ${index + 1}`}
                className="w-20 h-20 md:w-24 md:h-24 object-cover"
              />
              {/* Label overlay on thumbnail */}
              <span
                className={`absolute bottom-0 left-0 right-0 text-[9px] font-semibold text-center py-0.5 truncate ${
                  isIsometric
                    ? "bg-violet-600/90 text-white"
                    : "bg-black/60 text-white"
                }`}
              >
                {image.viewLabel ?? `View ${index + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Design Description */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Design Description
          </h3>
          <p className="text-muted-foreground text-sm">{designDescription}</p>
          <Button
            variant="link"
            className="px-0 mt-2"
            onClick={() => setShowPrompt(true)}
          >
            View AI prompt used
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Regenerate All
        </Button>
        <Button onClick={onModify} className="gap-2">
          Modify Design
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleDownload(images[selectedImage]?.imageUrl, selectedImage)}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download Current
        </Button>
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={images[selectedImage]?.imageUrl}
              alt={`Design variation ${selectedImage + 1}`}
              className="w-full h-full object-contain max-h-[90vh]"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Prompt Modal */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Prompt Used</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
            {prompt}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
