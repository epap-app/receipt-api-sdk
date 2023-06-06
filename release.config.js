/* eslint-disable */
module.exports = {
  branches: [
    "main",
    {
      name: "next",
      prerelease: true,
    },
    {
      name: "next-major",
      prerelease: true,
    },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          {
            type: "chore",
            release: "patch",
          },
          {
            type: "revert",
            release: "patch",
          },
          {
            type: "feat",
            release: "minor",
          },
          {
            type: "fix",
            release: "patch",
          },
          {
            type: "docs",
            release: false,
          },
          {
            type: "style",
            release: "patch",
          },
          {
            type: "refactor",
            release: "patch",
          },
          {
            type: "perf",
            release: "patch",
          },
          {
            type: "build",
            release: "patch",
          },
          {
            type: "ci",
            release: "patch",
          },
          {
            type: "test",
            release: false,
          },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            {
              type: "chore",
              section: "Miscellaneous Chores",
              hidden: false,
            },
            {
              type: "revert",
              section: "Reverts",
              hidden: false,
            },
            {
              type: "feat",
              section: "Features",
              hidden: false,
            },
            {
              type: "fix",
              section: "Bug Fixes",
              hidden: false,
            },
            {
              type: "docs",
              section: "Documentation",
              hidden: false,
            },
            {
              type: "style",
              section: "Styles",
              hidden: false,
            },
            {
              type: "refactor",
              section: "Code Refactoring",
              hidden: false,
            },
            {
              type: "perf",
              section: "Performance Improvements",
              hidden: false,
            },
            {
              type: "test",
              section: "Tests",
              hidden: false,
            },
            {
              type: "build",
              section: "Build System",
              hidden: false,
            },
            {
              type: "ci",
              section: "Continuous Integration",
              hidden: false,
            },
          ],
        },
      },
    ],
    "@semantic-release/npm",
    "@semantic-release/changelog",
    "@semantic-release/git",
    "@semantic-release/github",
    [
      "semantic-release-slack-bot",
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        markdownReleaseNotes: true,
        packageName: require("./package.json").name,
      },
    ],
  ],
};
