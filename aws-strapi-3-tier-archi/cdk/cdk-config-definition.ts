/* eslint-disable @typescript-eslint/no-namespace */

export namespace Config {
  export enum EnvName {
    DEV = 'dev',
  }

  export interface IEnvConfig {
    accountId: string
    region: string
  }

  export interface ICdkConfig {
    env: Record<EnvName, IEnvConfig>
  }
}
