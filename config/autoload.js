module.exports = function (compound) {
  var defaultModules = [
      'co-assets-compiler'
    ], developmentModules = [];

  if ('development' === compound.app.get('env')) {
    developmentModules = [
      'ejs-ext',
      'seedjs',
      'co-generators'
    ]
  }

  if (typeof window === 'undefined') {
    return defaultModules.concat(developmentModules).map(require);
  } else {
    return []
  }
};

