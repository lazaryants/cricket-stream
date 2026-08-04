# Security Policy

[Русская версия](SECURITY.ru.md)

## Supported Version

Security fixes are currently applied to the latest code on `main` and to supported release branches or tags when explicitly announced.

Version `v1.0.0` is the first stable release.

## Reporting a Vulnerability

Do not publish credentials, exploit details, stream keys, private source URLs, or destination URLs in a public GitHub issue.

Report security concerns privately to the repository owner through an approved private communication channel.

Include:

- affected version or commit;
- affected component;
- reproduction steps;
- impact;
- whether production data or credentials were exposed;
- suggested mitigation if known.

## Sensitive Data

Never commit or publish:

- backend `.env`;
- JWT secrets;
- PostgreSQL passwords;
- deploy keys;
- SSH private keys;
- TLS private keys;
- private source URLs;
- RTMP stream keys;
- tokenized HLS playback URLs;
- production database dumps.

## Role Security

Current policy:

- Viewer does not receive `source_url` or `destination_rtmp_url`;
- Operator can view both, start and stop streams, and edit the source;
- Operator cannot edit RTMP destination definitions;
- Administrator has full access.

Backend authorization is the security boundary. Frontend visibility alone is not sufficient.

## HLS Preview

- HLS files must not be exposed by a public Nginx alias;
- preview must be served through authenticated API endpoints;
- playback tokens must be short-lived;
- tokenized URLs should not be written to access logs;
- HLS storage is temporary and must not be treated as an archive.

## Production Protection

- expose only required ports;
- keep PostgreSQL private;
- prefer SSH keys;
- restrict administrator accounts;
- use HTTPS only;
- preserve Certbot-managed TLS configuration;
- back up before migrations and upgrades;
- apply component updates during maintenance windows;
- review logs for repeated authentication or process failures.

## Incident Response

1. Stop affected streams if publication risk exists.
2. Disable or reset affected user accounts.
3. Rotate JWT, database, deploy, or stream credentials as appropriate.
4. Preserve logs and database evidence.
5. Restore known-good code and configuration if required.
6. Verify Viewer and Operator permissions.
7. Document the incident and corrective action.
