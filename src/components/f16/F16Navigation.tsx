"use client";

import React from "react";
import Link from "next/link";

export default function F16Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/zepta/f16" className="text-xl font-bold text-gray-900">
              F16 Portal
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/zepta/f16" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href="/zepta/f16/acc" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ACC Integration
              </Link>
              <Link 
                href="/zepta/f16/blog" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logbuch
              </Link>
              <Link 
                href="/zepta/f16/bemusterung" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Bemusterung
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Projekt F16
          </div>
        </div>
      </div>
    </nav>
  );
}
