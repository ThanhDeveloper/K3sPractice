# Kubernetes Networking - Complete Guide

## 🌐 Network Communication Types in Kubernetes

Kubernetes has **4 main types of network communication**:

1. **Pod-to-Pod** (Container to Container)
2. **Pod-to-Service** (Internal communication)
3. **External-to-Service** (Internet to your app)
4. **Service-to-External** (Your app to external APIs)

---

## 📊 Network Types Comparison Table

| Network Type | From → To | Use Case | Example | Kubernetes Resource |
|--------------|-----------|----------|---------|---------------------|
| **Pod-to-Pod** | Pod → Pod | Microservice to microservice | Auth service → User service | NetworkPolicy |
| **ClusterIP** | Pod → Service | Internal API calls | Frontend → Backend API | Service (ClusterIP) |
| **NodePort** | External → Node IP:Port | Development/testing | Your browser → localhost:30081 | Service (NodePort) |
| **LoadBalancer** | Internet → Load Balancer | Production external access | Users → www.example.com | Service (LoadBalancer) |
| **Ingress** | Internet → Domain/Path | Production HTTP/HTTPS routing | api.example.com → API pods | Ingress + Ingress Controller |

---

## 🏗️ Complete Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Internet (Users)                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (443)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    Cloud Load Balancer                               │
│              (AWS ELB, GCP LB, Azure LB)                             │
│                  - TLS Termination                                   │
│                  - DDoS Protection                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP (80)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│               Kubernetes Cluster                                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Ingress Controller (nginx/traefik)              │   │
│  │  Rules:                                                      │   │
│  │  - www.example.com        → Frontend Service                │   │
│  │  - api.example.com        → Backend Service                 │   │
│  │  - api.example.com/users  → User Service                    │   │
│  └──────────────────┬──────────────────┬────────────────────────┘   │
│                     │                  │                            │
│  ┌──────────────────▼──────┐  ┌────────▼──────────────┐            │
│  │  Frontend Service       │  │  Backend Service      │            │
│  │  (ClusterIP)            │  │  (ClusterIP)          │            │
│  │  IP: 10.96.0.10:80      │  │  IP: 10.96.0.20:80    │            │
│  └──────────┬──────────────┘  └────────┬──────────────┘            │
│             │                          │                            │
│  ┌──────────▼──────────────┐  ┌────────▼──────────────────────┐    │
│  │  Frontend Pods          │  │  Backend Pods                 │    │
│  │  ┌────┐ ┌────┐ ┌────┐   │  │  ┌────┐ ┌────┐ ┌────┐        │    │
│  │  │Pod1│ │Pod2│ │Pod3│   │  │  │Pod1│ │Pod2│ │Pod3│        │    │
│  │  │FE  │ │FE  │ │FE  │   │  │  │BE  │ │BE  │ │BE  │        │    │
│  │  └────┘ └────┘ └────┘   │  │  └─┬──┘ └─┬──┘ └─┬──┘        │    │
│  └─────────────────────────┘  │    │      │      │            │    │
│                                │    │ Pod-to-Pod communication │    │
│                                │    │ (calls other services)   │    │
│                                └────┼──────┼──────┼────────────┘    │
│                                     │      │      │                 │
│                    ┌────────────────┴──────┴──────┴────┐            │
│                    │                                    │            │
│  ┌─────────────────▼──────────┐  ┌─────────────────────▼──────┐    │
│  │  User Service (ClusterIP)  │  │  Database Service          │    │
│  │  IP: 10.96.0.30:80         │  │  (ClusterIP)               │    │
│  └─────────────┬───────────────┘  │  IP: 10.96.0.40:5432       │    │
│                │                  └──────────┬─────────────────┘    │
│  ┌─────────────▼───────────────┐            │                      │
│  │  User Pods                  │  ┌─────────▼─────────────────┐    │
│  │  ┌────┐ ┌────┐              │  │  PostgreSQL StatefulSet   │    │
│  │  │Pod1│ │Pod2│              │  │  ┌────┐                   │    │
│  │  │User│ │User│              │  │  │DB  │                   │    │
│  │  └────┘ └────┘              │  │  │Pod │                   │    │
│  └─────────────────────────────┘  │  └────┘                   │    │
│                                    └──────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Pod-to-Pod Communication

