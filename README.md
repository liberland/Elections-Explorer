# Liberland Election Explorer

## Prerequisites

Create docker network for backend <-> frontend communication

```sh
docker network create liberland-election-explorer
```

## Build and deploy backend

1. Build docker image

```sh
docker build -t liberland-election-explorer backend
```

2. Run

```sh
docker run -d --network liberland-election-explorer --name liberland-election-explorer --restart unless-stopped liberland-election-explorer
```

## Build and deploy frontend

1. Build docker image

```sh
docker build -t liberland-election-explorer-frontend frontend
```

2. Run

```sh
docker run -d --network liberland-election-explorer --name liberland-election-explorer-frontend --restart unless-stopped -p 3000:3000 liberland-election-explorer-frontend
```
