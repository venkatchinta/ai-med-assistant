# AI Medical Assistant

A personal AI-powered medical assistant web application for family health management with agentic workflow capabilities.

## Features

### Core Functionality
- **User Authentication**: Secure signup/login with JWT tokens
- **Family Management**: Track up to 6 family members per account
- **Medications Tracking**: Manage prescriptions, supplements, and vitamins
- **Lab Results**: Log and monitor test results with automatic status detection
- **Appointments**: Schedule and track medical appointments with calendar view
- **Health Tracking**: Daily vitals, wellness metrics, and diet logging
- **AI Recommendations**: Intelligent supplement and dietary suggestions based on lab results
- **Patient Portal Integration**: Mock UI for connecting to healthcare provider portals (Epic, Cerner, etc.)

### Technical Features
- **HIPAA Compliance**: PHI encryption at rest, audit logging
- **Dual LLM Support**: Google MedGemma (GCP) or local LLM (Ollama)
- **Database Flexibility**: SQLite for development, PostgreSQL-ready for production
- **Modern UI**: React with Tailwind CSS, responsive design

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic layer
│   │   └── main.py         # Application entry point
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client modules
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Ollama for local LLM

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_TYPE` | `sqlite` or `postgresql` | `sqlite` |
| `DATABASE_URL` | SQLite connection string | `sqlite+aiosqlite:///./med_assistant.db` |
| `SECRET_KEY` | JWT signing key | Change in production! |
| `LLM_PROVIDER` | `gcp` or `local` | `local` |
| `LOCAL_LLM_URL` | Ollama/local LLM URL | `http://localhost:11434` |
| `LOCAL_LLM_MODEL` | Model name | `llama2` |
| `GOOGLE_API_KEY` | Google AI API key | (optional) |

### LLM Configuration

#### Option 1: Local LLM (Ollama)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2

# Set in .env
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama2
```

#### Option 2: Google Cloud (MedGemma)
```bash
# Set in .env
LLM_PROVIDER=gcp
GOOGLE_API_KEY=your-api-key
GCP_PROJECT_ID=your-project-id
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token

### Family Members
- `GET /api/v1/family` - List family members
- `POST /api/v1/family` - Add family member
- `PUT /api/v1/family/{id}` - Update family member
- `DELETE /api/v1/family/{id}` - Delete family member

### Medications
- `GET /api/v1/medications/family/{family_member_id}` - List medications
- `POST /api/v1/medications` - Add medication
- `PUT /api/v1/medications/{id}` - Update medication
- `DELETE /api/v1/medications/{id}` - Delete medication

### Lab Results
- `GET /api/v1/lab-results/family/{family_member_id}` - List lab results
- `GET /api/v1/lab-results/family/{family_member_id}/abnormal` - Get abnormal results
- `POST /api/v1/lab-results` - Add lab result

### Appointments
- `GET /api/v1/appointments/calendar` - Get calendar view
- `POST /api/v1/appointments` - Create appointment

### Health Tracking
- `POST /api/v1/health-tracking/logs` - Log daily vitals
- `POST /api/v1/health-tracking/diet` - Log diet entry
- `GET /api/v1/health-tracking/diet/family/{id}/summary` - Nutrition summary

### AI Recommendations
- `POST /api/v1/ai-recommendations/generate` - Generate AI insights
- `GET /api/v1/ai-recommendations/family/{family_member_id}` - Get recommendations

### Patient Portal (Mock)
- `GET /api/v1/patient-portal/providers` - List available portals
- `POST /api/v1/patient-portal/connect` - Connect to portal
- `POST /api/v1/patient-portal/sync/{provider_id}` - Sync data

## AI Agent Workflow

The AI recommendation system analyzes:
1. **Lab Results**: Identifies deficiencies (low B12, Vitamin D, iron, etc.)
2. **Current Medications**: Checks for interactions
3. **Diet History**: Evaluates nutritional intake
4. **Health Logs**: Considers overall wellness trends

Based on this data, it generates:
- **Supplement Recommendations**: Specific supplements with dosages
- **Dietary Suggestions**: Foods to include/avoid
- **Lifestyle Recommendations**: General health improvements

### Rule-Based Fallback
When LLM is unavailable, the system uses predefined rules for common deficiencies:
- Low B12 → Methylcobalamin supplement + B12-rich foods
- Low Vitamin D → D3 supplement + sun exposure
- Low Iron → Iron supplement + iron-rich foods
- High Cholesterol → Omega-3 + heart-healthy diet

## Security & HIPAA Compliance

- **Encryption**: Sensitive PHI data encrypted at rest using Fernet
- **Audit Logging**: All PHI access logged for compliance
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password Hashing**: bcrypt with salt

## Future Enhancements

- [ ] Real FHIR/SMART integration for patient portals
- [ ] Apple Health / Google Fit integration
- [ ] Push notifications for medication reminders
- [ ] PDF lab result upload with OCR
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## License

MIT License - See LICENSE file for details.

## Disclaimer

This application is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
