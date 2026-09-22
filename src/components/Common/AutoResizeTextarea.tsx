import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(({
  value,
  onChange,
  className = '',
  minRows = 2,
  maxRows = 12,
  rows,
  ...props
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computedStyle = window.getComputedStyle(el);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 8;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 1;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 1;

    const effectiveMinRows = rows || minRows;
    const minHeight = (effectiveMinRows * lineHeight) + paddingTop + paddingBottom + borderTop + borderBottom;
    const maxHeight = (maxRows * lineHeight) + paddingTop + paddingBottom + borderTop + borderBottom;

    const targetHeight = Math.max(minHeight, el.scrollHeight);
    if (targetHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = 'auto';
    } else {
      el.style.height = `${targetHeight}px`;
      el.style.overflowY = 'hidden';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={`overflow-hidden resize-none transition-[height] duration-75 ${className}`}
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
