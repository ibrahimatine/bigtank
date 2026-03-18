'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

const MAX_LENGTH = 1000;

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTypingSignal = useCallback(
    (typing: boolean) => {
      if (typing !== isTypingRef.current) {
        isTypingRef.current = typing;
        onTypingChange?.(typing);
      }
    },
    [onTypingChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_LENGTH) return;
    setContent(val);

    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
    }

    handleTypingSignal(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => handleTypingSignal(false), 2000);
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setContent('');
    handleTypingSignal(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remaining = MAX_LENGTH - content.length;
  const showCounter = remaining <= 100;
  const hasContent = content.trim().length > 0;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          rows={1}
          className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-4 py-3 text-[14px] outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-card)] transition-all max-h-32 overflow-y-auto placeholder:text-[var(--color-muted-foreground)]"
          style={{ minHeight: '44px' }}
        />
        {showCounter && (
          <span
            className={`absolute right-3 bottom-2.5 text-[10px] font-medium transition-colors ${
              remaining <= 20 ? 'text-red-500' : 'text-[var(--color-muted-foreground)]'
            }`}
          >
            {remaining}
          </span>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!hasContent}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
          hasContent
            ? 'bg-[var(--color-accent)] text-white shadow-sm hover:opacity-90 scale-100'
            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] scale-95'
        }`}
        aria-label="Envoyer"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
