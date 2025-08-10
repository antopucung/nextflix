import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <AnimatePresence exitBeforeEnter initial={false}>
      <motion.div
        key={router.asPath}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 