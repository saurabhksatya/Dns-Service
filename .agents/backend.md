# Backend Reference (`backend/`)

Go 1.25.3. The backend is the **authoritative DNS server** plus a small HTTP API used to **verify NS delegation**. It uses two third-party libs: **Echo v5** (`github.com/labstack/echo/v5`) for HTTP and **miekg/dns** (`github.com/miekg/dns`) for DNS.

Module name: `dns`.

## Directory structure

```
backend/
├── go.mod            # module dns, go 1.25.3
├── go.sum
├── main.go           # everything: Echo app + DNS server + handlers
├── types/            # shared response types
│   ├── error.go
│   └── checkNameServer.go
├── utils/            # helpers
│   └── domain.go
└── .gitignore        # .idea, tmp
```

## Services

### 1. HTTP server (Echo v5) — port `:8000`

Routes:

| Method | Path | Handler | Purpose |
|---|---|---|---|
| GET | `/` | `Index` | Health check — returns `"Hello, World!"` |
| GET | `/checkNS/:domain` | `checkNameServers` | Real public NS lookup via `net.LookupNS` |
| GET | `/test/:domain` | `checkNameServerFromDockerCoreDNS` | NS lookup against local CoreDNS at `127.0.0.1:4000` (for dev/testing) |

Middleware: `middleware.Recover()` only (request logging is commented out).

### 2. DNS server (miekg/dns) — port `:8001` UDP + TCP

- Registers `dns.HandleFunc(".", handleDNS)` — a **catch-all** handler for every domain.
- For any `A` query it replies authoritatively with a hard-coded record: `A 102.100.1.1`, TTL 300.
- Listens on both UDP and TCP `:8001` (UDP in a goroutine, TCP blocks `main`).

## Source walkthrough — `main.go`

### `Index`

```go
func Index(c *echo.Context) error {
    return c.String(http.StatusOK, "Hello, World!")
}
```

### NS verification — `checkNameServers` (public lookup)

1. Reads `:domain` path param.
2. Validates with `utils.IsValidDomain(domain)` → 400 `ErrorResponse{Message: "Invalid Domain"}` on failure.
3. `net.LookupNS(domain)` → 500 `"Failed to Lookup NS"` on error.
4. Compares returned NS hosts (lowercased) against expected set `{ns1.example.com, ns2.example.com}`:
   - An NS record that isn't in the expected set → 400 `"Remove <ns> from your NS records"`.
   - A missing expected NS → 400 `"<ns> is missing from your NS records"`.
5. On success → 200 `{ "success": true }`.

### NS verification — `checkNameServerFromDockerCoreDNS` (local)

Same logic, but instead of `net.LookupNS` it sends a `dns.TypeNS` query via a `dns.Client` to `127.0.0.1:4000` (the CoreDNS container from `testing/`). Expected set uses **trailing dots**: `ns1.example.com.` and `ns2.example.com.`.

> ⚠️ **Known inconsistency:** the two handlers compare against NS names **with** (`ns1.example.com.`) vs **without** (`ns1.example.com`) trailing dots. If you change one, check the other. Both are currently hard-coded.

### `handleDNS` (authoritative responder)

```go
func handleDNS(w dns.ResponseWriter, r *dns.Msg) {
    msg := new(dns.Msg)
    msg.SetReply(r)
    msg.Authoritative = true
    for _, q := range r.Question {
        switch q.Qtype {
        case dns.TypeA:
            rr := &dns.A{ Hdr: dns.RR_Header{ Name: q.Name, Rrtype: dns.TypeA, Class: dns.ClassINET, Ttl: 300 },
                          A: net.ParseIP("102.100.1.1") }
            msg.Answer = append(msg.Answer, rr)
        }
    }
    w.WriteMsg(msg)
}
```

Note the response address `102.100.1.1` is a **hard-coded placeholder**. In the future this should return a real IP per site/domain.

### `main`

```go
func main() {
    e := echo.New()
    e.Use(middleware.Recover())
    e.GET("/", Index)
    e.GET("/checkNS/:domain", checkNameServers)
    e.GET("/test/:domain", checkNameServerFromDockerCoreDNS)

    go func() { e.Start(":8000") }()          // HTTP, goroutine

    dns.HandleFunc(".", handleDNS)
    go func() { (&dns.Server{Addr: ":8001", Net: "udp"}).ListenAndServe() }()
    (&dns.Server{Addr: ":8001", Net: "tcp"}).ListenAndServe()  // blocks
}
```

## Types (`types/`)

```go
// types/error.go
type ErrorResponse struct {
    Message string `json:"message"`
}

// types/checkNameServer.go
type CheckNameServerResponse struct {
    Success bool `json:"success"`
}
```

Both are the only two shared response types. All error responses use `ErrorResponse`; NS checks use `CheckNameServerResponse`.

## Utils (`utils/`)

```go
// utils/domain.go
package utils

import "golang.org/x/net/idna"

func IsValidDomain(domain string) bool {
    _, err := idna.Lookup.ToASCII(domain)
    return err != nil
}
```

> ⚠️ **Gotcha:** `IsValidDomain` returns `true` when the domain is **invalid** (the bool is really "has error"). Callers use `if utils.IsValidDomain(domain) { /* invalid → 400 */ }`. The name is misleading — consider renaming it to something like `HasError` or inverting it, but **don't change it without updating both call sites** in `main.go`.

## Conventions & practices

- **Handlers** take `*echo.Context` and return `error`. Error responses use `types.ErrorResponse`.
- **Exported names**: keep exported symbols only for things other packages need (`Index`, `IsValidDomain`, the two types). Everything else is package-private.
- **Logging**: `log/slog` (used in `main` for server start failures). Avoid `println` in production code — the current `println(domain)` debug lines in both handlers should be removed or replaced with `slog`.
- **JSON tags** on response types: `json:"message"`, `json:"success"`.
- Use **net/mail-style lowercasing** when comparing DNS names (`strings.ToLower`).

## Gotchas & future work

- All deps in `go.mod` are marked `// indirect` even though `echo/v5` and `miekg/dns` are used directly. Run `go mod tidy` to clean this up.
- NS names are **hard-coded** (`ns1.example.com` / `ns2.example.com`) in both the verification logic and the DNS responder. When multi-tenancy lands, these must come from config/DB.
- The DNS `A` answer (`102.100.1.1`) is a placeholder.
- **No tests, no Dockerfile, no Makefile** exist yet.
- Handlers have leftover `println` debug statements.

## Commands

```bash
cd backend
go run .              # start both HTTP (8000) and DNS (8001) servers
go build ./...        # compile check
go vet ./...          # static analysis
go mod tidy           # clean go.mod (currently has stale // indirect markers)
```
