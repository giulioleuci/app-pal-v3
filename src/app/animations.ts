/**
 * Centralized animation variants for consistent UI transitions throughout the application.
 * Uses framer-motion for smooth, performant animations following our design system.
 */

import { Variants } from 'framer-motion';

/**
 * Page transition animations for smooth navigation between routes.
 * Provides a consistent slide-in-from-right effect for page changes.
 */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      duration: 0.2,
    },
  },
};

/**
 * Modal and dialog pop-in animations.
 * Creates an elegant scale-up effect with opacity fade for modal appearances.
 */
export const modalPopIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      duration: 0.3,
    },
  },
};

/**
 * Staggered list animations for smooth list item appearances.
 * Creates a cascading effect where list items appear in sequence.
 */
export const listStagger: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Individual list item animation used with listStagger.
 * Provides slide-up and fade-in effect for each list item.
 */
export const listItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Fade animation for simple opacity transitions.
 * Useful for loading states and content swapping.
 */
export const fade: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

/**
 * Slide animation for drawer and sidebar components.
 * Provides smooth horizontal sliding effects.
 */
export const slideFromLeft: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 20,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 20,
    },
  },
};

/**
 * Button press animation for interactive feedback.
 * Provides tactile feedback for button interactions.
 */
export const buttonPress: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: 1,
  },
  whileTap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: 'easeInOut',
    },
  },
  whileHover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

/**
 * Fade-in-up animation for general component entrances.
 * Creates a smooth upward slide with opacity fade.
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      duration: 0.6,
    },
  },
};

/**
 * Centralized animations object for easy access to all animation variants.
 * This allows for consistent animation access throughout the application.
 */
export const animations = {
  pageTransition,
  modalPopIn,
  listStagger,
  listItem,
  fade,
  slideFromLeft,
  buttonPress,
  fadeInUp,
};
