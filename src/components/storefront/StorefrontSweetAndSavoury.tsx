import React from 'react';
import { StorefrontBitesAndIndulgence } from './StorefrontBitesAndIndulgence';
import { Product, WebsiteSectionConfig } from '../../types';

interface StorefrontSweetAndSavouryProps {
  sectionConfig?: WebsiteSectionConfig;
  onOpenCart: () => void;
  onOpenProductDetail?: (product: Product) => void;
}

export const StorefrontSweetAndSavoury: React.FC<StorefrontSweetAndSavouryProps> = (props) => {
  return <StorefrontBitesAndIndulgence {...props} />;
};

export { StorefrontBitesAndIndulgence };
