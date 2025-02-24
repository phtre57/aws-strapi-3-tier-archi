import { aws_route53 as route53, aws_route53_targets as route53Targets, Stack } from 'aws-cdk-lib'
import { IApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs'
import { IBaseStackProps } from '../utils';

export interface Route53StackProps extends IBaseStackProps {
  applicationName: string;
  hostedZoneDomainName: string;
  loadBalancer: IApplicationLoadBalancer;
}

export class Route53Stack extends Stack {
  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props)

    const { loadBalancer, hostedZoneDomainName, applicationName } = props!

    const hostedZone = route53.HostedZone.fromLookup(this, 'hosted-zone', {
      domainName: hostedZoneDomainName,
    })

    new route53.ARecord(this, 'a-dns-record', {
      recordName: `strapi.${applicationName}`,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(loadBalancer),
      ),
    })
  }
}
