#!/bin/bash

# Function to log messages
log() {
  echo "[INFO] $1"
}

# Function to check and install Node.js and npm
install_node() {
  if ! command -v node &>/dev/null; then
    log "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    log "Node.js is already installed."
  fi
}

# Function to check and install Python and pip
install_python() {
  if ! command -v python3 &>/dev/null; then
    log "Python3 is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
  else
    log "Python3 is already installed."
  fi
}

# Function to check and install npm packages
install_npm_packages() {
  log "Installing Node.js dependencies..."
  
  # Explicitly install cors and multer
  npm install cors multer
  
  # Install all dependencies listed in package.json
  npm install
}

# Function to check and install Python dependencies
install_python_dependencies() {
  if [ -f requirements.txt ]; then
    log "Installing Python dependencies from requirements.txt..."
    pip3 install -r requirements.txt || { log "Failed to install Python dependencies."; exit 1; }
  else
    log "requirements.txt not found. Skipping Python dependencies."
  fi
}

# Function to download spaCy model
install_spacy_model() {
  log "Installing spaCy model..."
  python3 -m spacy download en_core_web_sm || { log "Failed to download spaCy model."; exit 1; }
}

# Main script execution
log "Starting dependency installation..."

# Install Node.js, npm, Python, and pip
install_node
install_python

# Install project-specific dependencies
install_npm_packages
install_python_dependencies

# Install spaCy model
install_spacy_model

log "All dependencies installed successfully!"