**Scenario:** Backend Pod needs to call User Service Pod directly

### How it works:
- Each Pod gets its own IP address in the cluster
- Pods can communicate directly using these IPs
- No Service needed (but Services are recommended for stability)

```yaml
# Backend Pod calling User Pod directly
apiVersion: v1
kind: Pod
metadata:
  name: backend-pod
spec:
  containers:
  - name: backend
    image: myapp/backend
    env:
    - name: USER_SERVICE_URL
      value: "http://10.42.0.15:8080"  # Direct Pod IP (NOT recommended)
```

**Visual:**
```
┌─────────────┐                    ┌─────────────┐
│ Backend Pod │  HTTP Request      │  User Pod   │
│ 10.42.0.10  │ ──────────────────▶│ 10.42.0.15  │
│             │  GET /api/users    │             │
└─────────────┘                    └─────────────┘
```

**⚠️ Problem:** If User Pod restarts, its IP changes!

**✅ Better approach:** Use Service (see next section)

---

## 2️⃣ ClusterIP Service (Internal Communication)

**Scenario:** Frontend needs to call Backend API (inside cluster only)

### Use Cases:
- ✅ Frontend (FE) → Backend API
- ✅ Backend → Database
- ✅ Backend → User Service
- ✅ Backend → Payment Service
- ✅ Any internal microservice communication

