/* eslint-disable */
module.exports = {
  branches: [
    'main',
    {
      name: 'next',
      prerelease: true
    },
    {
      name: 'next-major',
      prerelease: true
    }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/changelog',
    '@semantic-release/git',
    '@semantic-release/github',
    [
      'semantic-release-slack-bot',
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        markdownReleaseNotes: true,
        packageName: require('./package.json').name
      }
    ]
  ]
}
