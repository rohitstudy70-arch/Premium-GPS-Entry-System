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
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Sirf image files aur PDF documents allowed hain (jpg, png, pdf, etc.)'));
    }
  }
});

// --- Gemini AI Setup ---
// We support both a single key and comma-separated multiple keys in env for automatic rotation
const getApiKeys = () => {
  if (process.env.GEMINI_API_KEYS) {
    return process.env.GEMINI_API_KEYS.split(',')
      .map(key => key.trim())
      .filter(key => key && key !== 'your_gemini_api_key_here');
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    return process.env.GEMINI_API_KEY.split(',')
      .map(key => key.trim())
      .filter(key => key && key !== 'your_gemini_api_key_here');
  }
  return [];
};

// POST /api/extract - Extract vehicle data from image or PDF
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Koi file upload nahi hui.' });
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'GEMINI_API_KEY ya GEMINI_API_KEYS .env file mein set nahi hai. Kripya add karein.' 
      });
    }

    const prompt = `You are a vehicle document OCR expert. Analyze this document (image or PDF, such as an RC book, vehicle document, or any vehicle-related document) and extract the following information.

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

    // Convert file to base64 for Gemini
    const fileBase64 = req.file.buffer.toString('base64');
    const fileMimeType = req.file.mimetype;

    const filePart = {
      inlineData: {
        data: fileBase64,
        mimeType: fileMimeType,
      },
    };

    let responseText = '';
    let apiSuccess = false;
    let lastError = null;

    // Loop through all keys to try extraction (Key Rotation)
    for (let i = 0; i < apiKeys.length; i++) {
      const activeKey = apiKeys[i];
      try {
        console.log(`[AI Auto-Fill] Trying Gemini extraction with key index ${i + 1} of ${apiKeys.length}...`);
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const result = await model.generateContent([prompt, filePart]);
        responseText = result.response.text().trim();
        apiSuccess = true;
        console.log(`[AI Auto-Fill] Success with API Key index ${i + 1}!`);
        break; // Exit loop on success
      } catch (err) {
        lastError = err;
        console.error(`[AI Auto-Fill] Key index ${i + 1} failed:`, err.message || err);
        // Continue loop to try next key
      }
    }

    if (!apiSuccess) {
      const errMsg = lastError?.message || 'Unknown Gemini error';
      if (
        errMsg.includes('429') || 
        errMsg.includes('Quota') || 
        errMsg.includes('quota') || 
        errMsg.includes('limit')
      ) {
        return res.status(429).json({
          success: false,
          message: 'Saari configured Gemini API keys ki limits exceed ho chuki hain. Kripya Google AI Studio me aur keys banakar add karein ya thodi der baad try karein.'
        });
      }
      return res.status(500).json({
        success: false,
        message: `Gemini AI error: ${errMsg}`
      });
    }

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
      message: 'File se data successfully extract ho gaya!',
      data: finalData
    });

  } catch (error) {
    console.error('Extract route error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'File process karne mein error aaya. Dobara try karein.'
    });
  }
});

// POST /api/extract/text - Extract vehicle data from pasted text
router.post('/text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Koi text nahi mila.' });
    }

    const prompt = `You are a vehicle document details parser. Analyze this raw text (which was copied from a vehicle document, RC book, OCR, or PDF text) and extract the following information.

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
- customerMobile: customer's 10-digit mobile number
- customerAddress: full address
- chassisNumber: VIN or chassis number
- engineNumber: engine number
- imei: 15-digit device IMEI if mentioned
- iccId: 19 or 20 digit ICCID if mentioned
- simNumber1, simNumber2: SIM phone numbers if mentioned
- reference: reference if mentioned

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

    let responseText = '';
    let apiSuccess = false;
    let lastError = null;

    // --- Try Groq API first if key exists ---
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      try {
        console.log('[AI Text Auto-Fill] Trying Groq Llama extraction...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-7b-specdec',
            messages: [
              { role: 'user', content: `${prompt}\n\nHere is the text:\n${text}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          })
        });

        if (!response.ok) {
          throw new Error(`Groq HTTP error! status: ${response.status}`);
        }

        const resData = await response.json();
        responseText = resData.choices[0].message.content.trim();
        apiSuccess = true;
        console.log('[AI Text Auto-Fill] Success with Groq Llama!');
      } catch (err) {
        lastError = err;
        console.error('[AI Text Auto-Fill] Groq extraction failed, falling back to Gemini:', err.message || err);
      }
    }

    // --- Fallback to Gemini API if Groq fails or is not configured ---
    if (!apiSuccess) {
      const apiKeys = getApiKeys();
      if (apiKeys.length === 0) {
        const errMsg = lastError?.message || 'No active API keys';
        return res.status(500).json({ 
          success: false, 
          message: `Nahi Groq key mili aur na hi Gemini configured hai. Error: ${errMsg}` 
        });
      }

      // Loop through all Gemini keys (Key Rotation)
      for (let i = 0; i < apiKeys.length; i++) {
        const activeKey = apiKeys[i];
        try {
          console.log(`[AI Text Auto-Fill] Trying Gemini text extraction with key index ${i + 1} of ${apiKeys.length}...`);
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(activeKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const result = await model.generateContent([prompt, text]);
          responseText = result.response.text().trim();
          apiSuccess = true;
          console.log(`[AI Text Auto-Fill] Success with Gemini API Key index ${i + 1}!`);
          break; // Exit loop on success
        } catch (err) {
          lastError = err;
          console.error(`[AI Text Auto-Fill] Gemini Key index ${i + 1} failed:`, err.message || err);
        }
      }
    }

    if (!apiSuccess) {
      const errMsg = lastError?.message || 'Unknown API error';
      if (
        errMsg.includes('429') || 
        errMsg.includes('Quota') || 
        errMsg.includes('quota') || 
        errMsg.includes('limit')
      ) {
        return res.status(429).json({
          success: false,
          message: 'Saari configured API keys ki limits exceed ho chuki hain. Kripya local fast parser try karein.'
        });
      }
      return res.status(500).json({
        success: false,
        message: `AI Auto-Fill error: ${errMsg}`
      });
    }

    // Parse the JSON response
    let extractedData;
    try {
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      extractedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, '\nRaw response:', responseText);
      return res.status(500).json({
        success: false,
        message: 'AI response parse nahi ho saka. Kripya local parser try karein.',
      });
    }

    const defaultFields = {
      imei: '', rto: '', vehicleType: '', vehicleMake: '', vehicleModel: '',
      registrationYear: '', engineNumber: '', chassisNumber: '', vehicleNumber: '',
      customerName: '', customerMobile: '', iccId: '', customerAddress: '',
      reference: '', simNumber1: '', simNumber2: ''
    };

    const finalData = { ...defaultFields, ...extractedData };
    return res.json({
      success: true,
      message: 'Text se data successfully extract ho gaya!',
      data: finalData
    });

  } catch (error) {
    console.error('Extract text route error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Text process karne mein error aaya.'
    });
  }
});

module.exports = router;
