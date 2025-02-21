import { aws_ssm as ssm } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class SsmExportedValue extends Construct {
  private readonly parameterName: string

  constructor(scope: Construct, id: string, value: string, parameterNameOverride?: string) {
    super(scope, id)

    this.parameterName = `/cdk/${parameterNameOverride ? parameterNameOverride : this.node.addr}`

    new ssm.StringParameter(this, 'Parameter', {
      parameterName: this.parameterName,
      stringValue: value,
    })
  }

  public getValue(scope: Construct): string {
    scope.node.addDependency(this) // Force stacks dependency as no `Fn::ImportValue` will be generated
    return ssm.StringParameter.valueForStringParameter(scope, this.parameterName)
  }
}
