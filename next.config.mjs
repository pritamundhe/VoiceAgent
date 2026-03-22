/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;
