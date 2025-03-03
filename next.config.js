/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 配置 webpack 以支持 Node.js 模块
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端 webpack 配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 