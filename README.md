# K3sPractice

Kubernetes manifests for ArgoCD GitOps practice with K3s.

## 📚 Documentation

Complete guides to get you started:

1. **[Setup Guide](devops/SETUP.md)** - Install K3s, ArgoCD, and deploy your app
2. **[K3s Concepts](devops/K3S-CONCEPT.md)** - Understanding K3s architecture and features
3. **[Kubernetes Concepts](devops/KUBERNETES-CONCEPT.md)** - Core K8s concepts with diagrams
4. **[Kubernetes Networking](devops/KUBERNETES-NETWORKING.md)** - Complete networking guide (ClusterIP, NodePort, LoadBalancer, Ingress)
5. **[Testing Workflow](devops/TESTING-WORKFLOW.md)** - Step-by-step testing and deployment guide
6. **[Quick Reference](devops/QUICK-REFERENCE.md)** - Command cheat sheet for daily use
7. **[Architecture Diagrams](devops/ARCHITECTURE-DIAGRAM.md)** - Visual guides and flow diagrams

## 🏗️ Structure

```
.
├── apps/
│   ├── dotnet-sample/
│   │   ├── deployment.yaml      # Deployment with 3 replicas
│   │   └── service.yaml         # NodePort service on 30081
│   └── react-sample/            # (Future app)
│
└── devops/
    ├── SETUP.md                    # Installation & setup guide
    ├── K3S-CONCEPT.md              # K3s concepts
    ├── KUBERNETES-CONCEPT.md       # Kubernetes fundamentals
    ├── KUBERNETES-NETWORKING.md    # Networking deep dive
    ├── TESTING-WORKFLOW.md         # Testing guide
    ├── QUICK-REFERENCE.md          # Command cheat sheet
    ├── ARCHITECTURE-DIAGRAM.md     # Visual diagrams
    └── argocd-app.yaml             # ArgoCD application manifest
```

## 🚀 Quick Start

### 1. Prerequisites
- Rancher Desktop with K3s enabled
- Git repository (this repo)

### 2. Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 3. Get ArgoCD Password
```bash
# Windows PowerShell
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

### 4. Access ArgoCD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
Open: https://localhost:8080 (username: `admin`)

### 5. Deploy Application
```bash
# Update devops/argocd-app.yaml with your GitHub username
kubectl apply -f devops/argocd-app.yaml
```

### 6. Access Your App
http://localhost:30081

## 📱 Apps

| App | Replicas | Port | URL |
|-----|----------|------|-----|
| dotnet-sample | 3 | 30081 | http://localhost:30081 |

## 🧪 Test GitOps

```bash
# 1. Make a change
# Edit apps/dotnet-sample/deployment.yaml (change replicas: 3 to 5)

# 2. Commit and push
git add .
git commit -m "Scale to 5 replicas"
git push

# 3. Watch ArgoCD auto-sync (within 3 minutes)
kubectl get pods -l app=dotnet-sample -w
```

## 📖 Learning Path

1. Start with [SETUP.md](devops/SETUP.md) - Get everything running
2. Read [KUBERNETES-CONCEPT.md](devops/KUBERNETES-CONCEPT.md) - Understand the basics
3. Read [K3S-CONCEPT.md](devops/K3S-CONCEPT.md) - Learn about K3s
4. Follow [TESTING-WORKFLOW.md](devops/TESTING-WORKFLOW.md) - Practice GitOps deployments

## 🎯 What You'll Learn

- **K3s**: Lightweight Kubernetes distribution
- **ArgoCD**: GitOps continuous deployment
- **Kubernetes**: Pods, Deployments, Services, Replicas
- **GitOps**: Git as source of truth for infrastructure
- **DevOps**: Automated deployment workflows

## 🔧 Useful Commands

```bash
# Check cluster status
kubectl get nodes

# Check all resources
kubectl get all

# View ArgoCD apps
kubectl get applications -n argocd

# Watch pod status
kubectl get pods -w

# View logs
kubectl logs -l app=dotnet-sample

# Port forward to app
kubectl port-forward svc/dotnet-sample-service 8081:80
```

## 📚 Resources

- [K3s Documentation](https://docs.k3s.io/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Rancher Desktop](https://rancherdesktop.io/)
