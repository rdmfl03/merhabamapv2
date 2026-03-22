# Security

## Reporting a Vulnerability

If you believe you found a security vulnerability, privacy issue, or sensitive data exposure:

- do not open a public issue with exploit details
- report it privately to `info@merhabamap.com`
- include the affected area, impact, reproduction steps, and any suggested mitigation

Please avoid sharing real user data, tokens, credentials, or private infrastructure details in the report.

## Scope

Security-sensitive areas include:

- authentication and session handling
- admin and moderation functionality
- submissions and ingest endpoints
- environment variable handling
- database access and migrations
- email, token, and password-reset flows

## Expectations for Contributors

- do not commit secrets or private operational values
- do not weaken security checks for convenience
- keep production and public-repo safety in mind when changing docs, workflows, and config
