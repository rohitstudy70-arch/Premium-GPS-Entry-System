const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  imei: { type: String, default: '' },
  rto: { type: String, default: '' },
  vehicleType: { type: String, default: '' },
  vehicleMake: { type: String, default: '' },
  vehicleModel: { type: String, default: '' },
  registrationYear: { type: String, default: '' },
  engineNumber: { type: String, default: '' },
  chassisNumber: { type: String, default: '' },
  vehicleNumber: { type: String, default: '' },
  reference: { type: String, default: '' },
  simNumber1: { type: String, default: '' },
  simNumber2: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerMobile: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  iccId: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  timestamp: { type: Number, required: true, unique: true }
});

module.exports = mongoose.model('Entry', entrySchema);
