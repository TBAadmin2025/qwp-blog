import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="preview-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => <h2 {...props} />, 
          h3: ({ node, ...props }) => <h3 {...props} />,
          p: ({ node, ...props }) => <p {...props} />,
          ul: ({ node, ...props }) => <ul {...props} />,
          ol: ({ node, ...props }) => <ol {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          blockquote: ({ node, ...props }) => <blockquote {...props} />,
          strong: ({ node, ...props }) => <strong {...props} />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
