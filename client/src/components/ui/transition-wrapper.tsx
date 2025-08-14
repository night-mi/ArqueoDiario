import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TransitionWrapperProps {
  children: ReactNode;
  className?: string;
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.95
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.95
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Stagger animation for lists
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

// Card hover effects
export const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export default function TransitionWrapper({ children, className = "" }: TransitionWrapperProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Button animations
export const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// Success animation
export const successVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1
    }
  }
};

// Gas pump filling animation
export const fuelFillVariants = {
  empty: { scaleY: 0, originY: 1 },
  filling: {
    scaleY: [0, 0.3, 0.6, 0.9, 1],
    transition: {
      duration: 2,
      ease: "easeOut"
    }
  }
};