module.exports = {
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/background/background.ts',
      preload: 'src/preload.ts',
      mainProcessWatch: ['src/background**/*.ts'],
    },
  },
};
