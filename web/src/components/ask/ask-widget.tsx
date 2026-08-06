import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { streamAsk } from '@/lib/ask';
import { cn } from '@/lib/utils';
import type { Locale } from '@/content/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AskWidget() {
  const { t, i18n } = useTranslation('ask');
  const locale: Locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestedQuestions = [
    t('ask:suggestions.kubernetes'),
    t('ask:suggestions.stack'),
    t('ask:suggestions.remote'),
  ];

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setInput('');

    const history = messages.slice(-4).map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAsk({
        question: trimmed,
        history,
        locale,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + chunk };
            }
            return next;
          });
        },
      });
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setError(t('ask:error'));
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSend() {
    void submit(input);
  }

  function handleSuggestion(question: string) {
    setInput(question);
    void submit(question);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      abortRef.current?.abort();
    }
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          id="ask-widget-trigger"
          className="fixed bottom-6 right-6 z-50 shadow-lg"
          size="lg"
        >
          <MessageCircle />
          {t('ask:trigger')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('ask:title')}</SheetTitle>
          <SheetDescription>{t('ask:description')}</SheetDescription>
          <p className="text-xs text-muted-foreground">{t('ask:disclaimer')}</p>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 px-4">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => handleSuggestion(question)}
              disabled={isStreaming}
              className="rounded-full border border-input bg-transparent px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
                aria-live={message.role === 'assistant' ? 'polite' : undefined}
              >
                {message.content}
              </div>
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-end gap-2 border-t p-4">
          <Textarea
            value={input}
            maxLength={500}
            placeholder={t('ask:inputPlaceholder')}
            aria-label={t('ask:inputAriaLabel')}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-10"
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            <Send />
            <span className="sr-only">{t('ask:send')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
