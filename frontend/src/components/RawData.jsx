import React, { useState } from 'react';

function RawData({ data }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="raw-data-container">
            <button 
                className="toggle-raw-data"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? '▼' : '▶'} View Raw QR Data
            </button>
            
            {isExpanded && (
                <div className="raw-data-content">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default RawData;
