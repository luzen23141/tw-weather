module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          ...(isTest && { targets: { node: 'current' } }),
        },
      ],
    ],
    plugins: [
      'babel-plugin-transform-import-meta',
      ['babel-plugin-transform-define', { 'import.meta.env': 'process.env', 'import.meta': {} }],
    ],
  };
};
