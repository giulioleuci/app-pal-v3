import { AnySetConfigurationData } from '@/shared/types';

import { DropSetConfiguration } from './sets/DropSetConfiguration';
import { MavSetConfiguration } from './sets/MavSetConfiguration';
import { MyoRepsSetConfiguration } from './sets/MyoRepsSetConfiguration';
import { PyramidalSetConfiguration } from './sets/PyramidalSetConfiguration';
import { RestPauseSetConfiguration } from './sets/RestPauseSetConfiguration';
import { SetConfiguration } from './sets/SetConfiguration';
import { StandardSetConfiguration } from './sets/StandardSetConfiguration';

/**
 * Standalone factory function to create SetConfiguration instances.
 * This avoids circular dependency issues that occur when the factory is a static method.
 *
 * @param data The plain data object for the set configuration, can be a string (JSON) or object.
 * @returns An instance of a concrete SetConfiguration subclass.
 * @throws Error if the set configuration type is unknown.
 */
export function hydrateSetConfiguration(data: AnySetConfigurationData | string): SetConfiguration {
  // Parse JSON string if needed
  let parsedData: AnySetConfigurationData;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Invalid JSON in setConfiguration: ${data}`);
    }
  } else {
    parsedData = data;
  }

  switch (parsedData.type) {
    case 'standard':
      return new StandardSetConfiguration(parsedData);
    case 'drop':
      return new DropSetConfiguration(parsedData);
    case 'myoReps':
      return new MyoRepsSetConfiguration(parsedData);
    case 'pyramidal':
      return new PyramidalSetConfiguration(parsedData);
    case 'restPause':
      return new RestPauseSetConfiguration(parsedData);
    case 'mav':
      return new MavSetConfiguration(parsedData);
    default:
      throw new Error(`Unknown set configuration type: ${(parsedData as any).type}`);
  }
}
