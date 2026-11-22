import library from '../library/library.json';
import type { Exercise } from '../library/types';

/** The bundled exercise library, typed once for the app. */
export const LIBRARY = library as Exercise[];
