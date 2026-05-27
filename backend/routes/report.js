const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

// GET /api/report - Generates and returns a formatted TXT report from MongoDB
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ timestamp: 1 });
    
    // Group entries by date while preserving chronological order
    const grouped = {};
    entries.forEach(entry => {
      const d = entry.date || 'Unknown Date';
      if (!grouped[d]) {
        grouped[d] = [];
      }
      grouped[d].push(entry);
    });

    let textContent = '';
    
    Object.keys(grouped).forEach(date => {
      const dateEntries = grouped[date];
      textContent += `====================================================================
DATE: ${date} (Total Entries: ${dateEntries.length})
====================================================================\n\n`;

      dateEntries.forEach((entry, index) => {
        textContent += `${index + 1}. Customer Details:
   Customer Name    : ${entry.customerName || 'N/A'}
   Customer Mobile  : ${entry.customerMobile || 'N/A'}
   ICC ID           : ${entry.iccId || entry.aadharNumber || 'N/A'}
   Customer Address : ${entry.customerAddress || 'N/A'}

   Vehicle Details:
   IMEI             : ${entry.imei || 'N/A'}
   RTO              : ${entry.rto || 'N/A'}
   Vehicle Type     : ${entry.vehicleType || 'N/A'}
   Vehicle Make     : ${entry.vehicleMake || 'N/A'}
   Vehicle Model    : ${entry.vehicleModel || 'N/A'}
   Registration Year: ${entry.registrationYear || 'N/A'}
   Engine Number    : ${entry.engineNumber || 'N/A'}
   Chassis Number   : ${entry.chassisNumber || 'N/A'}
   Vehicle Number   : ${entry.vehicleNumber || 'N/A'}
   Reference        : ${entry.reference || 'N/A'}
   SIM 1            : ${entry.simNumber1 || 'N/A'}
   SIM 2            : ${entry.simNumber2 || 'N/A'}

   Time             : ${entry.time || 'N/A'}
--------------------------------------------------------------------\n\n`;
      });
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="data.txt"');
    res.send(textContent);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).send('Failed to generate report file.');
  }
});

module.exports = router;
