module.exports = function (api) {
  api.cache(true);

  return {
    presets: [require.resolve('babel-preset-expo')],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
