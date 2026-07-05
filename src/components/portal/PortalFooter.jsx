import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Globe, Share2, Briefcase, Mail } from 'lucide-react';

function PortalFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="portal-footer" id="contact">
      <div className="portal-footer-inner">
        <div className="portal-footer-brand">
          <div className="portal-brand">
            <span className="portal-brand-mark"><Sparkles size={18} /></span>
            <span className="portal-brand-text">AI Tools Portal<span className="dot">°</span></span>
          </div>
          <p>Your curated learning &amp; assessment hub for modern AI, development, and cloud tooling.</p>
          <div className="portal-social">
            <a href="#" aria-label="Website"><Globe size={18} /></a>
            <a href="#" aria-label="Share"><Share2 size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Briefcase size={18} /></a>
            <a href="mailto:support@symbiosystech.com" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>

        <div className="portal-footer-col">
          <h4>Explore</h4>
          <Link to="/home">Home</Link>
          <Link to="/explore">All Resources</Link>
          <a href="/home#categories">Categories</a>
          <a href="/home#popular">Popular</a>
        </div>

        <div className="portal-footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="portal-footer-col">
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="mailto:support@symbiosystech.com">Contact</a>
        </div>
      </div>
      <div className="portal-footer-bottom">
        <span>© {year} Symbiosys Technologies. All rights reserved.</span>
        <span className="portal-footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </span>
      </div>
    </footer>
  );
}

export default PortalFooter;
