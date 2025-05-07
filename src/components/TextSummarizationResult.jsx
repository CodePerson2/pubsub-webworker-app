import React from 'react';
import './ResultStyles.css';

const TextSummarizationResult = ({ result, uuid, onDelete }) => {
  // Handle both string and object result formats
  const isObjectResult = typeof result === 'object' && result !== null;
  const summary = isObjectResult ? result.summary : (result || '');
  
  // Extract metrics if available
  const originalWordCount = isObjectResult ? result.originalWordCount : 0;
  const summaryWordCount = isObjectResult ? result.summaryWordCount : summary.split(/\s+/).filter(word => word.trim()).length;
  const compressionRatio = isObjectResult ? result.compressionRatio : 0;
  const originalSentenceCount = isObjectResult ? result.originalSentenceCount : 0;
  const summarySentenceCount = isObjectResult ? result.summarySentenceCount : 0;

  return (
    <div className="result-container">
      <div className="result-header">
        <div className="result-header-content">
          <h3>Text Summarization Result</h3>
          <div className="id-container">
            <small>ID: {uuid}</small>
          </div>
        </div>
        <button className="delete-button" onClick={onDelete}>×</button>
      </div>
      <div className="result-content">
        <div className="summary-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Original Text:</span>
              <span className="stat-value">{originalWordCount} words</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Summary:</span>
              <span className="stat-value">{summaryWordCount} words</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Compression:</span>
              <span className="stat-value">{compressionRatio}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sentences:</span>
              <span className="stat-value">{summarySentenceCount} of {originalSentenceCount}</span>
            </div>
          </div>
        </div>
        <div className="summary-text">
          <p>{summary}</p>
        </div>
      </div>
    </div>
  );
};

export default TextSummarizationResult;
