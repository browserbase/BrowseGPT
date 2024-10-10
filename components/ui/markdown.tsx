import React from 'react';

export const MarkdownWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="markdown-content">
    <style jsx global>{`
      .markdown-content {
        ul, ol {
          margin: 0em 0;
        }
        li {
          margin: 0em 0;
          line-height: 1.5;
        }
        p {
          margin: -0em 0;
        }
        ul ul, ul ol {
          margin: -1.5em 0;
        }
        ol ol, ol ul {
          margin: -1.5em 0;
        }
          h1, h2, h3, h4, h5, h6 {
            font-weight: bold;
          }
      }
    `}</style>
    {children}
  </div>
);
