import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as tgw from 'aws-cdk-lib/aws-ec2';
import { SsmExportedValue } from '../utils';
import { IBaseStackProps } from '../utils/base-stack-props';

export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IBaseStackProps) {
    super(scope, id, props);

    // Create the compute VPC
    const computeVpc = new ec2.Vpc(this, 'ComputeVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    new SsmExportedValue(this, 'ComputeVpcId', computeVpc.vpcId);

    // Create the database VPC
    const databaseVpc = new ec2.Vpc(this, 'DatabaseVpc', {
      cidr: '10.1.0.0/16',
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    new SsmExportedValue(this, 'DatabaseVpcId', databaseVpc.vpcId);

    // Create the Transit Gateway
    const transitGateway = new tgw.CfnTransitGateway(this, 'TransitGateway');

    // Attach the compute VPC to the Transit Gateway
    new tgw.CfnTransitGatewayAttachment(this, 'ComputeVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: computeVpc.vpcId,
      subnetIds: computeVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
    });

    // Attach the database VPC to the Transit Gateway
    new tgw.CfnTransitGatewayAttachment(this, 'DatabaseVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: databaseVpc.vpcId,
      subnetIds: databaseVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
    });

    // Add VPC Endpoint for S3 to the compute VPC
    computeVpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Add Bastion Host to Compute VPC
    // Create a security group for the bastion hosts
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: computeVpc,
      allowAllOutbound: true,
      description: 'Security group for bastion hosts',
    });

    // Allow SSH access from anywhere
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access from anywhere');

    // Add additional ingress rules
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.tcp(80));
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('172.16.0.0/12'), ec2.Port.tcp(80));
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('192.168.0.0/16'), ec2.Port.tcp(80));
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.allIcmp());
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('172.16.0.0/12'), ec2.Port.allIcmp());
    bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4('192.168.0.0/16'), ec2.Port.allIcmp());

    // Add Bastion Host to Compute VPC
    const computeBastion = new ec2.BastionHostLinux(this, 'ComputeBastionHost', {
      vpc: computeVpc,
      instanceType: new ec2.InstanceType('t4g.nano'),
      subnetSelection: computeVpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
      securityGroup: bastionSecurityGroup,
    });
    cdk.Tags.of(computeBastion).add('Service', 'bastion');

    // Add Bastion Host to Database VPC
    const databaseBastion = new ec2.BastionHostLinux(this, 'DatabaseBastionHost', {
      vpc: databaseVpc,
      instanceType: new ec2.InstanceType('t4g.nano'),
      subnetSelection: databaseVpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
      securityGroup: bastionSecurityGroup,
    });
    cdk.Tags.of(databaseBastion).add('Service', 'bastion');
  }
}