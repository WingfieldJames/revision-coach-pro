import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, Copy, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ImageType = 'exam-question' | 'diagram' | 'notes' | 'general';

interface ImageTypeOption {
  value: ImageType;
  label: string;
  description: string;
}

const imageTypes: ImageTypeOption[] = [
  { value: 'exam-question', label: 'Exam Question', description: 'Past paper or practice question' },
  { value: 'diagram', label: 'Diagram', description: 'AD/AS, supply/demand, etc.' },
  { value: 'notes', label: 'Notes', description: 'Textbook or handwritten notes' },
  { value: 'general', label: 'General', description: 'Any other image' },
];

export const ImageUploadTool: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ImageType>('exam-question');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setExtractedText(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setExtractedText(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: imagePreview, imageType: selectedType }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze image. Please try again.');
        return;
      }

      if (data?.extractedText) {
        setExtractedText(data.extractedText);
        toast.success('Image analyzed successfully!');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;

    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success('Copied to clipboard! Paste it in the chat.');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setExtractedText(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <Image className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Image to Text</h3>
          <p className="text-xs text-muted-foreground">
            Upload to extract text for the chatbot
          </p>
        </div>
      </div>

      {/* Image Type Selector */}
      <div className="flex flex-wrap gap-2">
        {imageTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedType === type.value
                ? 'bg-gradient-brand text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Upload Area */}
      {!imagePreview ? (
        <label 
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:bg-muted/50'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">{isDragging ? 'Drop image here' : 'Click or drag to upload'}</span>
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max 10MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </label>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-40 object-contain rounded-lg border border-border"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-background transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Analyze Button */}
          {!extractedText && (
            <Button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Extract Text
                </>
              )}
            </Button>
          )}

          {/* Extracted Text */}
          {extractedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Extracted Text</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-1.5 text-xs h-7"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs text-foreground font-sans">
                  {extractedText}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Paste this into the chatbot to get help!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
