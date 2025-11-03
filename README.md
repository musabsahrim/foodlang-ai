# FoodLang AI

A bilingual food packaging translator web application that provides real-time translation between Arabic and English for food packaging labels using AI-powered RAG (Retrieval-Augmented Generation) technology.

## Features

### 🔤 Text Translation
- Real-time Arabic ↔ English translation
- Automatic language detection
- Food-specific terminology using custom glossary
- Copy-to-clipboard functionality

### 📷 Image Processing
- Upload images of food packaging
- Camera capture for mobile devices
- OCR text extraction using GPT-4 Vision
- Automatic translation of extracted text

### 🔧 Admin Panel
- Secure JWT-based authentication
- Glossary management (Excel upload)
- Usage statistics and cost tracking
- Update history and rollback functionality

### 💰 Cost Tracking
- Real-time API usage monitoring
- Detailed cost breakdown
- Session-based cost tracking

## Technology Stack

### Frontend
- **Next.js 14+** with App Router
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Zustand** for state management

### Backend
- **Python 3.9+**
- **FastAPI** framework
- **FAISS** for vector search
- **OpenAI GPT-4o-mini** for translation
- **OpenAI text-embedding-3-small** for embeddings
- **JWT** for authentication

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.9+
- OpenAI API key

### Frontend Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your OpenAI API key

# Start backend server
python main.py
```

### Environment Variables

Create `.env` file in the backend directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Project Structure

```
foodlang-ai/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   └── theme-provider.tsx # Theme provider
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── backend/              # FastAPI backend
│   ├── main.py          # Main FastAPI application
│   ├── requirements.txt # Python dependencies
│   ├── data/           # Data storage directory
│   └── .env.example    # Environment template
└── public/              # Static assets
```

## API Endpoints

### Public Endpoints
- `POST /api/translate` - Translate text
- `POST /api/ocr` - OCR and translate image
- `GET /` - Health check

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/glossary` - Get glossary information
- `POST /api/admin/glossary/upload` - Upload new glossary
- `GET /api/admin/cost` - Get cost breakdown
- `GET /api/admin/history` - Get update history

## Glossary Management

Upload Excel files (.xlsx) with the following format:
- **Column A**: English terms
- **Column B**: Arabic terms

Example:
| English | Arabic |
|---------|--------|
| Milk | حليب |
| Sugar | سكر |
| Wheat Flour | دقيق القمح |

## Deployment

### Frontend (Vercel)
```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel --prod
```

### Backend (Railway/Render)
```bash
# The backend includes a Dockerfile for containerized deployment
# Configure environment variables in your deployment platform
```

## Development

### Running Tests
```bash
# Frontend tests
pnpm test

# Backend tests
cd backend && python -m pytest
```

### Code Quality
```bash
# Lint frontend code
pnpm lint

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.