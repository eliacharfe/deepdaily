// apps/web/components/markdown-content.tsx

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as Prism from "prismjs";
import "@/lib/prism";

type Props = {
    content: string;
    className?: string;
};

function childrenToText(children: React.ReactNode): string {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(childrenToText).join("");
    return "";
}

export default function MarkdownContent({ content, className = "" }: Props) {
    return (
        <div
            className={[
                "min-w-0 text-sm leading-relaxed text-slate-900 dark:text-[#F1E7DF]",
                "[&_p]:my-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5",
                "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold",
                "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold",
                "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
                "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold",
                "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-[#5A524D]",
                "[&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-[#4C4541]",
                "[&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto",
                "[&_code]:max-w-full",
                "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
                "[&_img]:max-w-full",
                "[&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80",
                className,
            ].join(" ")}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className, children, ...props }) {
                        const lang =
                            (className || "").match(/language-(\w+)/)?.[1] || "";
                        const isBlock = /language-\w+/.test(className || "");

                        if (isBlock) {
                            const raw = childrenToText(children).replace(/\n$/, "");
                            const grammar = Prism.languages[lang];
                            const highlighted = grammar
                                ? Prism.highlight(raw, grammar, lang)
                                : raw;

                            return (
                                <div className="relative my-4 max-w-full min-w-0" dir="ltr">
                                    <div className="absolute right-3 top-3">
                                        {lang ? (
                                            <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-gray-300">
                                                {lang}
                                            </span>
                                        ) : null}
                                    </div>

                                    <pre
                                        dir="ltr"
                                        className="max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 pt-10 text-sm"
                                    >
                                        <code
                                            className={className}
                                            dangerouslySetInnerHTML={{
                                                __html: highlighted,
                                            }}
                                        />
                                    </pre>
                                </div>
                            );
                        }

                        return (
                            <code
                                dir="ltr"
                                className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-xs text-gray-100 border border-white/10"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}