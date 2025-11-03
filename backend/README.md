# FoodLang AI Backend

Production-ready FastAPI backend with RAG-based translation, OCR, and glossary management.

## Features

- **RAG-Based Translation**: Uses FAISS vector search with OpenAI embeddings for context-aware translation
- **Image OCR**: GPT-4 Vision integration for text extraction from food packaging images
- **Glossary Management**: Upload and manage bilingual glossaries (Excel format)
- **Cost Tracking**: Real-time API usage and cost estimation
- **Admin Panel**: Secure JWT-based authentication for admin features
- **Update History**: Track glossary updates and rollback capability

## Installation

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Create `.env` file:
\`\`\`bash
cp .env.example .env
# Edit .env with your OpenAI API key and credentials
\`\`\`

3. Create data directory:
\`\`\`bash
mkdir data
\`\`\`

## Running the Server

### Development
\`\`\`bash
python main.py
\`\`\`

### Production (with Gunicorn)
\`\`\`bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
\`\`\`

## API Endpoints

### Public Endpoints

- `GET /` - Health check
- `POST /api/translate` - Translate text
- `POST /api/ocr` - OCR and translate image

### Admin Endpoints (Requires JWT)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/glossary` - Get glossary info
- `POST /api/admin/glossary/upload` - Upload new glossary
- `GET /api/admin/cost` - Get cost breakdown
- `GET /api/admin/history` - Get update history

## Glossary Format

Upload Excel files (.xlsx) with:
- **Column A**: English terms
- **Column B**: Arabic terms

Example:
\`\`\`
| English          | Arabic        |
|------------------|---------------|
| Milk             | حليب          |
| Sugar            | سكر           |
| Wheat Flour      | دقيق القمح    |
\`\`\`

## API Usage Examples

### Text Translation
\`\`\`bash
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Milk and sugar"}'
\`\`\`

### Admin Login
\`\`\`bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
\`\`\`

### Upload Glossary
\`\`\`bash
curl -X POST http://localhost:8000/api/admin/glossary/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@glossary.xlsx"
\`\`\`

## Deployment

### Docker
\`\`\`dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

### Environment Variables
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `JWT_SECRET` - Secret key for JWT tokens (required for production)
- `ADMIN_USERNAME` - Admin username (default: admin)
- `ADMIN_PASSWORD` - Admin password (default: admin123)

## Cost Estimation

- Embeddings: ~$0.02 per 1M tokens
- Completions: ~$0.15 per 1M tokens (GPT-4o-mini)
- Vision: ~$0.01 per image (high detail)

## Security Notes

1. Change default admin credentials in production
2. Use strong JWT_SECRET (32+ characters)
3. Enable HTTPS in production
4. Configure CORS for your frontend domain
5. Use environment variables for sensitive data

## Integration with Frontend

The backend is designed to work seamlessly with the FoodLang AI frontend. Update your frontend API calls to point to this backend URL.

## Support

For issues or questions, please contact the development team.
