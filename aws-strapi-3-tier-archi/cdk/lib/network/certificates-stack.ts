import { aws_certificatemanager as certificateManager, aws_route53 as route53, Stack, aws_certificatemanager as acm } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Construct } from 'constructs'
import { IBaseStackProps, SsmExportedValue } from '../utils'

export interface CertificatesStackProps extends IBaseStackProps {
  domainName: string;
  hostedZoneDomainName: string;
}

export class CertificatesStack extends Stack {
  public readonly certificate: ICertificate

  public readonly certificateArns: { [domainName: string]: SsmExportedValue } = {}

  public readonly certificateUsEast1Arns: { [domainName: string]: SsmExportedValue } = {}

  constructor(scope: Construct, id: string, props: CertificatesStackProps) {
    super(scope, id, props)

    const { hostedZoneDomainName, domainName, region } = props

    const hostedZone = route53.HostedZone.fromLookup(this, 'hosted-zone', {
      domainName: hostedZoneDomainName,
    })

    this.certificate = new certificateManager.Certificate(
      this,
      'aws-strapi-archi-3-tier-certificate',
      {
        domainName,
        subjectAlternativeNames: [`*.${domainName}`],
        validation: certificateManager.CertificateValidation.fromDns(hostedZone),
      },
    )

    this.certificateArns[domainName] = new SsmExportedValue(
      this,
      `ssm-certificates-arn-${domainName}`,
      this.certificate.certificateArn,
    )

    if (region !== 'us-east-1') {
      const certificateUsEast1 = new acm.DnsValidatedCertificate(this, `certificate-${domainName}-us-east-1`, {
        domainName,
        hostedZone,
        region: 'us-east-1',
        subjectAlternativeNames: [`*.${domainName}`],
      })
      this.certificateUsEast1Arns[domainName] = new SsmExportedValue(
        this,
        `ssm-certificates-arn-${domainName}-us-east-1`,
        certificateUsEast1.certificateArn,
      )
    }
  }
}
