export interface OperatorLink
  extends Readonly<{
    linkID: string;
    source: OperatorPort;
    target: OperatorPort;
  }> {
}

export interface OperatorPort
  extends Readonly<{
    operatorID: string;
    portID: string;
  }> {
}
