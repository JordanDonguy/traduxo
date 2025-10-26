module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@traduxo/packages": "../packages",
          },
          extensions: [".js", ".ts", ".tsx", ".jsx"],
        },
      ],
    ],
  };
};
