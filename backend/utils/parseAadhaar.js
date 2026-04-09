const zlib = require('zlib');
const xml2js = require('xml2js');
const Jimp = require('jimp');

async function parseAadhaarData(qrData) {
    try {
        console.log('Parsing QR data length:', qrData ? qrData.length : 0);
        
        let pidData;
        
        // QPDB v1 plain XML
        if (typeof qrData === 'string' && qrData.startsWith('<QPDB')) {
            console.log('Detected QPDB v1 plain XML');
            const xmlString = qrData;
            
            const parser = new xml2js.Parser({ explicitArray: false, trim: true });
            const result = await parser.parseStringPromise(xmlString);
            
            pidData = result.QPDB;
        } 
        
        // v2+ compressed
        else if (typeof qrData === 'string' && qrData.length > 100) {
            console.log('Trying compressed format');
            const buffer = Buffer.from(qrData, 'base64');
            
            const decompressed = zlib.inflateSync(buffer);
            const xmlString = decompressed.toString('utf8');
            
            const parser = new xml2js.Parser({ explicitArray: false, trim: true });
            const result = await parser.parseStringPromise(xmlString);
            
            pidData = result.PrintLetterBarcodeData || result.OfflineAadhaar;
        }
        
        if (pidData) {
            const normalized = {
                name: pidData.$.n || pidData.$.name || pidData.name || 'N/A',
                gender: pidData.$.g || pidData.$.gender || pidData.gender || 'N/A',
                dob: pidData.$.d || pidData.$.dob || pidData.dob || 'N/A',
                mobile: pidData.$.m || 'N/A',
                uid: pidData.$.u || pidData.$.uid || pidData.uid || 'N/A',
                address: pidData.$.a || formatAddress(pidData),
                photoB64: '',
                signatureB64: ''
            };
            
            const maskedAadhaar = normalized.uid.replace(/x{4}(\d{4})/, 'XXXX-$1');
            
            // Decode jp2 photo to PNG base64
            if (pidData.$.i) {
                try {
                    const photoBuffer = Buffer.from(pidData.$.i, 'base64');
                    const image = await Jimp.read(photoBuffer);
                    const pngBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
                    normalized.photoB64 = pngBuffer.toString('base64');
                } catch (photoErr) {
                    console.log('Photo decode failed:', photoErr.message);
                }
            }
            
            // Signature (optional)
            if (pidData.$.s) {
                normalized.signatureB64 = pidData.$.s;
            }
            
            return {
                verified: true,
                normalized,
                maskedAadhaar,
                user: pidData.$
            };
        }
        
        return {
            verified: false,
            normalized: { name: 'No data', gender: 'N/A', dob: 'N/A', address: 'Invalid QR', photoB64: '' },
            maskedAadhaar: 'N/A',
            user: { error: 'No PID data' }
        };
    } catch (error) {
        console.error('Parse error:', error.message);
        return {
            verified: false,
            normalized: { name: 'Parse Failed', gender: 'N/A', dob: 'N/A', address: error.message, photoB64: '' },
            maskedAadhaar: 'N/A',
            user: { error: error.message }
        };
    }
}

function formatAddress(data) {
    return data.$.a || 'N/A';
}

module.exports = { parseAadhaarData };
