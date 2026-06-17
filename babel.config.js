module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    // NOTE: Do NOT add "transform-inline-environment-variables" here.
    // It rewrites every process.env.* reference (including
    // process.env.EXPO_ROUTER_APP_ROOT, which babel-preset-expo injects for
    // expo-router) to its OS value at transform time. Since EXPO_ROUTER_APP_ROOT
    // is not a real shell env var, it becomes `undefined` and breaks
    // require.context in expo-router/_ctx.ios.js ("First argument of
    // require.context should be a string"), failing the iOS archive.
    // babel-preset-expo already inlines all EXPO_PUBLIC_* vars automatically.
    plugins: ["react-native-reanimated/plugin"]
  };
};
