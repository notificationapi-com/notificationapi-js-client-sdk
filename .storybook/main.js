module.exports = {
  stories: [
    '../src/stories/*.stories.mdx',
    '../src/stories/*.stories.@(js|jsx|ts|tsx)'
  ],
  features: {
    postcss: false
  },
  core: {
    builder: 'webpack5'
  }
};
