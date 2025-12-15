/**
 * Convert camelCase to Title Case
 * Example: subscriptionStartDate -> Subscription Start Date
 */
export function camelToTitleCase(str: string): string {
  // Handle already uppercase strings
  if (str === str.toUpperCase()) {
    return str;
  }

  return str
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Handle acronyms (e.g., APIKey -> API Key)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Capitalize first letter
    .replace(/^./, (char) => char.toUpperCase())
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format a date string nicely
 */
export function formatDate(value: any): string {
  if (!value) return '';

  // Try to parse as date
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return String(value);
  }

  // Format as: Dec 14, 2025 at 3:45 PM
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a value looks like a date
 */
export function isDateLike(key: string, value: any): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }

  const lowerKey = key.toLowerCase();
  const dateKeywords = ['date', 'time', 'created', 'updated', 'timestamp', 'at'];
  
  const hasDateKeyword = dateKeywords.some(keyword => lowerKey.includes(keyword));
  
  if (!hasDateKeyword) {
    return false;
  }

  // Try to parse as date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Format any value for display
 */
export function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (typeof value[0] === 'object') {
      return `${value.length} item${value.length !== 1 ? 's' : ''}`;
    }
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0 ? 'See details' : 'Empty';
  }

  // Check if it's a date
  if (isDateLike(key, value)) {
    return formatDate(value);
  }

  return String(value);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Flatten nested objects for display
 */
export function flattenObject(obj: any, prefix: string = ''): Record<string, any> {
  const flattened: Record<string, any> = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (Array.isArray(value)) {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && Object.keys(value).length > 0) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });

  return flattened;
}

