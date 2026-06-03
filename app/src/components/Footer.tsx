import { Link } from 'react-router-dom';

const footerLinks = {
  Product: [
    { label: 'Features', path: '/#features' },
    { label: 'Playbooks', path: '/playbooks' },
    { label: 'Campaigns', path: '/campaigns' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Pricing', path: '/pricing' },
  ],
  Resources: [
    { label: 'Documentation', path: '#' },
    { label: 'API Reference', path: '#' },
    { label: 'Blog', path: '#' },
    { label: 'Changelog', path: '#' },
  ],
  Company: [
    { label: 'About', path: '#' },
    { label: 'Careers', path: '#' },
    { label: 'Contact', path: '#' },
    { label: 'Legal', path: '#' },
  ],
  Connect: [
    { label: 'Twitter/X', path: '#' },
    { label: 'LinkedIn', path: '#' },
    { label: 'GitHub', path: '#' },
    { label: 'Discord', path: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050505]">
      <div className="px-[8vw] pt-20 pb-10">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-xs text-white/35 hover:text-white/60 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/35">
            &copy; 2025 SellScout AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-white/35 hover:text-white/60 transition-colors duration-150">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-white/35 hover:text-white/60 transition-colors duration-150">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
