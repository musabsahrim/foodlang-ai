"""
FoodLang AI - FastAPI Backend
Production-ready backend with RAG-based translation, OCR, and glossary management
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
import faiss
import tiktoken
import jwt
import os
import json
import base64
import time
from datetime import datetime, timedelta
import logging
from collections import defaultdict, deque
import secrets
from openai import OpenAI
from PIL import Image
from io import BytesIO
import hashlib
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# Logging Configuration
# ============================================================================

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('data/app.log', mode='a') if os.path.exists('data') or os.makedirs('data', exist_ok=True) else logging.StreamHandler()
    ]
)

logger = logging.getLogger("foodlang-ai")

# ============================================================================
# Configuration
# ============================================================================

class Config:
    """Application configuration"""
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_MINUTES = 30  # Changed from hours to minutes as per requirements
    
    def __post_init__(self):
        """Validate configuration on startup"""
        if not self.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. API calls will fail.")
        
        if self.JWT_SECRET == "your-secret-key-change-in-production":
            logger.warning("Using default JWT_SECRET. Generate a secure key for production!")
        
        if len(self.JWT_SECRET) < 32:
            logger.warning("JWT_SECRET should be at least 32 characters long for security.")
        
        logger.info(f"Configuration loaded - Rate limit: {self.RATE_LIMIT_REQUESTS} requests per {self.RATE_LIMIT_WINDOW}s")
    
    @staticmethod
    def generate_secure_jwt_secret() -> str:
        """Generate a secure JWT secret key"""
        return secrets.token_urlsafe(64)
    
    EMBEDDING_MODEL = "text-embedding-3-small"
    CHAT_MODEL = "gpt-4o-mini"
    EMBEDDING_DIMENSIONS = 1536
    TOP_K_RETRIEVAL = 3
    
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
    
    # Rate limiting configuration
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))  # requests per window
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))     # window in seconds (1 hour)
    ADMIN_RATE_LIMIT_REQUESTS = int(os.getenv("ADMIN_RATE_LIMIT_REQUESTS", "50"))  # admin endpoints
    
    # Security configuration
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
    
    GLOSSARY_PATH = "data/glossary.pkl"
    INDEX_PATH = "data/faiss_index.bin"
    METADATA_PATH = "data/metadata.json"
    HISTORY_PATH = "data/update_history.json"
    COST_LOG_PATH = "data/cost_log.json"

config = Config()
config.__post_init__()

# Initialize OpenAI client
client = OpenAI(api_key=config.OPENAI_API_KEY)

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="FoodLang AI API",
    description="Arabic ↔ English Food Packaging Translation API with RAG",
    version="1.0.0"
)

# Security middleware
if config.ALLOWED_HOSTS != ["*"]:
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=config.ALLOWED_HOSTS
    )

# CORS middleware with secure configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
    ],
    expose_headers=["*"],
    max_age=86400,  # 24 hours
)

# Enhanced request logging and security headers middleware with monitoring
@app.middleware("http")
async def logging_and_security_middleware(request: Request, call_next):
    """Add security headers, request logging, and monitoring to all responses"""
    start_time = time.time()
    client_ip = RateLimiter.get_client_ip(request)
    
    # Log incoming request
    logger.info(f"Request: {request.method} {request.url.path} from {client_ip}")
    
    try:
        response = await call_next(request)
        
        # Calculate response time
        process_time = time.time() - start_time
        
        # Record response time for monitoring
        health_monitor.record_response_time(request.url.path, process_time)
        
        # Log response
        logger.info(f"Response: {response.status_code} for {request.method} {request.url.path} in {process_time:.3f}s")
        
        # Record errors for monitoring
        if response.status_code >= 400:
            error_type = "client_error" if response.status_code < 500 else "server_error"
            health_monitor.record_error(error_type, request.url.path, f"HTTP {response.status_code}")
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["X-Response-Time"] = str(process_time)
        
        # Only add HSTS in production with HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {request.method} {request.url.path} from {client_ip} - {str(e)} in {process_time:.3f}s")
        
        # Record exception for monitoring
        health_monitor.record_error("exception", request.url.path, str(e))
        
        raise

# Security
security = HTTPBearer()

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(lambda: deque())

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    @staticmethod
    def is_allowed(client_ip: str, endpoint: str = "general", limit: int = None, window: int = None) -> bool:
        """Check if request is allowed based on rate limits"""
        if limit is None:
            limit = config.RATE_LIMIT_REQUESTS
        if window is None:
            window = config.RATE_LIMIT_WINDOW
            
        key = f"{client_ip}:{endpoint}"
        now = time.time()
        
        # Clean old entries
        requests = rate_limit_storage[key]
        while requests and requests[0] < now - window:
            requests.popleft()
        
        # Check if limit exceeded
        if len(requests) >= limit:
            return False
        
        # Add current request
        requests.append(now)
        return True
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"

def rate_limit_dependency(request: Request, endpoint: str = "general", limit: int = None):
    """Rate limiting dependency for endpoints"""
    client_ip = RateLimiter.get_client_ip(request)
    
    if not RateLimiter.is_allowed(client_ip, endpoint, limit):
        logger.warning(f"Rate limit exceeded for {client_ip} on endpoint {endpoint}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": str(config.RATE_LIMIT_WINDOW)}
        )
    
    return client_ip

# ============================================================================
# Data Models
# ============================================================================

class TranslateRequest(BaseModel):
    text: str
    
class TranslateResponse(BaseModel):
    translated_text: str
    detected_language: str
    tokens_used: int
    cost_estimate: float

# OCR request is handled via form data (UploadFile)

class OCRResponse(BaseModel):
    extracted_text: str
    translated_text: str
    detected_language: str
    tokens_used: int
    cost_estimate: float

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    expires_at: str

class GlossaryInfo(BaseModel):
    total_entries: int
    last_updated: str
    file_size: str

class CostBreakdown(BaseModel):
    embedding_tokens: int
    completion_tokens: int
    embedding_cost: float
    completion_cost: float
    total_cost: float

# ============================================================================
# Global State (In production, use Redis or database)
# ============================================================================

class AppState:
    """Global application state"""
    def __init__(self):
        self.index: Optional[faiss.Index] = None
        self.glossary: Optional[pd.DataFrame] = None
        self.metadata: Optional[Dict] = None
        self.cost_tracker = {
            "embedding_tokens": 0,
            "completion_tokens": 0,
            "embedding_requests": 0,
            "completion_requests": 0
        }
        self.initialized = False
        
    def load_glossary(self):
        """Load glossary and FAISS index from disk"""
        try:
            # First try to load existing processed glossary
            if os.path.exists(config.INDEX_PATH) and os.path.exists(config.GLOSSARY_PATH):
                self.index = faiss.read_index(config.INDEX_PATH)
                self.glossary = pd.read_pickle(config.GLOSSARY_PATH)
                
                if os.path.exists(config.METADATA_PATH):
                    with open(config.METADATA_PATH, 'r') as f:
                        self.metadata = json.load(f)
                
                self.initialized = True
                logger.info(f"✅ Loaded processed glossary with {len(self.glossary)} entries")
                return
            
            # If no processed glossary, try to load ProductList.xlsx
            product_list_path = "data/ProductList.xlsx"
            if os.path.exists(product_list_path):
                logger.info(f"📚 Found ProductList.xlsx, processing...")
                self.load_excel_glossary(product_list_path)
                return
                
            logger.warning("⚠️ No glossary found. Please upload one via admin panel.")
        except Exception as e:
            logger.error(f"❌ Error loading glossary: {e}")
    
    def load_excel_glossary(self, file_path: str):
        """Load glossary from Excel file and build FAISS index"""
        try:
            # Read Excel file
            glossary = pd.read_excel(file_path)
            
            # Validate and process
            if len(glossary.columns) < 2:
                raise Exception("Excel file must have at least 2 columns")
            
            glossary = glossary.iloc[:, :2]
            glossary.columns = ['english', 'arabic']
            
            # Clean data
            glossary['english'] = glossary['english'].astype(str).str.strip()
            glossary['arabic'] = glossary['arabic'].astype(str).str.strip()
            
            glossary = glossary[
                (glossary['english'] != '') &
                (glossary['english'] != 'nan') &
                (glossary['arabic'] != '') &
                (glossary['arabic'] != 'nan')
            ]
            
            if len(glossary) == 0:
                raise Exception("No valid entries found in glossary")
            
            logger.info(f"📊 Processing {len(glossary)} glossary entries...")
            
            # Create combined searchable text
            glossary['combined'] = glossary['english'] + " | " + glossary['arabic']
            
            # Generate embeddings
            embeddings = get_embeddings_batch(glossary['combined'].tolist())
            
            # Build FAISS index
            index = faiss.IndexFlatL2(config.EMBEDDING_DIMENSIONS)
            index.add(embeddings)
            
            # Update state
            self.index = index
            self.glossary = glossary
            self.metadata = {
                "created_at": datetime.now().isoformat(),
                "num_entries": len(glossary),
                "file_name": "ProductList.xlsx",
                "source": "startup_load"
            }
            self.initialized = True
            
            # Save processed data to disk for faster future loads
            self.save_glossary()
            
            logger.info(f"✅ Successfully loaded and processed glossary with {len(glossary)} entries")
            
        except Exception as e:
            logger.error(f"❌ Error processing Excel glossary: {e}")
            raise
    
    def save_glossary(self):
        """Save glossary and FAISS index to disk"""
        os.makedirs("data", exist_ok=True)
        faiss.write_index(self.index, config.INDEX_PATH)
        self.glossary.to_pickle(config.GLOSSARY_PATH)
        
        with open(config.METADATA_PATH, 'w') as f:
            json.dump(self.metadata, f)

state = AppState()

# ============================================================================
# Utility Functions
# ============================================================================

def count_tokens(text: str) -> int:
    """Count tokens in text"""
    enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(str(text)))

def track_embedding_cost(text: str):
    """Track embedding API usage"""
    tokens = count_tokens(text)
    state.cost_tracker["embedding_tokens"] += tokens
    state.cost_tracker["embedding_requests"] += 1

def track_completion_cost(tokens: int):
    """Track completion API usage"""
    state.cost_tracker["completion_tokens"] += tokens
    state.cost_tracker["completion_requests"] += 1

def log_api_usage(endpoint: str, cost: float, tokens_used: int, request_type: str = "completion"):
    """Log API usage to JSON file"""
    try:
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "endpoint": endpoint,
            "request_type": request_type,
            "tokens_used": tokens_used,
            "cost": cost,
            "session_total_cost": calculate_costs()["total_cost"]
        }
        
        # Ensure data directory exists
        os.makedirs("data", exist_ok=True)
        
        # Read existing logs
        logs = []
        if os.path.exists(config.COST_LOG_PATH):
            try:
                with open(config.COST_LOG_PATH, 'r') as f:
                    logs = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                logs = []
        
        # Add new log entry
        logs.append(log_entry)
        
        # Keep only last 1000 entries to prevent file from growing too large
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        # Write back to file
        with open(config.COST_LOG_PATH, 'w') as f:
            json.dump(logs, f, indent=2)
        
        # Also log to application logger
        logger.info(f"API Usage - {endpoint}: {tokens_used} tokens, ${cost:.6f}")
            
    except Exception as e:
        logger.error(f"Error logging API usage: {e}")

def calculate_costs() -> Dict[str, float]:
    """Calculate estimated costs using OpenAI pricing"""
    # OpenAI pricing: $0.150/1M input tokens, $0.600/1M output tokens for GPT-4o-mini
    # Embedding pricing: $0.020/1M tokens for text-embedding-3-small
    embedding_cost = (state.cost_tracker["embedding_tokens"] / 1_000_000) * 0.020
    completion_cost = (state.cost_tracker["completion_tokens"] / 1_000_000) * 0.150  # Using input token pricing
    
    return {
        "embedding_tokens": state.cost_tracker["embedding_tokens"],
        "completion_tokens": state.cost_tracker["completion_tokens"],
        "embedding_cost": round(embedding_cost, 6),
        "completion_cost": round(completion_cost, 6),
        "total_cost": round(embedding_cost + completion_cost, 6)
    }

def get_single_embedding(text: str) -> np.ndarray:
    """Get embedding for a single text"""
    text = str(text).strip()
    if not text:
        return np.zeros(config.EMBEDDING_DIMENSIONS, dtype='float32')
    
    track_embedding_cost(text)
    response = client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=text
    )
    return np.array(response.data[0].embedding, dtype='float32')

def get_embeddings_batch(texts: List[str]) -> np.ndarray:
    """Generate embeddings in batches"""
    embeddings_list = []
    batch_size = 100
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        batch = [str(t).strip() if t else "" for t in batch]
        
        for text in batch:
            track_embedding_cost(text)
        
        response = client.embeddings.create(
            model=config.EMBEDDING_MODEL,
            input=batch
        )
        
        batch_embeddings = [
            np.array(item.embedding, dtype='float32')
            for item in response.data
        ]
        embeddings_list.extend(batch_embeddings)
    
    return np.vstack(embeddings_list)

def detect_language(text: str) -> str:
    """Detect if text is primarily Arabic or English"""
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
    
    total_chars = arabic_chars + english_chars
    if total_chars == 0:
        return "unknown"
    
    arabic_ratio = arabic_chars / total_chars
    
    if arabic_ratio > 0.7:
        return "arabic"
    elif arabic_ratio < 0.3:
        return "english"
    else:
        return "mixed"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(username: str) -> str:
    """Create JWT token for authentication with 30-minute expiration"""
    expiration = datetime.utcnow() + timedelta(minutes=config.JWT_EXPIRATION_MINUTES)
    payload = {
        "sub": username,
        "exp": expiration,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return username"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            config.JWT_SECRET,
            algorithms=[config.JWT_ALGORITHM]
        )
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, 
            detail="Token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401, 
            detail="Invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

def require_admin_auth(username: str = Depends(verify_jwt_token)) -> str:
    """Require admin authentication for protected endpoints"""
    if username != config.ADMIN_USERNAME:
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )
    return username

# ============================================================================
# Translation Functions
# ============================================================================

def translate_text(query: str) -> Dict[str, Any]:
    """Translate text using RAG + GPT"""
    if not state.initialized:
        raise HTTPException(status_code=503, detail="Glossary not loaded. Please contact admin.")
    
    # Sanitize input
    query = sanitize_text_input(query)
    
    # Get query embedding
    q_emb = get_single_embedding(query)
    
    # Search for similar entries
    distances, indices = state.index.search(np.array([q_emb]), config.TOP_K_RETRIEVAL)
    retrieved = state.glossary.iloc[indices[0]]
    
    # Build context from retrieved entries
    context_lines = []
    for idx, (_, row) in enumerate(retrieved.iterrows()):
        context_lines.append(f"{idx+1}. {row['english']} = {row['arabic']}")
    context = "\n".join(context_lines)
    
    # Build prompt for GPT
    prompt = f"""You are FoodLang AI, an expert Arabic–English food packaging translator.
