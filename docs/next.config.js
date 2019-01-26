const { join } = require('path');
const { copySync, removeSync } = require('fs-extra');
const withMDX = require('@zeit/next-mdx')({
  extension: /\.(md|mdx)$/,
});

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${require('./package.json').version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
  webpack: config => {
    config.module.rules.push({
      test: /.mdx?$/,
      use: [join(__dirname, './common/fm-loader')],
    });
    return config;
  },
  async exportPathMap(defaultPathMap, { dev, dir, outDir }) {
    if (dev) {
      return defaultPathMap;
    }
    copySync(join(dir, 'robots.txt'), join(outDir, 'robots.txt'));
    return Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/\/v[1-9][^\/]*$/)) {
          // ends in "/v<version>"
          pathname += '/index.html'; // TODO: find out why we need to do this
        }

        if (pathname.match(/unversioned/)) {
          return {};
        } else {
          return { [pathname]: page };
        }
      })
    );
  },
});
