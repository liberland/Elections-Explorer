# Liberland Elections Explorer

## Prerequisites

Create docker network for backend <-> frontend communication

```sh
docker network create liberland-elections-explorer
```

## Build and deploy backend

1. Build docker image

```sh
docker build -t liberland-elections-explorer backend
```

2. Run

```sh
docker run -d --network liberland-elections-explorer --name liberland-elections-explorer --restart unless-stopped liberland-elections-explorer
```

## Build and deploy frontend

1. Build docker image

```sh
docker build -t liberland-elections-explorer-frontend frontend
```

2. Run

```sh
docker run -d --network liberland-elections-explorer --name liberland-elections-explorer-frontend --restart unless-stopped -p 3000:3000 liberland-elections-explorer-frontend
```
