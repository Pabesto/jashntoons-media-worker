import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  ...(process.env.JASHNTOONS_RUNTIME === 'render' ? {
    distDir: '.next-render',
    webpack(config, {webpack}) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/, path.resolve('services/render-web/cloudflare-runtime.ts')));
      return config;
    },
  } : {}),
};

export default nextConfig;
