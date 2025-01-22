#!/bin/bash

log() {
  echo "[INFO] $1"
}

install_node() {
  if ! command -v node &>/dev/null; then
    log "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    log "Node.js is already installed."
  fi
}

install_python() {
  if ! command -v python3 &>/dev/null; then
    log "Python3 is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
  else
    log "Python3 is already installed."
  fi
}

install_npm_packages() {
  log "Installing Node.js dependencies..."
  npm install cors multer express
  npm install
}

install_python_dependencies() {
  log "Installing Python dependencies..."
  pip3 install spacy pdfplumber
  if [ -f requirements.txt ]; then
    log "Installing additional dependencies from requirements.txt..."
    pip3 install -r requirements.txt || { log "Failed to install Python dependencies."; exit 1; }
  fi
}

install_spacy_model() {
  log "Installing spaCy models..."
  python3 -m spacy download en_core_web_sm || { log "Failed to download small spaCy model."; exit 1; }
  python3 -m spacy download en_core_web_lg || { log "Failed to download large spaCy model."; exit 1; }
}

create_directories() {
  log "Creating required directories..."
  mkdir -p uploads
  chmod 755 uploads
}

log "Starting dependency installation..."
install_node
install_python
install_npm_packages
install_python_dependencies
install_spacy_model
create_directories
log "All dependencies installed successfully!"