Use the glossary context below to ensure consistent, regulatory-compliant translations.

Glossary Context (most relevant matches):
{context}

Translate the following text naturally and accurately:
"{query}"

Provide only the translation (no explanation or additional text)."""
    
    # Call GPT
    response = client.chat.completions.create(
        model=config.CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )
    
    # Track costs
    track_completion_cost(response.usage.total_tokens)
    
    translation = response.choices[0].message.content.strip()
    detected_lang = detect_language(query)
    
    # Calculate cost for this request
    embedding_cost = (count_tokens(query) / 1_000_000) * 0.020
    completion_cost = (response.usage.total_tokens / 1_000_000) * 0.150
    request_cost = round(embedding_cost + completion_cost, 6)
    
    # Log API usage
    log_api_usage("/api/translate", request_cost, response.usage.total_tokens, "translation")
    
    return {
        "translated_text": translation,
        "detected_language": detected_lang,
        "tokens_used": response.usage.total_tokens,
        "cost_estimate": request_cost
    }

def extract_text_with_gpt_vision(image_base64: str) -> str:
    """Extract text from image using GPT-4 Vision"""
    prompt = """Extract all text from this food packaging image in both Arabic and English. 
    Focus on ingredient lists, nutritional information, and product descriptions.
    Return only the text, preserving line breaks and formatting."""
    
    response = client.chat.completions.create(
        model="gpt-4o",  # Use GPT-4o for better vision capabilities
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        max_tokens=1500
    )
    
    track_completion_cost(response.usage.total_tokens)
    return response.choices[0].message.content.strip()

def extract_text_with_tesseract(image_data: bytes) -> str:
    """Extract text from image using Tesseract OCR"""
    try:
        import pytesseract
        from PIL import Image
        
        # Open image
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Configure Tesseract for Arabic and English
        config = '--oem 3 --psm 6 -l ara+eng'
        
        # Extract text
        text = pytesseract.image_to_string(image, config=config)
        
        return text.strip()
    except ImportError:
        raise HTTPException(status_code=500, detail="Tesseract OCR not available. Install pytesseract.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tesseract OCR error: {str(e)}")

def sanitize_text_input(text: str, max_length: int = 10000) -> str:
    """Sanitize and validate text input"""
    if not text or not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Invalid text input")
    
    # Remove null bytes and control characters
    text = text.replace('\x00', '').strip()
    
    # Check length
    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"Text too long. Maximum length: {max_length} characters")
    
    if len(text) == 0:
        raise HTTPException(status_code=400, detail="Empty text input")
    
    return text

def validate_and_process_image(image_data: bytes, max_size_mb: int = 10) -> bytes:
    """Validate and process uploaded image"""
    try:
        # Check file size
        if len(image_data) > max_size_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image too large. Maximum size: {max_size_mb}MB")
        
        # Open and validate image
        image = Image.open(BytesIO(image_data))
        
        # Check if it's a valid image
        image.verify()
        
        # Reopen for processing (verify() closes the image)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode not in ['RGB', 'RGBA']:
            image = image.convert('RGB')
        
        # Resize if too large (for better OCR performance)
        max_dimension = 2048
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save processed image to bytes
        output = BytesIO()
        image.save(output, format='JPEG', quality=95)
        return output.getvalue()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load glossary on startup"""
    logger.info("🚀 Starting FoodLang AI API server...")
    logger.info(f"Environment: {'Production' if os.getenv('ENVIRONMENT') == 'production' else 'Development'}")
    logger.info(f"CORS Origins: {cors_origins}")
    state.load_glossary()
    logger.info("✅ Server startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down FoodLang AI API server...")
    logger.info("✅ Server shutdown complete")

