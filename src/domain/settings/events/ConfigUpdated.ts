import { BaseDomainEvent } from '@domain/shared';

export interface ConfigUpdatedPayload {
  configId: string;
  field: string;
  hasValue?: boolean;
}

export class ConfigUpdated extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'ConfigUpdated';

  constructor(public readonly payload: ConfigUpdatedPayload) {
    super(ConfigUpdated.EVENT_TYPE, payload.configId);
  }

  get configId(): string {
    return this.payload.configId;
  }

  get field(): string {
    return this.payload.field;
  }
}
