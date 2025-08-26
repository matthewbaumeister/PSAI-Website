/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    
    // Exclude favicon.svg from SVG processing
    config.module.rules.push({
      test: /favicon\.svg$/,
      type: 'asset/resource',
    })
    
    return config
  },
}

module.exports = nextConfig
