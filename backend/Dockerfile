# Multi-stage build for Go DNS backend
FROM golang:alpine AS builder

WORKDIR /src

# Install CA certificates and git for module fetching
RUN apk add --no-cache ca-certificates git

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/dns-server .

# Production runner image
FROM alpine:latest

WORKDIR /app


COPY --from=builder /bin/dns-server /app/dns-server

# Use unprivileged user
USER appuser

# Expose HTTP API (:8000) and DNS server (:8001 UDP/TCP)
EXPOSE 8000
EXPOSE 8001/udp
EXPOSE 8001/tcp

ENTRYPOINT ["/app/dns-server"]
