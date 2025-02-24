import { aws_ecr as awsEcr, aws_logs as logs, aws_ec2 as ec2, Stack } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2'
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  CpuArchitecture,
  Secret as ecsSecret,
  FargateTaskDefinition,
  OperatingSystemFamily,
} from 'aws-cdk-lib/aws-ecs'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import {
  IApplicationLoadBalancer,
  ListenerAction,
  ListenerCondition,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { IBaseStackProps } from '../utils'
import { RedeployEcsServiceOnNewImagePushedToEcr } from '../utils/redeploy-ecs-service-on-new-image-pushed-to-ecr'
import { IBucket } from 'aws-cdk-lib/aws-s3'

export interface ECSStackProps extends IBaseStackProps {
  serviceName: string;
  authorizedIPsForAdminAccess: string[];
  certificate: ICertificate;
  dbSecurityGroup: ISecurityGroup;
  dbSecret: ISecret;
  ecr: awsEcr.IRepository;
  vpc: IVpc;
  ecs: {
    image: {
      tag: string;
    }
  }
  db: {
    port: number
  }
  imageAssetsBucket: IBucket
}

export class ECSStack extends Stack {
  public readonly STRAPI_HOST: string = '0.0.0.0'
  public readonly STRAPI_PORT: number = 1337

  public readonly loadBalancer: IApplicationLoadBalancer

  public readonly connectable: ec2.IConnectable

  constructor(scope: Construct, id: string, props: ECSStackProps) {
    super(scope, id, props)

    const {
      authorizedIPsForAdminAccess,
      vpc,
      dbSecret,
      dbSecurityGroup,
      certificate,
      serviceName,
      ecr,
      ecs,
      db,
      imageAssetsBucket,
    } = props

    const strapiSecret = new Secret(this, 'StrapiSecret', {
      secretName: `${serviceName}-strapi-secret`,

      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'StrapiKey',
        excludePunctuation: true,
      },
    })

    const cluster = new Cluster(this, 'Cluster', { vpc })

    const task = new FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.ARM64,
      },
    })
    const logDriver = new AwsLogDriver({
      streamPrefix: '3tierarchi-strapi',
      logRetention: logs.RetentionDays.TWO_YEARS,
    })
    task.addContainer('StrapiContainer', {
      logging: logDriver,
      secrets: {
        DATABASE_USERNAME: ecsSecret.fromSecretsManager(dbSecret, 'username'),
        DATABASE_PASSWORD: ecsSecret.fromSecretsManager(dbSecret, 'password'),
        JWT_SECRET: ecsSecret.fromSecretsManager(strapiSecret, 'StrapiKey'),
        APP_KEYS: ecsSecret.fromSecretsManager(strapiSecret, 'StrapiKey'),
        API_TOKEN_SALT: ecsSecret.fromSecretsManager(strapiSecret, 'StrapiKey'),
        ADMIN_JWT_SECRET: ecsSecret.fromSecretsManager(
          strapiSecret,
          'StrapiKey',
        ),
        DATABASE_CLIENT: ecsSecret.fromSecretsManager(dbSecret, 'engine'),
        DATABASE_HOST: ecsSecret.fromSecretsManager(dbSecret, 'host'),
        DATABASE_PORT: ecsSecret.fromSecretsManager(dbSecret, 'port'),
        DATABASE_NAME: ecsSecret.fromSecretsManager(dbSecret, 'dbname'),
      },
      image: ContainerImage.fromEcrRepository(ecr, ecs.image.tag),
      portMappings: [{containerPort: this.STRAPI_PORT}],
      environment: {
        HOST: this.STRAPI_HOST,
        PORT: `${this.STRAPI_PORT}`,
        AWS_BUCKET: imageAssetsBucket.bucketName,
        AWS_REGION: this.region,
      },
    })

    const loadBalancedService = new ApplicationLoadBalancedFargateService(
      this,
      'StrapiFargateService',
      {
        assignPublicIp: true,
        cluster,
        taskDefinition: task,
        certificate,
      },
    )
    imageAssetsBucket.grantReadWrite(loadBalancedService.taskDefinition.taskRole)

    this.connectable = loadBalancedService.service

    // loadBalancedService.service.connections.allowTo(dbSecurityGroup, ec2.Port.tcp(db.port))

    this.restrictAccessToAdmin(loadBalancedService, authorizedIPsForAdminAccess)

    this.loadBalancer = loadBalancedService.loadBalancer

    new RedeployEcsServiceOnNewImagePushedToEcr(this, `auto-deploy-new-image-${serviceName}`, {
      ecr: ecr,
      ecrTagName: ecs.image.tag,
      service: loadBalancedService.service,
    })
  }

  private restrictAccessToAdmin(
    loadBalancedService: ApplicationLoadBalancedFargateService,
    authorizedIPsForAdminAccess: string[],
  ) {
    const conditions: ListenerCondition[] = [ListenerCondition.pathPatterns(['/admin/*'])]
    if (authorizedIPsForAdminAccess.length > 0) {
      conditions.push(ListenerCondition.sourceIps(authorizedIPsForAdminAccess))
    }

    loadBalancedService.listener.addAction('/accept', {
      priority: 10,
      conditions,
      action: ListenerAction.forward([loadBalancedService.targetGroup]),
    })

    loadBalancedService.listener.addAction('/forbidden', {
      priority: 20,
      conditions: [ListenerCondition.pathPatterns(['/admin/*'])],
      action: ListenerAction.fixedResponse(403, {
        contentType: 'text/html',
        messageBody: 'Not authorized',
      }),
    })
  }
}
