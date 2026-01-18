# Testing & Deployment Workflow Guide

## 🎯 Overview

This guide shows you how to test GitOps deployment with ArgoCD step-by-step.

---

## 🔧 Prerequisites Checklist

- [ ] Rancher Desktop installed with K3s enabled
- [ ] ArgoCD installed in your cluster
- [ ] Git repository cloned locally
- [ ] `kubectl` working (test: `kubectl get nodes`)
- [ ] ArgoCD UI accessible at https://localhost:8080

---

## 📝 Initial Setup

### 1. Start ArgoCD UI Access

Open a terminal and keep this running:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Leave this terminal open. Open https://localhost:8080 in your browser.

### 2. Update ArgoCD Application Manifest

Edit `devops/argocd-app.yaml` and replace `YOUR_USERNAME` with your actual GitHub username:

```yaml
source:
  repoURL: https://github.com/YOUR_ACTUAL_USERNAME/K3sPractice.git
```

### 3. Deploy Application to ArgoCD

```bash
# Apply the ArgoCD application
kubectl apply -f devops/argocd-app.yaml

# Verify application is created
kubectl get application -n argocd

# Watch the sync status
kubectl get application dotnet-sample -n argocd -w
```

**Expected output:**
```
NAME            SYNC STATUS   HEALTH STATUS
dotnet-sample   Synced        Healthy
```

### 4. Verify Deployment

```bash
# Check if pods are running
kubectl get pods -l app=dotnet-sample

# Should show 3 pods (based on replicas: 3)
NAME                             READY   STATUS    RESTARTS   AGE
dotnet-sample-xxxxxxxxx-xxxxx    1/1     Running   0          1m
dotnet-sample-xxxxxxxxx-xxxxx    1/1     Running   0          1m
dotnet-sample-xxxxxxxxx-xxxxx    1/1     Running   0          1m

# Check service
kubectl get svc dotnet-sample-service

# Should show NodePort 30081
```

### 5. Access Your Application

Open in browser: http://localhost:30081

You should see the ASP.NET sample app running!

---

## 🧪 Test 1: Scale Application (Change Replicas)

**Goal:** Test if ArgoCD automatically deploys changes when you push to Git.

### Steps:

1. **Edit the deployment file:**

```bash
# Open apps/dotnet-sample/deployment.yaml
# Change line 8:
replicas: 3  # Change to 5
```

2. **Commit and push:**

```bash
git add apps/dotnet-sample/deployment.yaml
git commit -m "Scale dotnet-sample to 5 replicas"
git push origin main
```

3. **Watch ArgoCD sync (in UI or CLI):**

**Option A: Watch in ArgoCD UI**
- Refresh https://localhost:8080
- You should see "OutOfSync" status briefly
- Then it will auto-sync and show "Synced"

**Option B: Watch via CLI**
```bash
# Watch application status
kubectl get application dotnet-sample -n argocd -w

# Watch pods being created
kubectl get pods -l app=dotnet-sample -w
```

4. **Verify the change:**

```bash
# Should now show 5 pods
kubectl get pods -l app=dotnet-sample

# Check deployment
kubectl get deployment dotnet-sample
# Should show: READY 5/5
```

**Expected time:** 1-3 minutes for ArgoCD to detect and sync.

**✅ Success criteria:**
- ArgoCD detects the change automatically
- New pods are created
- All 5 pods are in "Running" state
- Application still accessible at http://localhost:30081

---

## 🧪 Test 2: Update Application Image

**Goal:** Test rolling update with zero downtime.

### Steps:

1. **Edit deployment.yaml:**

```yaml
# Change image tag (line 19)
image: mcr.microsoft.com/dotnet/samples:aspnetapp
# to:
image: mcr.microsoft.com/dotnet/samples:aspnetapp-alpine
```

2. **Commit and push:**

```bash
git add apps/dotnet-sample/deployment.yaml
git commit -m "Update dotnet-sample to alpine version"
git push origin main
```

