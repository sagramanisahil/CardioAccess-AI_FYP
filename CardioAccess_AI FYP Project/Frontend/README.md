# CardioAccess AI — Frontend

CardioAccess AI is a web-based cardiac screening support system designed for healthcare professionals, particularly in low-resource healthcare settings.

The frontend uses React, Vite, and Tailwind CSS. It connects to Supabase for authentication, database access, and secure file storage, and is designed to work with a Python FastAPI backend for AI-assisted analysis.

## 1. User Roles and Access

CardioAccess AI supports three user roles: **Admin, Clinician, and Nurse**.

### Admin

The Admin is responsible for managing the system and its users.

- View the Admin Dashboard.
- Manage user accounts.
- Approve or deactivate accounts.
- Assign authorized user roles.
- Review system audit logs.
- Manage permitted system settings.

Admins do not create patient screenings or access the clinical screening workflow.

### Clinician

- Access the clinical dashboard.
- Create new screening cases.
- Upload ECG and echocardiography (Echo) files.
- Access Screening Review.
- View authorized patient cases and case history.
- Review available AI screening results, uncertainty information, and triage decisions.
- Access permitted clinical analytics.

### Nurse

- Access the clinical dashboard.
- Create new screening cases.
- Upload ECG and Echo files.
- Access Screening Review.
- View authorized patient cases and case history.
- Review available AI screening results, uncertainty information, and triage decisions.
- Access permitted clinical analytics.

**Security:** Frontend role-based navigation is not sufficient to protect patient data. Backend endpoints and Supabase Row Level Security (RLS) must enforce permissions.

These permissions describe the intended design. Features still under development must not be treated as operational.

## 2. Main Frontend Features

- User registration and sign-in.
- Email verification and password recovery.
- Role-based dashboards and navigation.
- Account approval workflow.
- New Screening for Clinicians and Nurses.
- ECG and Echo file uploads.
- Screening Review.
- Case Log and case history.
- Clinical analytics interface.
- User management interface for Admin.
- Display of available AI screening results and summary reports.

AI analysis and report generation depend on backend services and deployed models.

## 3. Frontend Technologies

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and build tools |
| Tailwind CSS | Styling and responsive layouts |
