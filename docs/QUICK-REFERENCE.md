# Quick Reference - Commands Cheat Sheet

## 🚀 Initial Setup

### Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Get ArgoCD Password (Windows PowerShell)
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

### Access ArgoCD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open: https://localhost:8080
# Username: admin
```

### Deploy Application
```bash
# Edit devops/argocd-app.yaml first (update YOUR_USERNAME)
kubectl apply -f devops/argocd-app.yaml
```

---

## 📊 Monitoring Commands

### Check Cluster
```bash
kubectl get nodes                    # Check node status
kubectl cluster-info                 # Cluster information
kubectl get all                      # All resources in default namespace
kubectl get all --all-namespaces     # All resources everywhere
```

### Check ArgoCD
```bash
kubectl get pods -n argocd                        # ArgoCD pods
kubectl get application -n argocd                 # List applications
kubectl get application dotnet-sample -n argocd  # Specific app status
kubectl describe application dotnet-sample -n argocd  # Detailed info
```

### Check Your Application
```bash
kubectl get pods -l app=dotnet-sample              # App pods
kubectl get deployment dotnet-sample               # Deployment status
kubectl get svc dotnet-sample-service              # Service info
kubectl get all -l app=dotnet-sample               # All app resources
```

### Watch Resources (Real-time)
```bash
kubectl get pods -w                                # Watch all pods
kubectl get pods -l app=dotnet-sample -w           # Watch app pods
kubectl get application dotnet-sample -n argocd -w # Watch ArgoCD sync
```

---

## 🔍 Debugging Commands

### View Logs
```bash
kubectl logs -l app=dotnet-sample                  # App logs (all pods)
kubectl logs -l app=dotnet-sample --tail=50 -f     # Follow logs (last 50 lines)
kubectl logs <pod-name>                            # Specific pod logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller  # ArgoCD logs
```

### Describe Resources
```bash
kubectl describe pod <pod-name>                    # Pod details + events
kubectl describe deployment dotnet-sample          # Deployment details
kubectl describe svc dotnet-sample-service         # Service details
kubectl describe application dotnet-sample -n argocd  # ArgoCD app details
```

### Get Resource YAML
```bash
kubectl get deployment dotnet-sample -o yaml       # Deployment manifest
kubectl get pod <pod-name> -o yaml                 # Pod manifest
kubectl get application dotnet-sample -n argocd -o yaml  # ArgoCD app manifest
```

### Enter Pod Shell
```bash
kubectl exec -it <pod-name> -- /bin/sh             # Interactive shell
kubectl exec -it <pod-name> -- /bin/bash           # Bash shell (if available)
```

---

## 🛠️ Management Commands

### Scale Deployment
```bash
kubectl scale deployment dotnet-sample --replicas=5  # Scale to 5 pods
```

### Force ArgoCD Sync
```bash
kubectl patch application dotnet-sample -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

### Restart Pods
```bash
kubectl rollout restart deployment dotnet-sample   # Restart all pods
kubectl delete pod <pod-name>                      # Delete specific pod (recreated automatically)
```

### Port Forward
```bash
kubectl port-forward svc/dotnet-sample-service 8081:80  # Access app on localhost:8081
kubectl port-forward svc/argocd-server -n argocd 8080:443  # Access ArgoCD UI
```

---

## 🧹 Cleanup Commands

### Delete Application from ArgoCD
```bash
kubectl delete application dotnet-sample -n argocd  # Remove from ArgoCD
kubectl delete -f devops/argocd-app.yaml            # Same thing
```

### Delete Deployed Resources
```bash
kubectl delete deployment dotnet-sample            # Delete deployment
kubectl delete svc dotnet-sample-service           # Delete service
kubectl delete all -l app=dotnet-sample            # Delete all app resources
```

### Uninstall ArgoCD
```bash
kubectl delete namespace argocd                    # Delete ArgoCD completely
```

---

## 🔄 GitOps Workflow

### Make Changes
```bash
# 1. Edit files
code apps/dotnet-sample/deployment.yaml

# 2. Commit and push
git add .
git commit -m "Your change description"
git push origin main

# 3. Watch ArgoCD sync
kubectl get application dotnet-sample -n argocd -w
```

### Rollback Changes
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to previous commit
git reset --hard HEAD^
git push origin main --force  # Use with caution!
```

---

## 🆘 Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name>                    # Check events
kubectl logs <pod-name>                            # Check logs
kubectl get events --sort-by=.metadata.creationTimestamp  # Recent events
```

### ArgoCD Not Syncing
```bash
kubectl get application dotnet-sample -n argocd -o jsonpath='{.status.conditions}'  # Check conditions
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server  # Check repo access
```

### Service Not Accessible
```bash
kubectl get svc dotnet-sample-service              # Check service exists
kubectl get endpoints dotnet-sample-service        # Check endpoints (should list pod IPs)
kubectl get pods -l app=dotnet-sample -o wide      # Check pod IPs
```

### Check Resource Usage
```bash
kubectl top nodes                                  # Node resource usage (requires metrics-server)
kubectl top pods                                   # Pod resource usage
```

---

## 📝 Common Scenarios

### Scenario 1: Update Image Version
```bash
# Edit deployment.yaml
image: myapp:v2.0  # Change version

# Commit and push
git add apps/dotnet-sample/deployment.yaml
git commit -m "Update to v2.0"
git push

# Watch rolling update
kubectl get pods -l app=dotnet-sample -w
```

### Scenario 2: Change Replicas
```bash
# Edit deployment.yaml
replicas: 5  # Change number

# Commit and push
git add apps/dotnet-sample/deployment.yaml
git commit -m "Scale to 5 replicas"
git push

# Verify
kubectl get deployment dotnet-sample
```

### Scenario 3: Update Resource Limits
```bash
# Edit deployment.yaml
resources:
  limits:
    memory: "256Mi"
    cpu: "1000m"

# Commit and push
git add apps/dotnet-sample/deployment.yaml
git commit -m "Increase resource limits"
git push

# Verify
kubectl describe pod -l app=dotnet-sample | grep -A 5 "Limits:"
```

---

## 🎯 Essential Commands (Copy-Paste Ready)

```bash
# Complete setup in one go
kubectl create namespace argocd && \
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml && \
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd && \
echo "ArgoCD installed! Get password with:" && \
echo 'kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }'

# Check everything at once
kubectl get all && \
kubectl get all -n argocd && \
kubectl get application -n argocd

# Complete cleanup
kubectl delete application dotnet-sample -n argocd && \
kubectl delete all -l app=dotnet-sample && \
kubectl delete namespace argocd
```

---

## 📚 Help Commands

```bash
kubectl --help                                     # General help
kubectl get --help                                 # Help for 'get' command
kubectl explain pod                                # Explain pod resource
kubectl explain deployment.spec.replicas           # Explain specific field
kubectl api-resources                              # List all resource types
kubectl version                                    # Client and server version
```

---

## 🔗 Quick Links

- ArgoCD UI: https://localhost:8080 (after port-forward)
- Dotnet App: http://localhost:30081
- Full Docs: See devops/ folder
