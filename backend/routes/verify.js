const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const { parseAadhaarData } = require('../utils/parseAadhaar');

const upload = multer({ dest: 'uploads/' });

// New API endpoint for frontend
router.post('/verify-qr', async (req, res) => {
    try {
        const { raw } = req.body;
        console.log('QR verify-qr raw length:', raw ? raw.length : 0);
        
        const parsed = await parseAadhaarData(raw);
        
        res.json(parsed);
    } catch (error) {
        console.error('Verify QR error:', error.message);
        res.status(400).json({
            verified: false,
            normalized: { name: 'Error', gender: '', dob: '', address: '', photo: '' },
            maskedAadhaar: '',
            user: { error: error.message }
        });
    }
});

// Legacy endpoint
router.post('/aadhaar', async (req, res) => {
    try {
        const { qrData } = req.body;
        const parsed = await parseAadhaarData(qrData);
        res.json({ success: true, data: parsed });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Upload QR image
router.post('/upload-qr', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) return res.status(400).json({success: false, error: err.message});
        if (!req.file) return res.status(400).json({success: false, error: 'No image'});
        
        const imagePath = req.file.path;
        try {
            console.log('Processing image:', imagePath);
            
            let image = await Jimp.read(imagePath);
            image.resize(800, Jimp.AUTO);
            
            // Robust versions - NO BRIGHTEN
            const versions = [
                image.clone().greyscale().bitmap,
                image.clone().contrast(0.5).normalize().bitmap,
                image.clone().contrast(0.3).sharpen().greyscale().normalize().bitmap,
                image.clone().invert().contrast(0.5).normalize().bitmap
            ];
            
let qrText = '';
            for (let i = 0; i < versions.length; i++) {
                const { data, width, height } = versions[i];
                const qrData = new Uint8ClampedArray(data);
                const code = jsQR(qrData, width, height);
                if (code) {
                    qrText = code.data;
                    console.log(`QR found version ${i+1}: length ${qrText.length}`);
                    break;
                }
            }
            
            const parsed = await parseAadhaarData(qrText);
            res.json(parsed);
            
            fs.unlinkSync(imagePath).catch(() => {});
        } catch (error) {
            console.error('Upload error:', error.message);
            res.status(400).json({
                verified: false,
                normalized: { name: 'Process Error', gender: '', dob: '', address: '', photo: '' },
                maskedAadhaar: '',
                user: { error: error.message }
            });
            fs.unlinkSync(imagePath).catch(() => {});
        }
    });
});

module.exports = router;
