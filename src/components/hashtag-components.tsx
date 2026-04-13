import React from 'react';
import { parseTextWithHashtags } from '../utils/hashtags';

interface HashtagTextProps {
  text: string;
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
  hashtagClassName?: string;
}

/**
 * HashtagText Component
 * Renders text with clickable, styled hashtags
 * 
 * Usage:
 * <HashtagText 
 *   text="Great visit today! #marketvisit #airtel"
 *   onHashtagClick={(tag) => console.log('Clicked:', tag)}
 * />
 */
export function HashtagText({ 
  text, 
  onHashtagClick, 
  className = '',
  hashtagClassName = ''
}: HashtagTextProps) {
  const segments = parseTextWithHashtags(text);
  
  const handleHashtagClick = (tag: string) => {
    if (onHashtagClick) {
      onHashtagClick(tag);
    }
  };
  
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'hashtag') {
          return (
            <span
              key={index}
              onClick={() => handleHashtagClick(segment.tag!)}
              className={`
                text-blue-600 font-semibold cursor-pointer hover:underline 
                hover:text-blue-700 transition-colors
                ${hashtagClassName}
              `}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleHashtagClick(segment.tag!);
                }
              }}
            >
              {segment.content}
            </span>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}

interface HashtagChipProps {
  hashtag: string;
  count?: number;
  selected?: boolean;
  onClick?: (hashtag: string) => void;
  onRemove?: (hashtag: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
}

/**
 * HashtagChip Component
 * Displays a hashtag as a clickable chip/badge
 * 
 * Usage:
 * <HashtagChip 
 *   hashtag="marketvisit"
 *   count={23}
 *   selected={true}
 *   onClick={(tag) => console.log('Clicked:', tag)}
 * />
 */
export function HashtagChip({
  hashtag,
  count,
  selected = false,
  onClick,
  onRemove,
  size = 'md',
  variant = 'default'
}: HashtagChipProps) {
  const cleanTag = hashtag.replace('#', '');
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const variantClasses = {
    default: selected
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
    outline: selected
      ? 'bg-blue-50 text-blue-700 border-blue-600'
      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
    solid: selected
      ? 'bg-blue-700 text-white border-blue-700'
      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
  };
  
  return (
    <button
      onClick={() => onClick?.(cleanTag)}
      className={`
        inline-flex items-center gap-1.5 rounded-full border-2 
        font-medium transition-all whitespace-nowrap
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${selected ? 'shadow-md scale-105' : 'hover:shadow-sm'}
      `}
    >
      <span>#{cleanTag}</span>
      {count !== undefined && (
        <span className={`
          ${selected ? 'opacity-90' : 'opacity-70'}
          font-semibold
        `}>
          {count}
        </span>
      )}
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove(cleanTag);
          }}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

interface HashtagListProps {
  hashtags: Array<{ tag: string; count?: number }>;
  selectedHashtag?: string;
  onHashtagClick?: (hashtag: string) => void;
  maxDisplay?: number;
  showCounts?: boolean;
  variant?: 'default' | 'outline' | 'solid';
  emptyMessage?: string;
}

/**
 * HashtagList Component
 * Displays a list of hashtags as chips
 * 
 * Usage:
 * <HashtagList 
 *   hashtags={[
 *     { tag: 'marketvisit', count: 23 },
 *     { tag: 'airtel', count: 18 }
 *   ]}
 *   selectedHashtag="marketvisit"
 *   onHashtagClick={(tag) => setFilter(tag)}
 * />
 */
export function HashtagList({
  hashtags,
  selectedHashtag,
  onHashtagClick,
  maxDisplay,
  showCounts = true,
  variant = 'default',
  emptyMessage = 'No hashtags available'
}: HashtagListProps) {
  const displayHashtags = maxDisplay ? hashtags.slice(0, maxDisplay) : hashtags;
  
  if (hashtags.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {displayHashtags.map(({ tag, count }) => (
        <HashtagChip
          key={tag}
          hashtag={tag}
          count={showCounts ? count : undefined}
          selected={selectedHashtag === tag}
          onClick={onHashtagClick}
          variant={variant}
        />
      ))}
      {maxDisplay && hashtags.length > maxDisplay && (
        <span className="text-sm text-gray-500 self-center">
          +{hashtags.length - maxDisplay} more
        </span>
      )}
    </div>
  );
}

interface TrendingHashtagsProps {
  hashtags: Array<{ tag: string; count: number }>;
  onHashtagClick?: (hashtag: string) => void;
  title?: string;
  maxDisplay?: number;
}

/**
 * TrendingHashtags Component
 * Displays trending hashtags with animated styling
 * 
 * Usage:
 * <TrendingHashtags 
 *   hashtags={trendingTags}
 *   onHashtagClick={(tag) => setFilter(tag)}
 *   maxDisplay={5}
 * />
 */
export function TrendingHashtags({
  hashtags,
  onHashtagClick,
  title = '🔥 Trending Hashtags',
  maxDisplay = 10
}: TrendingHashtagsProps) {
  const displayHashtags = hashtags.slice(0, maxDisplay);
  
  if (hashtags.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {displayHashtags.map(({ tag, count }, index) => (
          <HashtagChip
            key={tag}
            hashtag={tag}
            count={count}
            onClick={onHashtagClick}
            variant={index < 3 ? 'solid' : 'outline'}
            size={index === 0 ? 'lg' : index < 3 ? 'md' : 'sm'}
          />
        ))}
      </div>
    </div>
  );
}

interface HashtagFilterBarProps {
  selectedHashtag: string | null;
  onClearFilter: () => void;
  postCount?: number;
}

/**
 * HashtagFilterBar Component
 * Shows active hashtag filter with clear button
 * 
 * Usage:
 * {selectedHashtag && (
 *   <HashtagFilterBar 
 *     selectedHashtag={selectedHashtag}
 *     onClearFilter={() => setSelectedHashtag(null)}
 *     postCount={filteredPosts.length}
 *   />
 * )}
 */
export function HashtagFilterBar({
  selectedHashtag,
  onClearFilter,
  postCount
}: HashtagFilterBarProps) {
  if (!selectedHashtag) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 animate-slide-down">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Showing posts with #{selectedHashtag}
            </p>
            {postCount !== undefined && (
              <p className="text-xs text-blue-700">
                {postCount} {postCount === 1 ? 'post' : 'posts'} found
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClearFilter}
          className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          Clear Filter
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
