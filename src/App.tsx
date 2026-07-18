/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UMKM, Product, Category } from './types';
import { getSavedUMKMs, getSavedProducts } from './data';

// Layout & Section Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroSection from './components/home/HeroSection';
import CategorySection from './components/home/CategorySection';
import FeaturedProductsSection from './components/home/FeaturedProductsSection';
import FeaturedBusinessesSection from './components/home/FeaturedBusinessesSection';
import HowItWorksSection from './components/home/HowItWorksSection';
import AboutVillageSection from './components/home/AboutVillageSection';
import MissionSection from './components/home/MissionSection';
import FaqSection from './components/home/FaqSection';
import FinalCtaSection from './components/home/FinalCtaSection';

// Dialog Components
import WhatsAppInquiryDialog from './components/shared/WhatsAppInquiryDialog';
import UMKMDetailDialog from './components/shared/UMKMDetailDialog';

export default function App() {
  // Page section highlights
  const [activeSection, setActiveSection] = useState('home');

  // Directory Data States
  const [umkms, setUmkms] = useState<UMKM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');

  // WhatsApp Inquiry Dialog States
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<Product | undefined>(undefined);
  const [inquiryUMKM, setInquiryUMKM] = useState<UMKM | undefined>(undefined);

  // UMKM Detail Dialog States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUMKMDetail, setSelectedUMKMDetail] = useState<UMKM | null>(null);

  // Initialize data on mount
  useEffect(() => {
    setUmkms(getSavedUMKMs());
    setProducts(getSavedProducts());
  }, []);

  // Section scroll handler
  const handleScrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // height of sticky header plus some padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Trigger WhatsApp dialogue for a specific product
  const handleInquireProduct = (product: Product) => {
    // Find associated business to pass along the phone number
    const parentUMKM = umkms.find((u) => u.id === product.umkmId);
    setInquiryProduct(product);
    setInquiryUMKM(parentUMKM);
    setIsWhatsAppOpen(true);
  };

  // Trigger WhatsApp dialogue for a business directly
  const handleInquireUMKM = (umkm: UMKM) => {
    setInquiryProduct(undefined);
    setInquiryUMKM(umkm);
    setIsWhatsAppOpen(true);
  };

  // View specific UMKM details
  const handleViewUMKMDetails = (umkm: UMKM) => {
    setSelectedUMKMDetail(umkm);
    setIsDetailOpen(true);
  };

  // View UMKM details by product click
  const handleViewUMKMById = (umkmId: string) => {
    const umkmObj = umkms.find((u) => u.id === umkmId);
    if (umkmObj) {
      handleViewUMKMDetails(umkmObj);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col antialiased">
      
      {/* 1. Header Navigation */}
      <Navbar 
        onScrollToSection={handleScrollToSection} 
        activeSection={activeSection} 
      />

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* 2. Hero Section */}
        <HeroSection 
          onBrowseProducts={() => handleScrollToSection('categories')}
          onBrowseUMKMs={() => handleScrollToSection('umkm')}
        />

        {/* 3. Category Discovery Section */}
        <CategorySection 
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            handleScrollToSection('categories');
          }}
        />

        {/* 4. Featured Products Grid */}
        <FeaturedProductsSection 
          products={products}
          selectedCategory={selectedCategory}
          onInquireProduct={handleInquireProduct}
          onViewMerchant={handleViewUMKMById}
        />

        {/* 5. Featured UMKM Directory Grid */}
        <FeaturedBusinessesSection 
          umkms={umkms}
          onViewDetails={handleViewUMKMDetails}
        />

        {/* 6. Simple Three-step User Journey */}
        <HowItWorksSection />

        {/* 7. About Desa Loning */}
        <AboutVillageSection />

        {/* 8. Local Economic-Support Statement (Mission) */}
        <MissionSection />

        {/* 9. FAQ Accordions */}
        <FaqSection />

        {/* 10. Final Call to Action */}
        <FinalCtaSection 
          onBrowseProducts={() => handleScrollToSection('categories')}
          onBrowseUMKMs={() => handleScrollToSection('umkm')}
        />

      </main>

      {/* 11. Footer segment */}
      <Footer onScrollToSection={handleScrollToSection} />

      {/* Shared Inquiry dialog overlay */}
      <WhatsAppInquiryDialog 
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        product={inquiryProduct}
        umkm={inquiryUMKM}
      />

      {/* Shared UMKM detail dialog overlay */}
      {selectedUMKMDetail && (
        <UMKMDetailDialog 
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedUMKMDetail(null);
          }}
          umkm={selectedUMKMDetail}
          onInquireProduct={handleInquireProduct}
          onInquireUMKM={handleInquireUMKM}
        />
      )}

    </div>
  );
}
