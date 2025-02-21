#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Lumigo } from '@lumigo/cdk-constructs-v2'
import { config } from '../cdk-config'
import { Config } from '../cdk-config-definition'

const app = new cdk.App()
const rawEnvName = app.node.tryGetContext('envName')
if (!rawEnvName) {
  throw new Error('Error, you have to add context: envName')
}
