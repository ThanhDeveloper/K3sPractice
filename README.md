# K3sPractice

Production-ready K3s microservices demo with ArgoCD GitOps.

## Project Structure (Enterprise Standard)

```
K3sPractice/
├── src/                              # Source code
│   ├── backend-api/                  # ASP.NET Core 8.0 API
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── Dockerfile
│   └── frontend-web/                 # React + Vite
│       ├── src/
│       ├── package.json
│       └── Dockerfile
│
├── k8s/                              # Kubernetes manifests
│   ├── base/                         # Base K8s configs
│   │   ├── backend/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── hpa.yaml
│   │   ├── frontend/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   └── ingress.yaml
│   │
│   └── argocd/                       # ArgoCD apps (GitOps)
│       ├── root-app.yaml             # Master app (apply once)
│       └── apps/
│           └── argocd-apps.yaml      # Child apps (auto-managed)
│
└── docs/                             # Documentation
    ├── SETUP.md
    ├── ARCHITECTURE-DIAGRAM.md
    └── ...
```

## Quick Start

### 1. Prerequisites
- K3s or Rancher Desktop
- ArgoCD installed
- Docker Hub account

### 2. Create Secret (before deploy)
```bash
kubectl create secret generic backend-api-secret \
  --from-literal=client_secret=YOUR_SECRET_VALUE
```

### 3. Deploy with ArgoCD (one-time setup)
```bash
kubectl apply -f k8s/argocd/root-app.yaml
```

ArgoCD will automatically:
- Create backend-api, frontend-web, ingress applications
- Sync all K8s manifests from Git
- Auto-deploy on every Git push

### 4. Access

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost/ | Public |
| Backend API | http://localhost/api/server-information | Via Ingress |
| ArgoCD UI | https://localhost:8080 | `kubectl port-forward svc/argocd-server -n argocd 8080:443` |

### 5. Get ArgoCD Password
```powershell
# PowerShell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}")))
```

## Architecture

```
Internet → Ingress (Port 80)
              │
    ┌─────────┴─────────┐
    │                   │
  /api/*              /*
    │                   │
Backend Service    Frontend Service
(ClusterIP)        (ClusterIP)
    │                   │
┌───┴───┐          ┌───┴───┐
│Pod 1-5│          │Pod 1-2│
│ :8080 │          │  :80  │
└───────┘          └───────┘
    │
┌───┴───┐
│ConfigMap│ + │Secret│
└─────────┘
```

## GitOps Flow

```
Developer → Git Push → ArgoCD (auto-sync) → K8s Cluster
                            │
                            ├── Detect changes in k8s/base/*
                            └── Apply manifests automatically
```

## Useful Commands

```bash
# Check pods
kubectl get pods

# Check HPA
kubectl get hpa

# View logs
kubectl logs -l app=backend-api -f

# Force sync
kubectl -n argocd get applications
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE-DIAGRAM.md)
- [K3s Concepts](docs/K3S-CONCEPT.md)
- [Kubernetes Concepts](docs/KUBERNETES-CONCEPT.md)
