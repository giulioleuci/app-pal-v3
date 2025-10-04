/**
 * A class that represents the result of an operation that can either
 * succeed with a value of type T or fail with an error of type E.
 * This promotes a functional approach to error handling between the
 * Application and Query Service layers.
 */
export class Result<T, E> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: E;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this.error = error;
    Object.freeze(this);
  }

  /**
   * Gets the success value as a property. Throws an error if the result is a failure.
   * @returns The success value of type T.
   */
  public get value(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get the value of a failed result.');
    }
    return this._value!;
  }

  /**
   * Gets the success value. Throws an error if the result is a failure.
   * @returns The success value of type T.
   */
  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get the value of a failed result.');
    }
    return this._value!;
  }

  /**
   * Creates a success result.
   * @param value The success value.
   */
  public static success<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Creates a failure result.
   * @param error The error value.
   */
  public static failure<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }
}
