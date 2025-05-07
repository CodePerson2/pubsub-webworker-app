import React from 'react';
import './ResultStyles.css';

const PasswordHashResult = ({ result, uuid, onDelete }) => {
  const { hash, salt, saltRounds } = result;

  return (
    <div className="result-container password-result">
      <div className="result-header">
        <div className="result-header-content">
          <h3>Password Hash Result</h3>
          <div className="id-container">
            <small>ID: {uuid}</small>
          </div>
        </div>
        <button className="delete-button" onClick={() => onDelete(uuid)}>×</button>
      </div>
      <div className="result-content">
        <div className="result-item">
          <span className="label">Salt:</span>
          <code className="value">{salt}</code>
        </div>
        <div className="result-item">
          <span className="label">Hash:</span>
          <code className="value">{hash}</code>
        </div>
        <div className="result-item">
          <span className="label">Salt Rounds:</span>
          <span className="value">{saltRounds}</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordHashResult;
