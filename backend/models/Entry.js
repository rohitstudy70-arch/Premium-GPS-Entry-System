const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  imei: { type: String, required: true },
  rto: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleMake: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  registrationYear: { type: String, required: true },
  engineNumber: { type: String, required: true },
  chassisNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  reference: { type: String, required: true },
  simNumber1: { type: String, required: true },
  simNumber2: { type: String, required: true },
  customerName: { type: String, default: '' },
  customerMobile: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  timestamp: { type: Number, required: true, unique: true }
});

module.exports = mongoose.model('Entry', entrySchema);
