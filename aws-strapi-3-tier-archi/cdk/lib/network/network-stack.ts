import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as tgw from 'aws-cdk-lib/aws-ec2';
import { IBaseStackProps } from '../utils/base-stack-props';

export class NetworkStack extends cdk.Stack {
  public computeVpc: ec2.IVpc
  public databaseVpc: ec2.IVpc

  constructor(scope: Construct, id: string, props: IBaseStackProps) {
    super(scope, id, props);

    // Create the compute VPC
    this.computeVpc = new ec2.Vpc(this, 'ComputeVpc', {
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
    // Create the database VPC
    this.databaseVpc = new ec2.Vpc(this, 'DatabaseVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/24'),
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

    // Create the Transit Gateway
    const transitGateway = new tgw.CfnTransitGateway(this, 'TransitGateway');

    // Attach the compute VPC to the Transit Gateway
    const computeTgwAttachment = new tgw.CfnTransitGatewayAttachment(this, 'ComputeVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: this.computeVpc.vpcId,
      subnetIds: this.computeVpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    // Attach the database VPC to the Transit Gateway
    const dbTgwAttachment = new tgw.CfnTransitGatewayAttachment(this, 'DatabaseVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: this.databaseVpc.vpcId,
      subnetIds: this.databaseVpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    this.computeVpc.publicSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `ComputeVpcRoute-${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: this.databaseVpc.vpcCidrBlock,
          transitGatewayId: transitGateway.ref
      }).node.addDependency(computeTgwAttachment);
    })

    this.databaseVpc.publicSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `DbVpcRoute-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: this.computeVpc.vpcCidrBlock,
        transitGatewayId: transitGateway.ref
    }).node.addDependency(dbTgwAttachment);
  })

    // Add VPC Endpoint for S3 to the compute VPC
    this.computeVpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });


    // Add Bastion Host to Compute VPC
    this.createBastionHost(this, 'compute', this.computeVpc, ec2.SubnetType.PUBLIC);
    this.createBastionHost(this, 'db', this.databaseVpc, ec2.SubnetType.PUBLIC);
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