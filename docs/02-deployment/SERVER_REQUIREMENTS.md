# LogiTrack Pro - Server Requirements

> Version: 2026-03-05
> Audience: Internal IT/Ops
> Deployment target: On-premise server

---

## 1. Purpose
This document defines the server specifications, OS, software stack, network ports, and operational requirements for deploying LogiTrack Pro in an on-premise environment.

---

## 2. Deployment Options

### Option A: Single Server (All-in-One)
- Web server / reverse proxy
- Spring Boot backend
- MySQL database
- Recommended for pilot or small internal usage

### Option B: Split App and Database
- App server: web server + backend
- DB server: MySQL only
- Recommended for production stability and data isolation

---

## 3. Hardware Requirements

### 3.1 App + DB on One Server (Option A)
Minimum:
- CPU: 4 cores
- RAM: 8 GB
- Disk: 200 GB SSD

Recommended:
- CPU: 8 cores
- RAM: 16 GB
- Disk: 500 GB SSD


---

## 4. Operating System
Supported (on-prem):
- Linux: Ubuntu Server 22.04 LTS (recommended)
- Windows Server 2019/2022 (supported, if required by policy)

---

## 5. Software Stack

### 5.1 Runtime
- Java 17+ (backend)
- Node.js 18+ and npm (frontend build only)
- MySQL 8.0+ (database)
- Nginx (Linux) or IIS (Windows) for static frontend hosting and reverse proxy

### 5.2 Build Tools
- Maven 3.6+ (backend build)

---

## 6. Network and Ports

Public (if exposed to users):
- 80/TCP (HTTP)
- 443/TCP (HTTPS)

Internal only:
- 8080/TCP (Spring Boot API)
- 3306/TCP (MySQL)

Management:
- 22/TCP (SSH, Linux) or 3389/TCP (RDP, Windows)

---

## 7. DNS and Certificates
- DNS record for the application domain
- TLS certificate for HTTPS termination (on Nginx/IIS)

---

## 8. Backup and Recovery
- Daily MySQL backups
- Retention: 7-30 days (per policy)
- Backup storage in separate volume or backup server

---

## 9. Monitoring and Logs
- System metrics: CPU, RAM, disk, and network
- Application logs: Spring Boot log files
- Database logs: MySQL error and slow query logs
- Optional: centralized log collection (SIEM or log server)

---

## 10. Security Controls
- Least-privilege firewall rules
- No public exposure of 8080 or 3306
- Admin access restricted by IP allowlist
- Regular OS patching and vulnerability scanning

---

## 11. Capacity Notes
- Baseline dataset includes ~14k enquiries and ~13k offers
- Current usage fits within the recommended specs above
- Scale vertically (CPU/RAM) if concurrent users or data volume grows

