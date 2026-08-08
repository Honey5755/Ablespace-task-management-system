import type { NextConfig } from 'next';

const LOCAL_API = 'http://localhost:4000/api';

/**
 * NEXT_PUBLIC_* values are inlined at build time, so a missing API URL cannot
 * be fixed by setting it later in the host's dashboard — it needs a rebuild.
 *
 * Left unguarded, a deploy with the variable unset would quietly ship a bundle
 * pointing at localhost: the site loads, looks correct, and every request fails
 * in the browser with no clue why. Fail the build instead, but only on a deploy
 * host, so local `next build` still works with the default.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const isDeployHost = Boolean(
  process.env.NETLIFY ?? process.env.VERCEL ?? process.env.RENDER,
);

if (isDeployHost && (!apiUrl || apiUrl.includes('localhost'))) {
  throw new Error(
    'NEXT_PUBLIC_API_URL must point at the deployed API (e.g. ' +
      'https://your-api.onrender.com/api). It is currently ' +
      `${apiUrl ? `"${apiUrl}"` : 'unset'}, which would ship a bundle that ` +
      'calls localhost. Set it in your site\'s environment variables and redeploy.',
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl ?? LOCAL_API,
  },
};

export default nextConfig;
