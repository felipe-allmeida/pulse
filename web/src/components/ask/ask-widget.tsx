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
import { Chip } from '@/components/signal/chip';
import { streamAsk } from '@/lib/ask';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
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
  const isOpen = useAskWidgetStore((s) => s.isOpen);
  const setOpen = useAskWidgetStore((s) => s.setOpen);
  const pendingQuestion = useAskWidgetStore((s) => s.pendingQuestion);
  const clearPendingQuestion = useAskWidgetStore((s) => s.clearPendingQuestion);

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

  // A suggestion chip elsewhere in the tree (e.g. the home page's "ask
  // chips") opened the widget with a question already chosen. Submit it
  // once, as if the visitor had typed and sent it themselves. Clearing
  // `pendingQuestion` immediately (before the async submit resolves) is
  // what makes this idempotent: a second effect run — a re-render, or
  // React StrictMode's dev double-invoke — sees `pendingQuestion` already
  // `null` and does nothing. Waiting on `!isStreaming` means a pending
  // question that arrives mid-stream is submitted once the current one
  // finishes, rather than being dropped or interleaved.
  useEffect(() => {
    if (isOpen && pendingQuestion && !isStreaming) {
      const question = pendingQuestion;
      clearPendingQuestion();
      void submit(question);
    }
  }, [isOpen, pendingQuestion, isStreaming]);

  function handleSend() {
    void submit(input);
  }

  function handleSuggestion(question: string) {
    setInput(question);
    void submit(question);
  }

  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      abortRef.current?.abort();
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {/*
          Compact on phones: with the full label this trigger was 252px wide on
          a 375px viewport (67% of the screen) and sat on top of page content,
          at 40px tall — under the 44px touch target. Below `sm` it collapses
          to a 48px circular icon button (label still announced via
          aria-label); from `sm` up the label comes back.
        */}
        <Button
          size="lg"
          aria-label={t('ask:trigger')}
          className="fixed right-6 bottom-6 z-50 size-12 rounded-full border border-signal/40 bg-signal p-0 font-mono text-signal-foreground shadow-[0_0_24px_-6px_var(--color-signal)] hover:bg-signal/90 sm:h-12 sm:w-auto sm:px-6"
        >
          <MessageCircle />
          <span className="hidden sm:inline">{t('ask:trigger')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="dark flex w-full flex-col border-signal/15 bg-background text-foreground sm:max-w-md"
      >
        <SheetHeader className="border-b border-signal/10">
          <SheetTitle className="font-mono text-signal">{t('ask:title')}</SheetTitle>
          <SheetDescription>{t('ask:description')}</SheetDescription>
          <p className="font-mono text-xs text-muted-foreground">{t('ask:disclaimer')}</p>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 px-4">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => handleSuggestion(question)}
              disabled={isStreaming}
              className="rounded-full transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
            >
              <Chip>{question}</Chip>
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
                    ? 'bg-signal text-signal-foreground'
                    : 'border border-signal/10 bg-signal-muted/15 text-foreground'
                )}
                aria-live={message.role === 'assistant' ? 'polite' : undefined}
              >
                {message.content}
              </div>
            </div>
          ))}
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-end gap-2 border-t border-signal/10 p-4">
          <Textarea
            value={input}
            maxLength={500}
            placeholder={t('ask:inputPlaceholder')}
            aria-label={t('ask:inputAriaLabel')}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-10 border-signal/20 bg-signal-muted/10 focus-visible:border-signal focus-visible:ring-signal/30"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="bg-signal text-signal-foreground hover:bg-signal/90"
          >
            <Send />
            <span className="sr-only">{t('ask:send')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
