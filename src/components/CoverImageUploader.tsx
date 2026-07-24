import React from 'react';
import { MediaField } from './media/MediaField';

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

/** @deprecated Prefer MediaField directly — kept as thin wrapper for articles cover. */
export const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  value,
  onChange,
  label = 'تصویر شاخص / کاور',
}) => {
  return (
    <MediaField
      label={label}
      value={value}
      onChange={onChange}
      accept="image"
      aspect="video"
      required
      helperText="از کتابخانه رسانه انتخاب کنید یا فایل جدید آپلود کنید"
    />
  );
};
