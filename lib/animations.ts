/**
 * Shared animation variants for receipt containers
 */

export const slideVariants = {
  initial: {
    y: "100%",
  },
  animate: (fromScan: boolean = false) => ({
    y: 0,
    transition: {
      duration: fromScan ? 5 : 1,
      ease: "easeOut",
    },
  }),
  exit: {
    y: "100%",
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

// Back button animations
export const backButtonVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: { delay: 0.2 },
}
