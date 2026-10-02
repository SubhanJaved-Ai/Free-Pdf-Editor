'use client';

import React from 'react';
import { BRANDING_CONFIG } from '../../config/branding';
import { LinkedInIcon } from './LinkedInIcon';

interface CreatorBrandingProps {
  variant?: 'toolbar' | 'navbar' | 'footer' | 'pill';
  className?: string;
}

export const CreatorBranding: React.FC<CreatorBrandingProps> = ({
  variant = 'toolbar',
  className = '',
}) => {
  const { name, avatar, linkedInUrl } = BRANDING_CONFIG.creator;
  const isUrlConfigured = Boolean(linkedInUrl && linkedInUrl !== '#');

  const handleLinkedInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isUrlConfigured) {
      e.preventDefault();
    }
  };

  if (variant === 'toolbar') {
    return (
      <a 
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleLinkedInClick}
        className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-surface-container/70 hover:bg-surface-container border border-outline-variant/30 hover:border-[#0A66C2]/40 transition-all shadow-xs group select-none cursor-pointer ${className}`}
        title={`Connect with ${name} on LinkedIn`}
        aria-label={`Connect with ${name} on LinkedIn`}
      >
        {/* Circular Avatar */}
        <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1.5 ring-primary/50 shadow-xs flex-shrink-0 bg-surface-container-high">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Text Byline */}
        <span className="text-[11px] font-medium text-on-surface-variant leading-none whitespace-nowrap">
          Made by <span className="font-semibold text-on-surface group-hover:text-[#0A66C2] transition-colors">{name}</span>
        </span>

        {/* LinkedIn Connection Icon */}
        <span
          className="text-on-surface-variant/70 group-hover:text-[#0A66C2] transition-colors p-0.5 rounded flex items-center justify-center ml-0.5"
          aria-hidden="true"
        >
          <LinkedInIcon size={13} />
        </span>
      </a>
    );
  }

  if (variant === 'navbar') {
    return (
      <a 
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleLinkedInClick}
        className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/90 hover:bg-white hover:border-[#0A66C2]/40 shadow-2xs hover:shadow-xs transition-all group select-none cursor-pointer ${className}`}
        title={`Connect with ${name} on LinkedIn`}
        aria-label={`Connect with ${name} on LinkedIn`}
      >
        {/* Circular Avatar */}
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden ring-2 ring-indigo-500/30 shadow-xs flex-shrink-0 bg-slate-200">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Text Byline */}
        <span className="text-xs font-medium text-slate-600 leading-none whitespace-nowrap">
          Made by <span className="font-bold text-slate-900 group-hover:text-[#0A66C2] transition-colors">{name}</span>
        </span>

        <span className="h-3 w-px bg-slate-200/90" />

        {/* LinkedIn Icon */}
        <span
          className="text-slate-400 group-hover:text-[#0A66C2] transition-colors p-0.5 rounded flex items-center justify-center"
          aria-hidden="true"
        >
          <LinkedInIcon size={14} />
        </span>
      </a>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-3.5 p-2.5 pr-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner group ${className}`}>
        {/* Circular Avatar */}
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkedInClick}
          className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-500/50 hover:ring-[#0A66C2] shadow-md flex-shrink-0 bg-slate-700 cursor-pointer transition-all"
          title={`Connect with ${name} on LinkedIn`}
          aria-label={`Connect with ${name} on LinkedIn`}
        >
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        </a>

        <div className="flex flex-col">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkedInClick}
            className="text-xs font-semibold text-white leading-tight hover:text-indigo-300 transition-colors cursor-pointer"
            title={`Connect with ${name} on LinkedIn`}
          >
            Made by <span className="text-indigo-400 font-bold group-hover:text-[#0A66C2] transition-colors">{name}</span>
          </a>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span>Software Engineer & Creator</span>
            <span className="text-slate-600">•</span>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkedInClick}
              title={`Connect with ${name} on LinkedIn`}
              className="text-slate-400 hover:text-[#0A66C2] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium hover:underline"
              aria-label={`${name}'s LinkedIn profile`}
            >
              <LinkedInIcon size={12} />
              <span className="text-[10px] font-medium text-slate-300 hover:text-[#0A66C2]">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default 'pill'
  return (
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleLinkedInClick}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-100 text-indigo-900 text-xs font-medium cursor-pointer transition-all group ${className}`}
      title={`Connect with ${name} on LinkedIn`}
      aria-label={`Connect with ${name} on LinkedIn`}
    >
      <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-indigo-400 flex-shrink-0">
        <img src={avatar} alt={name} className="w-full h-full object-cover object-top" />
      </div>
      <span>Made by <span className="font-bold">{name}</span></span>
      <span className="text-indigo-600 group-hover:text-[#0A66C2] transition-colors ml-0.5">
        <LinkedInIcon size={12} />
      </span>
    </a>
  );
};

export default CreatorBranding;
