import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
};

export default nextConfig;
module.exports = {
  allowedDevOrigins: ['10.100.4.6'],
}