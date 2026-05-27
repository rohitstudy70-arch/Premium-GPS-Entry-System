const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const fs = require('fs');
const path = require('path');

// --- Auto Migration ---
// If MongoDB is empty but we have local data.json, push it to MongoDB
const jsonFilePath = path.join(__dirname, '../reports/data.json');
const migrateData = async () => {
  try {
    const count = await Entry.countDocuments();
    if (count === 0 && fs.existsSync(jsonFilePath)) {
      const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      if (data && data.length > 0) {
        await Entry.insertMany(data);
        console.log(`✅ Automatically migrated ${data.length} entries from local data.json to MongoDB!`);
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
};
// Run migration check asynchronously
setTimeout(migrateData, 2000);

// POST /api/entries - Submit vehicle entry form
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Basic validation
    const emptyFields = Object.values(data).filter(val => !val || val.toString().trim() === '');
    if (emptyFields.length > 0) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const now = new Date();
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const autoDate = now.toLocaleDateString('en-IN', dateOptions);
    const autoTime = now.toLocaleTimeString('en-IN', timeOptions);

    const newEntry = await Entry.create({
      imei: data.imei.trim(),
      rto: data.rto.trim(),
      vehicleType: data.vehicleType.trim(),
      vehicleMake: data.vehicleMake.trim(),
      vehicleModel: data.vehicleModel.trim(),
      registrationYear: data.registrationYear.trim(),
      engineNumber: data.engineNumber.trim(),
      chassisNumber: data.chassisNumber.trim(),
      vehicleNumber: data.vehicleNumber.trim(),
      reference: data.reference.trim(),
      simNumber1: data.simNumber1.trim(),
      simNumber2: data.simNumber2.trim(),
      customerName: data.customerName.trim(),
      customerMobile: data.customerMobile.trim(),
      aadharNumber: data.aadharNumber.trim(),
      customerAddress: data.customerAddress.trim(),
      date: autoDate,
      time: autoTime,
      timestamp: now.getTime()
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle entry saved successfully to MongoDB!',
      entry: newEntry
    });

  } catch (error) {
    console.error('Error saving entry:', error);
    return res.status(500).json({ success: false, message: 'Server error: Failed to save data.' });
  }
});

// GET /api/entries/today - Get today's entries
router.get('/today', async (req, res) => {
  try {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayDateStr = now.toLocaleDateString('en-IN', dateOptions);

    const entries = await Entry.find({ date: todayDateStr }).sort({ timestamp: -1 });
    res.json({ success: true, entries });
  } catch (error) {
    console.error('Error fetching today entries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch entries' });
  }
});

// GET /api/entries/count - Get total entries count
router.get('/count', async (req, res) => {
  try {
    const count = await Entry.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

// PUT /api/entries/:timestamp - Edit an existing entry
router.put('/:timestamp', async (req, res) => {
  try {
    const timestamp = parseInt(req.params.timestamp);
    const updatedData = req.body;
    
    // Filter out date, time, timestamp from being updated
    const updatePayload = {
      imei: updatedData.imei.trim(),
      rto: updatedData.rto.trim(),
      vehicleType: updatedData.vehicleType.trim(),
      vehicleMake: updatedData.vehicleMake.trim(),
      vehicleModel: updatedData.vehicleModel.trim(),
      registrationYear: updatedData.registrationYear.trim(),
      engineNumber: updatedData.engineNumber.trim(),
      chassisNumber: updatedData.chassisNumber.trim(),
      vehicleNumber: updatedData.vehicleNumber.trim(),
      reference: updatedData.reference.trim(),
      simNumber1: updatedData.simNumber1.trim(),
      simNumber2: updatedData.simNumber2.trim(),
      customerName: updatedData.customerName ? updatedData.customerName.trim() : '',
      customerMobile: updatedData.customerMobile ? updatedData.customerMobile.trim() : '',
      aadharNumber: updatedData.aadharNumber ? updatedData.aadharNumber.trim() : '',
      customerAddress: updatedData.customerAddress ? updatedData.customerAddress.trim() : ''
    };

    const entry = await Entry.findOneAndUpdate(
      { timestamp },
      { $set: updatePayload },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    
    return res.json({
      success: true,
      message: 'Vehicle entry updated successfully!',
      entry
    });
    
  } catch (error) {
    console.error('Error updating entry:', error);
    return res.status(500).json({ success: false, message: 'Server error: Failed to update entry.' });
  }
});

module.exports = router;
