import { MaxLogModel } from '@/features/max-log/domain';

import { IDomainEvent } from './IDomainEvent';

export class NewPersonalRecordEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  constructor(public readonly maxLog: MaxLogModel) {
    this.dateTimeOccurred = new Date();
  }
  getAggregateId(): string {
    return this.maxLog.id;
  }
}
