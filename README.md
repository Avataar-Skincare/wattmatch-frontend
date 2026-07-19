# wattmatch-frontend

React 19 + Vite static frontend for the Wattmatch lead-capture site.

## Development

```bash
npm install
npm run dev
```

Form submissions go to the API at `VITE_API_URL` (baked in at build time). If it's unset, forms run in demo mode and succeed locally without a backend.

## Build

```bash
VITE_API_URL=https://<site-domain> npm run build   # output in dist/
```

## Deployment

Push to `main` deploys automatically (`.github/workflows/deploy.yml`): GitHub Actions builds with `VITE_API_URL` from the repo variable, syncs `dist/` to the S3 bucket, and invalidates the CloudFront distribution. AWS access uses the GitHub OIDC role in `AWS_ROLE_ARN` — no long-lived keys.

Repo configuration lives in Settings → Secrets and variables → Actions: secret `AWS_ROLE_ARN`; variables `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `VITE_API_URL`.