@app.get("/")
async def root(request: Request, _: str = Depends(lambda r: rate_limit_dependency(r, "root", 20))):
    """Root endpoint"""
    return {
        "status": "online",
        "service": "FoodLang AI API",
        "version": "1.0.0",
        "glossary_loaded": state.initialized
    }

@app.get("/api/health")
async def health_check(request: Request, _: str = Depends(lambda r: rate_limit_dependency(r, "health", 30))):
    """Enhanced health check endpoint with comprehensive monitoring"""
    try:
        # Get comprehensive health status from monitor
        health_status = health_monitor.check_system_health()
        
        # Add additional service-specific information
        health_status.update({
            "service": "FoodLang AI API",
            "version": "1.0.0",
            "uptime_hours": round((time.time() - startup_time) / 3600, 2),
            "glossary": {
                "loaded": state.initialized,
                "entries": len(state.glossary) if state.initialized else 0,
                "last_updated": state.metadata.get("created_at", "Unknown") if state.metadata else "Unknown"
            },
            "services": {
                "faiss_index": "loaded" if state.index is not None else "not_loaded"
            },
            "monitoring": {
                "error_rate_5min": health_monitor.get_error_rate(5),
                "avg_response_time_5min": health_monitor.get_avg_response_time(5),
                "recent_errors_count": len(health_monitor.recent_errors),
                "recent_response_times_count": len(health_monitor.recent_response_times)
            },
            "session_stats": calculate_costs()
        })
        
        # Check Tesseract availability
        try:
            import pytesseract
            health_status["ocr_methods"] = {
                "gpt_vision": True,
                "tesseract": {"available": True, "error": None}
            }
        except ImportError as e:
            health_status["ocr_methods"] = {
                "gpt_vision": True,
                "tesseract": {"available": False, "error": str(e)}
            }
        
        logger.info(f"Health check - Status: {health_status['overall_status']}, Checks: {len(health_status['checks'])}")
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        health_monitor.record_error("health_check_error", "/api/health", str(e))
        
        # Return minimal health status on error
        return {
            "status": "error",
            "service": "FoodLang AI API",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Health check failed",
            "details": str(e)
        }

