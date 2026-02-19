
import React from 'react';

const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    // Simple parser for basic markdown used in reports
    // Handles: ## Headers, **Bold**, - Lists, | Tables |
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    return (
        <div>
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('## ')) {
                    return <h3 key={i} style={{ color: 'var(--color-primary-blue)', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary-orange)', paddingBottom: '0.25rem' }}>{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                    return <h4 key={i} style={{ color: '#4b5563', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem' }}>{line.replace('### ', '')}</h4>;
                }

                // Bold text replacement helper
                const renderText = (text) => {
                    const parts = text.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={index} style={{ color: '#111827' }}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });
                };

                // List items
                if (line.trim().startsWith('- ')) {
                    return <li key={i} style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{renderText(line.replace('- ', ''))}</li>;
                }

                // Tables (Simple rendering)
                if (line.trim().startsWith('|')) {
                    // Start or continue table
                    // Ideally check next line for separator |---| but simplistic approach for now
                    if (lines[i + 1] && lines[i + 1].includes('---')) return null; // Skip separator line
                    if (line.includes('---')) return null; // Skip separator line explicitly

                    const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                    return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '10px', padding: '8px', borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                            {cells.map((cell, cIdx) => <span key={cIdx}>{renderText(cell)}</span>)}
                        </div>
                    );
                }

                // Paragraphs
                if (line.trim() === '') return <br key={i} />;

                return <p key={i} style={{ marginBottom: '0.5rem' }}>{renderText(line)}</p>;
            })}
        </div>
    );
};

export default MarkdownRenderer;
