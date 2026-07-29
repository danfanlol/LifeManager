import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's client loads its query engine binary via a dynamic require that
  // Next's file tracer can't statically resolve, so the .so.node file isn't
  // reliably bundled into serverless functions without this explicit include.
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
