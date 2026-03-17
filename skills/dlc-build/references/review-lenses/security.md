# Security Review Lens

Inject into reviewer prompts when diff touches: auth, API endpoints, user input, database queries, file uploads, or anything handling credentials/tokens.

```text
SECURITY LENS (active for this review):
Apply OWASP Top 10 checks to all changed code:
- Injection: SQL, command, LDAP, XPath — any user input in query/command construction?
- Auth bypass: missing authentication guards, broken access control, IDOR vulnerabilities
- Sensitive data exposure: credentials in logs, API responses leaking PII, tokens in URLs
- Security misconfiguration: CORS too permissive, debug mode in production, exposed stack traces
- Insecure deserialization: untrusted input deserialized without validation
- Rate limiting: endpoints missing rate limits that could enable brute force or DoS
- Secret management: hardcoded secrets, env vars logged, secrets in version control

THRESHOLD: Report at confidence ≥70 (lower than default — security false positives are acceptable).
Hard Rule violations always reported regardless of confidence.
```
