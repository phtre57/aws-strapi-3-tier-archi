/* eslint-disable @typescript-eslint/no-namespace */
import * as cdk from 'aws-cdk-lib';

export namespace Config {
  export enum EnvName {
    DEV = 'dev',
  }

  export interface IEnvConfig {
    accountId: string
    region: string
    db: {
      removalPolicy: cdk.RemovalPolicy
      minAcu: number
      maxAcu: number
      autoPause: cdk.Duration
      port: number
    }
  }

  export interface ICdkConfig {
    env: Record<EnvName, IEnvConfig>
  }
}
