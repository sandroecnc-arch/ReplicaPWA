import { build } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

async function buildProject() {
  console.log("🏗️  Building Manicure Studio Lite for production...\n");

  // Build the frontend
  console.log("📦 Building frontend...");
  await build({
    root: ".",
    build: {
      outDir: "dist/public",
      emptyOutDir: true,
    },
  });
  console.log("✅ Frontend built successfully\n");

  // Build the backend
  console.log("📦 Building backend...");
  await build({
    build: {
      ssr: true,
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          index: resolve(process.cwd(), "server/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          format: "es",
        },
      },
    },
  });
  console.log("✅ Backend built successfully\n");

  // Copy package.json for production dependencies
  console.log("📋 Copying package.json...");
  copyFileSync("package.json", "dist/package.json");
  console.log("✅ package.json copied\n");

  // Create PM2 ecosystem file
  console.log("📝 Creating PM2 ecosystem file...");
  const pm2Config = `module.exports = {
  apps: [{
    name: 'manicure-studio',
    script: './index.js',
    cwd: '/var/www/manicure-studio/dist',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
`;

  if (!existsSync("dist")) {
    mkdirSync("dist", { recursive: true });
  }

  const fs = await import("fs/promises");
  await fs.writeFile("dist/ecosystem.config.cjs", pm2Config);
  console.log("✅ PM2 ecosystem file created\n");

  console.log("🎉 Build completed successfully!");
  console.log("\n📁 Output directory: ./dist");
  console.log("\n🚀 To deploy:");
  console.log("   1. Copy the dist/ folder to your VPS");
  console.log("   2. Run: npm install --production");
  console.log("   3. Run: pm2 start ecosystem.config.cjs");
  console.log("   4. Run: pm2 save && pm2 startup\n");
}

buildProject().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
