# Kubernetes Concepts - Practical Guide

## 📖 What is Kubernetes?

Kubernetes (K8s) is an **open-source container orchestration platform** that automates:
- Deployment of containers
- Scaling applications
- Load balancing
- Self-healing (auto-restart failed containers)
- Rolling updates and rollbacks

**Think of it as:** An operating system for your cluster of machines.

---

## 🏗️ Core Components

### 1. Pod
**The smallest deployable unit in Kubernetes.**

A Pod is a wrapper around one or more containers that share:
- Network namespace (same IP address)
- Storage volumes
- Lifecycle

```yaml
# Example: Simple Pod
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
```

**Visual:**
```
┌─────────────────────────┐
│         Pod             │
│  ┌──────────────────┐   │
│  │   Container 1    │   │ ← Your app
│  │   nginx:1.21     │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │   Container 2    │   │ ← Optional sidecar
│  │   (logging)      │   │
│  └──────────────────┘   │
│                         │
│  Shared: IP, Volumes    │
└─────────────────────────┘
```

**Real-world analogy:** A Pod is like a physical server. You can run multiple processes (containers) on it, and they all share the same network interface.

---

### 2. Deployment
**Manages multiple identical Pods with rolling updates and rollbacks.**

Deployments ensure:
- Desired number of Pods are always running
- Rolling updates without downtime
- Easy rollback to previous versions

```yaml
# Example: Deployment with 3 replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dotnet-sample
  labels:
    app: dotnet-sample
spec:
  replicas: 3  # ← Run 3 identical Pods
  selector:
    matchLabels:
      app: dotnet-sample
  template:  # ← Pod template
    metadata:
      labels:
        app: dotnet-sample
    spec:
      containers:
      - name: dotnet-sample
        image: mcr.microsoft.com/dotnet/samples:aspnetapp
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"  # ← 0.5 CPU core
          requests:
            memory: "64Mi"
            cpu: "250m"  # ← 0.25 CPU core minimum
```

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│                    Deployment                            │
│  Desired State: 3 replicas                               │
│                                                          │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐         │
│  │  Pod 1  │      │  Pod 2  │      │  Pod 3  │         │
│  │ dotnet  │      │ dotnet  │      │ dotnet  │         │
│  │ app     │      │ app     │      │ app     │         │
│  └─────────┘      └─────────┘      └─────────┘         │
│                                                          │
│  If Pod 2 crashes → Deployment creates new Pod 2        │
└──────────────────────────────────────────────────────────┘
```

**What `replicas` means:**
- `replicas: 1` → 1 copy of your app
- `replicas: 3` → 3 identical copies
- Kubernetes spreads them across different nodes for high availability

**When to use many vs few replicas:**

| Scenario | Replicas | Reason |
|----------|----------|--------|
| Development/Testing | 1-2 | Save resources, faster deployments |
| Low traffic app | 2-3 | Basic redundancy, zero-downtime updates |
| Production web app | 3-5+ | Handle traffic spikes, high availability |
| High traffic API | 10-50+ | Distribute load, scale horizontally |
| Background worker | 1-10 | Based on queue size and processing time |
| Stateful database | 1 or 3/5 | 1 for dev, odd numbers for HA (etcd, etc.) |

---

### 3. Service
**A stable network endpoint to access Pods.**

Why needed? Pods are ephemeral (can be killed/recreated). Services provide:
- Stable IP address
- Load balancing across Pods
- Service discovery (DNS name)

```yaml
# Example: Service for dotnet-sample
apiVersion: v1
kind: Service
metadata:
  name: dotnet-sample-service
spec:
  type: NodePort  # ← Expose on node's port
  selector:
    app: dotnet-sample  # ← Target Pods with this label
  ports:
  - port: 80           # ← Service port (internal)
    targetPort: 8080   # ← Pod's container port
    nodePort: 30081    # ← External access port (30000-32767)
```

**Visual:**
```
External Request: http://localhost:30081
         │
         ▼
┌────────────────────────────────────────┐
│         Service (LoadBalancer)         │
│    dotnet-sample-service:80            │
│                                        │
│     Load balances across Pods:         │
└────────┬───────────┬───────────┬───────┘
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Pod 1  │  │ Pod 2  │  │ Pod 3  │
    │ :8080  │  │ :8080  │  │ :8080  │
    └────────┘  └────────┘  └────────┘
```

**Service Types:**

| Type | Use Case | Access |
|------|----------|--------|
| **ClusterIP** | Internal only (default) | Within cluster only |
| **NodePort** | Expose on node's IP:port | External access via node IP |
| **LoadBalancer** | Cloud load balancer | External access via LB IP |
| **ExternalName** | DNS alias | Map to external service |

---

### 4. Resource Limits & Requests

**Control how much CPU/memory each Pod can use.**

```yaml
resources:
  limits:      # ← Maximum allowed
    memory: "128Mi"
    cpu: "500m"
  requests:    # ← Minimum guaranteed
    memory: "64Mi"
    cpu: "250m"
