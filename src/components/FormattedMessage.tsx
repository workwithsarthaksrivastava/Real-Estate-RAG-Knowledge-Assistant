import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  return (
    <div className="markdown-content text-sm text-neutral-200 leading-relaxed select-text space-y-2.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight mt-3 mb-1.5 pb-1 border-b border-neutral-800/80 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight mt-3 mb-1.5 flex items-center gap-2 text-amber-300">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-neutral-100 mt-2.5 mb-1 text-amber-200/90">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-neutral-200 mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-100 text-amber-100/90">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-300">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-amber-400/70 text-neutral-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-amber-400/80 text-neutral-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-2 border-amber-500/60 bg-amber-500/5 px-3.5 py-2 rounded-r-lg text-xs text-amber-200/90 italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-amber-300 font-mono text-[11px] border border-neutral-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 overflow-x-auto my-2">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-neutral-800 bg-neutral-950/80">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-300 font-semibold uppercase tracking-wider text-[11px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-800/60">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-900/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 text-neutral-200 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-neutral-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3 border-neutral-800" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
