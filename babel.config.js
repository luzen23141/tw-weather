module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          ...(isTest && { targets: { node: 'current' } }),
        },
      ],
      'nativewind/babel',
    ],
  };
};
