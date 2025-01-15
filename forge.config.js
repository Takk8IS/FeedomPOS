const { FusesPlugin } = require('@electron-forge/plugin-fuses')
const { FuseV1Options, FuseVersion } = require('@electron/fuses')
const path = require('path')

module.exports = {
  packagerConfig: {
    asar: {
      // Enable asar archive with additional options
      unpack: '*.{node,dll}',
      smartUnpack: true,
    },
    icon: path.join(__dirname, 'assets', 'icon'),
    appBundleId: 'com.freedompos.app',
    appCategoryType: 'public.app-category.business',
    win32metadata: {
      CompanyName: 'FreedomPOS',
      FileDescription: 'Modern Point of Sale System',
      OriginalFilename: 'FreedomPOS.exe',
      ProductName: 'FreedomPOS',
      InternalName: 'FreedomPOS',
    },
    osxSign: {
      identity: 'Developer ID Application: FreedomPOS (XXXXXXXXXX)',
      'hardened-runtime': true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library',
    },
    protocols: [
      {
        name: 'FreedomPOS Protocol',
        schemes: ['freedompos'],
      },
    ],
  },
  rebuildConfig: {
    onlyModules: ['better-sqlite3', 'serialport'],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'FreedomPOS',
        authors: 'FreedomPOS Team',
        setupIcon: path.join(__dirname, 'assets', 'icon.ico'),
        loadingGif: path.join(__dirname, 'assets', 'installer.gif'),
        certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'FreedomPOS Team',
          homepage: 'https://freedompos.com',
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Office', 'Finance'],
          depends: ['libsqlite3-0'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'FreedomPOS Team',
          homepage: 'https://freedompos.com',
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Office', 'Finance'],
          requires: ['sqlite'],
        },
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: path.join(__dirname, 'assets', 'icon.icns'),
        background: path.join(__dirname, 'assets', 'dmg-background.png'),
        contents: [
          {
            x: 448,
            y: 344,
            type: 'link',
            path: '/Applications',
          },
          {
            x: 192,
            y: 344,
            type: 'file',
            path: path.join(__dirname, 'out', 'FreedomPOS-darwin-x64', 'FreedomPOS.app'),
          },
        ],
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.EnableSourceMapsInProductionBinaries]: false,
    }),
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.ts',
              name: 'main_window',
              preload: {
                js: './src/preload.ts',
              },
            },
          ],
        },
        port: 3000,
        loggerPort: 9000,
        devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`,
        devServer: {
          liveReload: true,
          hot: true,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
      },
    },
    {
      name: '@electron-forge/plugin-electronegativity',
      config: {
        isSarif: true,
        output: './security-report.sarif',
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'freedompos',
          name: 'freedompos',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
}
