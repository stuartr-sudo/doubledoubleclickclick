import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlag } from '@/api/entities';
import { AppProduct } from '@/api/entities';

const FeatureFlagContext = createContext(null);

export const FeatureFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [flagsData, productsData] = await Promise.all([
          FeatureFlag.filter().catch(() => []),
          AppProduct.filter().catch(() => []),
        ]);
        setFlags(flagsData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Failed to load feature flag context", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const value = { flags, products, loading };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlagData = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagData must be used within a FeatureFlagProvider');
  }
  return context;
};