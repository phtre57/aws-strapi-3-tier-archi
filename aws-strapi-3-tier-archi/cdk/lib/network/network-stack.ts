import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IBaseStackProps } from '../utils/base-stack-props';

export class NetworkStack extends cdk.Stack {
  public vpc: ec2.IVpc

  constructor(scope: Construct, id: string, props: IBaseStackProps) {
    super(scope, id, props);

    // Create the compute VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC Endpoint for S3 to the compute VPC
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });


    // Add Bastion Host to Compute VPC
    this.createBastionHost(this, 'compute', this.vpc, ec2.SubnetType.PUBLIC);
  }

  private createBastionHost(scope: Construct, name: string, vpc: ec2.IVpc, subnetType: ec2.SubnetType): ec2.BastionHostLinux {
    // Add Bastion Host to Compute VPC
    // Create a security group for the bastion hosts
    const bastionSecurityGroup = new ec2.SecurityGroup(this, `${name}-BastionSecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Security group for bastion hosts',
    });

    // Add additional ingress rules
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allIcmp());

    return new ec2.BastionHostLinux(scope, `${name}-BastionHost`, {
      instanceName: `${name}-BastionHost`,
      vpc: vpc,
      instanceType: new ec2.InstanceType('t4g.nano'),
      subnetSelection: vpc.selectSubnets({ subnetType: subnetType }),
      securityGroup: bastionSecurityGroup,
    });
  }
}