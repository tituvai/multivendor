import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-350 border-t border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-1.5 font-extrabold text-2xl text-white">
              <span className="text-orange-500">🛍️</span>
              <span>Malti<span className="text-orange-500 font-medium">Vendor</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discover a premium multi-vendor marketplace shopping experience. Seamless transactions, verified sellers, and quick delivery.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: FaFacebook, href: "#" },
                { icon: FaTwitter, href: "#" },
                { icon: FaInstagram, href: "#" },
                { icon: FaYoutube, href: "#" },
              ].map((s, idx) => (
                <a
                  key={idx}
                  href={s.href}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-orange-500 hover:text-white flex items-center justify-center text-slate-400 transition"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  How to Buy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-orange-500 transition">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Become a Partner */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Partner with Us
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/vendor/register" className="hover:text-orange-500 transition font-semibold text-orange-400">
                  Register as Vendor
                </Link>
              </li>
              <li>
                <Link href="/vendor/register" className="hover:text-orange-500 transition">
                  Vendor Rules & Commission
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Logistics Partner
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Contact Us
            </h4>
            <div className="space-y-3 text-sm text-slate-450">
              <p className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>Sector 11, Uttara, Dhaka, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>+880 1794 000000</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>support@maltivendor.com</span>
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-800 my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MaltiVendor. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {["SSLCommerz", "Stripe", "bKash", "COD"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-semibold tracking-wider"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
