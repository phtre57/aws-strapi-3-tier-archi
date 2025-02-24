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
    ecs: {
      image: {
        tag: string
      },
      ips: {
        admins: string[]
      }
    }
    s3: {
      removalPolicy: cdk.RemovalPolicy
    }
    ecr: {
      name: string
      removalPolicy: cdk.RemovalPolicy
    }
    domain: {
      name: string,
      sub: string,
    }
  }

  export interface ICdkConfig {
    env: Record<EnvName, IEnvConfig>
  }
}
