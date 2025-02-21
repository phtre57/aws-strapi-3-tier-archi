import { Config } from './cdk-config-definition'
import { prodConfig } from './cdk-config.prod'
import { devConfig } from './cdk-config.dev'

export const config: Config.ICdkConfig = {
  global: {
    eventBusName: 'unicorne-monitoring-event-bus',
    jsmBaseUrl: 'https://unicornecloud.atlassian.net/',
  },
  env: {
    prod: prodConfig,
    dev: devConfig,
  },
}
