import { Config } from './cdk-config-definition'
import * as cdk from 'aws-cdk-lib';

export const devConfig: Config.IEnvConfig = {
  accountId: '392199159898',
  region: 'ca-central-1',
  db: {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    minAcu: 0,
    maxAcu: 256,
    autoPause: cdk.Duration.minutes(10),
    port: 5432,
  },
  ecs: {
    image: {
      tag: 'latest',
    },
    ips: {
      admins: ['70.53.199.236']
    }
  },
  s3: {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  },
  ecr: {
    name: 'aws-strapi-3-tier-archi-dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
}