# Add startup time tracking
startup_time = time.time()

# ============================================================================
# Enhanced Monitoring and Alerting
# ============================================================================

class HealthMonitor:
    """Enhanced health monitoring with alerting capabilities"""
    
    def __init__(self):
        self.alert_thresholds = {
            "memory_usage_percent": 85.0,
            "disk_usage_percent": 90.0,
            "cpu_usage_percent": 90.0,
            "error_rate_threshold": 0.1,  # 10% error rate
            "response_time_threshold": 5.0,  # 5 seconds
        }
        self.recent_errors = deque(maxlen=100)
        self.recent_response_times = deque(maxlen=100)
        self.alert_cooldown = {}  # Prevent spam alerts
        self.alert_cooldown_duration = 300  # 5 minutes
    
    def record_error(self, error_type: str, endpoint: str, details: str = ""):
        """Record an error for monitoring"""
        error_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": error_type,
            "endpoint": endpoint,
            "details": details
        }
        self.recent_errors.append(error_entry)
        logger.error(f"Error recorded: {error_type} on {endpoint} - {details}")
    
    def record_response_time(self, endpoint: str, response_time: float):
        """Record response time for monitoring"""
        self.recent_response_times.append({
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": endpoint,
            "response_time": response_time
        })
        
        # Check for slow response alert
        if response_time > self.alert_thresholds["response_time_threshold"]:
            self._trigger_alert("slow_response", f"Slow response on {endpoint}: {response_time:.2f}s")
    
    def get_error_rate(self, window_minutes: int = 5) -> float:
        """Calculate error rate in the last N minutes"""
        if not self.recent_errors:
            return 0.0
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        recent_errors = [
            e for e in self.recent_errors 
            if datetime.fromisoformat(e["timestamp"]) > cutoff_time
        ]
        
        # Estimate total requests (this is approximate)
        total_requests = len(self.recent_response_times)
        if total_requests == 0:
            return 0.0
        
        return len(recent_errors) / total_requests
    
    def get_avg_response_time(self, window_minutes: int = 5) -> float:
        """Calculate average response time in the last N minutes"""
        if not self.recent_response_times:
            return 0.0
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        recent_times = [
            rt["response_time"] for rt in self.recent_response_times
            if datetime.fromisoformat(rt["timestamp"]) > cutoff_time
        ]
        
        return sum(recent_times) / len(recent_times) if recent_times else 0.0
    
    def check_system_health(self) -> Dict[str, Any]:
        """Comprehensive system health check with alerting"""
        health_status = {
            "overall_status": "healthy",
            "checks": {},
            "alerts": [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            # Check glossary status
            glossary_healthy = state.initialized and state.glossary is not None
            health_status["checks"]["glossary"] = {
                "status": "healthy" if glossary_healthy else "unhealthy",
                "details": f"Loaded with {len(state.glossary) if glossary_healthy else 0} entries"
            }
            
            if not glossary_healthy:
                health_status["overall_status"] = "degraded"
                self._trigger_alert("glossary_error", "Glossary not loaded or corrupted")
            
            # Check OpenAI API connectivity
            openai_healthy = True
            try:
                if config.OPENAI_API_KEY:
                    # Quick test without making actual API call
                    openai_healthy = len(config.OPENAI_API_KEY) > 10
                else:
                    openai_healthy = False
            except Exception as e:
                openai_healthy = False
                logger.error(f"OpenAI API check failed: {e}")
            
            health_status["checks"]["openai_api"] = {
                "status": "healthy" if openai_healthy else "unhealthy",
                "details": "API key configured" if openai_healthy else "API key missing or invalid"
            }
            
            if not openai_healthy:
                health_status["overall_status"] = "degraded"
                self._trigger_alert("openai_api_error", "OpenAI API not accessible")
            
            # Check system resources if psutil is available
            try:
                import psutil
                
                # Memory check
                memory = psutil.virtual_memory()
                memory_healthy = memory.percent < self.alert_thresholds["memory_usage_percent"]
                health_status["checks"]["memory"] = {
                    "status": "healthy" if memory_healthy else "warning",
                    "details": f"{memory.percent:.1f}% used",
                    "threshold": f"{self.alert_thresholds['memory_usage_percent']}%"
                }
                
                if not memory_healthy:
                    health_status["overall_status"] = "degraded"
                    self._trigger_alert("high_memory", f"Memory usage at {memory.percent:.1f}%")
                
                # CPU check
                cpu_percent = psutil.cpu_percent(interval=1)
                cpu_healthy = cpu_percent < self.alert_thresholds["cpu_usage_percent"]
                health_status["checks"]["cpu"] = {
                    "status": "healthy" if cpu_healthy else "warning",
                    "details": f"{cpu_percent:.1f}% used",
                    "threshold": f"{self.alert_thresholds['cpu_usage_percent']}%"
                }
                
                if not cpu_healthy:
                    health_status["overall_status"] = "degraded"
                    self._trigger_alert("high_cpu", f"CPU usage at {cpu_percent:.1f}%")
                
                # Disk check
                if os.path.exists("data"):
                    disk = psutil.disk_usage("data")
                    disk_percent = (disk.used / disk.total) * 100
                    disk_healthy = disk_percent < self.alert_thresholds["disk_usage_percent"]
                    health_status["checks"]["disk"] = {
                        "status": "healthy" if disk_healthy else "warning",
                        "details": f"{disk_percent:.1f}% used",
                        "threshold": f"{self.alert_thresholds['disk_usage_percent']}%"
                    }
                    
                    if not disk_healthy:
                        health_status["overall_status"] = "degraded"
                        self._trigger_alert("high_disk", f"Disk usage at {disk_percent:.1f}%")
                
            except ImportError:
                health_status["checks"]["system_resources"] = {
                    "status": "unknown",
                    "details": "psutil not available for system monitoring"
                }
            
            # Check error rate
            error_rate = self.get_error_rate()
            error_rate_healthy = error_rate < self.alert_thresholds["error_rate_threshold"]
            health_status["checks"]["error_rate"] = {
                "status": "healthy" if error_rate_healthy else "warning",
                "details": f"{error_rate:.2%} error rate",
                "threshold": f"{self.alert_thresholds['error_rate_threshold']:.1%}"
            }
            
            if not error_rate_healthy:
                health_status["overall_status"] = "degraded"
                self._trigger_alert("high_error_rate", f"Error rate at {error_rate:.2%}")
            
            # Check average response time
            avg_response_time = self.get_avg_response_time()
            response_time_healthy = avg_response_time < self.alert_thresholds["response_time_threshold"]
            health_status["checks"]["response_time"] = {
                "status": "healthy" if response_time_healthy else "warning",
                "details": f"{avg_response_time:.2f}s average",
                "threshold": f"{self.alert_thresholds['response_time_threshold']}s"
            }
            
            if not response_time_healthy and avg_response_time > 0:
                health_status["overall_status"] = "degraded"
                self._trigger_alert("slow_response_avg", f"Average response time at {avg_response_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            health_status["overall_status"] = "error"
            health_status["checks"]["health_check"] = {
                "status": "error",
                "details": f"Health check failed: {str(e)}"
            }
        
        return health_status
    
    def _trigger_alert(self, alert_type: str, message: str):
        """Trigger an alert with cooldown to prevent spam"""
        now = time.time()
        last_alert = self.alert_cooldown.get(alert_type, 0)
        
        if now - last_alert > self.alert_cooldown_duration:
            self.alert_cooldown[alert_type] = now
            logger.warning(f"ALERT [{alert_type}]: {message}")
            
            # In production, you could send alerts to external services here
            # Examples: Slack, email, PagerDuty, etc.
            self._log_alert(alert_type, message)
    
    def _log_alert(self, alert_type: str, message: str):
        """Log alert to file for persistence"""
        try:
            alert_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "type": alert_type,
                "message": message,
                "severity": "warning"
            }
            
            os.makedirs("data", exist_ok=True)
            alert_log_path = "data/alerts.json"
            
            alerts = []
            if os.path.exists(alert_log_path):
                try:
                    with open(alert_log_path, 'r') as f:
                        alerts = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    alerts = []
            
            alerts.append(alert_entry)
            
            # Keep only last 500 alerts
            if len(alerts) > 500:
                alerts = alerts[-500:]
            
            with open(alert_log_path, 'w') as f:
                json.dump(alerts, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to log alert: {e}")

# Initialize health monitor
health_monitor = HealthMonitor()

@app.post("/api/translate", response_model=TranslateResponse)
async def translate(
    translate_request: TranslateRequest, 
    request: Request, 
    _: str = Depends(lambda r: rate_limit_dependency(r, "translate", 50))
):
    """Translate text endpoint with enhanced error handling"""
    try:
        logger.info(f"Translation request: {len(translate_request.text)} characters")
        result = translate_text(translate_request.text)
        logger.info(f"Translation successful: {result['detected_language']} -> target language")
        return TranslateResponse(**result)
    except HTTPException as he:
        logger.warning(f"Translation HTTP error: {he.status_code} - {he.detail}")
        health_monitor.record_error("http_error", "/api/translate", f"HTTP {he.status_code}: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Translation error: {str(e)}", exc_info=True)
        health_monitor.record_error("translation_error", "/api/translate", str(e))
        raise HTTPException(status_code=500, detail="Translation service temporarily unavailable")

@app.post("/api/ocr", response_model=OCRResponse)
async def ocr_and_translate(
    request: Request,
    file: UploadFile = File(...), 
    ocr_method: str = "gpt-vision",
    _: str = Depends(lambda r: rate_limit_dependency(r, "ocr", 20))
):
    """OCR and translate image endpoint with enhanced error handling"""
    try:
        logger.info(f"OCR request: {file.filename} ({file.content_type}) using {ocr_method}")
        
        if not state.initialized:
            logger.error("OCR request failed: Glossary not loaded")
            health_monitor.record_error("service_unavailable", "/api/ocr", "Glossary not loaded")
            raise HTTPException(status_code=503, detail="Glossary not loaded")
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if not file.content_type or file.content_type not in allowed_types:
            logger.warning(f"Invalid file type: {file.content_type}")
            health_monitor.record_error("validation_error", "/api/ocr", f"Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Validate filename
        if not file.filename or len(file.filename) > 255:
            logger.warning(f"Invalid filename: {file.filename}")
            health_monitor.record_error("validation_error", "/api/ocr", f"Invalid filename: {file.filename}")
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        # Read and process image data
        raw_image_data = await file.read()
        processed_image_data = validate_and_process_image(raw_image_data)
        
        # Extract text from image based on method
        if ocr_method == "gpt-vision":
            image_base64 = base64.b64encode(processed_image_data).decode('utf-8')
            extracted_text = extract_text_with_gpt_vision(image_base64)
        elif ocr_method == "tesseract":
            extracted_text = extract_text_with_tesseract(processed_image_data)
        else:
            logger.warning(f"Invalid OCR method: {ocr_method}")
            health_monitor.record_error("validation_error", "/api/ocr", f"Invalid OCR method: {ocr_method}")
            raise HTTPException(status_code=400, detail="Invalid OCR method. Use 'gpt-vision' or 'tesseract'")
        
        if not extracted_text or len(extracted_text.strip()) == 0:
            logger.info("No text detected in image")
            return OCRResponse(
                extracted_text="",
                translated_text="No text detected in image",
                detected_language="none",
                tokens_used=0,
                cost_estimate=0.0
            )
        
        # Translate extracted text
        translation_result = translate_text(extracted_text)
        
        # Log OCR usage (translation is already logged in translate_text)
        log_api_usage("/api/ocr", translation_result["cost_estimate"], translation_result["tokens_used"], "ocr")
        
        logger.info(f"OCR successful: {len(extracted_text)} chars extracted, translated to {translation_result['detected_language']}")
        
        return OCRResponse(
            extracted_text=extracted_text,
            translated_text=translation_result["translated_text"],
            detected_language=translation_result["detected_language"],
            tokens_used=translation_result["tokens_used"],
            cost_estimate=translation_result["cost_estimate"]
        )
    except HTTPException as he:
        logger.warning(f"OCR HTTP error: {he.status_code} - {he.detail}")
        health_monitor.record_error("http_error", "/api/ocr", f"HTTP {he.status_code}: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"OCR error: {str(e)}", exc_info=True)
        health_monitor.record_error("ocr_error", "/api/ocr", str(e))
        raise HTTPException(status_code=500, detail="OCR service temporarily unavailable")

@app.post("/api/admin/login", response_model=LoginResponse)
async def admin_login(
    login_request: LoginRequest,
    request: Request,
    _: str = Depends(lambda r: rate_limit_dependency(r, "login", 5))  # Strict rate limit for login
):
    """Admin login endpoint with secure password validation"""
    # Validate username
    if login_request.username != config.ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For backward compatibility, check if password is already hashed
    # In production, ADMIN_PASSWORD should be a bcrypt hash
    admin_password = config.ADMIN_PASSWORD
    if admin_password.startswith('$2b$'):
        # Password is already hashed
        if not verify_password(login_request.password, admin_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        # Plain text password (for development only)
        if login_request.password != admin_password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(login_request.username)
    expiration = datetime.utcnow() + timedelta(minutes=config.JWT_EXPIRATION_MINUTES)
    
    return LoginResponse(
        token=token,
        expires_at=expiration.isoformat()
    )

@app.get("/api/admin/glossary", response_model=GlossaryInfo)
async def get_glossary_info(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get glossary information"""
    if not state.initialized:
        raise HTTPException(status_code=404, detail="No glossary loaded")
    
    file_size = "N/A"
    if os.path.exists(config.GLOSSARY_PATH):
        size_bytes = os.path.getsize(config.GLOSSARY_PATH)
        file_size = f"{size_bytes / 1024:.2f} KB"
    
    return GlossaryInfo(
        total_entries=len(state.glossary),
        last_updated=state.metadata.get("created_at", "Unknown") if state.metadata else "Unknown",
        file_size=file_size
    )

@app.post("/api/admin/glossary/upload")
async def upload_glossary(
    request: Request,
    file: UploadFile = File(...),
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin_upload", 10))  # Lower limit for uploads
):
    """Upload new glossary"""
    try:
        # Validate file type
        allowed_types = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                        "application/vnd.ms-excel"]
        if not file.content_type or file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
            )
        
        # Validate filename
        if not file.filename or not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
            raise HTTPException(status_code=400, detail="Invalid Excel filename")
        
        # Read Excel file
        contents = await file.read()
        
        # Validate file size (max 50MB for Excel files)
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Excel file too large. Maximum size: 50MB")
        
        glossary = pd.read_excel(BytesIO(contents))
        
        # Validate and process
        if len(glossary.columns) < 2:
            raise HTTPException(status_code=400, detail="Excel file must have at least 2 columns")
        
        glossary = glossary.iloc[:, :2]
        glossary.columns = ['english', 'arabic']
        
        # Clean data
        glossary['english'] = glossary['english'].astype(str).str.strip()
        glossary['arabic'] = glossary['arabic'].astype(str).str.strip()
        
        glossary = glossary[
            (glossary['english'] != '') &
            (glossary['english'] != 'nan') &
            (glossary['arabic'] != '') &
            (glossary['arabic'] != 'nan')
        ]
        
        if len(glossary) == 0:
            raise HTTPException(status_code=400, detail="No valid entries found in glossary")
        
        # Create combined searchable text
        glossary['combined'] = glossary['english'] + " | " + glossary['arabic']
        
        # Generate embeddings
        embeddings = get_embeddings_batch(glossary['combined'].tolist())
        
        # Build FAISS index
        index = faiss.IndexFlatL2(config.EMBEDDING_DIMENSIONS)
        index.add(embeddings)
        
        # Update state
        state.index = index
        state.glossary = glossary
        state.metadata = {
            "created_at": datetime.now().isoformat(),
            "num_entries": len(glossary),
            "file_name": file.filename
        }
        state.initialized = True
        
        # Save to disk
        state.save_glossary()
        
        # Log update history
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "entries": len(glossary),
            "user": username
        }
        
        history = []
        if os.path.exists(config.HISTORY_PATH):
            with open(config.HISTORY_PATH, 'r') as f:
                history = json.load(f)
        
        history.insert(0, history_entry)
        history = history[:10]  # Keep last 10
        
        os.makedirs("data", exist_ok=True)
        with open(config.HISTORY_PATH, 'w') as f:
            json.dump(history, f)
        
        return {
            "success": True,
            "message": f"Glossary uploaded successfully with {len(glossary)} entries"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/cost", response_model=CostBreakdown)
async def get_cost_breakdown(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get cost breakdown"""
    costs = calculate_costs()
    return CostBreakdown(**costs)

@app.get("/api/cost")
async def get_session_cost(
    request: Request,
    _: str = Depends(lambda r: rate_limit_dependency(r, "cost", 100))
):
    """Get current session cost information (public endpoint)"""
    costs = calculate_costs()
    return {
        "session_cost": costs["total_cost"],
        "total_calls": state.cost_tracker["embedding_requests"] + state.cost_tracker["completion_requests"],
        "embedding_tokens": costs["embedding_tokens"],
        "completion_tokens": costs["completion_tokens"]
    }

@app.get("/api/admin/history")
async def get_update_history(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get glossary update history"""
    if not os.path.exists(config.HISTORY_PATH):
        return []
    
    with open(config.HISTORY_PATH, 'r') as f:
        return json.load(f)

@app.get("/api/admin/usage")
async def get_usage_statistics(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get detailed usage statistics"""
    try:
        # Load usage logs
        logs = []
        if os.path.exists(config.COST_LOG_PATH):
            with open(config.COST_LOG_PATH, 'r') as f:
                logs = json.load(f)
        
        # Calculate statistics
        total_requests = len(logs)
        total_cost = sum(log.get("cost", 0) for log in logs)
        total_tokens = sum(log.get("tokens_used", 0) for log in logs)
        
        # Group by endpoint
        endpoint_stats = {}
        for log in logs:
            endpoint = log.get("endpoint", "unknown")
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {
                    "requests": 0,
                    "cost": 0,
                    "tokens": 0
                }
            endpoint_stats[endpoint]["requests"] += 1
            endpoint_stats[endpoint]["cost"] += log.get("cost", 0)
            endpoint_stats[endpoint]["tokens"] += log.get("tokens_used", 0)
        
        # Get recent logs (last 50)
        recent_logs = logs[-50:] if logs else []
        
        # Current session stats
        current_costs = calculate_costs()
        
        return {
            "total_requests": total_requests,
            "total_cost": round(total_cost, 6),
            "total_tokens": total_tokens,
            "endpoint_breakdown": endpoint_stats,
            "recent_logs": recent_logs,
            "current_session": current_costs
        }
        
    except Exception as e:
        logger.error(f"Error retrieving usage statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving usage statistics: {str(e)}")

@app.get("/api/admin/monitoring")
async def get_monitoring_data(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get comprehensive monitoring data for system health"""
    try:
        # Get health status from monitor
        health_status = health_monitor.check_system_health()
        
        # System metrics
        system_metrics = {}
        try:
            import psutil
            
            # Memory usage
            memory = psutil.virtual_memory()
            system_metrics["memory"] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used
            }
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            system_metrics["cpu_percent"] = cpu_percent
            
            # Disk usage for data directory
            if os.path.exists("data"):
                disk = psutil.disk_usage("data")
                system_metrics["disk"] = {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100
                }
                
        except ImportError:
            system_metrics["error"] = "psutil not available for system monitoring"
        
        # Rate limiting stats
        rate_limit_stats = {}
        for key, requests in rate_limit_storage.items():
            rate_limit_stats[key] = len(requests)
        
        # Error log analysis (last 100 lines from log file)
        error_logs = []
        log_file_path = "data/app.log"
        if os.path.exists(log_file_path):
            try:
                with open(log_file_path, 'r') as f:
                    lines = f.readlines()
                    # Get last 100 lines and filter for errors/warnings
                    recent_lines = lines[-100:] if len(lines) > 100 else lines
                    for line in recent_lines:
                        if any(level in line for level in ['ERROR', 'WARNING', 'CRITICAL']):
                            error_logs.append(line.strip())
            except Exception as e:
                error_logs = [f"Error reading log file: {str(e)}"]
        
        # Load alerts from file
        alerts = []
        alert_log_path = "data/alerts.json"
        if os.path.exists(alert_log_path):
            try:
                with open(alert_log_path, 'r') as f:
                    alerts = json.load(f)
                    # Get last 50 alerts
                    alerts = alerts[-50:] if len(alerts) > 50 else alerts
            except (json.JSONDecodeError, FileNotFoundError):
                alerts = []
        
        # Application-specific metrics
        app_metrics = {
            "glossary_loaded": state.initialized,
            "glossary_entries": len(state.glossary) if state.initialized else 0,
            "faiss_index_size": state.index.ntotal if state.index else 0,
            "session_costs": calculate_costs(),
            "uptime_seconds": time.time() - startup_time if 'startup_time' in globals() else 0,
            "error_rate_5min": health_monitor.get_error_rate(5),
            "avg_response_time_5min": health_monitor.get_avg_response_time(5),
            "recent_errors_count": len(health_monitor.recent_errors),
            "recent_response_times_count": len(health_monitor.recent_response_times)
        }
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "health_checks": health_status,
            "system": system_metrics,
            "application": app_metrics,
            "rate_limiting": {
                "active_clients": len(rate_limit_stats),
                "client_stats": rate_limit_stats
            },
            "recent_errors": error_logs[-20:],  # Last 20 error/warning logs
            "alerts": alerts,
            "monitoring_thresholds": health_monitor.alert_thresholds
        }
        
    except Exception as e:
        logger.error(f"Error retrieving monitoring data: {str(e)}")
        health_monitor.record_error("monitoring_error", "/api/admin/monitoring", str(e))
        raise HTTPException(status_code=500, detail=f"Error retrieving monitoring data: {str(e)}")

@app.get("/api/admin/alerts")
async def get_alerts(
    request: Request,
    username: str = Depends(require_admin_auth),
    limit: int = 50,
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Get recent alerts"""
    try:
        alerts = []
        alert_log_path = "data/alerts.json"
        
        if os.path.exists(alert_log_path):
            try:
                with open(alert_log_path, 'r') as f:
                    all_alerts = json.load(f)
                    # Get last N alerts
                    alerts = all_alerts[-limit:] if len(all_alerts) > limit else all_alerts
                    # Reverse to show most recent first
                    alerts.reverse()
            except (json.JSONDecodeError, FileNotFoundError):
                alerts = []
        
        return {
            "alerts": alerts,
            "total_count": len(alerts),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrieving alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving alerts: {str(e)}")

@app.post("/api/admin/alerts/clear")
async def clear_alerts(
    request: Request,
    username: str = Depends(require_admin_auth),
    _: str = Depends(lambda r: rate_limit_dependency(r, "admin", config.ADMIN_RATE_LIMIT_REQUESTS))
):
    """Clear all alerts"""
    try:
        alert_log_path = "data/alerts.json"
        
        if os.path.exists(alert_log_path):
            os.remove(alert_log_path)
        
        logger.info(f"Alerts cleared by admin user: {username}")
        
        return {
            "success": True,
            "message": "All alerts cleared",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error clearing alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error clearing alerts: {str(e)}")

# ============================================================================
# Production ASGI Configuration
# ============================================================================

def create_app():
    """Factory function to create the FastAPI app"""
    return app

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    # Default to 10000 for Render, 8000 for local development
    default_port = 10000 if os.getenv("RENDER") else 8000
    port = int(os.getenv("PORT", default_port))
    host = os.getenv("HOST", "0.0.0.0")
    workers = int(os.getenv("WORKERS", 1))
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Production configuration
    if environment == "production":
        # Use Gunicorn-compatible settings for production
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=workers,
            loop="uvloop",
            http="httptools",
            access_log=True,
            use_colors=False,
            server_header=False,
            date_header=False,
            proxy_headers=True,
            forwarded_allow_ips="*",
            timeout_keep_alive=30,
            timeout_graceful_shutdown=30,
        )
    else:
        # Development configuration
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=True,
            reload_dirs=["./"],
            access_log=True,
            use_colors=True,
        )
