# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## CI/CD Deployment

This project uses GitHub Actions to automatically deploy to Vercel.

### Deployment Workflow

| Trigger | Environment | Description |
|---------|-------------|-------------|
| Push to `main` | Production | Automatically deploys to production |
| Pull Request | Preview | Creates a preview deployment and comments URL on PR |

### Setup Requirements

To enable automatic deployments, configure the following GitHub Secrets:

1. **VERCEL_TOKEN** - Your Vercel authentication token
2. **VERCEL_ORG_ID** - Your Vercel Organization ID
3. **VERCEL_PROJECT_ID** - Your Vercel Project ID

For detailed setup instructions, see [.github/workflows/README.md](.github/workflows/README.md).
