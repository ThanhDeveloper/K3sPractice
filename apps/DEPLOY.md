# Deployment Guide - Microservices with ArgoCD

## 📋 Architecture

```
Internet (Your Browser)
       │
       │ http://localhost:30700
       ▼
┌─────────────────────────────┐
│  frontend-web-service       │
│  (NodePort: 30700)          │
│  EXTERNAL ACCESS            │
└──────────────┬──────────────┘
               │
    ┌──────────▼──────────┐
    │  Frontend Pods (2)  │
    │  React App          │
    └──────────┬──────────┘
               │ http://backend-api-service/api/time
               │ (Internal call)
               ▼
┌─────────────────────────────┐
│  backend-api-service        │
│  (ClusterIP)                │
│  INTERNAL ONLY              │
└──────────────┬──────────────┘
               │
    ┌──────────▼──────────┐
    │  Backend Pods (2)   │
    │  ASP.NET Core API   │
    └─────────────────────┘
```

---

## 🚀 Step 1: Build & Push Docker Images

### Build Backend Image
```bash
cd d:\K3sPractice\apps\backend-api
docker build -t thanhdeveloper/k3s-backend-api:latest .
```

### Build Frontend Image
```bash
cd d:\K3sPractice\apps\frontend-web
docker build -t thanhdeveloper/k3s-frontend-web:latest --build-arg VITE_API_URL=http://backend-api-service/api .
```

### Push to Docker Hub
```bash
docker push thanhdeveloper/k3s-backend-api:latest
docker push thanhdeveloper/k3s-frontend-web:latest
```

### All-in-one (Copy & Run)
```bash
cd d:\K3sPractice\apps\backend-api && docker build -t thanhdeveloper/k3s-backend-api:latest . && docker push thanhdeveloper/k3s-backend-api:latest

cd d:\K3sPractice\apps\frontend-web && docker build -t thanhdeveloper/k3s-frontend-web:latest --build-arg VITE_API_URL=http://backend-api-service/api . && docker push thanhdeveloper/k3s-frontend-web:latest
```

---

## 🔧 Step 2: Access ArgoCD UI

### Get ArgoCD Password
```powershell
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

### Port Forward ArgoCD
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Open ArgoCD UI
- URL: https://localhost:8080
- Username: `admin`
- Password: (from above command)

---

## 📦 Step 3: Deploy via ArgoCD

### Option A: Using ArgoCD UI

1. Open https://localhost:8080
2. Click **"+ NEW APP"**

**Create Backend App:**
- Application Name: `backend-api`
- Project: `default`
- Sync Policy: `Automatic`
- Repository URL: `https://github.com/YOUR_GITHUB_USERNAME/K3sPractice.git`
- Path: `apps/backend-api/k8s`
- Cluster: `https://kubernetes.default.svc`
- Namespace: `default`
- Click **CREATE**

**Create Frontend App:**
- Application Name: `frontend-web`
- Project: `default`
- Sync Policy: `Automatic`
- Repository URL: `https://github.com/YOUR_GITHUB_USERNAME/K3sPractice.git`
- Path: `apps/frontend-web/k8s`
- Cluster: `https://kubernetes.default.svc`
- Namespace: `default`
- Click **CREATE**

### Option B: Using kubectl (Manual Deploy First)

If you want to test without ArgoCD first:

```bash
# Deploy Backend
kubectl apply -f d:\K3sPractice\apps\backend-api\k8s\

# Deploy Frontend
kubectl apply -f d:\K3sPractice\apps\frontend-web\k8s\

# Check status
kubectl get pods
kubectl get svc
```

---

## ✅ Step 4: Verify Deployment

### Check Pods
```bash
kubectl get pods -l tier=backend
kubectl get pods -l tier=frontend
```

### Check Services
```bash
kubectl get svc
```

Expected output:
```
NAME                   TYPE        CLUSTER-IP      PORT(S)        AGE
backend-api-service    ClusterIP   10.43.x.x       80/TCP         1m
frontend-web-service   NodePort    10.43.x.x       80:30700/TCP   1m
```

### Test Backend (from inside cluster)
```bash
kubectl run curl --image=curlimages/curl -it --rm -- curl http://backend-api-service/api/time
```

### Access Frontend
Open browser: **http://localhost:30700**

---

## 🧪 Step 5: Test the Application

1. Open http://localhost:30700
2. You should see the React app
3. It displays UTC time from backend API
4. Auto-refreshes every 5 seconds

**If working correctly:**
- UTC time is displayed
- "Service: backend-api" shows
- No errors

---

## 🔍 Troubleshooting

### Frontend can't reach Backend?
```bash
# Check backend pods are running
kubectl get pods -l app=backend-api

# Check backend service exists
kubectl get svc backend-api-service

# Test backend from inside cluster
kubectl run curl --image=curlimages/curl -it --rm -- curl http://backend-api-service/api/time
```

### Pods not starting?
```bash
# Check pod status
kubectl describe pod -l app=backend-api
kubectl describe pod -l app=frontend-web

# Check logs
kubectl logs -l app=backend-api
kubectl logs -l app=frontend-web
```

### Image pull error?
```bash
# Make sure images are pushed to Docker Hub
docker push thanhdeveloper/k3s-backend-api:latest
docker push thanhdeveloper/k3s-frontend-web:latest
```

---

## 🗑️ Cleanup

```bash
# Delete deployments
kubectl delete -f d:\K3sPractice\apps\backend-api\k8s\
kubectl delete -f d:\K3sPractice\apps\frontend-web\k8s\

# Or delete by label
kubectl delete all -l tier=backend
kubectl delete all -l tier=frontend
```

---

## 📊 Summary

| Component | Type | Port | Access |
|-----------|------|------|--------|
| Backend API | ClusterIP | 80 (internal) | Only from inside cluster |
| Frontend Web | NodePort | 30700 | http://localhost:30700 |
| ArgoCD | NodePort | 8080 | https://localhost:8080 |
