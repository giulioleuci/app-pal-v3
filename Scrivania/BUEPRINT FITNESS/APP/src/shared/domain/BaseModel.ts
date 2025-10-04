/**
 * An abstract base class for all domain models in the application.
 * It provides common properties like id, createdAt, and updatedAt,
 * and enforces a contract for serialization and validation.
 * @template T The plain data object type that corresponds to the model.
 */
export abstract class BaseModel<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  protected constructor(props: T) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Converts the rich domain model back into a plain, serializable object. */
  abstract toPlainObject(): T;

  /** Validates the model's data against its corresponding Zod schema. */
  abstract validate(): { success: boolean; errors?: unknown };

  /** Creates a deep, structurally-shared clone of the model instance. */
  public abstract clone(): this;

  /** Compares this model with another for equality based on their unique IDs. */
  public equals(other: BaseModel<unknown> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this.id === other.id;
  }
}
