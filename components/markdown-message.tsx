"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { IconCheck, IconCopy } from "@/components/icons";
import { cn } from "@/lib/utils";

type MarkdownMessageProps = {
  content: string;
  className?: string;
  /** While tokens arrive, soften unfinished markdown so raw ** / ``` don't flash. */
  streaming?: boolean;
};

/** Close a few common unfinished markers so streaming text looks like real markdown. */
function softenStreamingMarkdown(text: string): string {
  let out = text;

  const fenceCount = out.split("```").length - 1;
  if (fenceCount % 2 === 1) {
    out += "\n```";
  }

  const boldCount = out.split("**").length - 1;
  if (boldCount % 2 === 1) {
    out += "**";
  }

  return out;
}

export function MarkdownMessage({
  content,
  className,
  streaming = false,
}: MarkdownMessageProps) {
  const rendered = streaming ? softenStreamingMarkdown(content) : content;

  return (
    <div
      className={cn(
        "barre-md text-[15px] leading-7 text-foreground break-words",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-xl font-semibold tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-4 text-lg font-semibold tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3.5 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-accent/50 pl-3 text-muted italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted-bg px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const text = String(children).replace(/\n$/, "");
            const isBlock = Boolean(codeClassName) || text.includes("\n");

            if (!isBlock) {
              return (
                <code
                  className="rounded-md bg-muted-bg px-1.5 py-0.5 font-mono text-[0.86em] text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const language =
              /language-([\w-]+)/.exec(codeClassName || "")?.[1] ?? "code";

            return (
              <CodeBlock language={language} code={text}>
                {children}
              </CodeBlock>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {rendered}
      </ReactMarkdown>
      {streaming ? <span className="stream-caret" aria-hidden /> : null}
    </div>
  );
}

function CodeBlock({
  language,
  code,
  children,
}: {
  language: string;
  code: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-border bg-[#0b1214] text-[#e8f4f5]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px] text-white/55">
        <span className="font-mono uppercase tracking-wide">{language}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
          aria-label="Copy code"
        >
          {copied ? (
            <IconCheck className="h-3.5 w-3.5 text-accent" />
          ) : (
            <IconCopy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-6">
        <code>{children}</code>
      </pre>
    </div>
  );
}
