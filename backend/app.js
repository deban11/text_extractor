// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer to store uploaded files in uploads directory
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

app.use(cors());

// Endpoint to handle PDF upload and processing
app.post('/extract', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct absolute path to the Python script by going up one level from backend
    const pythonScriptPath = path.join(__dirname, '..', 'model', 'extract.py');

    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
        return res.status(500).json({ 
            error: `Python script not found at ${pythonScriptPath}` 
        });
    }

    // Spawn Python process with correct script path
    const pythonProcess = spawn('python', [
        pythonScriptPath,
        req.file.path
    ]);

    let dataString = '';

    // Collect data from Python script
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // Handle errors
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    // When Python process completes
    pythonProcess.on('close', (code) => {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        if (code !== 0) {
            return res.status(500).json({ error: 'Failed to process PDF' });
        }

        try {
            const extractedData = JSON.parse(dataString);
            res.json(extractedData);
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to parse extracted data',
                details: error.message 
            });
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error' });
    }
    if (error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Python script path: ${path.join(__dirname, '..', 'model', 'extract.py')}`);
});