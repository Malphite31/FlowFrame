
export const isValidURL = (string: string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

export const getDomain = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
};

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  url: string;
}

const parseHtml = (html: string, url: string): LinkMetadata => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (prop: string) => 
      doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
      doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

    const title = getMeta('og:title') || doc.querySelector('title')?.innerText || getDomain(url);
    const description = getMeta('og:description') || getMeta('description') || '';
    const image = getMeta('og:image') || '';

    // Handle relative URLs for images
    let absoluteImage = image;
    if (image && !image.startsWith('http') && !image.startsWith('//')) {
      try {
        absoluteImage = new URL(image, url).href;
      } catch {
        absoluteImage = '';
      }
    } else if (image.startsWith('//')) {
        absoluteImage = `https:${image}`;
    }

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      image: absoluteImage
    };
};

// Fetches OpenGraph data using public proxies to bypass CORS
export const fetchLinkMetadata = async (url: string): Promise<LinkMetadata> => {
  // Strategy 1: corsproxy.io (Direct HTML)
  // This is often faster and returns the raw page, allowing for better parsing.
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
        const html = await response.text();
        return parseHtml(html, url);
    }
  } catch (e) {
    // Silent fail, try next strategy
  }

  // Strategy 2: allorigins.win (JSON wrapper)
  // This wraps the response in JSON, useful if the direct fetch is blocked.
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
        const data = await response.json();
        if (data.contents) {
            return parseHtml(data.contents, url);
        }
    }
  } catch (e) {
    // Silent fail
  }

  // Fallback: Just return basic info to ensure UI doesn't break
  return {
      url,
      title: getDomain(url),
      description: 'No preview available',
      image: ''
  };
};
