import type {NextConfig} from 'next';

const immutableModelCache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

const nextConfig:NextConfig={
 images:{remotePatterns:[{protocol:'https',hostname:'d35aaqx5ub95lt.cloudfront.net'},{protocol:'https',hostname:'images.higgs.ai'}]},
 async headers(){
  return [
   { source: '/models/:path*', headers: immutableModelCache },
   { source: '/study/models/:path*', headers: immutableModelCache },
  ];
 },
};
export default nextConfig;
