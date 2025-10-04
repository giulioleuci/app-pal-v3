import { IDomainEvent } from './IDomainEvent';

export class DataImportCompletedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  constructor(public readonly profileId: string) {
    this.dateTimeOccurred = new Date();
  }
  getAggregateId(): string {
    return this.profileId;
  }
}
