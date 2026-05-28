# Sistema de Transferencias Bancarias

Aplicación web de simulación bancaria para registro de clientes, autenticación, consulta de saldo, historial de movimientos, gestión de cuentas destino y transferencias monetarias seguras.

La solución está dividida en dos capas desacopladas:

- **Frontend**: interfaz web construida con React y Vite.
- **Backend**: API monolítica con lógica de negocio, autenticación, validaciones y operaciones financieras.

La persistencia se realiza sobre una base de datos administrada externa. MongoDB soporta transacciones multi-documento cuando se requiere atomicidad en operaciones que afectan más de un documento. [web:1233][web:1236]

---

## Tabla de contenido

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Ejecución en desarrollo local](#ejecución-en-desarrollo-local)
- [Ejecución con Docker](#ejecución-con-docker)
- [Despliegue con Docker Swarm](#despliegue-con-docker-swarm)
- [Comandos útiles](#comandos-útiles)
- [Solución de problemas](#solución-de-problemas)

---

## Arquitectura

El proyecto sigue una arquitectura separada por capas:

- Un contenedor para el **frontend**.
- Un contenedor para el **backend**.
- Una base de datos externa administrada.
- Despliegue opcional en **Docker Swarm** para replicación y rolling updates. Docker Swarm permite actualizaciones progresivas de servicios según la política `UpdateConfig`. [web:979][web:1223]

---

## Tecnologías

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- API REST
- JWT para autenticación

### Infraestructura
- Docker
- Docker Swarm
- MongoDB Atlas

### Nota sobre configuración del frontend
Vite expone variables mediante `import.meta.env` y reemplaza sus valores en tiempo de build. Esto significa que la configuración del frontend debe estar correcta **antes de compilar o construir la imagen**. [web:1078][web:1088][web:1110]

---

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- Git
- Node.js 20 o superior
- npm
- Docker
- Docker Desktop o Docker Engine
- Acceso a una base de datos MongoDB Atlas
- Acceso a las variables de entorno necesarias del proyecto

---

## Estructura del proyecto

```bash
Sistema-de-transferencias-bancarias/
├── frontend/
├── backend/
└── docker-stack.yml
```

> Los nombres de carpetas pueden variar ligeramente según la organización actual del repositorio.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Sistema-de-transferencias-bancarias
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno

Cada integrante debe crear localmente los archivos de configuración necesarios para:

- el backend,
- el frontend,
- y, en caso de despliegue, los servicios Docker o Swarm.

Este repositorio **no incluye** archivos `.env`.

> Importante: el frontend debe tener configurada correctamente la URL del backend antes de ejecutar `vite build`, ya que Vite inserta las variables en el bundle final durante el build. [web:1078][web:1110]

---

## Ejecución en desarrollo local

### 1. Iniciar el backend

Desde la carpeta `backend`:

```bash
npm run dev
```

### 2. Iniciar el frontend

Desde la carpeta `frontend`:

```bash
npm run dev
```

Vite mostrará en consola la URL del servidor de desarrollo. [web:1130]

### 3. Probar la aplicación

Con ambos servicios levantados:

1. Abrir el frontend en el navegador.
2. Registrar un usuario nuevo.
3. Iniciar sesión.
4. Verificar el dashboard.
5. Consultar el historial de movimientos.
6. Registrar una cuenta destino.
7. Realizar una transferencia de prueba.

---

## Ejecución con Docker

### Backend

Desde la carpeta `backend`:

```bash
docker build -t banco-nexus-backend .
docker run --env-file .env -p 3000:3000 banco-nexus-backend
```

### Frontend

Desde la carpeta `frontend`:

```bash
docker build -t banco-nexus-frontend .
docker run -p 80:80 banco-nexus-frontend
```

> Antes de construir la imagen del frontend, asegúrate de que su configuración esté correcta. En Vite, las variables `VITE_*` se incorporan en el build y no cambian automáticamente en runtime. [web:1078][web:1088]

---

## Despliegue con Docker Swarm

### 1. Inicializar Swarm

En el nodo manager:

```bash
docker swarm init
```

### 2. Unir nodos al clúster

En los demás nodos, ejecutar el comando `docker swarm join` generado por el manager.

### 3. Verificar el clúster

```bash
docker node ls
```

### 4. Desplegar el stack

Desde el nodo manager:

```bash
docker stack deploy -c docker-stack.yml banco-nexus
```

### 5. Verificar servicios

```bash
docker service ls
docker service ps banco-nexus_backend
docker service ps banco-nexus_frontend
```

### 6. Revisar logs

```bash
docker service logs banco-nexus_backend --tail=100
docker service logs banco-nexus_frontend --tail=100
```

### 7. Forzar actualización de un servicio

Si es necesario reiniciar tareas o aplicar una nueva imagen:

```bash
docker service update --force banco-nexus_backend
docker service update --force banco-nexus_frontend
```

Docker Swarm soporta rolling updates configurando políticas de actualización en el servicio, por ejemplo con retrasos entre tareas y pausas automáticas si una actualización falla. [web:979][web:1223][web:1238]

---

## Comandos útiles

### Desarrollo local

```bash
npm install
npm run dev
```

### Construcción con Docker

```bash
docker build -t nombre-imagen .
docker run --env-file .env -p HOST:CONTAINER nombre-imagen
```

### Docker Swarm

```bash
docker swarm init
docker node ls
docker stack deploy -c docker-stack.yml banco-nexus
docker service ls
docker service ps banco-nexus_backend
docker service ps banco-nexus_frontend
docker service logs banco-nexus_backend --tail=100
docker service logs banco-nexus_frontend --tail=100
docker service update --force banco-nexus_backend
docker service update --force banco-nexus_frontend
```

---

## Solución de problemas

### El frontend sigue apuntando a `localhost`

Esto suele ocurrir cuando el frontend fue compilado con una configuración incorrecta. Vite reemplaza las variables de entorno en tiempo de build, por lo que un valor incorrecto queda incrustado en el bundle final. [web:1078][web:1110]

### El backend no conecta a la base de datos

Verificar:

- que la URI de MongoDB Atlas sea válida,
- que la IP esté autorizada en Atlas,
- que las credenciales sean correctas.

MongoDB permite transacciones ACID para operaciones multi-documento a través de sesiones y transacciones del driver. [web:1233][web:1236]

### Un servicio en Swarm no queda en `1/1`

Revisar:

```bash
docker service ps <servicio> --no-trunc
docker service logs <servicio> --tail=100
```

Si hace falta reiniciar la tarea:

```bash
docker service update --force <servicio>
```

### Los cambios no aparecen después del deploy

Verificar:

- que la imagen nueva realmente se haya construido,
- que el servicio esté usando el digest más reciente,
- que el navegador no esté cargando archivos cacheados,
- que el frontend no haya sido compilado con una URL antigua del backend.

---

## Recomendaciones

- No subir archivos de entorno al repositorio.
- Confirmar la configuración antes de construir el frontend.
- Validar la conectividad con MongoDB Atlas antes de probar transferencias.
- En despliegues con Swarm, comprobar el estado de las réplicas después de cada actualización.
- Mantener sincronizados frontend, backend y configuración de infraestructura.

---

## Estado esperado del sistema

Cuando el proyecto está correctamente configurado:

- el backend responde a la API,
- el frontend permite autenticación y operaciones bancarias,
- la base de datos persiste usuarios, cuentas y transacciones,
- los servicios pueden ejecutarse localmente o mediante Docker,
- y el despliegue en Swarm permite actualizaciones progresivas sin reemplazos manuales de contenedores. [web:979][web:1233]
