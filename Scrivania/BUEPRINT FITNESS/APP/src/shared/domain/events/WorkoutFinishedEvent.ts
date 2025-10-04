import { WorkoutLogModel } from '@/features/workout/domain';

import { IDomainEvent } from './IDomainEvent';

export class WorkoutFinishedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  constructor(public readonly log: WorkoutLogModel) {
    this.dateTimeOccurred = new Date();
  }
  getAggregateId(): string {
    return this.log.id;
  }
}
