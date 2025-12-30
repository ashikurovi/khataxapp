import { useState } from 'react';

const IMGBB_API_KEY =  '4c0b08895bc2ff1f30c87a652f06be0c';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

interface ImgBBUploadResponse {
    success: boolean;
    data?: {
        url: string;
        display_url: string;
        delete_url: string;
        thumb?: {
            url: string;
        };
        medium?: {
            url: string;
        };
    };
    error?: {
        message: string;
    };
}

interface UploadResult {
    url: string;
    displayUrl: string;
    deleteUrl: string;
    thumb?: string;
    medium?: string;
}

interface UseImageUploadReturn {
    uploadImage: (file: File) => Promise<UploadResult | null>;
    isUploading: boolean;
    uploadError: string | null;
    resetError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadImage = async (file: File): Promise<UploadResult | null> => {
        if (!file) {
            setUploadError('No file provided');
            return null;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file');
            return null;
        }

        // Validate file size (max 32MB for ImgBB)
        const maxSize = 32 * 1024 * 1024; // 32MB
        if (file.size > maxSize) {
            setUploadError('File size must be less than 32MB');
            return null;
        }

        if (!IMGBB_API_KEY) {
            setUploadError('Image upload API key is not configured');
            return null;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('key', IMGBB_API_KEY);

            const response = await fetch(IMGBB_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            const data: ImgBBUploadResponse = await response.json();

            if (data.success && data.data) {
                return {
                    url: data.data.url,
                    displayUrl: data.data.display_url,
                    deleteUrl: data.data.delete_url,
                    thumb: data.data.thumb?.url,
                    medium: data.data.medium?.url,
                };
            } else {
                setUploadError(data.error?.message || 'Upload failed');
                return null;
            }
        } catch (error) {
            setUploadError('Network error occurred during upload');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const resetError = (): void => {
        setUploadError(null);
    };

    return {
        uploadImage,
        isUploading,
        uploadError,
        resetError,
    };
};