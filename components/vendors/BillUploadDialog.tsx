'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Bill, Purchase } from '@/lib/firestore';

// Helper function to compress image
const compressImage = (file: File, maxSizeKB: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to reduce file size
      let { width, height } = img;
      const maxDimension = 1200; // Max width or height
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels until we get under the size limit
      let quality = 0.8;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Keep reducing quality until file is small enough
      while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) { // 1.37 accounts for base64 overhead
        quality -= 0.1;
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to convert file to base64 with compression
const convertFileToBase64 = async (file: File): Promise<string> => {
  // For images, compress them first
  if (file.type.startsWith('image/')) {
    try {
      return await compressImage(file, 800); // Target 800KB for base64
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      // Fall back to original file conversion
    }
  }
  
  // For PDFs and other files, or if image compression failed
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

interface BillUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadBill: (billData: Omit<Bill, 'id' | 'uploadedAt'>) => Promise<void>;
  vendorId: string;
  vendorName: string;
  purchaseDate: string;
  totalAmount: number;
  purchaseItem?: Purchase | null;
  uploadType?: 'single' | 'all';
}

export default function BillUploadDialog({
  isOpen,
  onClose,
  onUploadBill,
  vendorId,
  vendorName,
  purchaseDate,
  totalAmount,
  purchaseItem,
  uploadType = 'all'
}: BillUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploading(false);
      setError('');
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB for original file)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');

      // Convert file to base64 with compression
      const fileData = await convertFileToBase64(selectedFile);
      
      // Check final base64 size (Firestore limit is ~1MB)
      if (fileData.length > 900 * 1024) { // 900KB limit to be safe
        setError('File is too large after processing. Please use a smaller file or lower quality image.');
        return;
      }

      const billData: Omit<Bill, 'id' | 'uploadedAt'> = {
        vendorId,
        vendorName,
        purchaseDate,
        fileName: selectedFile.name,
        fileData: fileData,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        totalAmount,
        billType: uploadType === 'single' ? 'child' : 'parent',
        purchaseId: uploadType === 'single' ? purchaseItem?.id : null,
        vegetableName: uploadType === 'single' ? purchaseItem?.vegetable : null
      };

      await onUploadBill(billData);
      
      // Reset form
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Error uploading bill:', error);
      setError(`Failed to upload bill. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload {uploadType === 'single' ? 'Item Bill' : 'Parent Bill'}</span>
          </DialogTitle>
          <DialogDescription>
            Upload {uploadType === 'single' ? `item bill for ${purchaseItem?.vegetable}` : 'parent bill covering all purchases'} on {new Date(purchaseDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Purchase Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Bill Type:</span>
              <span className="text-blue-600 font-semibold">
                {uploadType === 'single' ? 'Item Bill (Child)' : 'Parent Bill (All Items)'}
              </span>
            </div>
            {uploadType === 'single' && purchaseItem && (
              <div className="flex justify-between">
                <span className="font-medium">Item:</span>
                <span>{purchaseItem.vegetable}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Vendor:</span>
              <span>{vendorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{new Date(purchaseDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
            </div>
            {uploadType === 'single' && purchaseItem && (
              <div className="flex justify-between">
                <span className="font-medium">Weight:</span>
                <span>{purchaseItem.receivedWeight || purchaseItem.orderedWeight} kg</span>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="bill-file">Select Bill/Invoice File</Label>
            <Input
              id="bill-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG, PDF (Max size: 5MB)
              <br />
              <span className="text-blue-600">Images will be automatically compressed to fit storage limits</span>
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Bill
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}