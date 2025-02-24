import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_rds as rds, aws_ec2 as ec2, aws_secretsmanager as secretsManager } from 'aws-cdk-lib';
import { IBaseStackProps } from '../utils/base-stack-props';
import { IDbConnectionWithSecret, SsmExportedValue } from '../utils';

export type DbStackProps = IBaseStackProps & {
  // vpc: ec2.IVpc
  vpcId: SsmExportedValue
  removalPolicy: cdk.RemovalPolicy
  minAcu: number
  maxAcu: number
  autoPause: cdk.Duration
  port: number
}

export class DbStack extends cdk.Stack implements IDbConnectionWithSecret {
  public readonly securityGroup: ec2.SecurityGroup
  private readonly cluster: rds.DatabaseCluster
  private readonly port: number
  private readonly dbName = 'StrapiDB'

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    const { autoPause, removalPolicy, minAcu, maxAcu, port } = props

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: props.vpcId.getValue(this),
    })

    this.port = port

    this.securityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
    })
    this.securityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(port), 'Allow inbound traffic from VPC')

    // Create the Aurora Serverless cluster
    this.cluster = new rds.DatabaseCluster(this, 'AuroraServerlessCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_6 }),
      vpc,
      serverlessV2MinCapacity: minAcu,
      serverlessV2MaxCapacity: maxAcu,
      defaultDatabaseName: this.dbName,
      removalPolicy: removalPolicy,
      port: port,
      securityGroups: [this.securityGroup],
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }),
      writer: rds.ClusterInstance.serverlessV2(`${this.dbName}-Writer`),
    });

    // Output the cluster endpoint
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.socketAddress,
    });
  }

  addDbConnection(connection: ec2.IConnectable, name?: string | undefined): void {
    const description = name ? `Allow PostgreSQL access from ${name}` : 'Allow PostgreSQL access'
    connection.connections.allowTo(this.securityGroup, ec2.Port.tcp(this.port), description)
  }

  getDbHostname(): string {
    return this.cluster.clusterEndpoint.hostname
  }

  getDbName(): string {
    return this.dbName
  }

  getDbSecret(): secretsManager.ISecret {
    if (!this.cluster.secret) {
      throw new Error('No secret found for the database cluster')
    }

    return this.cluster.secret
  }

  getDbConnectionString(): string {
    return `jdbc:postgresql://${this.getDbHostname()}:${this.port}`
  }
}