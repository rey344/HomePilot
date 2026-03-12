# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in HomePilot, please report it by emailing the maintainers directly. **Do not open a public issue.**

We take security seriously and will respond to valid reports within 48 hours.

## Security Best Practices

### Secret Management

**✅ DO:**
- Use environment variables for all secrets (API keys, database passwords, etc.)
- Copy `infrastructure/.env.example` to `infrastructure/.env` and set real values
- Generate strong passwords: `openssl rand -base64 32`
- Use different credentials for development, staging, and production
- Rotate credentials regularly (at least every 90 days)
- Use your platform's secret management (Railway Secrets, Vercel Environment Variables)

**❌ DON'T:**
- Never commit `.env` files to git (they are gitignored)
- Never use default passwords like "homepilot" or "changeme" in production
- Never hardcode credentials in source code
- Never share credentials in chat, email, or documentation
- Never use production credentials in local development

### Required Secrets

The following environment variables MUST be set before running the application:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_PASSWORD` | Database password | Generated with `openssl rand -base64 32` |

Optional secrets:
- `GROQ_API_KEY` — Enables real AI (explain + chat); rule-based fallback if not set
- `FRED_API_KEY` — Live 30-year mortgage rates from Federal Reserve; cached default if not set
- `RAPIDAPI_KEY` — Real estate listings; frontend Search Homes uses mock data if not set

### Fail-Fast Security

HomePilot is designed to **fail fast** if required secrets are missing:

- ✅ App will **refuse to start** if `DATABASE_URL` is not set
- ✅ App will **warn** if DATABASE_URL contains insecure patterns
- ✅ No insecure fallback defaults (e.g., `${PASSWORD:-default}`)
- ✅ Tests use explicit SQLite in-memory (no production credentials)

### Secret Scanning

We use multiple layers to prevent secret leaks:

1. **Pre-commit hooks** (local)
   ```bash
   # Install once
   pip install pre-commit
   pre-commit install
   
   # Runs automatically on git commit
   # Or manually: pre-commit run --all-files
   ```

2. **GitHub Actions** (CI/CD)
   - Gitleaks scans every push and PR
   - TruffleHog verifies found secrets
   - Runs weekly to catch historical leaks

3. **.gitignore**
   - All `.env` files are ignored
   - Secrets directory is ignored
   - Private keys (`.pem`, `.key`) are ignored

### Local Development Setup

```bash
# 1. Copy environment template
cp infrastructure/.env.example infrastructure/.env

# 2. Generate secure password
openssl rand -base64 32

# 3. Edit .env with your generated password
# Replace CHANGE_ME_REQUIRED with the generated password

# 4. Start services
docker compose -f infrastructure/docker-compose.yml up --build -d

# 5. Verify
curl http://localhost:9001/health
```

### Production Deployment

When deploying to production:

1. **Never** use the example passwords
2. Set all environment variables in your platform's secrets manager
3. Use managed databases (Railway Postgres, Neon, Supabase) with auto-generated credentials
4. Enable SSL/TLS for database connections
5. Restrict database access to your backend's IP only
6. Enable CORS with specific origins (no wildcards)

### Docker Compose Security

- Postgres port is bound to `127.0.0.1` only (not exposed to internet)
- All services use `env_file` to load secrets from `.env`
- No default password fallbacks (fails if secrets missing)
- Health checks ensure services are running securely

### Dependency Security

```bash
# Backend - check for vulnerabilities
cd backend
pip install safety
safety check

# Frontend - audit npm packages
cd frontend
npm audit
npm audit fix
```

### Rate Limiting

- API is rate-limited to 100 requests/minute per IP
- Prevents brute force attacks
- Configured in `backend/app/main.py`

## Known Limitations

⚠️ **Before Production Use, Add:**
- Authentication (OAuth2/JWT)
- HTTPS/TLS termination
- Web Application Firewall (WAF)
- DDoS protection
- Log monitoring and alerting
- Automated backup strategy

## Security Checklist

Before deploying to production:

- [ ] All secrets set via environment variables (no defaults)
- [ ] Strong passwords generated (min 32 characters)
- [ ] `.env` files are gitignored and never committed
- [ ] Pre-commit hooks installed and working
- [ ] GitHub Actions secret scanning enabled
- [ ] CORS origins restricted to your domains
- [ ] Database uses SSL/TLS
- [ ] Database access restricted by IP
- [ ] Rate limiting enabled
- [ ] Health checks passing
- [ ] Dependencies audited for vulnerabilities
- [ ] Logs are monitored
- [ ] Backup strategy in place

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Railway Security](https://docs.railway.app/guides/security)
- [Vercel Security](https://vercel.com/docs/security)

---

Last updated: March 2026
