import React, { useState } from 'react';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  uploadSection: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    marginBottom: '30px',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9'
  },
  fileInput: {
    display: 'none'
  },
  uploadText: {
    color: '#666',
    marginTop: '10px'
  },
  form: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    margin: '20px 0'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: '20px'
  },
  fileName: {
    marginTop: '10px',
    color: '#666',
    fontSize: '14px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonHover: {
    backgroundColor: '#0056b3'
  }
};

const FormField = ({ label, value }) => (
  <div style={styles.formGroup}>
    <label style={styles.label}>{label}</label>
    <input type="text" value={value} readOnly style={styles.input} />
  </div>
);

const App = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3006/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        role: data.role || ''
      });
    } catch (err) {
      setError('Error processing PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>PDF Data Extractor</h1>

      <div
        style={styles.uploadSection}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <p style={styles.uploadText}>Click here to upload a PDF file</p>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={styles.fileInput}
          id="fileInput"
        />
        {fileName && (
          <p style={styles.fileName}>Selected file: {fileName}</p>
        )}
      </div>

      {loading && (
        <div style={styles.loading}>
          <p>Processing PDF...</p>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.form}>
        <FormField label="Name" value={formData.name} />
        <FormField label="Phone" value={formData.phone} />
        <FormField label="Address" value={formData.address} />
        <FormField label="Role" value={formData.role} />
      </div>
    </div>
  );
};

export default App;