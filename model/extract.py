import sys
import json
import spacy
import pdfplumber
from spacy.matcher import Matcher
import re  # Added for phone number extraction

def extract_data_from_pdf(pdf_path):
    # Load spaCy model
    nlp = spacy.load("en_core_web_lg")
    
    # Initialize matcher
    matcher = Matcher(nlp.vocab)
    
    # Define expanded patterns for role detection
    role_patterns = [
        # Academic roles
        [{"LOWER": {"IN": ["assistant", "associate", "full", "visiting", "adjunct", "research"]}},
         {"LOWER": "professor"}],
        [{"LOWER": "professor"}],
        [{"LOWER": "lecturer"}],
        
        # Management roles
        [{"LOWER": {"IN": ["senior", "executive", "managing", "technical", "project", "product"]}},
         {"LOWER": "director"}],
        [{"LOWER": "director"}],
        [{"LOWER": {"IN": ["senior", "junior", "project", "product", "engineering", "technical"]}},
         {"LOWER": "manager"}],
        [{"LOWER": "manager"}],
        
        # Engineering roles
        [{"LOWER": {"IN": ["senior", "junior", "lead", "assistant", "associate", "principal"]}}, 
         {"LOWER": {"IN": ["software", "systems", "full", "stack", "backend", "frontend", "data"]}},
         {"LOWER": {"IN": ["engineer", "developer", "architect"]}}],
        [{"LOWER": {"IN": ["software", "systems", "full", "stack", "backend", "frontend", "data"]}},
         {"LOWER": {"IN": ["engineer", "developer", "architect"]}}],
        
        # Analyst roles
        [{"LOWER": {"IN": ["senior", "junior", "lead", "business", "data", "financial", "research"]}},
         {"LOWER": "analyst"}],
        [{"LOWER": "analyst"}],
        
        # Consultant roles
        [{"LOWER": {"IN": ["senior", "junior", "management", "technical", "it", "business"]}},
         {"LOWER": "consultant"}],
        [{"LOWER": "consultant"}],
        
        # Researcher roles
        [{"LOWER": {"IN": ["senior", "lead", "principal", "postdoctoral"]}},
         {"LOWER": "researcher"}],
        [{"LOWER": "researcher"}],
        
        # Other technical roles
        [{"LOWER": {"IN": ["data", "machine learning", "ai"]}},
         {"LOWER": "scientist"}],
        [{"LOWER": "architect"}],
        [{"LOWER": "designer"}]
    ]
    
    matcher.add("ROLE", role_patterns)
    
    # Extract text from PDF
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    
    # Process text with spaCy
    doc = nlp(text)
    
    # Extract name (PERSON entity)
    name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            # Skip if the entity contains words like "file", "assignment", "document"
            if not any(word.lower() in ["file", "assignment", "document"] for word in ent.text.split()):
                name = ent.text
                break
    
    # Extract phone number using combination of spaCy and regex
    phone = None
    phone_pattern = r'Phone\s*:\s*\+?\s*1?\s*\(?\s*(\d{3})\s*\)?\s*[-.]?\s*(\d{3})\s*[-.]?\s*(\d{4})'
    phone_match = re.search(phone_pattern, text)
    if phone_match:
        phone = f"({phone_match.group(1)}) {phone_match.group(2)}-{phone_match.group(3)}"
    else:
        # Fallback to spaCy token pattern for phone numbers
        for token in doc:
            if token.like_num and len(token.text) >= 10:
                digits = ''.join(filter(str.isdigit, token.text))
                if len(digits) >= 10:
                    phone = f"({digits[:3]}) {digits[3:6]}-{digits[6:10]}"
                    break
    
    # Extract address (GPE and LOC entities in sequence)
    address_parts = []
    prev_was_address = False
    
    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC", "FAC"]:
            if prev_was_address or not address_parts:
                address_parts.append(ent.text)
                prev_was_address = True
            elif len(address_parts) < 3:  # Limit to avoid picking up unrelated locations
                address_parts.append(ent.text)
    
    address = " ".join(address_parts) if address_parts else None
    
    # Extract role using matcher
    role = None
    matches = matcher(doc)
    if matches:
        match_id, start, end = matches[0]
        role = doc[start:end].text
    
    # Return results as JSON
    result = {
        "name": name,
        "phone": phone,
        "address": address,
        "role": role
    }
    
    print(json.dumps(result))
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "PDF path not provided"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extract_data_from_pdf(pdf_path)