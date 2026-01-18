# K3s Microservices Architecture

## Overview

Single VPS deployment with K3s (lightweight Kubernetes) running a 2-tier application.

## Architecture Diagram

```
                              ┌─────────────────────────────────────────────────────────────┐
                              │                         VPS Server                          │
                              │                    (Single Node K3s Cluster)                │
                              │                                                             │
    Internet                  │  ┌─────────────────────────────────────────────────────┐   │
        │                     │  │              Traefik Ingress Controller              │   │
        │                     │  │                    (Port 80)                         │   │
        ▼                     │  │                                                      │   │
   ┌─────────┐                │  │    /api/*  ──────────┐    /*  ──────────┐           │   │
   │ Browser │ ──────────────▶│  │                      │                  │           │   │
   └─────────┘                │  └──────────────────────┼──────────────────┼───────────┘   │
                              │                         │                  │               │
                              │                         ▼                  ▼               │
                              │  ┌──────────────────────────┐  ┌──────────────────────┐   │
                              │  │   backend-api-service    │  │  frontend-web-service │   │
                              │  │      (ClusterIP)         │  │      (ClusterIP)      │   │
                              │  │       Port: 80           │  │       Port: 80        │   │
                              │  └───────────┬──────────────┘  └───────────┬───────────┘   │
                              │              │                             │               │
                              │      ┌───────┴───────┐             ┌───────┴───────┐       │
                              │      │               │             │               │       │
                              │      ▼               ▼             ▼               ▼       │
                              │  ┌───────┐       ┌───────┐     ┌───────┐       ┌───────┐   │
                              │  │ Pod 1 │       │ Pod 2 │     │ Pod 1 │       │ Pod 2 │   │
                              │  │  BE   │       │  BE   │     │  FE   │       │  FE   │   │
                              │  │ :8080 │       │ :8080 │     │  :80  │       │  :80  │   │
                              │  └───┬───┘       └───┬───┘     └───────┘       └───────┘   │
                              │      │               │                                     │
                              │      │    ┌──────────┴──────────┐                          │
                              │      │    │                     │                          │
                              │      ▼    ▼                     ▼                          │
                              │  ┌─────────────┐          ┌─────────────┐                  │
                              │  │  ConfigMap  │          │   Secret    │                  │
                              │  │ GG_Client_Id│          │client_secret│                  │
                              │  └─────────────┘          └─────────────┘                  │
                              │                                                             │
                              │  ┌─────────────────────────────────────────────────────┐   │
                              │  │                        HPA                           │   │
                              │  │  Backend: 2-5 pods (scale at 50% memory usage)       │   │
                              │  └─────────────────────────────────────────────────────┘   │
                              │                                                             │
                              └─────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────────────────────────────────────────┐
                              │                        ArgoCD                               │
                              │                    (GitOps Controller)                      │
                              │                      Port: 8080                             │
                              │                                                             │
                              │    GitHub Repo ──sync──▶ K8s Manifests ──apply──▶ Cluster  │
                              └─────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (React + Vite)
- **Image:** `thanhdeveloper/k3s-frontend-web:v3`
- **Replicas:** 2
- **Port:** 80 (nginx)
- **Endpoint:** `/` (catch-all)
- **Resources:** 32Mi-64Mi RAM, 50m-100m CPU

### Backend (ASP.NET Core 8.0)
- **Image:** `thanhdeveloper/k3s-backend-api:v2`
- **Replicas:** 2-5 (HPA managed)
- **Port:** 8080
- **Endpoint:** `/api/server-information`
- **Resources:** 64Mi-128Mi RAM, 100m-250m CPU

### Configuration
| Resource | Purpose | Key |
|----------|---------|-----|
| ConfigMap | Non-sensitive config | `GoogleAuth__GG_Client_Id` |
| Secret | Sensitive data | `client_secret` |

### HPA (Horizontal Pod Autoscaler)
- **Target:** Backend Deployment
- **Min Replicas:** 2
- **Max Replicas:** 5
- **Scale Trigger:** Memory > 50% OR CPU > 70%

## Network Flow

```
Browser Request: http://your-server/api/server-information
        │
        ▼
    Traefik Ingress (Port 80)
        │
        ├── Path: /api/* ──▶ backend-api-service:80 ──▶ Pod:8080
        │
        └── Path: /* ──────▶ frontend-web-service:80 ──▶ Pod:80
```

## GitOps Flow (ArgoCD)

```
Developer ──push──▶ GitHub ──sync──▶ ArgoCD ──apply──▶ K8s Cluster
    │                                   │
    │                                   ├── apps/backend-api/k8s/
    │                                   ├── apps/frontend-web/k8s/
    │                                   └── apps/ingress.yaml
    │
    └── Changes auto-deployed within 3 minutes
```

## Ports Summary

| Service | Internal Port | External Port | Access |
|---------|--------------|---------------|--------|
| Frontend | 80 | 80 (via Ingress) | Public |
| Backend | 8080 | - | Internal only |
| ArgoCD | 443 | 8080 (port-forward) | Admin only |

## Commands Reference

### Create Secret (run on server)
```bash
kubectl create secret generic backend-api-secret \
  --from-literal=client_secret=YOUR_SECRET_VALUE \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Check HPA status
```bash
kubectl get hpa backend-api-hpa
kubectl describe hpa backend-api-hpa
```

### Access ArgoCD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open: https://localhost:8080
```

### View logs
```bash
kubectl logs -l app=backend-api -f
kubectl logs -l app=frontend-web -f
```

### Verify deployment
```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```
