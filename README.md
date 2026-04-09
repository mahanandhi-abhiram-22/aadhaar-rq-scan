# Aadhaar QR Verification System

A web-based application that scans the **QR code present on an Aadhaar card**, extracts the encoded data, verifies it, and displays the parsed information in a user-friendly interface.

This project demonstrates **secure QR decoding, data parsing, and frontend visualization** using modern web technologies.

---

## Features

- Scan Aadhaar QR Code using device camera  
- Decode QR payload  
- Parse Aadhaar structured data  
- Display extracted information on UI  
- Error handling for invalid QR codes  
- Modular backend architecture  
- Clean React-based frontend interface  

---

## Tech Stack

### Frontend
- React  
- JavaScript  
- HTML5  
- CSS3  

### Backend
- Node.js  
- Express.js  

### Libraries
- QR decoding libraries  
- Aadhaar data parser  
- Camera access APIs  

---

## Project Structure


aadhaar-qr-verification/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ └── Scanner.js
│ │ ├── App.js
│ │ └── index.js
│ │
│ └── package.json
│
├── backend/
│ ├── controllers/
│ │ └── qrController.js
│ │
│ ├── routes/
│ │ └── qrRoutes.js
│ │
│ ├── services/
│ │ └── aadhaarParser.js
│ │
│ └── server.js
│
└── README.md


---

## Aadhaar QR Data Fields

When a QR code is scanned, the payload contains structured Aadhaar information.

Example decoded fields:

| Key | Meaning |
|----|----|
| n | Name |
| g | Gender |
| d | Date of Birth |
| a | Address |
| u | Masked Aadhaar Number |
| m | Masked Mobile Number |
| i | Digital signature data |
| x | Optional metadata |
| s | QR version / signature flag |

---

## Installation

### 1. Clone Repository


git clone https://github.com/yourusername/aadhaar-qr-verification.git

cd aadhaar-qr-verification


---

### 2. Install Backend Dependencies


cd backend
npm install


---

### 3. Install Frontend Dependencies


cd ../frontend
npm install


---

## Running the Application

### Start Backend


cd backend
node server.js


Backend runs on:


http://localhost:5000


---

### Start Frontend


cd frontend
npm start


Frontend runs on:


http://localhost:3000


---

## How It Works

1. User opens the web interface  
2. Camera scans Aadhaar QR code  
3. QR payload is decoded  
4. Encoded data is sent to backend  
5. Backend parses Aadhaar fields  
6. Extracted details are returned  
7. Frontend displays the information  

---
