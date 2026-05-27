const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

// GET /api/report - Generates and returns a formatted TXT report from MongoDB
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ timestamp: 1 });
    
    let textContent = '';
    entries.forEach(entry => {
      textContent += `---

## ARSHI GPS VEHICLE ENTRY REPORT

Customer Name : ${entry.customerName || 'N/A'}
Customer Mobile : ${entry.customerMobile || 'N/A'}
Aadhar Number : ${entry.aadharNumber || 'N/A'}
Customer Address : ${entry.customerAddress || 'N/A'}

IMEI : ${entry.imei}
RTO : ${entry.rto}
Vehicle Type : ${entry.vehicleType}
Vehicle Make : ${entry.vehicleMake}
Vehicle Model : ${entry.vehicleModel}
Registration Year : ${entry.registrationYear}
Engine Number : ${entry.engineNumber}
Chassis Number : ${entry.chassisNumber}
Vehicle Number : ${entry.vehicleNumber}
Reference : ${entry.reference}
SIM 1 : ${entry.simNumber1}
SIM 2 : ${entry.simNumber2}

Date : ${entry.date}
Time : ${entry.time}

---\n\n`;
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
