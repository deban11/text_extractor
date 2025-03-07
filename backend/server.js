const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory at ${uploadDir}`);
}

// Configure multer to store uploaded files in the uploads directory
const upload = multer({ 
    dest: uploadDir,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
app.use(cors());
// app.use(cors({
//     origin: 'https://jazzy-valkyrie-d0d249.netlify.app',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Function to install spaCy model if not already installed
function installSpacyModel() {
    const pythonProcess = spawn('python3', ['-m', 'spacy', 'download', 'en_core_web_lg']);
    
    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Error installing spaCy model');
        } else {
            console.log('spaCy model installed successfully');
        }
    });
}

// Check if the spaCy model is installed by running the command (non-blocking)
spawn('python3', ['-c', 'import spacy; spacy.load("en_core_web_lg")'])
    .on('error', (err) => {
        console.log('spaCy model not found, installing...');
        installSpacyModel();
    });

app.post('/extract', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const pythonScriptPath = path.join(__dirname, '..', 'model', 'extract.py');

    if (!fs.existsSync(pythonScriptPath)) {
        return res.status(500).json({ 
            error: `Python script not found at ${pythonScriptPath}` 
        });
    }

    const pythonProcess = spawn('python', [pythonScriptPath, req.file.path]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
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

// Global error handler
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error' });
    }
    if (error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

// Start the server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
