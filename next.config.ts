import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Explicit project root is helpful for some tools
  distDir: '.next',
};

export default nextConfig;
