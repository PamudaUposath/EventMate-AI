import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface ChatMessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

/**
 * Cleanly formats chat messages:
 * - Parses and strips any raw markdown artifacts (** or _)
 * - Detects structured tasks with Priority and Deadline and renders them as styled task cards
 * - Renders lists and bullet points with proper layout
 * - Ensures typography is crisp and easy to read
 */
export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content, role }) => {
  if (role === 'user') {
    // For user messages, simple clean text
    return <div className="whitespace-pre-wrap">{cleanRawMarkdown(content)}</div>;
  }

  // Split content by double newlines or single newlines
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="space-y-3 text-xs leading-relaxed text-slate-200">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);

        // Check if paragraph contains task items (e.g. "1. Title (Priority: HIGH, Deadline: 2026-11-10)")
        const isTaskBlock = lines.some((line) => /^\d+\.\s+/.test(line));

        if (isTaskBlock) {
          return (
            <div key={pIdx} className="space-y-2 my-1">
              {parseTaskBlock(lines)}
            </div>
          );
        }

        // Check if paragraph is a bullet list (e.g. "- item" or "* item")
        const isBulletBlock = lines.length > 1 && lines.every((line) => /^[-*•]\s+/.test(line));
        if (isBulletBlock) {
          return (
            <ul key={pIdx} className="space-y-1.5 pl-2 list-none my-1">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-*•]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-brand-400 mt-0.5">•</span>
                    <span>{renderInlineFormatting(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard text paragraph
        return (
          <p key={pIdx} className="leading-relaxed">
            {renderInlineFormatting(paragraph)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Strips raw markdown artifacts like ** and stray underscores
 */
function cleanRawMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\*\*/g, '');
}

/**
 * Parses inline formatting (such as bold or italics) into React nodes without raw markdown
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // First, clean any remaining orphan double asterisks
  const sanitized = text.replace(/(?<!\*)\*\*(?!\*)/g, '');

  // Split by bold (**...**) or italic (_..._ or *...*)
  const tokens = sanitized.split(/(\*\*[^*]+?\*\*|_[^_]+?_|(?<!\*)\*[^*]+?\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2).trim();
      return (
        <span key={i} className="font-semibold text-white">
          {boldText}
        </span>
      );
    }
    if (token.startsWith('_') && token.endsWith('_')) {
      const italicText = token.slice(1, -1).trim();
      return (
        <span key={i} className="italic text-slate-300">
          {italicText}
        </span>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      const italicText = token.slice(1, -1).trim();
      return (
        <span key={i} className="italic text-slate-300">
          {italicText}
        </span>
      );
    }

    // Regular text (cleanup any stray asterisks)
    return token.replace(/\*\*/g, '');
  });
}

/**
 * Parses lines into task items with optional description lines below
 */
function parseTaskBlock(lines: string[]): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let currentTask: {
    number: string;
    title: string;
    priority?: string;
    deadline?: string;
    description?: string;
  } | null = null;

  const flushCurrentTask = (key: number) => {
    if (!currentTask) return;
    const task = currentTask;
    const priorityColor =
      task.priority?.toUpperCase() === 'HIGH'
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : task.priority?.toUpperCase() === 'MEDIUM'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-slate-800 text-slate-300 border-slate-700';

    elements.push(
      <div
        key={key}
        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all space-y-1.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
              {task.number}
            </span>
            <span className="font-semibold text-white text-xs">
              {cleanRawMarkdown(task.title)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            {task.priority && (
              <span
                className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${priorityColor}`}
              >
                {task.priority}
              </span>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1 text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{task.deadline}</span>
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
            {cleanRawMarkdown(task.description)}
          </p>
        )}
      </div>
    );
    currentTask = null;
  };

  lines.forEach((line, idx) => {
    // Check if line starts a numbered item: "1. Title ..."
    const taskMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (taskMatch) {
      flushCurrentTask(idx);
      const number = taskMatch[1];
      let rest = taskMatch[2];

      // Extract Priority and Deadline if present: (Priority: HIGH, Deadline: 2026-11-10)
      let priority: string | undefined;
      let deadline: string | undefined;

      const metaMatch = rest.match(/\((?:Priority:\s*([A-Za-z]+))?(?:,\s*Deadline:\s*([0-9-]+))?\)/i);
      if (metaMatch) {
        priority = metaMatch[1];
        deadline = metaMatch[2];
        rest = rest.replace(metaMatch[0], '').trim();
      }

      currentTask = {
        number,
        title: cleanRawMarkdown(rest),
        priority,
        deadline,
      };
    } else if (currentTask) {
      // Treat as description for the current task
      const desc = cleanRawMarkdown(line);
      currentTask.description = currentTask.description
        ? `${currentTask.description} ${desc}`
        : desc;
    } else {
      // Just a standard text line
      elements.push(
        <p key={idx} className="leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  flushCurrentTask(lines.length);
  return elements;
}
