# K3s Concepts

## 📖 What is K3s?

K3s is a **lightweight Kubernetes distribution** created by Rancher Labs (now part of SUSE). It's a fully compliant Kubernetes distribution designed for:
- IoT and Edge computing
- Development environments
- CI/CD pipelines
- Resource-constrained environments

### Key Features
- **Small binary size**: ~50MB (vs standard Kubernetes ~1GB+)
- **Low memory footprint**: Runs on as little as 512MB RAM
- **Single binary**: Everything packaged in one executable
- **Simple installation**: One command to install
- **Production ready**: CNCF certified Kubernetes distribution

---

## 🆚 K3s vs Full Kubernetes

| Feature | K3s | Full Kubernetes |
|---------|-----|-----------------|
| Binary size | ~50MB | ~1GB+ |
| Memory usage | 512MB minimum | 2GB+ minimum |
| Installation | Single command | Complex setup |
| Default storage | Local Path Provisioner | Requires external setup |
| Load balancer | Built-in (ServiceLB) | Requires MetalLB/cloud LB |
| Embedded DB | SQLite (default) | Requires etcd |
| Best for | Edge, Dev, Small clusters | Large production clusters |

---

## 🏗️ K3s Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         K3s Server Node                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    K3s Binary                          │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │   API Server   │  Scheduler  │  Controller Mgr  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │      Embedded Database (SQLite or etcd)          │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │   Kubelet   │   Container Runtime (containerd)   │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (Optional)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      K3s Agent Nodes (Workers)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   Kubelet   │   Container Runtime   │   Kube-proxy   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Components Included

**Control Plane (K3s Server):**
- API Server - REST API for Kubernetes operations
- Scheduler - Assigns pods to nodes
- Controller Manager - Manages cluster state
- Embedded Database - SQLite (default) or etcd for HA

**Worker Components (K3s Server + Agent):**
- Kubelet - Manages pod lifecycle on the node
- Container Runtime - containerd (built-in)
- Kube-proxy - Network proxy for services

**Built-in Add-ons:**
- ServiceLB - Simple load balancer (replaces MetalLB)
- Traefik - Ingress controller (can be disabled)
- Local Path Provisioner - Dynamic storage provisioning
- CoreDNS - Cluster DNS

---

## 🔧 What K3s Removes/Replaces

To stay lightweight, K3s removes or replaces some standard Kubernetes components:

| Removed/Replaced | Reason | K3s Alternative |
|------------------|--------|-----------------|
| Cloud provider integrations | Not needed for edge | Built-in ServiceLB |
| Storage plugins | Too heavy | Local Path Provisioner |
| etcd (default) | Too heavy | SQLite (can use etcd for HA) |
| Docker | Heavy runtime | containerd (embedded) |
| Alpha features | Reduce attack surface | Disabled by default |

---

## 💾 Storage in K3s

K3s includes **Local Path Provisioner** by default:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path  # K3s default
  resources:
    requests:
      storage: 1Gi
```

**Storage location:** `/var/lib/rancher/k3s/storage/`

---

## 🌐 Networking in K3s

### ServiceLB (Built-in Load Balancer)
K3s includes a simple load balancer that uses available host ports:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: LoadBalancer  # K3s ServiceLB handles this
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: my-app
```

### Traefik Ingress Controller
K3s comes with Traefik v2 by default (can be disabled):

```bash
# Disable Traefik during installation
k3s server --disable traefik
```

---

## 🚀 Installation Methods

### 1. Linux/Mac (Standard)
```bash
# Install K3s server
curl -sfL https://get.k3s.io | sh -

# Get kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml

# Add agent node
k3s agent --server https://myserver:6443 --token ${NODE_TOKEN}
```

### 2. Windows (via Rancher Desktop) ✅ **Your Method**
- Install Rancher Desktop
- Select K3s as Kubernetes engine
- K3s runs in WSL2
- Access via `kubectl` (automatically configured)

### 3. Docker
```bash
docker run -d --privileged --name k3s \
  -p 6443:6443 -p 8080:8080 \
  rancher/k3s:latest server
```

---

## 🎯 K3s Use Cases

### ✅ Good For:
1. **Development environments** - Fast startup, low resource usage
2. **Edge computing** - Runs on Raspberry Pi, IoT devices
3. **CI/CD pipelines** - Ephemeral clusters for testing
4. **Small production workloads** - < 10 nodes
5. **Learning Kubernetes** - Full K8s features with less complexity

### ❌ Not Ideal For:
1. **Large production clusters** - Use full K8s for 50+ nodes
2. **High-availability critical systems** - Standard K8s has better HA
3. **Complex multi-tenancy** - Limited isolation features
4. **Cloud-native integrations** - Missing cloud provider features

---

## 🔒 K3s Security

K3s is more secure by default:
- Removes unnecessary code and features
- Smaller attack surface
- Automatic security updates
- Role-based access control (RBAC) enabled
- Pod Security Standards supported

### Default Security Settings
```bash
# K3s runs with these secure defaults:
- AppArmor/SELinux profiles enabled
- Pod Security Admission enabled
- Network policies supported
- TLS for all components
```

---

## 🎛️ K3s Configuration

### Server Configuration
```bash
# /etc/rancher/k3s/config.yaml (Linux)
write-kubeconfig-mode: "0644"
tls-san:
  - "my-k3s-server.example.com"
disable:
  - traefik
  - servicelb
cluster-init: true  # Enable embedded etcd
```

### In Rancher Desktop
Configuration via GUI:
- Kubernetes version
- Container runtime (containerd)
- Memory/CPU allocation
- Port forwarding
- WSL integration

---

## 📊 Resource Requirements

### Minimum (Single Node)
- **CPU**: 1 core
- **RAM**: 512MB
- **Disk**: 1GB

### Recommended (Development)
- **CPU**: 2+ cores
- **RAM**: 2GB+
- **Disk**: 20GB SSD

### Production (HA Setup)
- **CPU**: 4+ cores per node
- **RAM**: 8GB+ per node
- **Disk**: 50GB+ SSD
- **Nodes**: 3+ server nodes (etcd quorum)

---

## 🆘 Common K3s Commands

```bash
# Check K3s status
kubectl get nodes

# View K3s configuration
kubectl cluster-info

# List all resources
kubectl get all --all-namespaces

# K3s system pods
kubectl get pods -n kube-system

# Restart K3s (Linux)
sudo systemctl restart k3s

# View K3s logs (Linux)
sudo journalctl -u k3s -f

# Uninstall K3s (Linux)
/usr/local/bin/k3s-uninstall.sh
```

---

## 🔗 K3s + ArgoCD = GitOps Power

K3s is perfect for GitOps with ArgoCD because:
1. **Fast deployments** - Low overhead means faster sync times
2. **Resource efficient** - Run more apps with less infrastructure
3. **Easy to reset** - Quickly destroy and recreate environments
4. **Production-like** - Same K8s API as production clusters

```
Developer → Git Push → ArgoCD detects → K3s deploys → App running
```

---

## 🎓 Key Takeaways

1. **K3s = Kubernetes - Bloat** - Full K8s functionality, half the size
2. **Perfect for edge & dev** - Low resources, quick setup
3. **Production ready** - CNCF certified, secure by default
4. **Rancher Desktop** - Easiest way to run K3s on Windows
5. **GitOps friendly** - Works seamlessly with ArgoCD

---

## 📚 Additional Resources

- Official Docs: https://docs.k3s.io/
- GitHub: https://github.com/k3s-io/k3s
- Rancher Desktop: https://rancherdesktop.io/
- K3s vs K8s: https://k3s.io/#why-k3s
