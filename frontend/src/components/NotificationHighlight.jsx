import React from 'react';
import { motion } from 'framer-motion';

/**
 * Visual highlight component for new order notifications
 * Displays a pulsing badge or border highlight to draw attention
 */
export const NotificationHighlight = ({
  isActive = false,
  variant = 'badge', // 'badge', 'border', 'glow'
  color = 'orange',
  children,
  className = '',
}) => {
  const variants = {
    badge: {
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: [1, 1.1, 1],
        opacity: 1,
        transition: {
          duration: 0.6,
          repeat: isActive ? Infinity : 0,
          repeatType: 'loop',
        },
      },
      exit: { scale: 0, opacity: 0 },
    },
    border: {
      animate: {
        boxShadow: isActive
          ? [
              `0 0 0 0 rgba(f97316, 0.7)`,
              `0 0 0 10px rgba(249, 115, 22, 0)`,
            ]
          : `0 0 0 0 rgba(249, 115, 22, 0)`,
        transition: {
          duration: 2,
          repeat: isActive ? Infinity : 0,
        },
      },
    },
    glow: {
      animate: {
        opacity: isActive ? [0.5, 1, 0.5] : 0.2,
        transition: {
          duration: 1.5,
          repeat: isActive ? Infinity : 0,
          repeatType: 'loop',
        },
      },
    },
  };

  const colorClasses = {
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
  };

  if (variant === 'badge') {
    return (
      <motion.div
        variants={variants.badge}
        initial="initial"
        animate={isActive ? 'animate' : 'initial'}
        exit="exit"
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
          colorClasses[color]
        } font-semibold text-sm ${className}`}
      >
        <motion.span
          animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
        >
          🔔
        </motion.span>
        {children}
      </motion.div>
    );
  }

  if (variant === 'border') {
    return (
      <motion.div
        variants={variants.border}
        animate="animate"
        className={`relative ${className}`}
      >
        {children}
        {isActive && (
          <motion.div
            animate={{
              boxShadow: [
                `0 0 10px 0px rgba(249, 115, 22, 0.8)`,
                `0 0 20px 5px rgba(249, 115, 22, 0.3)`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'loop',
            }}
            className="absolute inset-0 rounded-lg pointer-events-none"
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants.glow}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Toast-like notification component that appears at top
 */
export const NotificationToast = ({ message, show, duration = 3000 }) => {
  const [isVisible, setIsVisible] = React.useState(show);

  React.useEffect(() => {
    setIsVisible(show);
    if (show) {
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={isVisible ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-orange-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 backdrop-blur-sm">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          🔔
        </motion.span>
        <span className="font-medium">{message}</span>
      </div>
    </motion.div>
  );
};
