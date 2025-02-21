import { aws_ec2 as ec2, aws_efs as efs, aws_secretsmanager as secretsManager } from 'aws-cdk-lib'

export interface IDbConnection {
  addDbConnection(connection: ec2.IConnectable, name?: string): void

  getDbHostname(): string
  getDbName(): string
  getDbConnectionString(): string
}

export interface IDbConnectionWithSecret extends IDbConnection {
  getDbSecret(): secretsManager.ISecret
}