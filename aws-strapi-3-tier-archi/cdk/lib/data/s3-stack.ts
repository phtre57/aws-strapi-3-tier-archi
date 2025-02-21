import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { IBaseStackProps } from '../utils';

export type S3StackProps = IBaseStackProps & {
  s3: {
    removalPolicy: cdk.RemovalPolicy
  }
};

export class S3Stack extends cdk.Stack {
  public readonly strapiImagesBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const { s3: { removalPolicy } } = props

    this.strapiImagesBucket = new s3.Bucket(this, 'StrapiImagesBucket', {
      versioned: false,
      removalPolicy: removalPolicy,
    });
  }
}