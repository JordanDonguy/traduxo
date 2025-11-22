const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the packages folder
config.watchFolders = [path.resolve(workspaceRoot, "packages")];

// Force Metro to resolve modules from app node_modules
config.resolver.extraNodeModules = new Proxy({}, {
  get: (_, name) => path.join(projectRoot, "node_modules", name),
});

module.exports = withNativeWind(config, { input: './app/global.css' })
