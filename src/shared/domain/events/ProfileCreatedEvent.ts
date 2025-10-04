import { ProfileModel } from '@/features/profile/domain';

import { IDomainEvent } from './IDomainEvent';

export class ProfileCreatedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  constructor(public readonly profile: ProfileModel) {
    this.dateTimeOccurred = new Date();
  }
  getAggregateId(): string {
    return this.profile.id;
  }
}
