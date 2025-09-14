import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { QuestionReportModal } from './QuestionReportModal';
import { ImageService, QuestionImage } from '@/lib/imageService';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: string;
  subject?: string;
  topic?: string;
}

interface EnhancedQuestionDisplayProps {
  question: Question;
  examId: string;
  testType: string;
  testId: string;
  showReportButton?: boolean;
  className?: string;
}

export const EnhancedQuestionDisplay: React.FC<EnhancedQuestionDisplayProps> = ({
  question,
  examId,
  testType,
  testId,
  showReportButton = true,
  className = ''
}) => {
  const [questionImages, setQuestionImages] = useState<QuestionImage[]>([]);
  const [optionImages, setOptionImages] = useState<QuestionImage[]>([]);
  const [explanationImages, setExplanationImages] = useState<QuestionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionImages();
  }, [question.id]);

  const loadQuestionImages = async () => {
    try {
      setLoading(true);
      const images = await ImageService.getQuestionImages(question.id);
      
      setQuestionImages(images.filter(img => img.image_type === 'question'));
      setOptionImages(images.filter(img => img.image_type === 'option'));
      setExplanationImages(images.filter(img => img.image_type === 'explanation'));
    } catch (error) {
      console.error('Error loading question images:', error);
      setImageError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (imageUrl: string) => {
    console.error('Image failed to load:', imageUrl);
    setImageError('Some images failed to load');
  };

  const renderImage = (image: QuestionImage, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'max-w-xs max-h-32',
      medium: 'max-w-md max-h-48',
      large: 'max-w-lg max-h-64'
    };

    return (
      <div key={image.id} className="relative group">
        <img
          {...ImageService.getImageProps(
            image.image_url,
            image.alt_text || 'Question image',
            `${sizeClasses[size]} cursor-pointer hover:opacity-90 transition-opacity`
          )}
          onError={() => handleImageError(image.image_url)}
          onClick={() => setSelectedImage(image.image_url)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const renderImages = (images: QuestionImage[], type: string) => {
    if (images.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="flex items-center space-x-2 mb-2">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">{type} Images</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {images.map(image => renderImage(image, 'medium'))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading question...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Question {question.id}</Badge>
              {question.difficulty && (
                <Badge variant="secondary">{question.difficulty}</Badge>
              )}
              {question.subject && (
                <Badge variant="outline">{question.subject}</Badge>
              )}
            </div>
            {showReportButton && (
              <QuestionReportModal
                examId={examId}
                testType={testType}
                testId={testId}
                questionId={question.id}
                questionText={question.question}
              />
            )}
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {question.question}
            </h3>
            
            {/* Question Images */}
            {renderImages(questionImages, 'Question')}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{option}</p>
                  {/* Option Images */}
                  {renderImages(
                    optionImages.filter(img => img.alt_text?.includes(`option-${index + 1}`)),
                    `Option ${String.fromCharCode(65 + index)}`
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-blue-500" />
                Explanation
              </h4>
              <div className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                <p>{question.explanation}</p>
                {/* Explanation Images */}
                {renderImages(explanationImages, 'Explanation')}
              </div>
            </div>
          )}

          {/* Image Error Alert */}
          {imageError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{imageError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={ImageService.getImageUrl(selectedImage)}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={() => setSelectedImage(null)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedQuestionDisplay;
