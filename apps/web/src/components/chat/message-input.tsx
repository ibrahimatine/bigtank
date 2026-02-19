'use client';

import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

const MAX_LENGTH = 1000;

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

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

    // Signaler frappe en cours
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remaining = MAX_LENGTH - content.length;
  const isNearLimit = remaining <= 100;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ecrire un message... (Entree pour envoyer)"
          rows={1}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 pr-16 text-sm outline-none focus:border-[var(--color-accent)] transition-colors max-h-32 overflow-y-auto"
          style={{ minHeight: '48px' }}
        />
        {isNearLimit && (
          <span
            className={`absolute right-12 bottom-3 text-xs ${
              remaining <= 20 ? 'text-red-500' : 'text-[var(--color-muted-foreground)]'
            }`}
          >
            {remaining}
          </span>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="w-10 h-10 rounded-xl bg-[var(--color-accent)] text-white flex items-center justify-center hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        aria-label="Envoyer"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
