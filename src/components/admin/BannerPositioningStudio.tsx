import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WebsiteSectionConfig, BannerTextConfig, ResponsiveTextPositions, TextElementPosition, TextElementStyle } from '../../types';
import { Monitor, Tablet, Smartphone, Save, X, Move, Type, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight, Check, Palette } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface BannerPositioningStudioProps {
  section: WebsiteSectionConfig;
  onSave: (updatedSection: WebsiteSectionConfig) => Promise<void> | void;
  onClose: () => void;
}

type TextElementType = 'subtitle' | 'heading' | 'description' | 'cta';

export const BannerPositioningStudio: React.FC<BannerPositioningStudioProps> = ({
  section,
  onSave,
  onClose,
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedElement, setSelectedElement] = useState<TextElementType>('heading');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Deep clone or default the text config
  const initialPositions: ResponsiveTextPositions = section.bannerTextConfig?.positions || {
    desktop: {
      subtitle: { x: 50, y: 24 },
      heading: { x: 50, y: 38 },
      description: { x: 50, y: 58 },
      cta: { x: 50, y: 78 },
    },
    tablet: {
      subtitle: { x: 50, y: 22 },
      heading: { x: 50, y: 38 },
      description: { x: 50, y: 60 },
      cta: { x: 50, y: 80 },
    },
    mobile: {
      subtitle: { x: 50, y: 20 },
      heading: { x: 50, y: 38 },
      description: { x: 50, y: 62 },
      cta: { x: 50, y: 84 },
    },
  };

  const [positions, setPositions] = useState<ResponsiveTextPositions>(initialPositions);

  const [headingText, setHeadingText] = useState(section.heading || 'Banner Heading');
  const [subtitleText, setSubtitleText] = useState(section.subheading || 'THE HIGHLIGHT');
  const [descriptionText, setDescriptionText] = useState(section.description || 'Artisanal delights handcrafted for the discerning palate.');
  const [ctaText, setCtaText] = useState(section.ctaText || 'Discover More');
  const [ctaLink, setCtaLink] = useState(section.ctaLink || '#');

  const [showSubtitle, setShowSubtitle] = useState(section.bannerTextConfig?.showSubtitle ?? true);
  const [showHeading, setShowHeading] = useState(section.bannerTextConfig?.showHeading ?? true);
  const [showDescription, setShowDescription] = useState(section.bannerTextConfig?.showDescription ?? true);
  const [showCta, setShowCta] = useState(section.bannerTextConfig?.showCta ?? true);

  const [styles, setStyles] = useState<{
    subtitle: TextElementStyle;
    heading: TextElementStyle;
    description: TextElementStyle;
    cta: TextElementStyle;
  }>({
    subtitle: section.bannerTextConfig?.subtitleStyle || {
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.25em',
      lineHeight: '1.2',
      textAlign: 'center',
      textColor: '#fae8be',
      maxWidth: '450px',
    },
    heading: section.bannerTextConfig?.headingStyle || {
      fontSize: '32px',
      fontWeight: '400',
      letterSpacing: 'normal',
      lineHeight: '1.2',
      textAlign: 'center',
      textColor: '#fae8be',
      maxWidth: '520px',
    },
    description: section.bannerTextConfig?.descriptionStyle || {
      fontSize: '13px',
      fontWeight: '300',
      letterSpacing: 'normal',
      lineHeight: '1.5',
      textAlign: 'center',
      textColor: '#fae8be',
      maxWidth: '440px',
    },
    cta: section.bannerTextConfig?.ctaStyle || {
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.15em',
      lineHeight: '1',
      textAlign: 'center',
      textColor: '#140b07',
      maxWidth: '220px',
    },
  });

  // Dragging interaction state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<TextElementType | null>(null);

  const handlePointerDown = (type: TextElementType, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedElement(type);
    setDraggedItem(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedItem || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain percentage within [4%, 96%]
    const clampedX = Math.round(Math.min(96, Math.max(4, rawX)));
    const clampedY = Math.round(Math.min(96, Math.max(4, rawY)));

    setPositions((prev) => ({
      ...prev,
      [device]: {
        ...prev[device],
        [draggedItem]: { x: clampedX, y: clampedY },
      },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedItem) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggedItem(null);
    }
  };

  const currentDevicePositions = positions[device] || {
    subtitle: { x: 50, y: 25 },
    heading: { x: 50, y: 40 },
    description: { x: 50, y: 60 },
    cta: { x: 50, y: 80 },
  };

  const currentElemPos = currentDevicePositions[selectedElement] || { x: 50, y: 50 };
  const currentElemStyle = styles[selectedElement];

  const updateCoord = (axis: 'x' | 'y', val: number) => {
    const clamped = Math.min(96, Math.max(4, val));
    setPositions((prev) => ({
      ...prev,
      [device]: {
        ...prev[device],
        [selectedElement]: {
          ...(prev[device]?.[selectedElement] || { x: 50, y: 50 }),
          [axis]: clamped,
        },
      },
    }));
  };

  const updateStyle = (key: keyof TextElementStyle, val: string) => {
    setStyles((prev) => ({
      ...prev,
      [selectedElement]: {
        ...prev[selectedElement],
        [key]: val,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated: WebsiteSectionConfig = {
      ...section,
      heading: headingText,
      subheading: subtitleText,
      description: descriptionText,
      ctaText,
      ctaLink,
      bannerTextConfig: {
        showSubtitle,
        showHeading,
        showDescription,
        showCta,
        ctaText,
        ctaLink,
        subtitleStyle: styles.subtitle,
        headingStyle: styles.heading,
        descriptionStyle: styles.description,
        ctaStyle: styles.cta,
        positions,
      },
    };

    try {
      await onSave(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#120b08] border border-[#3e271c] w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-zinc-100">
        {/* Studio Topbar */}
        <div className="p-4 sm:p-5 border-b border-[#281810] flex flex-wrap items-center justify-between gap-4 bg-[#180f0b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a1a12] border border-[#442a1d] flex items-center justify-center text-[#cfa851]">
              <Move className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-serif text-[#fae8be]">
                  Banner Text Positioning Studio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                  {section.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Click &amp; drag any text element directly in the live preview to position it.
              </p>
            </div>
          </div>

          {/* Device Breakpoint Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e0704] border border-[#2e1c12]">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                device === 'desktop' ? 'bg-[#cfa851] text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                device === 'tablet' ? 'bg-[#cfa851] text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                device === 'mobile' ? 'bg-[#cfa851] text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg hover:brightness-110 cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved to Server!' : isSaving ? 'Saving...' : 'Save Positions'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#22150e] hover:bg-[#2c1b12] text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Body: Interactive Preview (Left/Top) + Precision Controls (Right/Bottom) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Canvas Preview Area */}
          <div className="lg:col-span-8 p-4 sm:p-6 bg-[#0a0503] flex flex-col items-center justify-center overflow-auto border-b lg:border-b-0 lg:border-r border-[#281810]">
            <div className="text-[11px] font-mono text-zinc-400 mb-2 flex items-center justify-between w-full max-w-[800px]">
              <span className="flex items-center gap-1.5 text-[#cfa851]">
                <Move className="w-3.5 h-3.5" />
                <span>DRAG &amp; DROP ACTIVE • Breakpoint: {device.toUpperCase()}</span>
              </span>
              <span>Coordinates: {currentElemPos.x}% X, {currentElemPos.y}% Y</span>
            </div>

            {/* Container simulator */}
            <div
              className={`relative border-2 border-dashed border-[#442a1d] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 select-none ${
                device === 'mobile'
                  ? 'w-[340px] h-[480px]'
                  : device === 'tablet'
                  ? 'w-[580px] h-[420px]'
                  : 'w-full max-w-[800px] h-[420px]'
              }`}
            >
              {/* Interactive canvas */}
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full h-full bg-[#0e0704] flex items-center justify-center overflow-hidden touch-none"
              >
                {/* Background image */}
                {section.imageUrl ? (
                  <SafeImage
                    src={section.imageUrl}
                    alt={section.name}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    fallbackSrc="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#180E09] via-[#2D1B12] to-[#180E09] pointer-events-none" />
                )}

                {/* Subtitle Draggable Element */}
                {showSubtitle && (
                  <div
                    onPointerDown={(e) => handlePointerDown('subtitle', e)}
                    style={{
                      left: `${currentDevicePositions.subtitle?.x ?? 50}%`,
                      top: `${currentDevicePositions.subtitle?.y ?? 25}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: styles.subtitle.fontSize || '11px',
                      fontWeight: styles.subtitle.fontWeight || '700',
                      letterSpacing: styles.subtitle.letterSpacing || '0.25em',
                      color: styles.subtitle.textColor || '#fae8be',
                      textAlign: styles.subtitle.textAlign || 'center',
                    }}
                    className={`absolute p-1.5 cursor-grab active:cursor-grabbing font-mono uppercase rounded-lg transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      selectedElement === 'subtitle'
                        ? 'ring-2 ring-[#cfa851] bg-black/50 shadow-xl'
                        : 'hover:ring-1 hover:ring-white/40'
                    }`}
                  >
                    <span className="pointer-events-none">{subtitleText}</span>
                    {selectedElement === 'subtitle' && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#cfa851] text-zinc-950 text-[9px] font-mono font-bold whitespace-nowrap">
                        Subtitle ({currentDevicePositions.subtitle?.x}%, {currentDevicePositions.subtitle?.y}%)
                      </span>
                    )}
                  </div>
                )}

                {/* Heading Draggable Element */}
                {showHeading && (
                  <div
                    onPointerDown={(e) => handlePointerDown('heading', e)}
                    style={{
                      left: `${currentDevicePositions.heading?.x ?? 50}%`,
                      top: `${currentDevicePositions.heading?.y ?? 40}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: styles.heading.fontSize || (device === 'mobile' ? '20px' : '30px'),
                      fontWeight: styles.heading.fontWeight || '400',
                      letterSpacing: styles.heading.letterSpacing || 'normal',
                      lineHeight: styles.heading.lineHeight || '1.2',
                      color: styles.heading.textColor || '#fae8be',
                      textAlign: styles.heading.textAlign || 'center',
                      maxWidth: styles.heading.maxWidth || (device === 'mobile' ? '280px' : '500px'),
                    }}
                    className={`absolute p-2 cursor-grab active:cursor-grabbing font-serif rounded-lg transition-all drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] whitespace-pre-line ${
                      selectedElement === 'heading'
                        ? 'ring-2 ring-[#cfa851] bg-black/50 shadow-xl'
                        : 'hover:ring-1 hover:ring-white/40'
                    }`}
                  >
                    <span className="pointer-events-none">{headingText}</span>
                    {selectedElement === 'heading' && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#cfa851] text-zinc-950 text-[9px] font-mono font-bold whitespace-nowrap">
                        Heading ({currentDevicePositions.heading?.x}%, {currentDevicePositions.heading?.y}%)
                      </span>
                    )}
                  </div>
                )}

                {/* Description Draggable Element */}
                {showDescription && (
                  <div
                    onPointerDown={(e) => handlePointerDown('description', e)}
                    style={{
                      left: `${currentDevicePositions.description?.x ?? 50}%`,
                      top: `${currentDevicePositions.description?.y ?? 60}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: styles.description.fontSize || (device === 'mobile' ? '11px' : '13px'),
                      fontWeight: styles.description.fontWeight || '300',
                      lineHeight: styles.description.lineHeight || '1.4',
                      color: styles.description.textColor || '#fae8be',
                      textAlign: styles.description.textAlign || 'center',
                      maxWidth: styles.description.maxWidth || (device === 'mobile' ? '280px' : '440px'),
                    }}
                    className={`absolute p-1.5 cursor-grab active:cursor-grabbing font-sans font-light rounded-lg transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      selectedElement === 'description'
                        ? 'ring-2 ring-[#cfa851] bg-black/50 shadow-xl'
                        : 'hover:ring-1 hover:ring-white/40'
                    }`}
                  >
                    <span className="pointer-events-none">{descriptionText}</span>
                    {selectedElement === 'description' && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#cfa851] text-zinc-950 text-[9px] font-mono font-bold whitespace-nowrap">
                        Description ({currentDevicePositions.description?.x}%, {currentDevicePositions.description?.y}%)
                      </span>
                    )}
                  </div>
                )}

                {/* CTA Button Draggable Element */}
                {showCta && (
                  <div
                    onPointerDown={(e) => handlePointerDown('cta', e)}
                    style={{
                      left: `${currentDevicePositions.cta?.x ?? 50}%`,
                      top: `${currentDevicePositions.cta?.y ?? 80}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute p-1 cursor-grab active:cursor-grabbing rounded-full transition-all ${
                      selectedElement === 'cta'
                        ? 'ring-2 ring-[#cfa851] shadow-2xl'
                        : 'hover:ring-1 hover:ring-white/40'
                    }`}
                  >
                    <div
                      style={{
                        color: styles.cta.textColor || '#140b07',
                        backgroundColor: '#fae8be',
                      }}
                      className="px-4 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 pointer-events-none"
                    >
                      <span>{ctaText}</span>
                    </div>
                    {selectedElement === 'cta' && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#cfa851] text-zinc-950 text-[9px] font-mono font-bold whitespace-nowrap">
                        CTA Button ({currentDevicePositions.cta?.x}%, {currentDevicePositions.cta?.y}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Precision Control Inspector */}
          <div className="lg:col-span-4 p-5 bg-[#140c08] space-y-5 overflow-y-auto max-h-[550px] lg:max-h-none">
            {/* Element Selector Tabs */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2 font-bold">
                Select Active Element to Style &amp; Position
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#1e120b] border border-[#331e13] rounded-xl text-xs">
                {(['subtitle', 'heading', 'description', 'cta'] as TextElementType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedElement(type)}
                    className={`py-1.5 rounded-lg font-semibold capitalize text-[11px] transition cursor-pointer ${
                      selectedElement === type
                        ? 'bg-[#cfa851] text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Coordinates Control */}
            <div className="p-3.5 rounded-2xl bg-[#1b100a] border border-[#342015] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#fae8be] flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span className="capitalize">{selectedElement} Position ({device})</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Left / Top %</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-mono block mb-1">
                    X Axis (Horizontal): {currentElemPos.x}%
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={currentElemPos.x}
                    onChange={(e) => updateCoord('x', Number(e.target.value))}
                    className="w-full accent-[#cfa851] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-mono block mb-1">
                    Y Axis (Vertical): {currentElemPos.y}%
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={currentElemPos.y}
                    onChange={(e) => updateCoord('y', Number(e.target.value))}
                    className="w-full accent-[#cfa851] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Element Text Content */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#fae8be] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#cfa851]" />
                <span className="capitalize">{selectedElement} Text &amp; Copy</span>
              </label>

              {selectedElement === 'subtitle' && (
                <input
                  type="text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b100a] border border-[#342015] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              )}

              {selectedElement === 'heading' && (
                <textarea
                  rows={2}
                  value={headingText}
                  onChange={(e) => setHeadingText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b100a] border border-[#342015] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              )}

              {selectedElement === 'description' && (
                <textarea
                  rows={3}
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b100a] border border-[#342015] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              )}

              {selectedElement === 'cta' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Button Label"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b100a] border border-[#342015] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Target Link (e.g. #coffee-menu)"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b100a] border border-[#342015] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Typography & Color Inspector */}
            <div className="p-3.5 rounded-2xl bg-[#1b100a] border border-[#342015] space-y-3">
              <span className="text-xs font-bold text-[#fae8be] block">
                Typography &amp; Color Style
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Font Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 28px, 1.5rem"
                    value={currentElemStyle.fontSize || ''}
                    onChange={(e) => updateStyle('fontSize', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#140c08] border border-[#331e13] rounded-lg text-xs text-zinc-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Letter Spacing</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.25em, normal"
                    value={currentElemStyle.letterSpacing || ''}
                    onChange={(e) => updateStyle('letterSpacing', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#140c08] border border-[#331e13] rounded-lg text-xs text-zinc-200"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Text Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => updateStyle('textAlign', align)}
                      className={`flex-1 py-1 rounded-lg border text-xs flex items-center justify-center cursor-pointer ${
                        currentElemStyle.textAlign === align
                          ? 'bg-[#cfa851] text-zinc-950 border-[#cfa851]'
                          : 'bg-[#140c08] border-[#331e13] text-zinc-400'
                      }`}
                    >
                      {align === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : align === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1.5">Color Palette</label>
                <div className="flex items-center gap-2">
                  {['#fae8be', '#ffffff', '#cfa851', '#e2d3c2', '#140b07'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateStyle('textColor', hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-6 h-6 rounded-full border border-black/40 cursor-pointer ${
                        currentElemStyle.textColor === hex ? 'ring-2 ring-[#cfa851]' : ''
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={currentElemStyle.textColor || '#fae8be'}
                    onChange={(e) => updateStyle('textColor', e.target.value)}
                    className="w-7 h-7 bg-transparent border-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Visibility toggle for element */}
              <div className="pt-2 border-t border-[#2c1a11] flex items-center justify-between">
                <span className="text-xs text-zinc-300">Show this element</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedElement === 'subtitle') setShowSubtitle(!showSubtitle);
                    if (selectedElement === 'heading') setShowHeading(!showHeading);
                    if (selectedElement === 'description') setShowDescription(!showDescription);
                    if (selectedElement === 'cta') setShowCta(!showCta);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    (selectedElement === 'subtitle' && showSubtitle) ||
                    (selectedElement === 'heading' && showHeading) ||
                    (selectedElement === 'description' && showDescription) ||
                    (selectedElement === 'cta' && showCta)
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {(selectedElement === 'subtitle' && showSubtitle) ||
                  (selectedElement === 'heading' && showHeading) ||
                  (selectedElement === 'description' && showDescription) ||
                  (selectedElement === 'cta' && showCta)
                    ? 'Visible'
                    : 'Hidden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
