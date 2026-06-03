import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Playbooks', path: '/playbooks' },
  { label: 'Campaigns', path: '/campaigns' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Pricing', path: '/pricing' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300 ${
        scrolled || !isHome
          ? 'bg-[rgba(5,5,5,0.92)] backdrop-blur-[12px]'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-[8vw] flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-white">
            SellScout
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative text-[13px] font-medium tracking-[0.06em] uppercase transition-colors duration-200 ${
                location.pathname === link.path
                  ? 'text-white/60'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gold"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <button className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 hover:text-white/60 transition-colors duration-200">
            Sign In
          </button>
          <Link
            to="/pricing"
            className="text-[13px] font-medium tracking-[0.06em] uppercase bg-gold text-[#050505] px-5 py-2.5 rounded-md hover:brightness-110 transition-all duration-150"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white/60"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="absolute top-[72px] left-0 right-0 bg-[rgba(5,5,5,0.95)] backdrop-blur-[12px] border-t border-white/[0.06] md:hidden"
          >
            <div className="px-[8vw] py-6 flex flex-col gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/60 py-2"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
                <button className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">
                  Sign In
                </button>
                <Link
                  to="/pricing"
                  className="text-[13px] font-medium tracking-[0.06em] uppercase bg-gold text-[#050505] px-5 py-2.5 rounded-md"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
