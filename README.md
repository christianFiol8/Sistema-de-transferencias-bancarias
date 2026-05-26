# Sistema de Transferencias Bancarias — Banco Nexus

Aplicación bancaria completa con autenticación JWT, transferencias atómicas ACID, historial de movimientos, bitácora de auditoría, notificaciones en tiempo real (SSE) y despliegue en AWS EC2 con Docker Swarm.

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  AWS EC2 Cluster                    │
│                                                     │
│  [EC2 Manager/Frontend]  [EC2 Worker 1]  [EC2 Worker 2]
│       Frontend (Nginx)    Backend (x2 réplicas)     │
│           :80              :3000 (overlay network)  │
│                                                     │
│              Docker Swarm — overlay network         │
└─────────────────────────────────────────────────────┘
                         │
               MongoDB Atlas (externo)
                (Replica Set administrado)
```

## Módulos implementados

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 1. Autenticación | Registro, login JWT, perfil, número de cuenta automático | ✅ |
| 2. Dashboard | Saldo, historial, métricas | ✅ |
| 3. Transferencias | Transferencia ACID, cuentas destino, depósito, retiro | ✅ |
| 4. Auditoría | Bitácora completa, alertas SSE | ✅ |

## Número de cuenta

Formato: `180` + ID secuencial (6 dígitos) + dígito verificador (mod 10).
Ejemplo: ID=34 → `180000034` → suma=16 → mod10=6 → **`1800000346`**

## Requisitos previos

- Node.js 20+
- Docker + Docker Compose (desarrollo local)
- Cuenta en MongoDB Atlas
- Cuenta en Docker Hub
- 3 instancias EC2 en AWS (Ubuntu 22.04)

## Desarrollo local

```bash
# 1. Clonar el repo
git clone https://github.com/sasa71928/Sistema-de-transferencias-bancarias.git
cd Sistema-de-transferencias-bancarias

# 2. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con tu MONGO_URI de Atlas y JWT_SECRET

# 3. Iniciar backend
cd backend && npm install && npm run dev

# 4. Iniciar frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Docker (desarrollo local)

```bash
docker compose up --build
```

## Despliegue en AWS con Docker Swarm

### 1. Preparar las 3 instancias EC2

```bash
# En cada EC2 — instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
```

### 2. Inicializar el Swarm (en EC2 Manager)

```bash
docker swarm init --advertise-addr <IP_PRIVADA_MANAGER>
# Copiar el token que aparece y ejecutarlo en los workers
```

### 3. Unir workers al Swarm

```bash
# En EC2 Worker 1 y Worker 2:
docker swarm join --token <TOKEN> <IP_MANAGER>:2377
```

### 4. Configurar secrets de GitHub Actions

En tu repositorio → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `DOCKER_HUB_USER` | Tu usuario de Docker Hub |
| `DOCKER_HUB_TOKEN` | Token de acceso de Docker Hub |
| `EC2_SSH_KEY` | Llave privada SSH para las EC2 |
| `EC2_MANAGER_HOST` | IP pública del EC2 Manager |
| `EC2_USER` | `ubuntu` (o el usuario de tu AMI) |
| `MONGO_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | Secreto para JWT |

### 5. Despliegue manual inicial

```bash
# En EC2 Manager:
export MONGO_URI="mongodb+srv://..."
export JWT_SECRET="tu_secreto"
export DOCKER_IMAGE_BACKEND="tuusuario/banco-nexus-backend:latest"
export DOCKER_IMAGE_FRONTEND="tuusuario/banco-nexus-frontend:latest"

docker stack deploy --compose-file docker-stack.yml --with-registry-auth banco-nexus

# Verificar el stack
docker stack ps banco-nexus
```

Después de este primer despliegue, cualquier `git push` a `main` disparará el pipeline de CI/CD automáticamente.

## API Reference

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/registro` | No | Crear cuenta nueva |
| POST | `/api/auth/login` | No | Iniciar sesión |
| GET | `/api/perfil` | JWT | Ver/editar perfil |
| GET | `/api/cuenta/:num` | JWT | Saldo y datos |
| POST | `/api/deposito` | JWT | Depositar fondos |
| POST | `/api/retiro` | JWT | Retirar fondos |
| POST | `/api/transferencia` | JWT | Transferir entre cuentas |
| GET | `/api/cuentas-destino` | JWT | Listar cuentas guardadas |
| POST | `/api/cuentas-destino` | JWT | Registrar cuenta destino |
| DELETE | `/api/cuentas-destino/:id` | JWT | Eliminar cuenta destino |
| GET | `/api/historial/:num` | JWT | Historial de transacciones |
| GET | `/api/bitacora` | JWT | Logs de auditoría |
