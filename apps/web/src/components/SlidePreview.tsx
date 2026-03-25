import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SlidePreviewProps {
  headline: string;
  subCaption: string;
  thumbnailUrl?: string | null;
  slideNumber?: number;
}

export function SlidePreview({ headline, subCaption, thumbnailUrl, slideNumber = 1 }: SlidePreviewProps) {
  return (
    <Card className="overflow-hidden">
      {/* Slide Image/Background */}
      <div className="relative h-64 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-6">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Slide thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Slide Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end text-white">
          {slideNumber === 1 && (
            <>
              <div className="mb-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  Cover Slide
                </Badge>
              </div>
              <h2 className="text-2xl font-bold mb-2 leading-tight">
                {headline || 'Your Headline'}
              </h2>
              <p className="text-sm opacity-90 line-clamp-2">
                {subCaption || 'Your sub-caption goes here'}
              </p>
            </>
          )}

          {slideNumber > 1 && (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <p className="text-white text-sm text-center">
                  Slide {slideNumber}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ExtensionSlidePreviewProps {
  slideNumber: number;
  copy: string;
}

export function ExtensionSlidePreview({ slideNumber, copy }: ExtensionSlidePreviewProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-6">
        <div className="text-white text-center w-full">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/30">
            Slide {slideNumber}
          </Badge>
          <p className="text-sm leading-relaxed px-4">
            {copy || 'Empty slide'}
          </p>
        </div>
      </div>
    </Card>
  );
}
