// ============================================
// Image Extraction Route - Gemini Vision AI
// POST /api/extract - Upload image, get form data
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Multer Setup (memory storage - no disk write) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sirf image files allowed hain (jpg, png, webp, etc.)'));
    }
  }
});

// --- Gemini AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/extract - Extract vehicle data from image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Koi image upload nahi hui.' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ 
        success: false, 
        message: 'GEMINI_API_KEY .env file mein set nahi hai. Aapna API key add karein.' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a vehicle document OCR expert. Analyze this image (RC book, vehicle document, or any vehicle-related document) and extract the following information.

Return ONLY a valid JSON object with these exact keys. If a field is not found or not visible, use an empty string "".

{
  "imei": "",
  "rto": "",
  "vehicleType": "",
  "vehicleMake": "",
  "vehicleModel": "",
  "registrationYear": "",
  "engineNumber": "",
  "chassisNumber": "",
  "vehicleNumber": "",
  "customerName": "",
  "customerMobile": "",
  "iccId": "",
  "customerAddress": "",
  "reference": "",
  "simNumber1": "",
  "simNumber2": ""
}

Rules:
- vehicleNumber: registration plate number (e.g. MH01AB1234)
- vehicleMake: brand/manufacturer (e.g. Tata, Mahindra, Maruti)
- vehicleModel: model name (e.g. Nexon, Bolero, Swift)
- vehicleType: type like Car, Truck, Bus, Two Wheeler, etc.
- registrationYear: only the 4-digit year
- rto: RTO office name or code
- customerName: owner name
- customerAddress: full address
- chassisNumber: VIN or chassis number
- engineNumber: engine number
- For imei, simNumber1, simNumber2: usually not on RC documents, leave as ""
- For reference, iccId: extract if visible, else leave as ""

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

    // Convert image to base64 for Gemini
    const imageBase64 = req.file.buffer.toString('base64');
    const imageMimeType = req.file.mimetype;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();

    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      extractedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, '\nRaw response:', responseText);
      return res.status(500).json({
        success: false,
        message: 'AI response parse nahi ho saka. Kripya dobara try karein.',
      });
    }

    // Ensure all expected keys exist
    const defaultFields = {
      imei: '', rto: '', vehicleType: '', vehicleMake: '', vehicleModel: '',
      registrationYear: '', engineNumber: '', chassisNumber: '', vehicleNumber: '',
      customerName: '', customerMobile: '', iccId: '', aadharNumber: '', customerAddress: '',
      reference: '', simNumber1: '', simNumber2: ''
    };

    const finalData = { ...defaultFields, ...extractedData };
    if (finalData.aadharNumber && !finalData.iccId) {
      finalData.iccId = finalData.aadharNumber;
    }

    return res.json({
      success: true,
      message: 'Image se data successfully extract ho gaya!',
      data: finalData
    });

  } catch (error) {
    console.error('Extract route error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ success: false, message: 'Gemini API key invalid hai. Please check karein.' });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Image process karne mein error aaya. Dobara try karein.'
    });
  }
});

module.exports = router;
