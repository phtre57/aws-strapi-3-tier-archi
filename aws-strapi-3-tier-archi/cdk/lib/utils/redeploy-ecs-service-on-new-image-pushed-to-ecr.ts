import {
  Duration,
  Stack,
  StackProps,
  aws_ecr as awsEcr,
  aws_ecs as ecs,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  aws_lambda as lambda,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface RedeployEcsServiceOnNewImagePushedToEcrProps
  extends StackProps {
  ecr: awsEcr.IRepository;
  ecrTagName?: string;
  service: ecs.IBaseService;
}

export class RedeployEcsServiceOnNewImagePushedToEcr extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: RedeployEcsServiceOnNewImagePushedToEcrProps,
  ) {
    super(scope, id)
    const { ecr, service } = props

    const ecrTagName: string = props.ecrTagName ?? 'latest'

    // Rule on new image pushed to ecr
    const rule = new events.Rule(this, 'event-rule-new-image-pushed', {
      description: `New image pushed to ECR ${ecr.repositoryName} with tag ${ecrTagName}`,
      eventPattern: {
        source: ['aws.ecr'],
        detailType: ['ECR Image Action'],
        detail: {
          'action-type': ['PUSH'],
          'image-tag': [ecrTagName],
          'repository-name': [ecr.repositoryName],
          result: ['SUCCESS'],
        },
      },
    })

    // Create lambda who will call updateService on service with forceNewDeployment to relaunch task will the new image
    const updateServiceLambda = new lambda.Function(
      this,
      'lambda-event-newImagePushed',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const ecs = new AWS.ECS();
        exports.handler = async(event, _ctx) => {
          console.log(JSON.stringify(event));
          await ecs.updateService({
            cluster: '${service.cluster.clusterName}',
            service: '${service.serviceName}',
            forceNewDeployment: true
          }).promise()
        }
      `),
      },
    )

    // Add right to be able to call UpdateService on the service
    updateServiceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [
          `arn:aws:ecs:${Stack.of(this).region}:${
            Stack.of(this).account
          }:service/${props.service.cluster.clusterName}/${
            props.service.serviceName
          }`,
        ],
        actions: ['ecs:UpdateService'],
      }),
    )

    // Associate the rule with lambda
    rule.addTarget(new eventsTargets.LambdaFunction(updateServiceLambda))
  }
}
