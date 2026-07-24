/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UMKM, Product, Category } from './types';
import { useUMKMs } from './hooks/useUMKMs';
import { useProducts } from './hooks/useProducts';
import { useDebouncedValue } from './hooks/useDebouncedValue';

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
import ProductDetailDialog from './components/shared/ProductDetailDialog';
import { trackPublicEvent } from './lib/analytics';

export default function App() {
  // Page section highlights
  const [activeSection, setActiveSection] = useState('home');

  // Directory Data States
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [umkmSearchQuery, setUmkmSearchQuery] = useState('');
  const debouncedProductSearchQuery = useDebouncedValue(productSearchQuery);
  const debouncedUmkmSearchQuery = useDebouncedValue(umkmSearchQuery);
  const apiCategory = selectedCategory === 'Semua' ? undefined : selectedCategory;
  const productsQuery = useProducts({ category: apiCategory, q: debouncedProductSearchQuery });
  const allProductsQuery = useProducts();
  const umkmsQuery = useUMKMs({ category: apiCategory, q: debouncedUmkmSearchQuery });
  const allUmkmsQuery = useUMKMs();
  const umkms = umkmsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const allProducts = allProductsQuery.data ?? [];
  const allUmkms = allUmkmsQuery.data ?? [];

  // WhatsApp Inquiry Dialog States
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState<Product | undefined>(undefined);
  const [inquiryUMKM, setInquiryUMKM] = useState<UMKM | undefined>(undefined);

  // UMKM Detail Dialog States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUMKMDetail, setSelectedUMKMDetail] = useState<UMKM | null>(null);

  // Product Detail Dialog States
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productTriggerRef = useRef<HTMLElement | null>(null);
  const [inquirySource, setInquirySource] = useState<'homepage_featured' | 'umkm_detail' | 'product_detail'>('homepage_featured');
  const inquiryFocusRef = useRef<HTMLElement | null>(null);


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
  const handleInquireProduct = (product: Product, source: 'homepage_featured' | 'umkm_detail' | 'product_detail') => {
    const parentUMKM = allUmkms.find((u) => u.id === product.umkmId);
    setIsProductDetailOpen(false);
    setSelectedProduct(null);
    setInquiryProduct(product);
    setInquiryUMKM(parentUMKM);
    setInquirySource(source);
    setIsWhatsAppOpen(true);
  };

  const handleInquiryClose = () => {
    setIsWhatsAppOpen(false);
    setInquiryProduct(undefined);
    setInquiryUMKM(undefined);
    requestAnimationFrame(() => inquiryFocusRef.current?.focus());
  };

  const handleViewProduct = (product: Product, trigger: HTMLElement, source: 'homepage_featured') => {
    productTriggerRef.current = trigger;
    inquiryFocusRef.current = trigger;
    setIsWhatsAppOpen(false);
    setIsDetailOpen(false);
    setSelectedUMKMDetail(null);
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
    trackPublicEvent({ eventType: 'product_view', productId: product.id, umkmId: product.umkmId, source });
  };

  const handleCloseProductDetail = () => {
    setIsProductDetailOpen(false);
    setSelectedProduct(null);
    requestAnimationFrame(() => productTriggerRef.current?.focus());
  };

  const handleProductDetailInquiry = () => {
    if (!selectedProduct) return;
    const trigger = productTriggerRef.current;
    setIsProductDetailOpen(false);
    setSelectedProduct(null);
    inquiryFocusRef.current = trigger;
    requestAnimationFrame(() => handleInquireProduct(selectedProduct, 'product_detail'));
  };

  const handleInquireUMKM = (umkm: UMKM) => {
    setIsProductDetailOpen(false);
    setSelectedProduct(null);
    setInquiryProduct(undefined);
    setInquiryUMKM(umkm);
    setInquirySource('umkm_detail');
    setIsWhatsAppOpen(true);
  };

  // View specific UMKM details
  const handleViewUMKMDetails = (umkm: UMKM) => {
    setSelectedUMKMDetail(umkm);
    setIsDetailOpen(true);
  };

  // View UMKM details by product click
  const handleViewUMKMById = (umkmId: string) => {
    const umkmObj = allUmkms.find((u) => u.id === umkmId);
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
          searchQuery={productSearchQuery}
          onSearchChange={setProductSearchQuery}
          onInquireProduct={(product) => handleInquireProduct(product, 'homepage_featured')}
          onViewProduct={handleViewProduct}
          onViewMerchant={handleViewUMKMById}
          isLoading={productsQuery.isPending}
          isError={productsQuery.isError}
          onRetry={() => void productsQuery.refetch()}
        />

        {/* 5. Featured UMKM Directory Grid */}
        <FeaturedBusinessesSection 
          umkms={umkms}
          searchQuery={umkmSearchQuery}
          onSearchChange={setUmkmSearchQuery}
          onViewDetails={handleViewUMKMDetails}
          isLoading={umkmsQuery.isPending}
          isError={umkmsQuery.isError}
          onRetry={() => void umkmsQuery.refetch()}
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

      <WhatsAppInquiryDialog
        isOpen={isWhatsAppOpen}
        onClose={handleInquiryClose}
        product={inquiryProduct}
        umkm={inquiryUMKM}
        source={inquirySource}
      />

      {selectedProduct && (
        <ProductDetailDialog
          isOpen={isProductDetailOpen}
          product={selectedProduct}
          onClose={handleCloseProductDetail}
          onInquire={handleProductDetailInquiry}
        />
      )}

      {/* Shared UMKM detail dialog overlay */}
      {selectedUMKMDetail && (
        <UMKMDetailDialog 
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedUMKMDetail(null);
          }}
          umkm={selectedUMKMDetail}
          products={allProducts}
          onInquireProduct={(product) => handleInquireProduct(product, 'umkm_detail')}
          onInquireUMKM={handleInquireUMKM}
        />
      )}

    </div>
  );
}
