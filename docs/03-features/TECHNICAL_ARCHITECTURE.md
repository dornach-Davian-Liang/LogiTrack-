# LogiTrack Pro - Technical Architecture

> Version: 2026-03-05
> Audience: Internal IT/Ops
> Scope: Architecture overview, components, data flow, integration, and non-functional constraints

---

## 1. System Overview
LogiTrack Pro is a logistics enquiry and quotation management system for pricing teams and sales offices. It provides a web UI for enquiry lifecycle management, reporting, and master data maintenance. The system uses a classic three-tier architecture:

- Presentation: React + TypeScript frontend
- Application: Spring Boot REST API
- Data: MySQL relational database

Primary users: pricing admins, operating users, and system admins.

---

## 2. Architecture Diagram (Text)

User Browser
  -> HTTPS (80/443)
  -> Web Server / Reverse Proxy (Nginx or IIS)
  -> Frontend static assets (React build)
  -> API requests (/api/*)
  -> Spring Boot backend (port 8080)
  -> MySQL database (port 3306)

---

## 3. Core Components

### 3.1 Frontend (logitrack-pro)
- Framework: React 19 + TypeScript + Vite
- Responsibilities:
  - UI rendering for enquiry, offer, report, and master data modules
  - Authentication UI and role-based navigation
  - API calls to backend via /api endpoints
- Runtime:
  - Production: static build served by Nginx/IIS
  - Development: Vite dev server

### 3.2 Backend (backend)
- Framework: Spring Boot 3.2
- Language: Java 17+
- Responsibilities:
  - REST API for enquiries, offers, reports, and master data
  - Business logic and validations
  - Audit logging and RBAC enforcement
- Deployment:
  - Fat JAR: target/logitrack-backend-1.0.0.jar

### 3.3 Database (database)
- MySQL 8.0+
- Data domains:
  - Enquiries, offers, audit logs
  - Master data: countries, ports, sales offices, sales PICs, container types
- Initial data import scripts and CSV loaders

---

## 4. Key Data Flows

### 4.1 Enquiry Lifecycle
1) User creates or edits enquiry in UI
2) Frontend sends JSON to POST/PUT /api/enquiries
3) Backend validates and persists to MySQL
4) Backend returns updated record
5) UI refreshes list and detail views

### 4.2 Reporting
1) User opens dashboard or report page
2) Frontend calls report endpoints
3) Backend aggregates data from MySQL
4) UI renders charts and tables

### 4.3 Audit Logging
1) Admin performs create/update/delete
2) Backend writes audit_log entries
3) Admin views audit log in UI

---

## 5. API Interface (High-Level)
All endpoints are prefixed with /api.

- GET /api/enquiries
- GET /api/enquiries/{id}
- POST /api/enquiries
- PUT /api/enquiries/{id}
- DELETE /api/enquiries/{id}

Additional endpoints exist for status, booking status, reports, and master data.

---

## 6. Security and Access Control

- Authentication: application-level login UI (per current implementation)
- Authorization: role-based access control (NORMAL_USER, OPERATING_USER, ADMIN_USER)
- Network isolation:
  - Public access only on 80/443
  - Backend port 8080 restricted to internal access
  - Database port 3306 restricted to internal access
- Audit logging enabled for admin operations

---

## 7. Non-Functional Requirements

- Availability: internal business hours (configurable)
- Performance: responsive UI for 10k+ enquiry records
- Data volume: baseline data set ~14k enquiries, 13k offers
- Logging: application logs + audit logs stored in database
- Backup: daily database backup recommended

---

## 8. Deployment Topologies

### Option A: Single Server (On-Prem)
- One server hosts Nginx/IIS, backend JAR, and MySQL
- Suitable for pilot or small-scale internal use

### Option B: Split App and DB
- App server: Nginx/IIS + Spring Boot
- DB server: MySQL on separate host
- Recommended for production stability

---

## 9. Configuration Summary

- Backend port: 8080
- Frontend: static files served via 80/443
- Database port: 3306
- Environment: application.properties for DB config

---

## 10. References

- Deployment guide: docs/02-deployment/DEPLOYMENT.md
- DMZ role and IP mapping: docs/03-features/SERVER_ROLE_EXPLANATION_DMZ_IP_MAPPING.md
- System demo report: SYSTEM_DEMO_REPORT.md
