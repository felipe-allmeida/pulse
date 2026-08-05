import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'Does Felipe have Kubernetes experience?',
  "What's Felipe's strongest tech stack?",
  'Is Felipe open to remote roles?',
];

export function AskWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setInput('');

    const history = messages.slice(-4).map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      await streamAsk({
        question: trimmed,
        history,
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
    } catch {
      setError("Sorry, something went wrong. Please try again in a moment.");
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 shadow-lg"
          size="lg"
        >
          <MessageCircle />
          Ask about Felipe
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask about Felipe</SheetTitle>
          <SheetDescription>
            Ask anything about Felipe&apos;s experience, skills, or availability.
          </SheetDescription>
          <p className="text-xs text-muted-foreground">
            AI assistant — answers may be imperfect and come only from Felipe&apos;s profile.
          </p>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 px-4">
          {SUGGESTED_QUESTIONS.map((question) => (
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
            placeholder="Ask about Felipe's experience..."
            onChange={(event) => setInput(event.target.value)}
            className="min-h-10"
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            <Send />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
