import { Config } from './cdk-config-definition'
import { devConfig } from './cdk-config.dev'

export const config: Config.ICdkConfig = {
  env: {
    dev: devConfig,
  },
}
