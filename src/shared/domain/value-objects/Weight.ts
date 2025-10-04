import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object representing weight with a value and a unit.
 */
export class Weight {
  constructor(
    public readonly value: number,
    public readonly unit: 'kg' | 'lbs'
  ) {
    if (value < 0) {
      throw new BusinessRuleError('errors.domain.weight.negative');
    }
    Object.freeze(this);
  }

  public equals(other: Weight): boolean {
    return this.value === other.value && this.unit === other.unit;
  }

  public toPlainObject(): { value: number; unit: 'kg' | 'lbs' } {
    return { value: this.value, unit: this.unit };
  }
}