3. **Watch rolling update:**

```bash
# Watch pods being updated one by one
kubectl get pods -l app=dotnet-sample -w
```

**You'll see:**
```
dotnet-sample-xxxxx   1/1   Running       0   5m
dotnet-sample-xxxxx   1/1   Running       0   5m
dotnet-sample-xxxxx   0/1   Terminating   0   5m  ← Old pod terminating
dotnet-sample-xxxxx   1/1   Running       0   1s  ← New pod starting
...
```

4. **Verify zero downtime:**

```bash
# Keep refreshing the browser at http://localhost:30081
# App should stay accessible during update
```

**✅ Success criteria:**
- Pods are updated one at a time (rolling update)
- Application remains accessible throughout
- All pods eventually run the new image

---

## 🧪 Test 3: Change Resource Limits

**Goal:** Test resource limit changes.

### Steps:

1. **Edit deployment.yaml:**

```yaml
# Change resource limits (line 23-26)
resources:
  limits:
    memory: "256Mi"  # Changed from 128Mi
    cpu: "1000m"     # Changed from 500m
```

2. **Commit and push:**

```bash
git add apps/dotnet-sample/deployment.yaml
git commit -m "Increase resource limits for dotnet-sample"
git push origin main
```

3. **Verify resource changes:**

```bash
# Check pod resources
kubectl describe pod -l app=dotnet-sample | grep -A 5 "Limits:"
```

**✅ Success criteria:**
- Pods are recreated with new resource limits
- No errors in pod status

---

## 🧪 Test 4: Rollback via Git

**Goal:** Test rollback by reverting Git commit.

### Steps:

1. **Revert the last commit:**

```bash
# Revert to previous state
git revert HEAD
git push origin main
```

2. **Watch ArgoCD rollback:**

```bash
kubectl get pods -l app=dotnet-sample -w
```

3. **Verify rollback:**

```bash
# Check current state matches before the change
kubectl get deployment dotnet-sample -o yaml
```

**✅ Success criteria:**
- ArgoCD detects the revert
- Deployment rolls back to previous state
- Application remains stable

---

## 🧪 Test 5: Manual Changes (Self-Heal Test)

**Goal:** Test if ArgoCD reverts manual changes.

### Steps:

1. **Manually scale deployment (bypass ArgoCD):**

```bash
# Manually change replicas to 10
kubectl scale deployment dotnet-sample --replicas=10

# Check pods
kubectl get pods -l app=dotnet-sample
# Should show 10 pods temporarily
```

2. **Watch ArgoCD self-heal:**

```bash
# ArgoCD will detect drift and revert to Git state
kubectl get pods -l app=dotnet-sample -w
```

**Within 1-3 minutes:**
- ArgoCD detects the manual change
- ArgoCD reverts replicas back to what's in Git (5 in our case)
- Extra pods are terminated

**✅ Success criteria:**
- ArgoCD automatically reverts manual changes
- Deployment matches Git state again

---

## 🧪 Test 6: Add New Service

**Goal:** Test adding a new Kubernetes resource.

### Steps:

1. **Create a ConfigMap:**

Create `apps/dotnet-sample/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dotnet-sample-config
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  APP_VERSION: "1.0.0"
```

2. **Commit and push:**

```bash
git add apps/dotnet-sample/configmap.yaml
git commit -m "Add ConfigMap for dotnet-sample"
git push origin main
```

3. **Verify ConfigMap is created:**

```bash
kubectl get configmap dotnet-sample-config
kubectl describe configmap dotnet-sample-config
```

**✅ Success criteria:**
- ArgoCD detects new file
- ConfigMap is created automatically

---

## 🧪 Test 7: Delete Resource

**Goal:** Test if ArgoCD deletes resources removed from Git.

### Steps:

1. **Delete the ConfigMap file:**

```bash
git rm apps/dotnet-sample/configmap.yaml
git commit -m "Remove ConfigMap"
git push origin main
```

2. **Verify deletion:**

