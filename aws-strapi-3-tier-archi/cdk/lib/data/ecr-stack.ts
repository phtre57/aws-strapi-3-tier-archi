import { Duration, RemovalPolicy, Stack, aws_ecr as ecr } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IBaseStackProps } from '../utils';

export interface EcrStackStackProps extends IBaseStackProps {
  ecr: {
    removalPolicy: RemovalPolicy,
    name: string
  }
}

export class EcrStack extends Stack {
  public readonly ecr: ecr.IRepository

  constructor(scope: Construct, id: string, props: EcrStackStackProps) {
    super(scope, id, props)

    const { ecr: { name, removalPolicy } } = props

    this.ecr = new ecr.Repository(this, `${name}`, {
      repositoryName: `${name}`,
      removalPolicy: removalPolicy,
      lifecycleRules: [
        {
          description: 'Untagged images older than 14 days',
          tagStatus: ecr.TagStatus.UNTAGGED,
          maxImageAge: Duration.days(14),
        },
      ],
    })
  }
}
