# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating CI/CD processes.

## Vercel Deployment Workflow

The `vercel-deployment.yml` workflow automatically deploys the project to Vercel.

### Workflow Triggers

| Trigger | Environment | Description |
|---------|-------------|-------------|
| Push to `main` branch | Production | Deploys to production domain with `--prod` flag |
| Pull Request (opened/updated) | Preview | Creates preview deployment and comments URL on PR |

### Required GitHub Secrets

Before using this workflow, you need to configure the following secrets in your GitHub repository:

1. **VERCEL_TOKEN**
2. **VERCEL_ORG_ID**
3. **VERCEL_PROJECT_ID**

### How to Get Vercel Credentials

#### Step 1: Get VERCEL_TOKEN

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create"** to create a new token
3. Enter a name for your token (e.g., "GitHub Actions")
4. Select the scope (Full Account or specific team)
5. Click **"Create Token"**
6. Copy the token value (you won't be able to see it again!)

#### Step 2: Get VERCEL_ORG_ID and VERCEL_PROJECT_ID

**Option A: Using Vercel CLI (Recommended)**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Link your project to Vercel:
   ```bash
   cd your-project
   vercel link
   ```

3. After linking, a `.vercel/project.json` file will be created with both IDs:
   ```json
   {
     "orgId": "your-org-id",
     "projectId": "your-project-id"
   }
   ```

**Option B: From Vercel Dashboard**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Find **"Project ID"** in the project settings
5. For **Organization ID**, go to your team/account settings

### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:
   - Name: `VERCEL_TOKEN`, Value: (your token)
   - Name: `VERCEL_ORG_ID`, Value: (your org ID)
   - Name: `VERCEL_PROJECT_ID`, Value: (your project ID)

### Workflow Steps

#### Production Deployment (push to main)
1. **Checkout code** - Pulls the latest code from the repository
2. **Setup Node.js** - Configures Node.js 18.x environment
3. **Install Vercel CLI** - Installs the latest Vercel CLI globally
4. **Pull Vercel Environment** - Fetches project settings from Vercel
5. **Build Project** - Builds the project using Vercel's build system
6. **Deploy** - Deploys to production with `--prod` flag

#### Preview Deployment (pull request)
1. **Checkout code** - Pulls the PR code
2. **Setup Node.js** - Configures Node.js 18.x environment
3. **Install Vercel CLI** - Installs the latest Vercel CLI globally
4. **Pull Vercel Environment** - Fetches preview environment settings
5. **Build Project** - Builds the project for preview
6. **Deploy** - Deploys to preview environment (no `--prod` flag)
7. **Comment on PR** - Posts the deployment URL as a comment on the PR

### Troubleshooting

#### Common Issues

**Error: "Vercel CLI not found"**
- Ensure the Vercel CLI installation step completed successfully
- Check if npm is available in the runner

**Error: "Project not found"**
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- Ensure the project exists in your Vercel account

**Error: "Invalid token"**
- Regenerate your `VERCEL_TOKEN`
- Check if the token has the correct permissions

**Error: "Permission denied"**
- Ensure your Vercel token has access to the organization/team
- Verify the token scope includes deployment permissions

### Security Notes

- Never commit your Vercel token or IDs to the repository
- Always use GitHub Secrets for sensitive information
- Rotate your Vercel token periodically for security
- Use the minimum required scope for your Vercel token
