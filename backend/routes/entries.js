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
    
    const now = new Date();
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
    const autoDate = now.toLocaleDateString('en-IN', dateOptions);
    const autoTime = now.toLocaleTimeString('en-IN', timeOptions);

    const newEntry = await Entry.create({
      imei: (data.imei || '').trim(),
      rto: (data.rto || '').trim(),
      vehicleType: (data.vehicleType || '').trim(),
      vehicleMake: (data.vehicleMake || '').trim(),
      vehicleModel: (data.vehicleModel || '').trim(),
      registrationYear: (data.registrationYear || '').trim(),
      engineNumber: (data.engineNumber || '').trim(),
      chassisNumber: (data.chassisNumber || '').trim(),
      vehicleNumber: (data.vehicleNumber || '').trim(),
      reference: (data.reference || '').trim(),
      simNumber1: (data.simNumber1 || '').trim(),
      simNumber2: (data.simNumber2 || '').trim(),
      customerName: (data.customerName || '').trim(),
      customerMobile: (data.customerMobile || '').trim(),
      aadharNumber: (data.aadharNumber || data.iccId || '').trim(),
      iccId: (data.iccId || data.aadharNumber || '').trim(),
      customerAddress: (data.customerAddress || '').trim(),
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
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' };
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
      imei: (updatedData.imei || '').trim(),
      rto: (updatedData.rto || '').trim(),
      vehicleType: (updatedData.vehicleType || '').trim(),
      vehicleMake: (updatedData.vehicleMake || '').trim(),
      vehicleModel: (updatedData.vehicleModel || '').trim(),
      registrationYear: (updatedData.registrationYear || '').trim(),
      engineNumber: (updatedData.engineNumber || '').trim(),
      chassisNumber: (updatedData.chassisNumber || '').trim(),
      vehicleNumber: (updatedData.vehicleNumber || '').trim(),
      reference: (updatedData.reference || '').trim(),
      simNumber1: (updatedData.simNumber1 || '').trim(),
      simNumber2: (updatedData.simNumber2 || '').trim(),
      customerName: (updatedData.customerName || '').trim(),
      customerMobile: (updatedData.customerMobile || '').trim(),
      aadharNumber: (updatedData.aadharNumber || updatedData.iccId || '').trim(),
      iccId: (updatedData.iccId || updatedData.aadharNumber || '').trim(),
      customerAddress: (updatedData.customerAddress || '').trim()
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

const backupFilePath = path.join(__dirname, '../reports/backup.json');

// DELETE /api/entries - Clear/reset all entries from database (saves backup)
router.delete('/', async (req, res) => {
  try {
    const entries = await Entry.find({});
    
    if (entries.length > 0) {
      fs.writeFileSync(backupFilePath, JSON.stringify(entries, null, 2), 'utf8');
    } else {
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
    }

    await Entry.deleteMany({});
    return res.json({ success: true, message: 'All entries have been reset successfully!' });
  } catch (error) {
    console.error('Error resetting entries:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset entries' });
  }
});

// POST /api/entries/restore - Restore entries from backup JSON file (one-time restore)
router.post('/restore', async (req, res) => {
  try {
    if (!fs.existsSync(backupFilePath)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Koi backup available nahi hai ya data pehle hi restore kiya ja chuka hai.' 
      });
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    if (!Array.isArray(backupData) || backupData.length === 0) {
      return res.status(400).json({ success: false, message: 'Backup file empty hai.' });
    }

    await Entry.insertMany(backupData);

    // Delete backup file so it can only be restored ONCE
    fs.unlinkSync(backupFilePath);

    return res.json({ 
      success: true, 
      message: 'Data successfully restore ho gaya!', 
      count: backupData.length 
    });
  } catch (error) {
    console.error('Error restoring entries:', error);
    return res.status(500).json({ success: false, message: 'Failed to restore entries' });
  }
});

module.exports = router;
