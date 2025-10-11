const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the packages folder
config.watchFolders = [path.resolve(workspaceRoot, "packages")];

// Allow symlinks (monorepo / PNPM / Yarn workspaces)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
