/**
 * Hashtag Utilities for Airtel Champions
 * Provides functions for extracting, parsing, and rendering hashtags
 */

/**
 * Extracts hashtags from text
 * @param text - Text containing hashtags (e.g., "Great visit! #marketvisit #airtel")
 * @returns Array of lowercase hashtags without # symbol (e.g., ["marketvisit", "airtel"])
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  
  const regex = /#(\w+)/g;
  const matches = text.matchAll(regex);
  const hashtags = Array.from(matches, m => m[1].toLowerCase());
  
  // Remove duplicates
  return [...new Set(hashtags)];
};

/**
 * Checks if text contains a specific hashtag
 * @param text - Text to search
 * @param hashtag - Hashtag to find (with or without #)
 * @returns true if hashtag exists in text
 */
export const containsHashtag = (text: string, hashtag: string): boolean => {
  const cleanTag = hashtag.replace('#', '').toLowerCase();
  const tags = extractHashtags(text);
  return tags.includes(cleanTag);
};

/**
 * Validates if a string is a valid hashtag
 * @param tag - Tag to validate
 * @returns true if valid hashtag (alphanumeric only)
 */
export const isValidHashtag = (tag: string): boolean => {
  const cleanTag = tag.replace('#', '');
  // Must be alphanumeric, 1-50 characters
  return /^[a-zA-Z0-9]{1,50}$/.test(cleanTag);
};

/**
 * Formats hashtag for display
 * @param tag - Hashtag (with or without #)
 * @returns Formatted hashtag with # symbol
 */
export const formatHashtag = (tag: string): string => {
  const cleanTag = tag.replace('#', '').toLowerCase();
  return `#${cleanTag}`;
};

/**
 * Parses text and returns array of text segments and hashtag objects
 * Useful for rendering text with clickable hashtags
 * @param text - Text containing hashtags
 * @returns Array of segments with type and content
 */
export const parseTextWithHashtags = (text: string): Array<{
  type: 'text' | 'hashtag';
  content: string;
  tag?: string; // For hashtags, the tag without #
}> => {
  if (!text) return [];
  
  const segments: Array<{
    type: 'text' | 'hashtag';
    content: string;
    tag?: string;
  }> = [];
  
  const parts = text.split(/(#\w+)/g);
  
  parts.forEach(part => {
    if (part.startsWith('#')) {
      segments.push({
        type: 'hashtag',
        content: part,
        tag: part.slice(1).toLowerCase()
      });
    } else if (part) {
      segments.push({
        type: 'text',
        content: part
      });
    }
  });
  
  return segments;
};

/**
 * Gets hashtag statistics from an array of posts
 * @param posts - Array of posts with captions
 * @returns Array of hashtags with their counts, sorted by popularity
 */
export const getHashtagStats = (posts: Array<{ caption: string }>): Array<{
  tag: string;
  count: number;
}> => {
  const hashtagCounts: { [key: string]: number } = {};
  
  posts.forEach(post => {
    const hashtags = extractHashtags(post.caption);
    hashtags.forEach(tag => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(hashtagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Gets the top N hashtags from posts
 * @param posts - Array of posts
 * @param limit - Number of top hashtags to return
 * @returns Top hashtags sorted by popularity
 */
export const getTopHashtags = (
  posts: Array<{ caption: string }>, 
  limit: number = 10
): Array<{ tag: string; count: number }> => {
  const stats = getHashtagStats(posts);
  return stats.slice(0, limit);
};

/**
 * Filters posts by hashtag
 * @param posts - Array of posts
 * @param hashtag - Hashtag to filter by (with or without #)
 * @returns Filtered posts containing the hashtag
 */
export const filterPostsByHashtag = <T extends { caption: string }>(
  posts: T[],
  hashtag: string
): T[] => {
  const cleanTag = hashtag.replace('#', '').toLowerCase();
  return posts.filter(post => containsHashtag(post.caption, cleanTag));
};

/**
 * Suggests hashtags based on partial input
 * @param input - Partial hashtag input
 * @param existingTags - Array of existing hashtags to search
 * @param limit - Max number of suggestions
 * @returns Array of suggested hashtags
 */
export const suggestHashtags = (
  input: string,
  existingTags: string[],
  limit: number = 5
): string[] => {
  const cleanInput = input.replace('#', '').toLowerCase();
  if (!cleanInput) return [];
  
  const suggestions = existingTags.filter(tag =>
    tag.toLowerCase().startsWith(cleanInput)
  );
  
  return suggestions.slice(0, limit);
};

/**
 * Formats hashtag count for display
 * @param count - Number of posts
 * @returns Formatted string (e.g., "1.2K", "523")
 */
export const formatHashtagCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * Limits the number of hashtags in text
 * @param text - Text with hashtags
 * @param maxHashtags - Maximum allowed hashtags (default: 10)
 * @returns Text with limited hashtags
 */
export const limitHashtags = (text: string, maxHashtags: number = 10): string => {
  const segments = parseTextWithHashtags(text);
  const hashtagSegments = segments.filter(s => s.type === 'hashtag');
  
  if (hashtagSegments.length <= maxHashtags) {
    return text;
  }
  
  // Keep only first N hashtags
  let hashtagCount = 0;
  return segments
    .map(segment => {
      if (segment.type === 'hashtag') {
        hashtagCount++;
        return hashtagCount <= maxHashtags ? segment.content : '';
      }
      return segment.content;
    })
    .join('');
};

/**
 * Validates caption for hashtag count
 * @param caption - Caption text
 * @param maxHashtags - Maximum allowed (default: 10)
 * @returns { valid: boolean, count: number, message?: string }
 */
export const validateHashtagCount = (
  caption: string,
  maxHashtags: number = 10
): { valid: boolean; count: number; message?: string } => {
  const hashtags = extractHashtags(caption);
  const count = hashtags.length;
  
  if (count > maxHashtags) {
    return {
      valid: false,
      count,
      message: `Maximum ${maxHashtags} hashtags allowed. You have ${count}.`
    };
  }
  
  return { valid: true, count };
};

// Common hashtags for Airtel Champions (for autocomplete/suggestions)
export const COMMON_HASHTAGS = [
  'marketvisit',
  'clientmeeting',
  'airtel',
  'sales',
  'fieldwork',
  'activation',
  'airtelmoney',
  'customerservice',
  'teamwork',
  'achievement',
  'newcustomer',
  'shopvisit',
  'airtelbiz',
  'simswap',
  'dataplan',
  'commission',
  'target',
  'winner',
  'topperformer',
  'training'
];
