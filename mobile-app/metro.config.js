const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// ---------------------------------------------------------------------------
// Web: keep `import.meta` out of the bundle.
//
// Expo serves the web bundle as a classic <script defer>, not
// <script type="module">. `import.meta` there is a *parse-time* SyntaxError
// ("Cannot use 'import.meta' outside a module"), so a single occurrence stops
// the entire app from booting.
//
// With package exports enabled, Metro matches the "import" condition for ESM
// importers. zustand's exports map offers only react-native / import / default,
// so on web `zustand/middleware` resolves to esm/middleware.mjs — whose
// devtools middleware reads `import.meta.env`. Its CommonJS twin
// (zustand/middleware.js) is identical minus that. Point web at the CJS files.
// Native is unaffected: it matches the "react-native" condition, already CJS.
// ---------------------------------------------------------------------------
const CJS_ONLY_ON_WEB = ['zustand'];

const zustandDir = path.dirname(
  require.resolve('zustand/package.json', { paths: [__dirname] })
);

const baseResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && CJS_ONLY_ON_WEB.some((p) => moduleName === p || moduleName.startsWith(`${p}/`))) {
    const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    if (subpath !== 'package.json') {
      // Resolved against the package directory so the exports map (and its
      // "import" condition) is bypassed entirely.
      return {
        type: 'sourceFile',
        filePath: path.join(zustandDir, `${subpath}.js`),
      };
    }
  }

  return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
