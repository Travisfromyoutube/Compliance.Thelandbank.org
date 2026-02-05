import React, { useState, useRef } from 'react';
import { Upload, X, FileText, DollarSign, CheckCircle } from 'lucide-react';

const CompliancePortal = () => {
  const [formData, setFormData] = useState({
    buyerName: '',
    email: '',
    propertyAddress: '',
    programType: '',
    totalSpent: '',
    submissionType: 'progress'
  });
  
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [financialDocs, setFinancialDocs] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [errors, setErrors] = useState({});
  
  const progressInputRef = useRef(null);
  const financialInputRef = useRef(null);
  const receiptsInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files, fileType);
  };

  const handleFiles = (files, fileType) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      return isImage || isPDF || isCSV;
    });

    const fileObjects = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    if (fileType === 'progress') {
      setProgressPhotos(prev => [...prev, ...fileObjects]);
    } else if (fileType === 'financial') {
      setFinancialDocs(prev => [...prev, ...fileObjects]);
    } else if (fileType === 'receipts') {
      setReceipts(prev => [...prev, ...fileObjects]);
    }
  };

  const removeFile = (index, fileType) => {
    if (fileType === 'progress') {
      setProgressPhotos(prev => prev.filter((_, i) => i !== index));
    } else if (fileType === 'financial') {
      setFinancialDocs(prev => prev.filter((_, i) => i !== index));
    } else if (fileType === 'receipts') {
      setReceipts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(submissionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-submission-${submissionData.timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property address is required';
    if (!formData.programType) newErrors.programType = 'Program type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    // Organize data for backend
    const submissionData = {
      timestamp: new Date().toISOString(),
      buyer: {
        name: formData.buyerName,
        email: formData.email,
        propertyAddress: formData.propertyAddress,
        programType: formData.programType
      },
      financial: {
        totalSpent: formData.totalSpent ? parseFloat(formData.totalSpent) : null,
        hasReceipts: receipts.length > 0
      },
      files: {
        progressPhotos: progressPhotos.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        documentation: financialDocs.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        receipts: receipts.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      },
      submissionType: formData.submissionType
    };

    console.log('Submission Data:', JSON.stringify(submissionData, null, 2));
    setSubmissionData(submissionData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-100 p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Submission Successful</h2>
            <p className="text-slate-600">
              Your compliance documentation has been received and organized for processing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Submission Summary */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Submission Summary</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><strong>Buyer:</strong> {formData.buyerName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Property:</strong> {formData.propertyAddress}</p>
                <p><strong>Program:</strong> {formData.programType}</p>
                {formData.totalSpent && (
                  <p><strong>Estimated Investment:</strong> ${parseFloat(formData.totalSpent).toLocaleString()}</p>
                )}
                <p><strong>Progress Photos:</strong> {progressPhotos.length} file(s)</p>
                <p><strong>Documentation:</strong> {financialDocs.length} file(s)</p>
                <p><strong>Receipts/Invoices:</strong> {receipts.length} file(s)</p>
              </div>
            </div>

            {/* JSON Data Preview */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-800 mb-3">FileMaker Data Structure</h3>
              <p className="text-xs text-slate-600 mb-3">
                This JSON will be sent to FileMaker via Data API
              </p>
              <div className="bg-slate-800 text-emerald-400 p-4 rounded text-xs overflow-auto max-h-64 font-mono">
                <pre>{JSON.stringify(submissionData, null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadJSON}
              className="flex-1 bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Download JSON Data</span>
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setSubmissionData(null);
                setFormData({
                  buyerName: '',
                  email: '',
                  propertyAddress: '',
                  programType: '',
                  totalSpent: '',
                  submissionType: 'progress'
                });
                setProgressPhotos([]);
                setFinancialDocs([]);
                setReceipts([]);
                setErrors({});
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-emerald-700 transition flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Submit Another Update</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border-t-4 border-emerald-500">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent mb-2">
            Genesee County Land Bank
          </h1>
          <p className="text-slate-600">Property Compliance Portal</p>
        </div>

        <div className="space-y-6">
          {/* Buyer Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Buyer Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Buyer Name *
                </label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.buyerName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter your name"
                />
                {errors.buyerName && (
                  <p className="text-red-500 text-xs mt-1">{errors.buyerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.email ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.propertyAddress ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="123 Main St, Flint, MI"
                />
                {errors.propertyAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.propertyAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Program Type *
                </label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({...formData, programType: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.programType ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select program</option>
                  <option value="Ready4Rehab">Ready4Rehab</option>
                  <option value="Featured Homes">Featured Homes</option>
                  <option value="VIP">VIP</option>
                </select>
                {errors.programType && (
                  <p className="text-red-500 text-xs mt-1">{errors.programType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Total Investment in Property
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalSpent}
                    onChange={(e) => setFormData({...formData, totalSpent: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Photos Upload */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Progress Photos</h2>
            <p className="text-sm text-slate-600 mb-6">Upload photos showing current work on your property</p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'progress')}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Drag and drop photos here, or</p>
              <button
                type="button"
                onClick={() => progressInputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Browse Files
              </button>
              <input
                ref={progressInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(Array.from(e.target.files), 'progress')}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-2">Supports: JPG, PNG, HEIC</p>
            </div>

            {progressPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {progressPhotos.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index, 'progress')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-slate-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documentation Upload */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Documentation</h2>
            <p className="text-sm text-slate-600 mb-6">Upload contracts, permits, or other documentation</p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'financial')}
            >
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Drag and drop documents here, or</p>
              <button
                type="button"
                onClick={() => financialInputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Browse Files
              </button>
              <input
                ref={financialInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.csv"
                onChange={(e) => handleFiles(Array.from(e.target.files), 'financial')}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-2">Supports: PDF, JPG, PNG, CSV</p>
            </div>

            {financialDocs.length > 0 && (
              <div className="space-y-2 mt-6">
                {financialDocs.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index, 'financial')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receipts Upload (Optional) */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Receipts & Invoices <span className="text-sm font-normal text-slate-500">(Optional)</span>
            </h2>
            <p className="text-sm text-slate-600 mb-6">Upload proof of investment if available</p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'receipts')}
            >
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Drag and drop receipts here, or</p>
              <button
                type="button"
                onClick={() => receiptsInputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Browse Files
              </button>
              <input
                ref={receiptsInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.csv"
                onChange={(e) => handleFiles(Array.from(e.target.files), 'receipts')}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-2">Supports: PDF, JPG, PNG, CSV</p>
            </div>

            {receipts.length > 0 && (
              <div className="space-y-2 mt-6">
                {receipts.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index, 'receipts')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-emerald-700 transition flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Submit Compliance Update</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePortal;
