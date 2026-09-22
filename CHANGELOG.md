# Changelog

All notable changes to the SkillSwap platform are documented in this file.

## [Unreleased]
### Added
- **Render Production Blueprint (`render.yaml`)**: Configured automatic zero-downtime deployment pipeline for Render with health check verification (`/api/health`).
- **Autonomous AI Directives (`AGENTS.md`)**: Expanded agent capabilities to include vulnerability auditing, PR code reviews, self-healing, and Render deployment protocols.
- **Enhanced AI CI Reviewer (`scripts/ai-code-reviewer.js`)**: Upgraded automated code auditor with secret scanning, Render compatibility checks, and security audit rules.
- **Automated Health Check Route**: Added `/api/health` endpoint on Express server reporting server uptime and health state.

### Security & Hardening
- Secret pattern scanning in CI before PR merge.
- Strict CORS validation permitting `.onrender.com`, Google Cloud Run, and configured domains.
