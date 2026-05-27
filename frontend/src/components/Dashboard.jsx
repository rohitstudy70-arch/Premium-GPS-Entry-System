// ==========================================
// Dashboard Component
// Vehicle Entry Form with Navbar and Success Popup
// ==========================================

import { useState, useEffect, useRef } from 'react';
import { submitEntry, getTodayEntries, getTotalEntriesCount, editEntry, extractFromImage } from '../api';

// Initial empty form state
const initialFormState = {
  imei: '',
  rto: '',
  vehicleType: '',
  vehicleMake: '',
  vehicleModel: '',
  registrationYear: '',
  engineNumber: '',
  chassisNumber: '',
  vehicleNumber: '',
  reference: '',
  simNumber1: '',
  simNumber2: '',
  customerName: '',
  customerMobile: '',
  iccId: '',
  aadharNumber: '',
  customerAddress: '',
};

function Dashboard({ user, onLogout }) {
  // State hooks
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [editingTimestamp, setEditingTimestamp] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Image Upload States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch today's entries
  const fetchTodayEntries = async () => {
    try {
      const response = await getTodayEntries();
      if (response.data.success) {
        setTodayEntries(response.data.entries);
      }
    } catch (err) {
      console.error('Failed to fetch today entries', err);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const res = await getTotalEntriesCount();
      if (res.data.success) {
        setTotalCount(res.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch count', err);
    }
  };

  useEffect(() => {
    fetchTodayEntries();
    fetchTotalCount();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form to empty state
  const handleReset = () => {
    setFormData(initialFormState);
    setEditingTimestamp(null);
    setError('');
    setImageFile(null);
    setImagePreview(null);
    setExtractSuccess(false);
    setExtractError('');
  };

  // --- Image Upload Handlers ---
  const handleImageSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setExtractError('Sirf image file select karein (JPG, PNG, WEBP, etc.)');
      return;
    }
    setImageFile(file);
    setExtractError('');
    setExtractSuccess(false);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    if (e.target.files[0]) handleImageSelect(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleExtract = async () => {
    if (!imageFile) {
      setExtractError('Pehle koi image select karein.');
      return;
    }
    setExtracting(true);
    setExtractError('');
    setExtractSuccess(false);

    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const response = await extractFromImage(fd);

      if (response.data.success) {
        const extracted = response.data.data;
        // Merge extracted data with existing form (don't overwrite non-empty fields unless extracted has value)
        setFormData(prev => {
          const merged = { ...prev };
          Object.keys(extracted).forEach(key => {
            if (extracted[key] && extracted[key].toString().trim() !== '') {
              merged[key] = extracted[key];
            }
          });
          return merged;
        });
        setExtractSuccess(true);
        // Scroll to form
        document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Image extract karne mein error aaya. Dobara try karein.';
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // No form validation restriction: all fields are optional
    setLoading(true);

    try {
      let response;
      if (editingTimestamp) {
        response = await editEntry(editingTimestamp, formData);
      } else {
        response = await submitEntry(formData);
      }

      if (response.data.success) {
        // Show success popup and clear form
        setSuccessInfo(response.data.entry);
        setShowSuccess(true);
        setFormData(initialFormState);
        setEditingTimestamp(null);
        fetchTodayEntries(); // Refresh the list
        fetchTotalCount(); // Refresh total count
      }
    } catch (err) {
      // Show error from server or a default message
      const message = err.response?.data?.message || 'Failed to submit entry. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click
  const handleEdit = (entry) => {
    setFormData(entry);
    setEditingTimestamp(entry.timestamp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setError('');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('arshi-token');
    onLogout();
  };

  // Close success popup
  const closeSuccess = () => {
    setShowSuccess(false);
    setSuccessInfo(null);
  };

  return (
    <div className="dashboard-page">
      {/* --- Top Navbar --- */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">📡</div>
          <div>
            <div className="navbar-title">Arshi GPS</div>
            <div className="navbar-subtitle">Dashboard</div>
          </div>
        </div>
        <button id="logout-button" className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* --- Main Content --- */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Vehicle Entry Form</h2>
            <p>Enter GPS device installation and vehicle details below.</p>
          </div>
          <div className="total-badge" style={{ background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>TOTAL ENTRIES</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>{totalCount}</div>
          </div>
        </div>

        {/* --- Image Upload Section --- */}
        <div className="image-upload-card">
          <div className="image-upload-header">
            <div className="image-upload-icon">📸</div>
            <div>
              <div className="image-upload-title">Smart Image Auto-Fill</div>
              <div className="image-upload-subtitle">RC Book / Vehicle Document ki photo upload karo — AI automatically form fill kar dega</div>
            </div>
          </div>

          <div className="image-upload-body">
            {/* Drop Zone */}
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileInput}
                id="image-upload-input"
              />
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Uploaded document" className="image-preview" />
                  <div className="image-preview-overlay">
                    <span>🔄 Click to change image</span>
                  </div>
                </div>
              ) : (
                <div className="drop-zone-placeholder">
                  <div className="drop-zone-icon">📄</div>
                  <div className="drop-zone-text">Image yahan drop karo ya click karo</div>
                  <div className="drop-zone-hint">JPG, PNG, WEBP supported • Max 10MB</div>
                </div>
              )}
            </div>

            {/* Action & Feedback */}
            <div className="image-actions">
              {extractError && (
                <div className="alert alert-error" style={{ marginBottom: '10px' }}>
                  ❌ {extractError}
                </div>
              )}
              {extractSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '10px' }}>
                  ✅ Data successfully extract ho gaya! Form check karein.
                </div>
              )}
              <button
                id="extract-image-button"
                type="button"
                className="btn-extract"
                onClick={handleExtract}
                disabled={extracting || !imageFile}
              >
                {extracting ? (
                  <><span className="spinner" /> AI Process kar raha hai...</>
                ) : (
                  <>🔍 Image se Auto-Fill karo</>
                )}
              </button>
              {imageFile && (
                <button
                  type="button"
                  className="btn-reset"
                  style={{ marginLeft: '10px' }}
                  onClick={() => { setImageFile(null); setImagePreview(null); setExtractSuccess(false); setExtractError(''); }}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <div className="form-card-title">📋 New Vehicle Entry</div>
          <div className="form-card-subtitle">
            Fill in the vehicle and device information. All fields are required.
          </div>

          {/* Error Alert */}
          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          {/* Vehicle Entry Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* IMEI */}
              <div className="form-group">
                <label htmlFor="field-imei">IMEI</label>
                <input
                  id="field-imei"
                  type="text"
                  name="imei"
                  placeholder="Enter IMEI number"
                  value={formData.imei}
                  onChange={handleChange}
                />
              </div>

              {/* RTO */}
              <div className="form-group">
                <label htmlFor="field-rto">RTO</label>
                <input
                  id="field-rto"
                  type="text"
                  name="rto"
                  placeholder="Enter RTO"
                  value={formData.rto}
                  onChange={handleChange}
                />
              </div>

              {/* Vehicle Type */}
              <div className="form-group">
                <label htmlFor="field-vehicleType">Vehicle Type</label>
                <input
                  id="field-vehicleType"
                  type="text"
                  name="vehicleType"
                  placeholder="e.g. Car, Truck, Bus"
                  value={formData.vehicleType}
                  onChange={handleChange}
                />
              </div>

              {/* Vehicle Make */}
              <div className="form-group">
                <label htmlFor="field-vehicleMake">Vehicle Make</label>
                <input
                  id="field-vehicleMake"
                  type="text"
                  name="vehicleMake"
                  placeholder="e.g. Tata, Mahindra"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                />
              </div>

              {/* Vehicle Model */}
              <div className="form-group">
                <label htmlFor="field-vehicleModel">Vehicle Model</label>
                <input
                  id="field-vehicleModel"
                  type="text"
                  name="vehicleModel"
                  placeholder="e.g. Nexon, Bolero"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                />
              </div>

              {/* Registration Year */}
              <div className="form-group">
                <label htmlFor="field-registrationYear">Registration Year</label>
                <input
                  id="field-registrationYear"
                  type="text"
                  name="registrationYear"
                  placeholder="e.g. 2024"
                  value={formData.registrationYear}
                  onChange={handleChange}
                />
              </div>

              {/* Engine Number */}
              <div className="form-group">
                <label htmlFor="field-engineNumber">Engine Number</label>
                <input
                  id="field-engineNumber"
                  type="text"
                  name="engineNumber"
                  placeholder="Enter engine number"
                  value={formData.engineNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Chassis Number */}
              <div className="form-group">
                <label htmlFor="field-chassisNumber">Chassis Number</label>
                <input
                  id="field-chassisNumber"
                  type="text"
                  name="chassisNumber"
                  placeholder="Enter chassis number"
                  value={formData.chassisNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Vehicle Number */}
              <div className="form-group">
                <label htmlFor="field-vehicleNumber">Vehicle Number</label>
                <input
                  id="field-vehicleNumber"
                  type="text"
                  name="vehicleNumber"
                  placeholder="e.g. MH01AB1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Customer Mobile */}
              <div className="form-group">
                <label htmlFor="field-customerMobile">Customer Mobile Number</label>
                <input
                  id="field-customerMobile"
                  type="text"
                  name="customerMobile"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.customerMobile || ''}
                  onChange={handleChange}
                />
              </div>

              {/* ICC ID */}
              <div className="form-group">
                <label htmlFor="field-iccId">ICC ID</label>
                <input
                  id="field-iccId"
                  type="text"
                  name="iccId"
                  placeholder="Enter ICC ID"
                  value={formData.iccId || formData.aadharNumber || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Customer Name */}
              <div className="form-group">
                <label htmlFor="field-customerName">Customer Name</label>
                <input
                  id="field-customerName"
                  type="text"
                  name="customerName"
                  placeholder="Enter Customer Name"
                  value={formData.customerName || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Customer Address */}
              <div className="form-group">
                <label htmlFor="field-customerAddress">Customer Address</label>
                <input
                  id="field-customerAddress"
                  type="text"
                  name="customerAddress"
                  placeholder="Enter complete address"
                  value={formData.customerAddress || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Reference */}
              <div className="form-group">
                <label htmlFor="field-reference">Reference</label>
                <input
                  id="field-reference"
                  type="text"
                  name="reference"
                  placeholder="Enter reference"
                  value={formData.reference}
                  onChange={handleChange}
                />
              </div>

              {/* SIM Number 1 */}
              <div className="form-group">
                <label htmlFor="field-simNumber1">SIM Number 1</label>
                <input
                  id="field-simNumber1"
                  type="text"
                  name="simNumber1"
                  placeholder="Enter SIM 1 number"
                  value={formData.simNumber1}
                  onChange={handleChange}
                />
              </div>

              {/* SIM Number 2 */}
              <div className="form-group">
                <label htmlFor="field-simNumber2">SIM Number 2</label>
                <input
                  id="field-simNumber2"
                  type="text"
                  name="simNumber2"
                  placeholder="Enter SIM 2 number"
                  value={formData.simNumber2}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="form-actions">
              {/* Submit */}
              <button
                id="submit-entry-button"
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    SUBMITTING...
                  </>
                ) : (
                  editingTimestamp ? 'UPDATE ENTRY' : 'SUBMIT'
                )}
              </button>

              {/* Reset */}
              <button
                id="reset-form-button"
                type="button"
                className="btn-reset"
                onClick={handleReset}
              >
                Clear Form
              </button>

              {/* Download TXT report */}
              <button
                id="download-report-button"
                type="button"
                className="btn-reset"
                onClick={() => window.open('/api/report', '_blank')}
              >
                📥 Download Report
              </button>
            </div>
          </form>
        </div>

        {/* --- Today's Entries --- */}
        <div className="form-card" style={{ marginTop: '20px' }}>
          <div className="form-card-title">📅 Today's Entries</div>
          <div className="form-card-subtitle">
            All entries submitted today.
          </div>
          
          {todayEntries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No entries submitted today yet.</p>
          ) : (
            <div className="table-container">
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer Name</th>
                    <th>Vehicle No.</th>
                    <th>IMEI</th>
                    <th>Vehicle Model</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayEntries.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.time}</td>
                      <td><strong>{entry.customerName || 'N/A'}</strong></td>
                      <td><strong>{entry.vehicleNumber}</strong></td>
                      <td>{entry.imei}</td>
                      <td>{entry.vehicleModel}</td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-edit" 
                          onClick={() => handleEdit(entry)}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* --- Success Popup Overlay --- */}
      {showSuccess && (
        <div className="success-overlay" onClick={closeSuccess}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">✅</div>
            <h3>Entry Saved Successfully!</h3>
            <p>
              Entry for <strong>{successInfo?.customerName || 'N/A'}</strong> (Vehicle: <strong>{successInfo?.vehicleNumber}</strong>) has been recorded and
              appended to the report file.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button
                id="close-success-button"
                className="btn-close-popup"
                onClick={closeSuccess}
              >
                Continue
              </button>
              <button
                className="btn-close-popup"
                style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
                onClick={() => window.open('/api/report', '_blank')}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
