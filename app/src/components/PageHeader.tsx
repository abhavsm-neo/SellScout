import { motion } from 'framer-motion';

interface PageHeaderProps {
  overline: string;
  title: string;
  subtitle: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function PageHeader({ overline, title, subtitle }: PageHeaderProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pt-[140px] pb-20 px-[8vw] text-center"
    >
      <motion.p
        variants={item}
        className="text-[13px] font-medium tracking-[0.15em] uppercase text-gold"
      >
        {overline}
      </motion.p>
      <motion.h1
        variants={item}
        className="text-[48px] font-normal tracking-[-0.02em] leading-[1.15] text-white mt-4 max-w-[600px] mx-auto"
      >
        {title}
      </motion.h1>
      <motion.p
        variants={item}
        className="text-base text-white/60 leading-relaxed mt-4 max-w-[520px] mx-auto"
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
}
