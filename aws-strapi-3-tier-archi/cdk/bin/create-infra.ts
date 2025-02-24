#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { config } from '../cdk-config'
import { Config } from '../cdk-config-definition'
import { CertificatesStack, NetworkStack, Route53Stack } from '~/lib/network'
import { enumFromStringValueOrThrow } from '~/lib/utils'
import { IBaseStackProps } from '~/lib/utils/base-stack-props'
import { DbStack, EcrStack, S3Stack } from '~/lib/data'
import { ECSStack } from '~/lib/compute'

const appName = 'Strapi3Tier'

const app = new cdk.App()
const rawEnvName = app.node.tryGetContext('envName')
if (!rawEnvName) {
  throw new Error('Error, you have to add context: envName')
}

const envName = enumFromStringValueOrThrow(Config.EnvName, rawEnvName)

const envConfig = config.env[envName]

const region: string = envConfig.region
const accountId: string = envConfig.accountId

const props: IBaseStackProps = {
  env: {
    account: accountId,
    region: region,
  },
  envName: envName,
  region: region,
  envConfig: envConfig,
}

const networkStack = new NetworkStack(app, `${appName}-NetworkStack`, {...props})

const certificatesStack = new CertificatesStack(app, `${appName}-CertificatesStack`, {
  ...props,
  domainName: `${envConfig.domain.sub}.${envConfig.domain.name}`,
  hostedZoneDomainName: envConfig.domain.name,
})

const ecrStack = new EcrStack(app, `${appName}-EcrStack`, {
  ...props,
  ecr: envConfig.ecr,
})

const s3Stack = new S3Stack(app, `${appName}-S3Stack`, {
  ...props,
  s3: envConfig.s3,
})

const dbStack = new DbStack(app, `${appName}-DbStack`, {
  ...props,
  ...envConfig.db,
  vpcId: networkStack.vpcId,
})

const ecsStack = new ECSStack(app, `${appName}-EcsStack`, {
  ...props,
  vpcId: networkStack.vpcId,
  serviceName: 'AwsStrapi3TierArchitecture',
  dbSecurityGroup: dbStack.securityGroup,
  dbSecret: dbStack.getDbSecret(),
  ecs: envConfig.ecs,
  db: envConfig.db,
  imageAssetsBucket: s3Stack.strapiImagesBucket,
  ecr: ecrStack.ecr,
  authorizedIPsForAdminAccess: envConfig.ecs.ips.admins,
  certificate: certificatesStack.certificate,
})

dbStack.addDbConnection(ecsStack.connectable, 'ECS Service')

new Route53Stack(app, `${appName}-Route53Stack`, {
  ...props,
  applicationName: envConfig.domain.sub,
  hostedZoneDomainName: envConfig.domain.name,
  loadBalancer: ecsStack.loadBalancer,
})