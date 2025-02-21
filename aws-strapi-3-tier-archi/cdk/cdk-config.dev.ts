import { Config } from './cdk-config-definition'
import * as cdk from 'aws-cdk-lib';

export const devConfig: Config.IEnvConfig = {
  accountId: '392199159898',
  region: 'ca-central-1',
  db: {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    minAcu: 0,
    maxAcu: 2,
    autoPause: cdk.Duration.minutes(10),
    port: 5432,
  }
}