### Why use ClusterIP?
- Stable IP address (doesn't change)
- Built-in load balancing across Pods
- Service discovery via DNS

```yaml
# Backend Service (ClusterIP - default type)
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP  # Only accessible inside cluster
  selector:
    app: backend
  ports:
  - port: 80           # Service port
    targetPort: 8080   # Pod container port
```

```yaml
# Frontend Pod calls Backend via Service
apiVersion: v1
kind: Pod
metadata:
  name: frontend-pod
spec:
  containers:
  - name: frontend
    image: myapp/frontend
    env:
    - name: API_URL
      value: "http://backend-service"  # Uses Service name (DNS)
```

**Visual:**
```
┌─────────────────┐           ┌──────────────────────┐
│  Frontend Pod   │           │  backend-service     │
│  10.42.0.5      │           │  ClusterIP: 10.96.1.5│
│                 │  HTTP     │  (Load Balancer)     │
│  Calls:         │ ───────▶  └──────────┬───────────┘
│  http://backend-│           │           │           │
│  service        │           │           │           │
└─────────────────┘           ▼           ▼           ▼
                        ┌────────┐  ┌────────┐  ┌────────┐
                        │Backend │  │Backend │  │Backend │
                        │Pod 1   │  │Pod 2   │  │Pod 3   │
                        │:8080   │  │:8080   │  │:8080   │
                        └────────┘  └────────┘  └────────┘
```

**Example Code (Frontend calling Backend):**
```javascript
// Frontend (React/Vue/Angular)
fetch('http://backend-service/api/users')
  .then(res => res.json())
  .then(data => console.log(data));
```

```csharp
// Backend (C#/.NET)
var httpClient = new HttpClient();
var response = await httpClient.GetAsync("http://user-service/api/users");
```

**DNS Resolution:**
- Service name: `backend-service`
- Full DNS: `backend-service.default.svc.cluster.local`
- Kubernetes DNS resolves this to Service ClusterIP

---

## 3️⃣ NodePort Service (Development Access)

**Scenario:** Developer wants to access app from laptop browser

### Use Cases:
- ✅ Development/testing on local machine (like your dotnet-sample)
- ✅ Quick access without Ingress setup
- ❌ **NOT for production** (exposes specific port on all nodes)

```yaml
# Your current dotnet-sample service
apiVersion: v1
kind: Service
metadata:
  name: dotnet-sample-service
spec:
  type: NodePort
  selector:
    app: dotnet-sample
  ports:
  - port: 80           # Service port
    targetPort: 8080   # Pod port
    nodePort: 30081    # External port (30000-32767)
```

**Visual:**
```
┌──────────────────┐
│  Your Browser    │
│  (Developer PC)  │
└────────┬─────────┘
         │ http://localhost:30081
         ▼
┌────────────────────────────────────────┐
│  Kubernetes Node (Rancher Desktop)    │
│                                        │
│  Port 30081 ──────────────────────┐   │
│                                    │   │
│  ┌─────────────────────────────────▼─┐ │
│  │  dotnet-sample-service          │ │
│  │  (NodePort)                     │ │
│  └────────┬────────────────────────┘ │
│           │ Load balances to:        │
│           ▼                          │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Pod 1  │  │ Pod 2  │  │ Pod 3  │ │
│  │ :8080  │  │ :8080  │  │ :8080  │ │
│  └────────┘  └────────┘  └────────┘ │
└────────────────────────────────────────┘
```

**Access methods:**
- `http://localhost:30081` (K3s on Rancher Desktop)
- `http://<node-ip>:30081` (any node IP)

---

## 4️⃣ LoadBalancer Service (Production External Access)

**Scenario:** Public users access your app from internet

### Use Cases:
- ✅ Production web applications
- ✅ Public APIs
- ✅ Mobile app backends
- ⚠️ **Requires cloud provider** (AWS, GCP, Azure)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: LoadBalancer  # Cloud provider creates external LB
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 8080
```

**Visual:**
```
Internet Users
    │
    │ http://52.123.45.67 (External IP from cloud)
    ▼
┌─────────────────────────────────────────┐
│  Cloud Load Balancer                    │
│  (AWS ELB / GCP LB / Azure LB)          │
│  External IP: 52.123.45.67              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Kubernetes Cluster                        │
│  ┌──────────────────────────────────────┐  │
│  │  frontend-service (LoadBalancer)     │  │
│  │  ClusterIP: 10.96.0.50               │  │
│  └─────────────┬────────────────────────┘  │
│                │                            │
│    ┌───────────┼───────────┐               │
│    ▼           ▼           ▼               │
│  ┌────┐     ┌────┐     ┌────┐              │
│  │Pod1│     │Pod2│     │Pod3│              │
│  │:80 │     │:80 │     │:80 │              │
│  └────┘     └────┘     └────┘              │
└────────────────────────────────────────────┘
```

**How it works:**
1. You create Service with `type: LoadBalancer`
2. Cloud provider provisions external load balancer
3. External IP is assigned (e.g., `52.123.45.67`)
4. Traffic flows: Internet → Cloud LB → K8s Service → Pods

**⚠️ Note:** LoadBalancer doesn't work on local K3s/Rancher Desktop (no cloud provider). Use NodePort for local dev.

---

## 5️⃣ Ingress (Production HTTP/HTTPS Routing)

**Scenario:** Multiple apps/domains on same cluster (most common in production)

### Use Cases:
- ✅ Route different domains to different services
- ✅ Path-based routing (e.g., `/api` → backend, `/` → frontend)
- ✅ TLS/SSL termination (HTTPS)
- ✅ Single entry point for multiple services
- ✅ Production-grade HTTP routing

### Why use Ingress instead of LoadBalancer?
- **Cost:** 1 Load Balancer for ALL services (vs 1 LB per service)
- **Features:** SSL, path routing, redirects, authentication
- **Domain routing:** Multiple domains on one IP

```yaml
# Ingress Controller must be installed first
# (K3s includes Traefik by default)

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Auto SSL
spec:
  rules:
  # Route www.example.com to frontend
  - host: www.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80

  # Route api.example.com to backend
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80

  # Path-based routing on same domain
  - host: app.example.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /api/payments
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80

  tls:
  - hosts:
    - www.example.com
    - api.example.com
    secretName: tls-secret  # SSL certificate
```

**Visual:**
```
Internet Users
    │
    │ https://www.example.com
    │ https://api.example.com
    ▼
┌────────────────────────────────────────────────┐
│         Ingress Controller                     │
│         (nginx/traefik)                        │
│         - SSL Termination                      │
│         - Domain routing                       │
│         - Path routing                         │
└──────┬──────────────────┬──────────────────────┘
       │                  │
       │ www.example.com  │ api.example.com
       ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  frontend-   │    │  backend-    │
│  service     │    │  service     │
│  (ClusterIP) │    │  (ClusterIP) │
└──────┬───────┘    └──────┬───────┘
       │                   │
   ┌───┴───┐          ┌────┴────┐
   ▼       ▼          ▼         ▼
┌────┐  ┌────┐    ┌────┐   ┌────┐
│FE  │  │FE  │    │BE  │   │BE  │
│Pod1│  │Pod2│    │Pod1│   │Pod2│
└────┘  └────┘    └────┘   └────┘
```

**Path-based routing example:**
```
Request: https://app.example.com/
         → frontend-service

Request: https://app.example.com/api/users
         → user-service

Request: https://app.example.com/api/payments
         → payment-service
```

---

## 🎯 Real-World Use Case Examples

### Example 1: E-commerce Application

```
Users (Internet)
    │ https://shop.example.com
    ▼
┌─────────────────────────────────────────────────┐
│ Ingress Controller                              │
│  /           → frontend-service (React app)     │
│  /api/cart   → cart-service                     │
│  /api/orders → order-service                    │
│  /api/users  → user-service                     │
└─────────────────────────────────────────────────┘
    │
    ├─▶ Frontend Service (ClusterIP) → Frontend Pods
    │     │
    │     └─▶ Calls internal services via ClusterIP:
    │         • http://cart-service/api/cart
    │         • http://order-service/api/orders
    │
    ├─▶ Cart Service (ClusterIP) → Cart Pods
    │     │
    │     └─▶ Calls: http://redis-service (cache)
    │
    ├─▶ Order Service (ClusterIP) → Order Pods
    │     │
    │     └─▶ Calls: http://postgres-service (database)
    │
    └─▶ User Service (ClusterIP) → User Pods
          │
          └─▶ Calls: http://postgres-service
```

### Example 2: Microservices Architecture

```
┌──────────────────────────────────────────────────────────┐
│  External Traffic (Internet)                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Ingress (SSL + Routing)      │
         │  - www.app.com → Frontend     │
         │  - api.app.com → API Gateway  │
         └────────┬──────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    ▼                           ▼
┌─────────────┐         ┌─────────────────┐
│ Frontend    │         │ API Gateway     │
│ Service     │         │ Service         │
│ (ClusterIP) │         │ (ClusterIP)     │
└─────────────┘         └────────┬────────┘
                                 │
                     Internal ClusterIP Services
                     ┌────────┬──────────┬─────────┐
                     ▼        ▼          ▼         ▼
                 ┌─────┐  ┌──────┐  ┌──────┐  ┌──────┐
                 │Auth │  │User  │  │Order │  │Pay   │
                 │Svc  │  │Svc   │  │Svc   │  │Svc   │
                 └──┬──┘  └───┬──┘  └───┬──┘  └───┬──┘
                    │         │         │         │
                    └─────────┴─────────┴─────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              ┌──────────┐        ┌──────────┐
              │PostgreSQL│        │ Redis    │
              │Service   │        │ Service  │
              └──────────┘        └──────────┘
```

---

## 📋 When to Use Each Network Type?

### 1. **Internet → Frontend (Users accessing your app)**
**Use:** Ingress (production) or NodePort (development)

```yaml
# Production
kind: Ingress
spec:
  rules:
  - host: www.myapp.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: frontend-service
```

```yaml
# Development
kind: Service
metadata:
  name: frontend-service
spec:
  type: NodePort
  ports:
  - port: 80
    nodePort: 30080
```

### 2. **Frontend → Backend API (FE to Server)**
**Use:** ClusterIP

```yaml
kind: Service
metadata:
  name: backend-api
spec:
  type: ClusterIP  # Internal only
  ports:
  - port: 80
    targetPort: 8080
```

**Frontend code:**
```javascript
// Calls internal service
fetch('http://backend-api/api/data')
```

### 3. **Backend → Database (Server to Server)**
**Use:** ClusterIP

```yaml
kind: Service
metadata:
  name: postgres-service
spec:
  type: ClusterIP  # No external access
  ports:
  - port: 5432
```

**Backend code:**
```csharp
var connectionString = "Host=postgres-service;Port=5432;Database=mydb";
```

### 4. **Backend → User Service (Server to Server - Microservices)**
**Use:** ClusterIP

```yaml
kind: Service
metadata:
  name: user-service
spec:
  type: ClusterIP
  ports:
  - port: 80
```

**Backend code:**
```csharp
var httpClient = new HttpClient();
var users = await httpClient.GetAsync("http://user-service/api/users");
```

### 5. **Backend → External API (e.g., Stripe, SendGrid)**
**Use:** No Service needed (direct internet access from Pod)

```csharp
// Pod can directly call external APIs
var httpClient = new HttpClient();
var response = await httpClient.PostAsync(
    "https://api.stripe.com/v1/charges",
    content
);
```

---

## 🔐 Network Policies (Security)

Control which Pods can talk to which Pods:

```yaml
# Example: Only allow frontend to call backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend  # Only frontend pods allowed
    ports:
    - protocol: TCP
      port: 8080
```

**Visual:**
```
┌──────────┐         ┌──────────┐
│ Frontend │  ✓ OK   │ Backend  │
│   Pod    │────────▶│   Pod    │
└──────────┘         └──────────┘

┌──────────┐         ┌──────────┐
│ Random   │  ✗ DENY │ Backend  │
│   Pod    │─ ─ ─ ─ ▶│   Pod    │
└──────────┘         └──────────┘
```

---

## 📊 Decision Tree: Which Service Type?

```
Is this for external access?
├─ No (internal only)
│  └─▶ Use ClusterIP
│      Example: Backend → Database
│
├─ Yes (external access needed)
   │
   ├─ Is this production?
   │  ├─ Yes
   │  │  ├─ Do you need domain routing/SSL?
   │  │  │  ├─ Yes → Use Ingress
   │  │  │  │   Example: www.app.com, api.app.com
   │  │  │  └─ No  → Use LoadBalancer
   │  │  │      Example: Single public IP
   │  │  │
   │  └─ No (development/testing)
   │     └─▶ Use NodePort
   │         Example: localhost:30081
```

---

## 💡 Summary

| From | To | Network Type | Example |
|------|-----|--------------|---------|
| **Internet** | Frontend | Ingress (prod) or NodePort (dev) | User browser → Your app |
| **Frontend** | Backend | ClusterIP | React app → API server |
| **Backend** | Database | ClusterIP | API → PostgreSQL |
| **Backend** | User Service | ClusterIP | Order service → User service |
| **Backend** | External API | Direct (no Service) | Your app → Stripe API |
| **Internet** | API | Ingress with path routing | api.example.com/v1/users |

**Golden Rules:**
1. **Internal communication** (pod-to-pod, service-to-service) → **ClusterIP**
2. **External access in production** → **Ingress** (with SSL/domain routing)
3. **External access in development** → **NodePort**
4. **Cloud production (simple)** → **LoadBalancer**
5. **Security between services** → **NetworkPolicy**

---

## 🔗 Next Steps

- Read [SETUP.md](SETUP.md) for hands-on setup
- Try creating different Service types
- Experiment with Ingress routing
- Implement NetworkPolicies for security
