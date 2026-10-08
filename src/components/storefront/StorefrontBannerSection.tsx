import React, { useState, useEffect } from 'react';
import { WebsiteSectionConfig } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { ArrowRight } from 'lucide-react';

interface StorefrontBannerSectionProps {
  sectionConfig: WebsiteSectionConfig;
}

export const StorefrontBannerSection: React.FC<StorefrontBannerSectionProps> = ({ sectionConfig }) => {
  if (!sectionConfig.isVisible) return null;

  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDevice('mobile');
      } else if (width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bannerHeight =
    sectionConfig.bannerHeight === 'compact'
      ? 'h-[320px] sm:h-[380px]'
      : sectionConfig.bannerHeight === 'large'
      ? 'h-[480px] sm:h-[560px]'
      : 'h-[380px] sm:h-[440px] lg:h-[480px]';

  const overlayIntensity = sectionConfig.overlayIntensity ?? 0;
  const textCfg = sectionConfig.bannerTextConfig;

  // Retrieve responsive coordinates
  const currentPositions =
    (device === 'mobile'
      ? textCfg?.positions?.mobile
      : device === 'tablet'
      ? textCfg?.positions?.tablet
      : textCfg?.positions?.desktop) || {};

  const subtitlePos = currentPositions.subtitle || { x: 50, y: 25 };
  const headingPos = currentPositions.heading || { x: 50, y: 40 };
  const descPos = currentPositions.description || { x: 50, y: 60 };
  const ctaPos = currentPositions.cta || { x: 50, y: 78 };

  const showSubtitle = textCfg?.showSubtitle ?? !!sectionConfig.subheading;
  const showHeading = textCfg?.showHeading ?? !!sectionConfig.heading;
  const showDescription = textCfg?.showDescription ?? !!sectionConfig.description;
  const showCta = textCfg?.showCta ?? !!sectionConfig.ctaText;

  return (
    <section
      id={sectionConfig.sectionKey || sectionConfig.id}
      className={`relative w-full ${bannerHeight} overflow-hidden bg-[#0A0503] text-white select-none border-y border-[#261710]`}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0 w-full h-full flex items-center justify-center bg-[#0A0503] overflow-hidden">
        {sectionConfig.imageUrl || sectionConfig.imageId ? (
          <SafeImage
            src={sectionConfig.imageUrl}
            imageId={sectionConfig.imageId}
            alt={sectionConfig.heading || sectionConfig.name}
            className={`w-full h-full ${
              sectionConfig.imageFit === 'cover' ? 'object-cover' : 'object-contain'
            } object-center pointer-events-none select-none`}
            fallbackSrc="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#180E09] via-[#2D1B12] to-[#180E09]" />
        )}

        {overlayIntensity > 0 && (
          <div
            style={{ backgroundColor: `rgba(0, 0, 0, ${overlayIntensity / 100})` }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>

      {/* Positioned Text & Action Layer */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto pointer-events-none">
        {showSubtitle && sectionConfig.subheading && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, subtitlePos.x))}%`,
              top: `${Math.min(95, Math.max(5, subtitlePos.y))}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: textCfg?.subtitleStyle?.fontSize || (device === 'mobile' ? '10px' : '11px'),
              fontWeight: textCfg?.subtitleStyle?.fontWeight || '700',
              letterSpacing: textCfg?.subtitleStyle?.letterSpacing || '0.25em',
              lineHeight: textCfg?.subtitleStyle?.lineHeight || '1.2',
              textAlign: textCfg?.subtitleStyle?.textAlign || 'left',
              color: textCfg?.subtitleStyle?.textColor || '#fae8be',
              maxWidth: textCfg?.subtitleStyle?.maxWidth || (device === 'mobile' ? '300px' : '450px'),
            }}
            className="font-mono uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
          >
            {sectionConfig.subheading}
          </div>
        )}

        {showHeading && sectionConfig.heading && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, headingPos.x))}%`,
              top: `${Math.min(95, Math.max(5, headingPos.y))}%`,
              transform: 'translate(-50%, -50%)',
              fontSize:
                textCfg?.headingStyle?.fontSize ||
                (device === 'mobile' ? '22px' : device === 'tablet' ? '28px' : '36px'),
              fontWeight: textCfg?.headingStyle?.fontWeight || '400',
              letterSpacing: textCfg?.headingStyle?.letterSpacing || 'normal',
              lineHeight: textCfg?.headingStyle?.lineHeight || '1.15',
              textAlign: textCfg?.headingStyle?.textAlign || 'left',
              color: textCfg?.headingStyle?.textColor || '#fae8be',
              maxWidth: textCfg?.headingStyle?.maxWidth || (device === 'mobile' ? '320px' : '520px'),
            }}
            className="font-serif drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] whitespace-pre-line"
          >
            {sectionConfig.heading}
          </div>
        )}

        {showDescription && sectionConfig.description && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, descPos.x))}%`,
              top: `${Math.min(95, Math.max(5, descPos.y))}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: textCfg?.descriptionStyle?.fontSize || (device === 'mobile' ? '12px' : '13px'),
              fontWeight: textCfg?.descriptionStyle?.fontWeight || '300',
              letterSpacing: textCfg?.descriptionStyle?.letterSpacing || 'normal',
              lineHeight: textCfg?.descriptionStyle?.lineHeight || '1.5',
              textAlign: textCfg?.descriptionStyle?.textAlign || 'left',
              color: textCfg?.descriptionStyle?.textColor || '#fae8be',
              maxWidth: textCfg?.descriptionStyle?.maxWidth || (device === 'mobile' ? '300px' : '440px'),
            }}
            className="font-sans font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
          >
            {sectionConfig.description}
          </div>
        )}

        {showCta && sectionConfig.ctaText && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, ctaPos.x))}%`,
              top: `${Math.min(95, Math.max(5, ctaPos.y))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-auto"
          >
            <a
              href={sectionConfig.ctaLink || '#'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fae8be] text-[#140b07] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <span>{sectionConfig.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
