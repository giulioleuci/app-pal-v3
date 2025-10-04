import { AnySetConfigurationData } from '@/shared/types';

import { DropSetConfiguration } from './sets/DropSetConfiguration';
import { MavSetConfiguration } from './sets/MavSetConfiguration';
import { MyoRepsSetConfiguration } from './sets/MyoRepsSetConfiguration';
import { PyramidalSetConfiguration } from './sets/PyramidalSetConfiguration';
import { RestPauseSetConfiguration } from './sets/RestPauseSetConfiguration';
import { SetConfiguration } from './sets/SetConfiguration';
import { StandardSetConfiguration } from './sets/StandardSetConfiguration';

/**
 * Factory class for creating SetConfiguration instances.
 * Placed outside the sets directory to avoid circular dependencies.
 */
export class SetConfigurationFactory {
  /**
   * Creates the appropriate SetConfiguration subclass based on the data type.
   *
   * @param data The plain data object for the set configuration.
   * @returns An instance of a concrete SetConfiguration subclass.
   * @throws Error if the set configuration type is unknown.
   */
  public static create(data: AnySetConfigurationData): SetConfiguration {
    switch (data.type) {
      case 'standard':
        return new StandardSetConfiguration(data);
      case 'drop':
        return new DropSetConfiguration(data);
      case 'myoReps':
        return new MyoRepsSetConfiguration(data);
      case 'pyramidal':
        return new PyramidalSetConfiguration(data);
      case 'restPause':
        return new RestPauseSetConfiguration(data);
      case 'mav':
        return new MavSetConfiguration(data);
      default:
        throw new Error(`Unknown set configuration type: ${(data as any).type}`);
    }
  }
}
