import * as cdk from 'aws-cdk-lib'
import { Config } from '../../cdk-config-definition'

export interface IBaseStackProps extends cdk.StackProps {
  readonly env?: cdk.Environment
  readonly envName: Config.EnvName
  readonly region: string
  readonly envConfig: Config.IEnvConfig
}