```

**What they mean:**
- `requests`: Kubernetes reserves this much for your Pod
- `limits`: Pod is killed if it exceeds memory limit, throttled if exceeds CPU

**CPU units:**
- `1000m` = 1 CPU core
- `500m` = 0.5 CPU core
- `100m` = 0.1 CPU core

**Memory units:**
- `Mi` = Mebibyte (1024^2 bytes)
- `Gi` = Gibibyte (1024^3 bytes)
- Example: `128Mi` = 134 MB

**Real example from your deployment:**
```yaml
resources:
  limits:
    memory: "128Mi"  # Max 128MB RAM
    cpu: "500m"      # Max 0.5 CPU core
```

With `replicas: 3`, this means:
- Total memory: 3 × 128MB = 384MB
- Total CPU: 3 × 0.5 = 1.5 CPU cores

---

## 🏢 Production-Grade Architecture

### Simple 3-Tier Web Application

```
┌────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Ingress Controller                     │  │
│  │              (nginx/traefik) - TLS/SSL                    │  │
│  │         www.example.com → Routing Rules                   │  │
│  └────────────────┬──────────────────────┬──────────────────┘  │
│                   │                      │                      │
│  ┌────────────────▼─────────┐   ┌───────▼────────────────┐    │
│  │   Frontend Service       │   │   API Service          │    │
│  │   (ClusterIP)            │   │   (ClusterIP)          │    │
│  └────────┬─────────────────┘   └───────┬────────────────┘    │
│           │                              │                      │
│  ┌────────▼─────────────────┐   ┌───────▼────────────────┐    │
│  │  Frontend Deployment     │   │   API Deployment       │    │
│  │  replicas: 3             │   │   replicas: 5          │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐│   │  ┌────┐ ┌────┐ ┌────┐  │    │
│  │  │React│ │React│ │React││   │  │.NET│ │.NET│ │.NET│  │    │
│  │  │ Pod │ │ Pod │ │ Pod ││   │  │Pod │ │Pod │ │Pod │  │    │
│  │  └─────┘ └─────┘ └─────┘│   │  └────┘ └────┘ └────┘  │    │
│  │                          │   │  ┌────┐ ┌────┐         │    │
│  │  CPU: 250m               │   │  │.NET│ │.NET│         │    │
│  │  Memory: 256Mi           │   │  │Pod │ │Pod │         │    │
│  └──────────────────────────┘   │  └────┘ └────┘         │    │
│                                  │                         │    │
│                                  │  CPU: 500m              │    │
│                                  │  Memory: 512Mi          │    │
│                                  └────────┬────────────────┘    │
│                                           │                     │
│                                  ┌────────▼────────────────┐    │
│                                  │   Database Service      │    │
│                                  │   (ClusterIP)           │    │
│                                  └────────┬────────────────┘    │
│                                           │                     │
│                                  ┌────────▼────────────────┐    │
│                                  │  PostgreSQL StatefulSet │    │
│                                  │  replicas: 1            │    │
│                                  │  ┌──────────────────┐   │    │
│                                  │  │   PostgreSQL     │   │    │
│                                  │  │   + PVC (100GB)  │   │    │
│                                  │  └──────────────────┘   │    │
│                                  │  CPU: 1000m             │    │
│                                  │  Memory: 2Gi            │    │
│                                  └─────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Monitoring: Prometheus, Grafana                       │    │
│  │  Logging: EFK Stack (Elasticsearch, Fluentd, Kibana)   │    │
│  │  CI/CD: ArgoCD (GitOps)                                │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

### Key Production Patterns

1. **Frontend Layer (3 replicas)**
   - Static content (React/Vue/Angular)
   - Low resource usage
   - Can scale to 10+ during traffic spikes

2. **API Layer (5 replicas)**
   - Business logic
   - More replicas to handle concurrent requests
   - Scales based on CPU/memory usage

3. **Database Layer (1 replica for dev, 3+ for HA)**
   - StatefulSet (not Deployment) for persistent data
   - Attached storage (PersistentVolume)
   - Only odd numbers for quorum (1, 3, 5)

4. **Monitoring & Logging**
   - Separate namespace
   - Always-on services
   - Low replica count (1-2)

---

## 🔄 How Kubernetes Works Internally

### Self-Healing Mechanism

