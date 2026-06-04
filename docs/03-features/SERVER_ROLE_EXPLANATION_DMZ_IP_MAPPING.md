# Server Role Explanation (for DMZ Deployment with IP Mapping)

## 1) Purpose of This Server
This server is the **public access entry point** for the LogiTrack application.  
It is placed in the **DMZ network segment** to receive external user traffic and securely forward application requests to internal services.

In short, this server acts as:
- **Web access gateway** (HTTP/HTTPS entry)
- **Reverse proxy** for backend API routing
- **Security boundary** between Internet users and internal systems

---

## 2) Business Role in LogiTrack
The server supports daily logistics enquiry operations, including:
- Viewing and managing enquiry records
- Submitting and updating pricing-related data
- Accessing reporting and dashboard APIs

Without this server, external users cannot securely access the LogiTrack web system.

---

## 3) Network Placement and Traffic Flow
### Deployment Zone
- Server location: **DMZ**
- Function: Expose controlled public endpoints while isolating internal application/data tiers

### Traffic Path (with IP Mapping)
1. External user accesses **Public IP**
2. Firewall/NAT performs **IP Mapping** to the DMZ server’s private IP
3. DMZ server (Nginx) handles web requests and forwards API traffic to local backend service
4. Backend accesses database through internal network policy only

### Port Exposure Principle
- **Externally allowed**: `80/443` (HTTP/HTTPS)
- **Restricted/internal only**: `8080` (Spring Boot), `3306` (MySQL)
- **Management**: `22` (SSH), source IP restricted to admin network only

---

## 4) Why DMZ + IP Mapping Is Required
- Provide controlled external access without exposing internal network directly
- Reduce attack surface by limiting open ports and services
- Centralize TLS termination and request filtering at gateway layer
- Meet enterprise security and network segregation requirements

---

## 5) Security Controls (High-Level)
- Reverse proxy gateway (Nginx) for request routing and header control
- Firewall rules: least-privilege inbound/outbound policy
- No direct Internet exposure for database and internal service ports
- Access logging and audit trace for security review
- Optional WAF/IPS integration at perimeter (if required by infra policy)

---

## 6) Requested Server Scope
### Requested server type
- 1 x Linux application gateway server in DMZ

### Planned application components on this server
- Nginx (web entry + reverse proxy)
- LogiTrack backend service (Spring Boot, internal port)
- (If approved by infra policy) local MySQL or internal DB connectivity

### Required network setup
- Public IP to private DMZ IP mapping (NAT)
- Domain/DNS binding to public endpoint
- SSL certificate installation for HTTPS

---

## 7) One-Paragraph Version (for approval form)
This server is requested as the DMZ gateway node for the LogiTrack system. It will receive external HTTP/HTTPS traffic via public-to-private IP mapping and provide controlled access to LogiTrack web and API services through Nginx reverse proxy. The design ensures that only web ports are exposed publicly, while backend and database ports remain internal, satisfying network isolation and security compliance requirements.

---

# 中文版本（供内部审批）

## 1）服务器角色说明
该服务器是 LogiTrack 系统的**对外接入网关服务器**，部署在 **DMZ 区域**。  
其职责是接收外部访问流量，并在受控条件下将请求转发到内部应用服务，避免内部网络和数据库直接暴露在公网。

核心角色包括：
- Web 对外入口（HTTP/HTTPS）
- API 反向代理转发（Nginx → Spring Boot）
- 网络安全边界节点（公网与内网隔离）

## 2）网络与端口策略
- 公网开放：`80/443`
- 内部限制：`8080`（应用）、`3306`（数据库）
- 运维端口：`22`（仅允许运维白名单 IP）

访问路径：
公网用户 → 公网 IP → 防火墙 NAT/IP Mapping → DMZ 服务器 → 内部应用/数据库（受策略控制）

## 3）申请理由
采用 DMZ + IP Mapping 可在满足业务外部访问需求的同时，确保内网资源不直接暴露，符合最小权限、分区隔离和安全审计要求。

## 4）审批可直接使用的一段话
本次申请的服务器用于 LogiTrack 系统 DMZ 对外接入，承担公网访问入口与反向代理转发职责。通过公网 IP 与 DMZ 私网 IP 的映射实现外部访问，仅开放 80/443 端口，应用与数据库端口保持内网访问，从架构上保障业务可用性与网络安全合规性。