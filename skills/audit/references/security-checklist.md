# Security Audit Checklist

OWASP Top 10 and security-reviewer focus areas for comprehensive security audits.

## OWASP Top 10 (2021)

| # | Category | Focus Areas |
|---|----------|-------------|
| A01 | Broken Access Control | IDOR, missing auth, privilege escalation |
| A02 | Cryptographic Failures | Weak encryption, hardcoded secrets, insecure storage |
| A03 | Injection | SQL, NoSQL, OS command, LDAP, XPath |
| A04 | Insecure Design | Missing rate limiting, business logic flaws |
| A05 | Security Misconfiguration | Default creds, open cloud storage, verbose errors |
| A06 | Vulnerable Components | Outdated deps, known CVEs, unpatched frameworks |
| A07 | Auth Failures | Weak passwords, missing MFA, session fixation |
| A08 | Software Integrity Failures | Untrusted sources, insecure CI/CD, supply chain |
| A09 | Logging Failures | Missing audit logs, leaked secrets in logs |
| A10 | SSRF | Internal network access, cloud metadata endpoints |

## Security-Reviewer Focus Areas

### Authentication & Authorization

- [ ] Password storage uses bcrypt/scrypt/argon2 (never plaintext, MD5, SHA1)
- [ ] Session tokens are cryptographically random, not predictable
- [ ] JWTs use strong secrets and short expiration
- [ ] Auth checks happen on every protected route
- [ ] Role checks use denylist (block admin routes) not allowlist
- [ ] API keys have minimum required permissions

### Input Validation

- [ ] All user input is validated (type, length, format)
- [ ] Input sanitization uses established libraries (DOMPurify, validator.js)
- [ ] File uploads validate type, size, content (not just extension)
- [ ] SQL queries use parameterized statements (never string concatenation)
- [ ] No dynamic code execution on user input (eval, Function constructor)

### Data Protection

- [ ] Sensitive data encrypted at rest (AES-256-GCM)
- [ ] Sensitive data encrypted in transit (TLS 1.3)
- [ ] Secrets stored in environment variables or secret managers (never in code)
- [ ] Logs redact sensitive data (passwords, tokens, PII)
- [ ] Database credentials not hardcoded (use env vars)

### API Security

- [ ] Rate limiting on all public endpoints
- [ ] CORS configured for allowed origins only
- [ ] No sensitive data in URL parameters
- [ ] Proper HTTP status codes (not leaking info)
- [ ] GraphQL introspection disabled in production

### Infrastructure

- [ ] Dependency versions have no known CVEs (npm audit, pip-audit)
- [ ] Security headers present (CSP, HSTS, X-Frame-Options)
- [ ] HTTPS redirect enabled
- [ ] Error messages don't leak stack traces or config
- [ ] Admin endpoints not publicly accessible

### Business Logic

- [ ] Rate limits on business actions (password reset, checkout)
- [ ] Idempotency keys for mutable operations
- [ ] Time-based checks (can't complete after deadline)
- [ ] State machine validation (can't skip steps)
- [ ] Numeric bounds (can't order negative quantity)

## Secret Scanning Patterns

Common patterns for detecting hardcoded secrets:

**API Keys:**

- Pattern: `api_key`, `apikey`, `API_KEY` followed by value
- Example: `api_key: "sk-1234567890abcdef"`

**AWS Keys:**

- Pattern: `AKIA` followed by 16 alphanumeric chars
- Example: `AKIAIOSFODNN7EXAMPLE`

**Private Keys:**

- Pattern: `-----BEGIN PRIVATE KEY-----`
- Check for: RSA, EC, DSA private key headers

**JWT Secrets:**

- Pattern: `jwt_secret`, `JWT_SECRET` followed by value
- Minimum length: 256 bits (32 chars)

**Database URLs:**

- Pattern: Connection strings with embedded credentials
- Example: `postgres://user:password@host:port/db`

## Severity Classification

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | Remote code execution, data breach, auth bypass |
| **HIGH** | SQL injection, auth weakness, data exposure |
| **MEDIUM** | XSS, CSRF, info disclosure, rate limiting missing |
| **LOW** | Verbose errors, missing headers, minor config issues |

## Report Template

```markdown
## Security Audit Report

### Critical Issues (N)

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| C1 | Hardcoded AWS key | src/config.ts:42 | Use env var AWS_ACCESS_KEY_ID |

### High Issues (N)

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| H1 | SQL injection risk | src/db/users.ts:89 | Use parameterized queries |

### Medium Issues (N)

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| M1 | Missing rate limit | src/api/auth.ts:23 | Add express-rate-limit |

### Low Issues (N)

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| L1 | Verbose error in prod | src/api/index.ts:15 | Disable stack traces |

### Summary

- Critical issues requiring immediate action: N
- High issues to address before release: N
- Medium issues to schedule: N
- Low issues for backlog: N
```

## Remediation Priority

1. **Critical** — Fix immediately, block release
2. **High** — Fix before production deployment
3. **Medium** — Fix within sprint
4. **Low** — Fix in next release cycle