```bash
# ConfigMap should be deleted automatically
kubectl get configmap dotnet-sample-config
# Should return: Error from server (NotFound)
```

**✅ Success criteria:**
- ArgoCD deletes the ConfigMap
- No manual cleanup needed

---

## 📊 Monitoring & Debugging

### Check ArgoCD Application Status

```bash
# Get application details
kubectl get application dotnet-sample -n argocd -o yaml

# View recent events
kubectl describe application dotnet-sample -n argocd
```

### View ArgoCD Logs

```bash
# Application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=50 -f

# Server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server --tail=50 -f
```

### Check Sync Status via CLI

```bash
# Install ArgoCD CLI first (optional)
# Then use:
argocd app get dotnet-sample
argocd app sync dotnet-sample --dry-run
```

### Force Sync (if stuck)

```bash
# Force immediate sync
kubectl patch application dotnet-sample -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'

# Or via CLI
argocd app sync dotnet-sample --force
```

---

## 🐛 Common Issues & Solutions

### Issue 1: ArgoCD Not Syncing

**Symptoms:** Changes pushed to Git but ArgoCD shows "Synced" (old state)

**Solutions:**
```bash
# Check if repository is accessible
kubectl get application dotnet-sample -n argocd -o jsonpath='{.status.conditions}'

# Refresh manually
argocd app get dotnet-sample --refresh

# Check ArgoCD can access your Git repo
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server
```

### Issue 2: Pods Not Starting

**Symptoms:** Pods stuck in "Pending" or "CrashLoopBackOff"

**Solutions:**
```bash
# Describe pod to see events
kubectl describe pod -l app=dotnet-sample

# Check pod logs
kubectl logs -l app=dotnet-sample

# Common causes:
# - Resource limits too high (not enough capacity)
# - Image pull errors
# - Port conflicts
```

### Issue 3: Service Not Accessible

**Symptoms:** Can't access http://localhost:30081

**Solutions:**
```bash
# Check if service exists
kubectl get svc dotnet-sample-service

# Check if pods are ready
kubectl get pods -l app=dotnet-sample

# Verify port forwarding in Rancher Desktop settings
# Ensure NodePort 30081 is not blocked by firewall

# Test with port-forward
kubectl port-forward svc/dotnet-sample-service 8081:80
# Then access http://localhost:8081
```

### Issue 4: ArgoCD UI Not Accessible

**Solutions:**
```bash
# Ensure port-forward is running
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Check ArgoCD pods are running
kubectl get pods -n argocd

# Restart port-forward if needed
```

---

## 📋 Complete Test Checklist

After completing all tests, you should have verified:

- [x] ArgoCD automatically syncs changes from Git
- [x] Scaling works (replicas change)
- [x] Rolling updates work (zero downtime)
- [x] Resource limits can be changed
- [x] Rollback works via Git revert
- [x] Self-healing works (reverts manual changes)
- [x] Adding new resources works
- [x] Deleting resources works (prune)

---

## 🎓 Key Learnings

1. **GitOps = Git as Source of Truth**
   - All changes go through Git
   - No manual `kubectl apply` needed

2. **ArgoCD Automatically:**
   - Detects Git changes (~3 min polling)
   - Syncs to desired state
   - Heals manual changes

3. **Benefits:**
   - Audit trail (Git history)
   - Easy rollback (Git revert)
   - Consistency (no config drift)
   - Team collaboration (PR reviews)

4. **Workflow:**
   ```
   Code → Git Push → ArgoCD Sync → K8s Deploy → App Running
   ```

---

## 🚀 Next Steps

1. **Set up CI/CD**: Automate Docker image builds
2. **Add monitoring**: Prometheus + Grafana
3. **Implement blue-green deployments**: Zero-downtime releases
4. **Add multiple environments**: dev, staging, prod namespaces
5. **Configure notifications**: Slack/Discord alerts for deployments

---

## 📚 References

- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)
- [GitOps Principles](https://opengitops.dev/)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy)