```
Time: T0
┌─────────────────────────────────────────────┐
│  Desired State: 3 Pods running              │
│  ┌─────┐    ┌─────┐    ┌─────┐             │
│  │Pod 1│    │Pod 2│    │Pod 3│             │
│  │ ✓   │    │ ✓   │    │ ✓   │             │
│  └─────┘    └─────┘    └─────┘             │
└─────────────────────────────────────────────┘

Time: T1 - Pod 2 crashes
┌─────────────────────────────────────────────┐
│  Desired State: 3 Pods running              │
│  ┌─────┐    ┌─────┐    ┌─────┐             │
│  │Pod 1│    │Pod 2│    │Pod 3│             │
│  │ ✓   │    │ ✗   │    │ ✓   │             │
│  └─────┘    └─────┘    └─────┘             │
│                 ▲                           │
│                 │                           │
│      Kubelet detects failure                │
└─────────────────────────────────────────────┘

Time: T2 - Controller creates new Pod
┌─────────────────────────────────────────────┐
│  Desired State: 3 Pods running              │
│  ┌─────┐    ┌─────┐    ┌─────┐             │
│  │Pod 1│    │Pod 2│    │Pod 3│             │
│  │ ✓   │    │ ⟳   │    │ ✓   │             │
│  └─────┘    └─────┘    └─────┘             │
│                 ▲                           │
│                 │                           │
│         Starting new Pod...                 │
└─────────────────────────────────────────────┘

Time: T3 - System restored
┌─────────────────────────────────────────────┐
│  Desired State: 3 Pods running              │
│  ┌─────┐    ┌─────┐    ┌─────┐             │
│  │Pod 1│    │Pod 2│    │Pod 3│             │
│  │ ✓   │    │ ✓   │    │ ✓   │             │
│  └─────┘    └─────┘    └─────┘             │
└─────────────────────────────────────────────┘
```

**This happens automatically in ~10-30 seconds!**

---

## 🎯 Scaling Strategies

### Horizontal Pod Autoscaler (HPA)

Automatically adjust replicas based on metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dotnet-sample-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dotnet-sample
  minReplicas: 2   # ← Minimum Pods
  maxReplicas: 10  # ← Maximum Pods
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # ← Scale when CPU > 70%
```

**How it works:**
```
CPU Usage: 30% → 2 Pods (min)
CPU Usage: 75% → Scales to 4 Pods
CPU Usage: 90% → Scales to 8 Pods
CPU Usage: 50% → Scales down to 3 Pods
```

### When to Scale Horizontally vs Vertically

| Scenario | Strategy | Example |
|----------|----------|---------|
| Web API with many requests | Horizontal | Add more Pods (2 → 10) |
| Database with complex queries | Vertical | Increase CPU/memory limits |
| Batch processing jobs | Horizontal | More workers = faster processing |
| Memory-intensive app | Vertical | Increase memory limits |

---

## 📊 Resource Planning Example

### Small App (Blog)
```yaml
# 1 Frontend, 1 API, 1 Database
replicas: 1 each
Total resources: ~2 CPU cores, 4GB RAM
```

### Medium App (E-commerce)
```yaml
# 3 Frontend, 5 API, 3 Database
replicas:
  frontend: 3
  api: 5
  database: 3
Total resources: ~8 CPU cores, 16GB RAM
```

### Large App (Social Media)
```yaml
# 10 Frontend, 50 API, 5 Database
replicas:
  frontend: 10
  api: 50
  database: 5
  cache: 3
  queue: 5
Total resources: ~50 CPU cores, 128GB RAM
```

---

## 🔐 Namespaces - Multi-tenancy

Namespaces isolate resources:

```
┌───────────────────────────────────────────┐
│         Kubernetes Cluster                │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  Namespace: production              │ │
│  │  - dotnet-app (5 replicas)          │ │
│  │  - postgres                          │ │
│  │  ResourceQuota: 10 CPU, 32GB RAM    │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  Namespace: staging                 │ │
│  │  - dotnet-app (2 replicas)          │ │
│  │  - postgres                          │ │
│  │  ResourceQuota: 4 CPU, 8GB RAM      │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  Namespace: development             │ │
│  │  - dotnet-app (1 replica)           │ │
│  │  - postgres                          │ │
│  │  ResourceQuota: 2 CPU, 4GB RAM      │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

## 🚀 Complete Flow: From Code to Running App

```
1. Developer writes code
   └─▶ git push to main

2. CI/CD builds Docker image
   └─▶ docker build → docker push to registry

3. Update Kubernetes manifest
   └─▶ Change image: myapp:v1.0 → myapp:v2.0

4. ArgoCD detects change
   └─▶ Syncs new manifest

5. Kubernetes performs Rolling Update
   └─▶ Pod 1: v1.0 → v2.0 ✓
   └─▶ Pod 2: v1.0 → v2.0 ✓
   └─▶ Pod 3: v1.0 → v2.0 ✓
   └─▶ Zero downtime!

6. Service routes traffic to healthy Pods
   └─▶ Users see new version
```

---

## 💡 Key Takeaways

1. **Pod** = Single unit of deployment (1+ containers)
2. **Deployment** = Manages multiple identical Pods
3. **Service** = Stable network endpoint to access Pods
4. **Replicas** = Number of copies of your app
5. **Resource limits** = Control CPU/memory usage
6. **More replicas** = Higher availability + handle more traffic
7. **Fewer replicas** = Lower cost + faster deployments
8. **Kubernetes** = Desired state management (you declare, K8s maintains)

---

## 📚 Next Steps

1. Understand your app's resource needs
2. Start with low replicas (1-2) in development
3. Monitor CPU/memory usage
4. Scale up based on actual traffic
5. Use HPA for automatic scaling
6. Set appropriate resource limits to prevent resource starvation

---

## 🔗 Official Documentation

- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
