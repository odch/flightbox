module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/testSetup.js'],
  moduleDirectories: ['node_modules', 'functions/node_modules'],
  coverageDirectory: './coverage/',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'functions/**/*.{js,jsx}',
    '!<rootDir>/node_modules/',
    '!<rootDir>/test/'
  ],
  moduleNameMapper: {
    '^csv-stringify/browser/esm$': 'csv-stringify',
    '^csv-parse/browser/esm/sync$': 'csv-parse/sync'
  },
  globals: {
    __DISABLE_IP_AUTHENTICATION__: false,
    __LANDING_FEES_STRATEGY__: 'default',
    __LANDING_FEES__: {
      instruction: {
        club: [
          {
            mtowMin: 0,
            mtowMax: 750,
            fee: 11
          },
          {
            mtowMin: 751,
            fee: 15
          }
        ],
        default: [
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 0,
            mtowMax: 750,
            fee: 16
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 751,
            mtowMax: 1499,
            fee: 20
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 1500,
            fee: 50
          }
        ]
      },
      default: {
        default: [
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 0,
            mtowMax: 750,
            fee: 16
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 751,
            mtowMax: 1499,
            fee: 20
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 1500,
            fee: 50
          }
        ]
      }
    },
    __GO_AROUND_FEES__: {
      instruction: {
        club: [
          {
            mtowMin: 0,
            mtowMax: 750,
            fee: 11
          },
          {
            mtowMin: 751,
            fee: 15
          }
        ],
        default: [
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 0,
            mtowMax: 750,
            fee: 16
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 751,
            mtowMax: 1499,
            fee: 20
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 1500,
            fee: 50
          }
        ]
      },
      default: {
        default: [
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 0,
            mtowMax: 750,
            fee: 16
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 751,
            mtowMax: 1499,
            fee: 20
          },
          {
            billingProduct: 'prod_Pn8NbuL38Z8D4n',
            mtowMin: 1500,
            fee: 50
          }
        ]
      }
    }
  }
};
