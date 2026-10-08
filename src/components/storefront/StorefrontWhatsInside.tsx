import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

export const StorefrontWhatsInside: React.FC = () => {
  const { sections } = useStore();

  const sectionConfig = sections.find((s) => s.sectionKey === 'whatsInside');
  if (sectionConfig && !sectionConfig.isVisible) return null;

  // Responsive device detector
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
    sectionConfig?.bannerHeight === 'compact'
      ? 'h-[360px] sm:h-[400px]'
      : sectionConfig?.bannerHeight === 'large'
      ? 'h-[480px] sm:h-[540px]'
      : 'h-[400px] sm:h-[450px] lg:h-[480px]';

  const overlayIntensity = sectionConfig?.overlayIntensity ?? 0;
  const textCfg = sectionConfig?.bannerTextConfig;

  // Retrieve responsive positions for current device mode
  const currentPositions =
    (device === 'mobile'
      ? textCfg?.positions?.mobile
      : device === 'tablet'
      ? textCfg?.positions?.tablet
      : textCfg?.positions?.desktop) || {};

  const subtitlePos = currentPositions.subtitle || { x: 55, y: 22 };
  const headingPos = currentPositions.heading || { x: 55, y: 36 };
  const descPos = currentPositions.description || { x: 55, y: 56 };
  const ctaPos = currentPositions.cta || { x: 55, y: 78 };

  const showSubtitle = textCfg?.showSubtitle ?? true;
  const showHeading = textCfg?.showHeading ?? true;
  const showDescription = textCfg?.showDescription ?? true;
  const showCta = textCfg?.showCta ?? true;

  const subtitleText = sectionConfig?.subheading || 'THE SURPRISE';
  const headingText = sectionConfig?.heading || "What's Inside?";
  const descText =
    sectionConfig?.description ||
    'Every cup hides a collectible toy or mini figurine. From cute characters to special editions — collect them all!';
  const ctaText = textCfg?.ctaText || sectionConfig?.ctaText || 'Discover The Surprise';
  const ctaLink = textCfg?.ctaLink || sectionConfig?.ctaLink || '#coffee-menu';

  return (
    <section
      id="whats-inside"
      style={{
        width: '100%',
        maxWidth: 'none',
        margin: 0,
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
      }}
      className={`relative w-full ${bannerHeight} overflow-hidden bg-[#0A0503] text-white select-none`}
    >
      {/* 
        TRUE CONTAIN-STYLE IMAGE FITTING MATCHING HERO BANNER:
        - Never cropped top, bottom, or sides.
        - Preserves original aspect ratio.
        - Empty areas seamlessly filled with subtle matching background #0A0503.
      */}
      <div className="absolute inset-0 z-0 w-full h-full flex items-center justify-center bg-[#0A0503] overflow-hidden">
        <SafeImage
          src={
            sectionConfig?.imageUrl ||
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80'
          }
          imageId={sectionConfig?.imageId}
          alt={headingText}
          className="w-full h-full object-contain object-center pointer-events-none select-none"
          fallbackSrc="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80"
        />

        {overlayIntensity > 0 && (
          <div
            style={{ backgroundColor: `rgba(0, 0, 0, ${overlayIntensity / 100})` }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>

      {/* 
        FREELY POSITIONED EDITABLE TEXT ELEMENTS:
        - Percentage-based responsive coordinates (left: X%, top: Y%)
        - Never shows outlines or handles on customer website
      */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto pointer-events-none">
        {/* Subtitle / Eyebrow */}
        {showSubtitle && (
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
            {subtitleText}
          </div>
        )}

        {/* Heading */}
        {showHeading && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, headingPos.x))}%`,
              top: `${Math.min(95, Math.max(5, headingPos.y))}%`,
              transform: 'translate(-50%, -50%)',
              fontSize:
                textCfg?.headingStyle?.fontSize ||
                (device === 'mobile' ? '22px' : device === 'tablet' ? '28px' : '34px'),
              fontWeight: textCfg?.headingStyle?.fontWeight || '400',
              letterSpacing: textCfg?.headingStyle?.letterSpacing || 'normal',
              lineHeight: textCfg?.headingStyle?.lineHeight || '1.2',
              textAlign: textCfg?.headingStyle?.textAlign || 'left',
              color: textCfg?.headingStyle?.textColor || '#fae8be',
              maxWidth: textCfg?.headingStyle?.maxWidth || (device === 'mobile' ? '320px' : '480px'),
            }}
            className="font-serif tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          >
            {headingText}
          </div>
        )}

        {/* Description */}
        {showDescription && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(95, Math.max(5, descPos.x))}%`,
              top: `${Math.min(95, Math.max(5, descPos.y))}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: textCfg?.descriptionStyle?.fontSize || (device === 'mobile' ? '11px' : '13px'),
              fontWeight: textCfg?.descriptionStyle?.fontWeight || '300',
              letterSpacing: textCfg?.descriptionStyle?.letterSpacing || 'normal',
              lineHeight: textCfg?.descriptionStyle?.lineHeight || '1.5',
              textAlign: textCfg?.descriptionStyle?.textAlign || 'left',
              color: textCfg?.descriptionStyle?.textColor || '#fae8be',
              maxWidth: textCfg?.descriptionStyle?.maxWidth || (device === 'mobile' ? '300px' : '420px'),
            }}
            className="font-sans font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-relaxed"
          >
            {descText}
          </div>
        )}

        {/* CTA Button */}
        {showCta && (
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
              href={ctaLink}
              style={{
                fontSize: textCfg?.ctaStyle?.fontSize || '11px',
                fontWeight: textCfg?.ctaStyle?.fontWeight || '700',
                letterSpacing: textCfg?.ctaStyle?.letterSpacing || '0.15em',
                lineHeight: textCfg?.ctaStyle?.lineHeight || '1',
                color: textCfg?.ctaStyle?.textColor || '#0c0704',
                maxWidth: textCfg?.ctaStyle?.maxWidth || '280px',
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fae8be] hover:bg-white text-zinc-950 font-mono transition-all duration-300 shadow-xl cursor-pointer"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
