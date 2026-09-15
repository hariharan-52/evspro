import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-eco-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-white">EcoDonate</span>
            </Link>
            <p className="text-gray-300 mb-6">
              Small actions. Big impact. Join us in reducing waste and building a sustainable future.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Donate Items</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Recycle Waste</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="text-green-400 mt-1" size={20} />
                <span className="text-gray-300">123 Green Avenue, Eco City, EC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-green-400" size={20} />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-green-400" size={20} />
                <span className="text-gray-300">hello@ecodonate.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} EcoDonate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
