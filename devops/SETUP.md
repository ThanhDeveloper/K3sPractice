# DevOps Setup Guide - K3s & ArgoCD

## 📋 Requirements

### 1. Rancher Desktop Requirements (Windows)
- Windows 10/11 with latest updates (Home edition supported)
- Windows Subsystem for Linux (WSL) installed
- Virtualization enabled in BIOS
- Minimum 8 GB RAM (16 GB recommended)
- Minimum 20 GB free disk space
- SSD recommended for better K3s performance
- Persistent internet connection

### 2. Software Prerequisites
- Rancher Desktop installed
- kubectl (comes with Rancher Desktop)
- git installed

### 3. Enable K3s in Rancher Desktop
1. Open Rancher Desktop
2. Go to **Kubernetes Settings**
3. Select **K3s** as the Kubernetes engine (not dockerd)
4. Choose your desired Kubernetes version
5. Click **Apply** and wait for K3s to start
6. Verify with: `kubectl get nodes`

---

## 🚀 ArgoCD Installation

### Step 1: Install ArgoCD
```bash
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Step 2: Verify Installation
```bash
# Check if all ArgoCD pods are running
kubectl get pods -n argocd

# Wait until all pods are in "Running" state
```

### Step 3: Get ArgoCD Admin Password
```bash
# Get the initial admin password (Windows PowerShell)
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

# On Linux/Mac or Git Bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

**Save this password!** Username is: `admin`

### Step 4: Access ArgoCD UI
```bash
# Port forward to access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open browser: https://localhost:8080
- Username: `admin`
- Password: (from Step 3)

**Note:** You'll see a certificate warning - this is normal for local development. Click "Advanced" and proceed.

---

## 📦 Deploy Your Dotnet App with ArgoCD

### Method 1: Using ArgoCD UI

1. Login to ArgoCD UI (https://localhost:8080)
2. Click **"+ NEW APP"**
3. Fill in the details:
   - **Application Name**: `dotnet-sample`
   - **Project**: `default`
   - **Sync Policy**: `Automatic` (enable auto-sync and self-heal)
   - **Repository URL**: Your Git repository URL
   - **Revision**: `main` (or your branch)
   - **Path**: `apps/dotnet-sample`
   - **Cluster**: `https://kubernetes.default.svc` (in-cluster)
   - **Namespace**: `default`
4. Click **CREATE**

### Method 2: Using ArgoCD CLI

```bash
# Install ArgoCD CLI (optional but recommended)
# Download from: https://argo-cd.readthedocs.io/en/stable/cli_installation/

# Login via CLI
argocd login localhost:8080 --username admin --password <your-password> --insecure

# Create the application
argocd app create dotnet-sample \
  --repo https://github.com/YOUR_USERNAME/K3sPractice.git \
  --path apps/dotnet-sample \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

### Method 3: Using Kubectl with Application Manifest

Create `devops/argocd-app.yaml`:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: dotnet-sample
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/K3sPractice.git
    targetRevision: main
    path: apps/dotnet-sample
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Apply it:
```bash
kubectl apply -f devops/argocd-app.yaml
```

---

## 🧪 Testing & Deployment Workflow

### 1. Initial Setup
```bash
# Verify ArgoCD is watching your repo
kubectl get applications -n argocd

# Check application status
kubectl get application dotnet-sample -n argocd -o yaml
```

### 2. Make Changes and Test GitOps

**Scenario: Update replicas from 3 to 5**

```bash
# Edit deployment.yaml
# Change replicas: 3 to replicas: 5

# Commit and push
git add apps/dotnet-sample/deployment.yaml
git commit -m "Scale dotnet-sample to 5 replicas"
git push origin main
```

**What happens next:**
1. ArgoCD detects the change (within ~3 minutes)
2. ArgoCD automatically syncs the new configuration
3. Kubernetes creates 2 additional pods

**Verify the deployment:**
```bash
# Check if ArgoCD detected the change
kubectl get application dotnet-sample -n argocd

# Watch pods being created
kubectl get pods -l app=dotnet-sample -w

# Should show 5 pods running
kubectl get deployment dotnet-sample
```

### 3. Access Your Application
```bash
# Your app is exposed on NodePort 30081
# In Rancher Desktop, access via:
http://localhost:30081

# Or get the service details
kubectl get svc dotnet-sample-service
```

### 4. Rollback Test
```bash
# If something goes wrong, rollback via git
git revert HEAD
git push origin main

# ArgoCD will automatically revert to previous state
```

### 5. Manual Sync (if auto-sync is disabled)
```bash
# Sync via CLI
argocd app sync dotnet-sample

# Or via UI: Click "SYNC" button
```

---

## 🔍 Useful Commands

### ArgoCD Management
```bash
# List all applications
argocd app list

# Get application details
argocd app get dotnet-sample

# View sync status
argocd app sync dotnet-sample --dry-run

# Delete application (keeps resources)
argocd app delete dotnet-sample --cascade=false

# Delete application (removes resources)
argocd app delete dotnet-sample --cascade=true
```

### Kubernetes Checks
```bash
# Check ArgoCD status
kubectl get pods -n argocd

# Check your application
kubectl get all -l app=dotnet-sample

# View application logs
kubectl logs -l app=dotnet-sample --tail=50

# Describe deployment
kubectl describe deployment dotnet-sample
```

### Troubleshooting
```bash
# If ArgoCD UI is not accessible
kubectl get svc -n argocd
kubectl port-forward svc/argocd-server -n argocd 8080:443

# If sync is stuck
argocd app sync dotnet-sample --force

# View ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller
```

---

## 🔄 Complete Workflow Example

```bash
# 1. Start port-forward in separate terminal
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 2. Make a change
echo "# Updated" >> apps/dotnet-sample/deployment.yaml

# 3. Commit and push
git add .
git commit -m "Test ArgoCD auto-sync"
git push

# 4. Watch ArgoCD sync (in ArgoCD UI or CLI)
argocd app watch dotnet-sample

# 5. Verify deployment
kubectl get pods -l app=dotnet-sample
curl http://localhost:30081
```

---

## 📚 References
- [ArgoCD Getting Started](https://argo-cd.readthedocs.io/en/stable/getting_started/)
- [K3s Installation](https://docs.k3s.io/installation)
- [Rancher Desktop Documentation](https://docs.rancherdesktop.io/)
