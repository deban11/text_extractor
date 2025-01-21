# PDF Data Extractor

This full-stack project allows users to upload a PDF file, extract data such as name, phone number, address, and role(bonus feature added), and display the extracted information on a web interface.

---

## Features

- Upload PDF files via a user-friendly web interface.
- Extract structured information using Natural Language Processing (NLP).
- Backend built with **Node.js** and Python.
- Frontend built with **React.js**.

---

## Prerequisites

Ensure the following tools and dependencies are installed:

- [Node.js](https://nodejs.org/)
- [Python 3.6+](https://www.python.org/)
- [spaCy](https://spacy.io/) (with `en_core_web_lg` model installed)
- [pdfplumber](https://pypi.org/project/pdfplumber/)
- [Multer](https://www.npmjs.com/package/multer)

### Install Python Dependencies
```bash
pip install spacy pdfplumber
python -m spacy download en_core_web_lg


#How to run the project:

###need to download the dependencies first:
###spacy model and pdfplumber

pip install spacy pdfplumber
python -m spacy download en_core_web_lg

###first start the backend by:

cd backend
npm run start

###start the frontend:

cd fron/my-react-app
npm run start

the webpage will load on localhost:3000,
you can upload your pdf file and you will get the required information
