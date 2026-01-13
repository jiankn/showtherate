'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './AvatarUpload.module.css';

/**
 * AvatarUpload Component
 * Displays avatar with upload, crop, and delete functionality
 */
export default function AvatarUpload({
    avatarUrl,
    initials,
    onUploadSuccess,
    onDeleteSuccess,
    disabled = false,
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 80, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // 乐观更新预览

    const fileInputRef = useRef(null);
    const imageRef = useRef(null);

    // Handle file selection
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPG, PNG, WebP, GIF)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5MB');
            return;
        }

        setError(null);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    }, []);

    // Create cropped image blob
    const getCroppedImg = useCallback(async () => {
        if (!imageRef.current || !completedCrop) return null;

        const canvas = document.createElement('canvas');
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        const pixelCrop = {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
        };

        // Output size (200x200 for avatar)
        const outputSize = 200;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            imageRef.current,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            outputSize,
            outputSize
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                0.9
            );
        });
    }, [completedCrop]);

    // Upload avatar with optimistic update
    const handleUpload = useCallback(async () => {
        try {
            setIsUploading(true);
            setUploadProgress(10);
            setError(null);

            const blob = await getCroppedImg();
            if (!blob) {
                setError('Failed to process image');
                return;
            }

            // 🚀 乐观更新：立即创建本地预览 URL 并显示
            const localPreviewUrl = URL.createObjectURL(blob);
            setPreviewUrl(localPreviewUrl);
            setShowCropModal(false);
            setSelectedImage(null);

            setUploadProgress(30);

            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpg');

            setUploadProgress(50);

            const res = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(80);

            const data = await res.json();

            if (!res.ok) {
                // 上传失败，清除本地预览
                setPreviewUrl(null);
                URL.revokeObjectURL(localPreviewUrl);
                setError(data.error || 'Failed to upload avatar');
                return;
            }

            setUploadProgress(100);

            // 上传成功后，清除本地预览（使用服务器返回的 URL）
            URL.revokeObjectURL(localPreviewUrl);
            setPreviewUrl(null);

            if (onUploadSuccess) {
                onUploadSuccess(data.avatarUrl);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setPreviewUrl(null);
            setError('Failed to upload avatar');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [getCroppedImg, onUploadSuccess]);

    // Delete avatar
    const handleDelete = useCallback(async () => {
        if (!avatarUrl) return;

        try {
            setIsUploading(true);
            setError(null);

            const res = await fetch('/api/user/avatar', {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to delete avatar');
                return;
            }

            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete avatar');
        } finally {
            setIsUploading(false);
        }
    }, [avatarUrl, onDeleteSuccess]);

    // Cancel crop
    const handleCancelCrop = useCallback(() => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCrop({ unit: '%', width: 80, aspect: 1 });
        setCompletedCrop(null);
    }, []);

    return (
        <div className={styles.container}>
            {/* Avatar Display */}
            <div
                className={`${styles.avatar} ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                {/* 优先显示乐观更新的预览，其次显示服务器头像 */}
                {(previewUrl || avatarUrl) ? (
                    <img
                        src={previewUrl || avatarUrl}
                        alt="Avatar"
                        className={styles.avatarImage}
                    />
                ) : (
                    <span className={styles.avatarInitials}>{initials}</span>
                )}

                {/* Overlay on hover */}
                {!disabled && (
                    <div className={styles.overlay}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
                <button
                    className={styles.changeBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                >
                    {isUploading ? 'Uploading...' : 'Change Photo'}
                </button>

                {avatarUrl && (
                    <button
                        className={styles.deleteBtn}
                        onClick={handleDelete}
                        disabled={disabled || isUploading}
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
                disabled={disabled}
            />

            {/* Crop Modal */}
            {showCropModal && (
                <div className={styles.modalBackdrop} onClick={handleCancelCrop}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Crop Your Photo</h3>
                            <button className={styles.closeBtn} onClick={handleCancelCrop}>
                                ✕
                            </button>
                        </div>

                        <div className={styles.cropContainer}>
                            {selectedImage && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imageRef}
                                        src={selectedImage}
                                        alt="Crop preview"
                                        className={styles.cropImage}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {isUploading && (
                            <div className={styles.progressContainer}>
                                <div
                                    className={styles.progressBar}
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={handleCancelCrop}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.uploadBtn}
                                onClick={handleUpload}
                                disabled={isUploading || !completedCrop}
                            >
                                {isUploading ? `Uploading ${uploadProgress}%` : 'Save Photo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
