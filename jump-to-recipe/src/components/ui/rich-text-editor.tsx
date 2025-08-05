'use client';

import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Quote,
  Link
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your comment...',
  className,
  disabled = false,
  minHeight = '120px',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = 
      value.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertFormatting('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertFormatting('*', '*'),
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => insertFormatting('<u>', '</u>'),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertFormatting('\n- '),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertFormatting('\n1. '),
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertFormatting('\n> '),
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertFormatting('[', '](url)'),
    },
  ];

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-1">
          {formatButtons.map((button) => (
            <Button
              key={button.label}
              variant="ghost"
              size="sm"
              onClick={button.action}
              disabled={disabled || isPreview}
              title={button.label}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            disabled={disabled}
            className="text-xs"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="p-3">
        {isPreview ? (
          <div
            className="prose prose-sm max-w-none min-h-[120px] text-sm"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{
              __html: renderPreview(value) || '<p class="text-muted-foreground">Nothing to preview...</p>'
            }}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="border-0 p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="px-3 pb-2 text-xs text-muted-foreground">
        Use **bold**, *italic*, [links](url), &gt; quotes, - lists
      </div>
    </div>
  );
}