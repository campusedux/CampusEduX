// Verified against the versions actually installed in node_modules:
//   expo 55.0.30 | babel-preset-expo 55.0.25 | @babel/core 7.29.7
//   nativewind 4.2.6 | react-native-css-interop 0.2.6
//   babel-plugin-module-resolver 5.0.3 | metro 0.83.8
//
// "nativewind/babel" re-exports "react-native-css-interop/babel", which returns
// { plugins: [...] } — that is a *preset* shape. Putting it in the `plugins`
// array is what produces:
//     [BABEL] .plugins is not a valid Plugin property
// so it must stay in `presets`. It already contributes the css-interop plugin,
// the JSX transform and react-native-worklets/plugin; do not add those again.
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],

    plugins: [
      // Keeps the "@/..." alias working in Metro. Must match the `paths`
      // mapping in tsconfig.json, or imports resolve for TS but not at runtime.
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
