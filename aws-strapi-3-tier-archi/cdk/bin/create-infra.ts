#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { config } from '../cdk-config'
import { Config } from '../cdk-config-definition'
import { Network } from 'inspector/promises'
import { NetworkStack } from '~/lib/network'
import { enumFromStringValueOrThrow } from '~/lib/utils'
import { IBaseStackProps } from '~/lib/utils/base-stack-props'
import { DbStack } from '~/lib/data'

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

const dbStack = new DbStack(app, `${appName}-DbStack`, {
  ...props,
  ...envConfig.db,
  dbVpc: networkStack.databaseVpc,
  computeVpc: networkStack.computeVpc,
})