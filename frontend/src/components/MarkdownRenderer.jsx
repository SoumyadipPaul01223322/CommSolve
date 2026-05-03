import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ content }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-white mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-2 mt-3">{children}</h3>,
          p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 mb-3 ml-1 list-decimal list-inside">{children}</ol>,
          li: ({ children }) => (
            <li className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-purple-400 mt-1 shrink-0">&#x2022;</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-purple-300">{children}</em>,
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-white/10 text-pink-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <pre className="bg-white/[0.06] border border-white/10 rounded-xl p-4 overflow-x-auto mb-3">
                <code className="text-sm text-gray-300 font-mono">{children}</code>
              </pre>
            ),
          pre: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-500/50 pl-4 my-3 text-gray-400 italic">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 rounded-xl border border-white/10">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.06]">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-gray-300 border-t border-white/5">{children}</td>,
          hr: () => <hr className="border-white/10 my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
