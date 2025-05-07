import React from 'react';
import './ResultStyles.css';

const ImageResult = ({ result, uuid, onDelete }) => {
  return (
    <div className="result-container">
      <div className="result-header">
        <div className="result-header-content">
          <h3>Image to GreyScale Result</h3>
          <div className="id-container">
            <small>ID: {uuid}</small>
          </div>
        </div>
        <button className="delete-button" onClick={onDelete}>×</button>
      </div>
      <div className="result-content">
        <img src={result} alt="Processed image" style={{ maxWidth: '100%' }} />
      </div>
    </div>
  );
};

export default ImageResult; 