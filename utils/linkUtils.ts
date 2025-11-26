

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
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
        const html = await response.text();
        return parseHtml(html, url);
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 2: allorigins.win
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

  return {
      url,
      title: getDomain(url),
      description: 'No preview available',
      image: ''
  };
};

export interface EmbedInfo {
    type: 'embed';
    url: string; // The embeddable URL (iframe src)
    provider: string;
    originalUrl: string;
    thumbnail?: string;
}

export const getEmbedInfo = (url: string): EmbedInfo | null => {
    // YouTube
    // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const ytRegExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[1]) {
        return {
            type: 'embed',
            url: `https://www.youtube.com/embed/${ytMatch[1]}`,
            provider: 'YouTube',
            originalUrl: url,
            thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`
        };
    }

    // Vimeo
    // Supports: vimeo.com/ID, player.vimeo.com/video/ID
    const vimeoRegExp = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch && vimeoMatch[1]) {
        return {
            type: 'embed',
            url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
            provider: 'Vimeo',
            originalUrl: url
            // Vimeo thumbnails require API call, skipping for sync simplicity
        };
    }

    return null;
};