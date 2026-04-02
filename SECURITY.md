<!-- SPDX-License-Identifier: Apache-2.0 -->

# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

- **Email**: askb23@gmail.com
- **Do NOT** open a public GitHub issue for security vulnerabilities

## Security Measures

### Application Security

- All API routes validate inputs and use try/catch error handling
- No direct filesystem access from client-side code
- Gateway WebSocket connections require authentication tokens
- Docker containers run with minimal privileges

### CI/CD Security

- All GitHub Actions pinned to SHA commits (not floating tags)
- Automated secret detection via detect-secrets
- Dependency auditing via pnpm audit
- Pre-commit hooks prevent credential leaks

### Infrastructure

- Caddy reverse proxy terminates TLS
- Docker network isolation between services
- Read-only volume mounts where possible
- No secrets stored in source code

## Supported Versions

| Version | Supported  |
| ------- | ---------- |
| 0.1.x   | ✅ Current |

## SPDX License

SPDX-License-Identifier: Apache-2.0
