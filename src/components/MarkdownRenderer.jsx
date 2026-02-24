import React from 'react';

const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    // Simple parser for basic markdown used in reports
    // Handles: ## Headers, **Bold**, - Lists, | Tables |
    const lines = content.split('\n');

    return (
        <div className="markdown-content">
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('## ')) {
                    return <h3 key={i} className="md-h2">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                    return <h4 key={i} className="md-h3">{line.replace('### ', '')}</h4>;
                }

                // Bold text replacement helper
                const renderText = (text) => {
                    const parts = text.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={index} className="md-bold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });
                };

                // List items
                if (line.trim().startsWith('- ')) {
                    return <li key={i} className="md-list-item">{renderText(line.replace('- ', ''))}</li>;
                }

                // Tables (Simple rendering)
                if (line.trim().startsWith('|')) {
                    if (lines[i + 1] && lines[i + 1].includes('---')) return null; // Skip separator line
                    if (line.includes('---')) return null; // Skip separator line explicitly

                    const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                    return (
                        <div key={i} className={`md-table-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                            {cells.map((cell, cIdx) => <span key={cIdx}>{renderText(cell)}</span>)}
                        </div>
                    );
                }

                // Paragraphs
                if (line.trim() === '') return <br key={i} />;

                return <p key={i} className="md-paragraph">{renderText(line)}</p>;
            })}
        </div>
    );
};

export default MarkdownRenderer;
