import React from 'react';

function ResultCard({ data }) {
    return (
        <div className="result-card">
            <h2>Verified Aadhaar Details</h2>
            <div className="details-grid">
                {data.name && (
                    <div className="detail-item">
                        <label>Full Name:</label>
                        <span>{data.name}</span>
                    </div>
                )}
                {data.uid && (
                    <div className="detail-item">
                        <label>Aadhaar Number:</label>
                        <span>XXXX-XXXX-{data.uid.slice(-4)}</span>
                    </div>
                )}
                {data.dob && (
                    <div className="detail-item">
                        <label>Date of Birth:</label>
                        <span>{data.dob}</span>
                    </div>
                )}
                {data.gender && (
                    <div className="detail-item">
                        <label>Gender:</label>
                        <span>{data.gender}</span>
                    </div>
                )}
                {data.address && (
                    <div className="detail-item">
                        <label>Address:</label>
                        <span>{data.address}</span>
                    </div>
                )}
                {data.profileImage && (
                    <div className="detail-item">
                        <label>Profile Image:</label>
                        <img src={data.profileImage} alt="Profile" className="profile-image" />
                    </div>
                )}
            </div>
            <div className="verification-badge">
                <span className="verified">✓ Verified</span>
            </div>
        </div>
    );
}

export default ResultCard;
