# CardioAccess-AI_FYP
# CardioAccess AI

**AI-Assisted Cardiac Screening and Referral Support System**

## About the Project

CardioAccess AI is a Final Year Project (FYP) designed to support cardiac screening and patient referral in healthcare facilities, especially in low-resource areas.

The system aims to help healthcare professionals manage patient screening cases, upload ECG and echocardiogram (Echo) data, review AI-assisted findings, and organize referrals.

CardioAccess AI is designed to support clinical decisions, not replace doctors or professional medical judgment.

## Project Objectives

- Make cardiac screening workflows easier for healthcare professionals.
- Support ECG and Echo analysis using artificial intelligence.
- Help clinicians manage patient screening records.
- Improve the organization of patient referrals.
- Provide a simple, modern interface suitable for healthcare facilities with limited resources.
- Protect patient information through authentication and role-based access controls.

## User Roles

### Admin
- Manage user accounts and approvals.
- Assign and manage authorized user roles.
- Access administrative and system management features.
- Cannot create new patient screenings.

### Clinician
- Create and manage patient screening cases.
- Upload ECG and Echo files.
- Review available screening results.
- Manage referrals and access clinical analytics.

### Nurse
- Create and manage patient screening cases.
- Upload ECG and Echo files.
- Access permitted patient cases.
- Support clinical screening workflows.

**Note:** These roles describe the intended access design. Frontend restrictions must also be enforced by backend authorization and Supabase Row Level Security (RLS).

## Technologies

| Component | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Authentication | Supabase Authentication |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| AI Integration | Planned ONNX-based inference |
| Version Control | Git and GitHub |

## Project Structure

```text
CardioAccess-AI_FYP/
│
├── CardioAccess_AI FYP Project/
│   ├── Backend/
│   ├── Frontend/
│   ├── Documentation/
│   ├── Training and Testing/
│   └── cardioaccess-ai.code-workspace
│
├── .gitignore
└── README.md
```

## Main System Features

- User registration and sign-in
- Account verification and approval workflow
- Role-based application navigation
- Patient screening case management
- ECG and Echo file uploads
- Patient case records
- Referral management interface
- Clinical analytics interface
- AI-assisted cardiac analysis (integration in progress)

## Running the Frontend

Open a terminal inside the `Frontend` directory.

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Configure your Supabase project URL and publishable key in `.env.local`.

Start the development server:

```powershell
npm run dev
```

See `Frontend/README.md` for additional Supabase setup and database migration instructions.

## Backend

The project includes a Python FastAPI backend in the `Backend` directory.

Backend API functionality, authorization, and integration with AI inference require further verification and testing.

## Documentation

The `Documentation` directory contains the project's academic documentation, including:

- Software Requirements Specification (SRS)
- Software Design Specification (SDS)
- Revised Project Proposal

The `Training and Testing` directory is reserved for model training, evaluation, and testing materials.

## Current Development Status

CardioAccess AI is under active development.

The repository includes frontend application code, backend source files, and Supabase database migrations.

Some features, including AI model inference, protected administrative operations, and complete referral processing, may require additional implementation and testing.

The presence of a feature in the interface does not necessarily mean its backend functionality is complete.

## Medical Disclaimer

CardioAccess AI is an academic project intended