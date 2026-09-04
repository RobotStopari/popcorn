import { MONTHS_GENITIVE, parseIsoDate, toIsoDate } from './event-dates';
import { slugifyTitle } from '../data/pages';
import { normalizeEventImageList } from '../data/event-images';
import { BLOG_GALLERY_MAX } from '../data/blog-images';
import { stripRichTextEmbedsForPreview } from './rich-text-embeds';
import { isValidHttpsUrl } from './event-format';
import { adminText } from './admin-text';

export const MAX_BLOG_KEYWORDS = 15;
export const EXTERNAL_BLOG_AUTHOR_UID = 'external';

function decodeHtmlEntities(text) {
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value;
  }

  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html) {
  if (!html) return '';
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function bodyToPreviewPlain(html) {
  return stripHtml(stripRichTextEmbedsForPreview(html));
}

export function getBlogPublishedDateTime(post) {
  if (!post.publishedDate) return new Date(0);
  return new Date(`${post.publishedDate}T${post.publishedTime || '00:00'}`);
}

export function formatBlogDateTimeLabel(post) {
  if (!post.publishedDate) return '—';

  const date = parseIsoDate(post.publishedDate);
  const base = `${date.getDate()}. ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;

  if (post.publishedTime) {
    return `${base}, ${post.publishedTime}`;
  }

  return base;
}

export function normalizeKeywords(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, MAX_BLOG_KEYWORDS);
}

export function normalizeAuthor(raw = {}) {
  const name = raw.name?.trim() || '';
  const nick = raw.nick?.trim() || '';
  const photoURL = raw.photoURL?.trim() || '';
  const label = raw.label?.trim() || nick || name.split(/\s+/)[0] || 'Autor';

  return {
    uid: raw.uid || '',
    name,
    nick,
    photoURL,
    label,
  };
}

export function formatAuthorDisplayName(author) {
  const name = author?.name?.trim() || '';
  const nick = author?.nick?.trim() || '';

  if (name && nick) return `${name} – ${nick}`;
  if (name) return name;
  if (nick) return nick;
  return author?.label?.trim() || 'Autor';
}

export function getAuthorNameParts(author) {
  const name = author?.name?.trim() || '';
  const nick = author?.nick?.trim() || '';

  if (name && nick) return { name, nick };
  if (name) return { name, nick: '' };
  if (nick) return { name: nick, nick: '' };
  return { name: author?.label?.trim() || 'Autor', nick: '' };
}

export function getAuthorPageKey(author) {
  if (!author?.uid) return '';

  if (author.uid === EXTERNAL_BLOG_AUTHOR_UID) {
    const label = author.name?.trim() || author.label?.trim() || 'autor';
    return `ext-${slugifyTitle(label)}`;
  }

  return author.uid;
}

export function blogAuthorUrl(author) {
  const key = getAuthorPageKey(author);
  return key ? `/blog/autor/${encodeURIComponent(key)}` : '';
}

export function postMatchesAuthorKey(post, authorKey) {
  if (!post?.author || !authorKey) return false;

  if (authorKey.startsWith('ext-')) {
    return post.author.uid === EXTERNAL_BLOG_AUTHOR_UID
      && getAuthorPageKey(post.author) === authorKey;
  }

  return post.author.uid === authorKey;
}

export function filterPostsByAuthor(posts, authorKey) {
  if (!authorKey) return posts;
  return posts.filter((post) => postMatchesAuthorKey(post, authorKey));
}

export function resolveAuthorFromPosts(posts, authorKey) {
  const match = posts.find((post) => postMatchesAuthorKey(post, authorKey));
  return match?.author || null;
}

export function enrichAuthor(author, userRecord = null) {
  if (!author) return author;
  if (!userRecord) return author;

  const name = author.name || userRecord.name?.trim() || userRecord.displayName?.trim() || '';
  const nick = author.nick || userRecord.nick?.trim() || '';
  const photoURL = author.photoURL || userRecord.photoURL?.trim() || '';

  return {
    ...author,
    name,
    nick,
    photoURL,
    email: author.email || userRecord.email?.trim() || '',
    label: formatAuthorDisplayName({ name, nick, label: author.label }),
  };
}

export function resolveAuthorForDisplay(author, { usersByUid = {}, profile, user } = {}) {
  if (!author) {
    return buildAuthorSnapshot(profile, user);
  }

  if (author.uid && user?.uid && author.uid === user.uid) {
    return enrichAuthor(author, {
      ...profile,
      photoURL: profile?.photoURL || user?.photoURL || author.photoURL,
      email: profile?.email || user?.email || author.email,
    });
  }

  if (author.uid && usersByUid[author.uid]) {
    return enrichAuthor(author, usersByUid[author.uid]);
  }

  return author;
}

export function getBlogExcerpt(post, maxLength = 100) {
  const text = bodyToPreviewPlain(post.body || '');
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function getBlogGalleryImages(post) {
  return (post.galleryImages || []).map((item, index) => ({
    src: item.url,
    alt: item.alt || `Fotografie ${index + 1}`,
  }));
}

export function normalizeBlogPost(raw) {
  const author = normalizeAuthor(raw.author);
  const keywords = normalizeKeywords(raw.keywords);
  const isExternal = raw.isExternal === true;
  const externalUrl = isExternal ? (raw.externalUrl?.trim() || '') : '';

  const post = {
    id: raw.id,
    title: raw.title?.trim() || '',
    slug: raw.slug?.trim() || '',
    body: raw.body || '',
    publishedDate: raw.publishedDate || '',
    publishedTime: raw.publishedTime || '',
    author,
    keywords,
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId.trim().slice(0, 40) : '',
    coverImage: raw.coverImage?.trim() || '',
    coverPublicId: raw.coverPublicId?.trim() || '',
    coverPatternSeed: typeof raw.coverPatternSeed === 'string'
      ? raw.coverPatternSeed.trim().slice(0, 80)
      : '',
    galleryImages: isExternal
      ? []
      : normalizeEventImageList(raw.galleryImages, BLOG_GALLERY_MAX),
    isExternal,
    externalUrl,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };

  const normalized = {
    ...post,
    likeCount: Number.isFinite(raw.likeCount) ? raw.likeCount : 0,
    commentCount: Number.isFinite(raw.commentCount) ? raw.commentCount : 0,
    dateTimeLabel: formatBlogDateTimeLabel(post),
    bodyPlain: stripHtml(post.body),
    authorLabel: formatAuthorDisplayName(author),
    excerpt: getBlogExcerpt({ body: post.body }),
    hasCoverImage: Boolean(post.coverImage),
    hasExternalLink: isExternal && isValidHttpsUrl(externalUrl),
  };

  return normalized;
}

export function sortPostsByPublished(posts, descending = true) {
  return [...posts].sort((a, b) => {
    const diff = getBlogPublishedDateTime(a) - getBlogPublishedDateTime(b);
    return descending ? -diff : diff;
  });
}

function scorePostMatch(post, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;

  if (post.title.toLowerCase().includes(q)) return 5;

  if (post.keywords.some((keyword) => keyword.toLowerCase().includes(q))) return 4;

  if (
    formatAuthorDisplayName(post.author).toLowerCase().includes(q)
    || post.author.name.toLowerCase().includes(q)
    || post.author.nick.toLowerCase().includes(q)
  ) {
    return 3;
  }

  const dateHay = `${post.publishedDate} ${post.publishedTime} ${post.dateTimeLabel}`.toLowerCase();
  if (dateHay.includes(q)) return 2;

  if (post.bodyPlain.toLowerCase().includes(q)) return 1;

  return 0;
}

export function filterPostsBySearch(posts, query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return sortPostsByPublished(posts);

  return posts
    .map((post) => ({ post, score: scorePostMatch(post, trimmed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return getBlogPublishedDateTime(b.post) - getBlogPublishedDateTime(a.post);
    })
    .map((item) => item.post);
}

export function parseKeywordsInput(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_BLOG_KEYWORDS);
}

export function keywordsToInput(keywords) {
  return keywords.join(', ');
}

export function buildAuthorSnapshot(profile, user) {
  const name = profile?.name?.trim() || profile?.displayName?.trim() || user?.displayName?.trim() || '';
  const nick = profile?.nick?.trim() || '';
  const photoURL = profile?.photoURL?.trim() || user?.photoURL?.trim() || '';

  return {
    uid: user?.uid || '',
    name,
    nick,
    photoURL,
    label: formatAuthorDisplayName({ name, nick, label: '' }),
  };
}

export function buildExternalAuthorSnapshot(name) {
  const trimmed = name?.trim() || '';
  return {
    uid: EXTERNAL_BLOG_AUTHOR_UID,
    name: trimmed,
    nick: '',
    photoURL: '',
    label: trimmed || 'Autor',
  };
}

export function resolveUniqueSlug(posts, baseSlug, excludeId = null) {
  const normalized = baseSlug?.trim() || 'prispevek';
  let slug = normalized;
  let suffix = 2;

  while (isSlugTaken(posts, slug, excludeId)) {
    slug = `${normalized}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function isSlugTaken(posts, slug, excludeId = null) {
  return posts.some((post) => post.slug === slug && post.id !== excludeId);
}

export function getPublishTimestamp(now = new Date()) {
  return {
    publishedDate: toIsoDate(now),
    publishedTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}

export function blogPostToFormState(post) {
  if (!post) {
    return {
      isExternal: false,
      title: '',
      slug: '',
      body: '',
      keywordsInput: '',
      categoryId: '',
      coverImage: '',
      coverPublicId: '',
      coverPatternSeed: '',
      galleryImages: [],
      externalUrl: '',
      externalAuthorName: '',
    };
  }

  return {
    isExternal: post.isExternal === true,
    title: post.title || '',
    slug: post.slug || '',
    body: post.body || '',
    keywordsInput: keywordsToInput(post.keywords),
    categoryId: post.categoryId || '',
    coverImage: post.coverImage || '',
    coverPublicId: post.coverPublicId || '',
    coverPatternSeed: post.coverPatternSeed || '',
    galleryImages: post.galleryImages || [],
    externalUrl: post.externalUrl || '',
    externalAuthorName: post.isExternal ? (post.author?.name || '') : '',
  };
}

export function formStateToBlogPayload(form, { author = null, posts = [], excludeId = null } = {}) {
  const isExternal = form.isExternal === true;
  const keywords = parseKeywordsInput(form.keywordsInput);
  const baseSlug = isExternal
    ? suggestSlugFromTitle(form.title)
    : form.slug.trim();

  const payload = {
    title: form.title.trim(),
    slug: isExternal ? resolveUniqueSlug(posts, baseSlug, excludeId) : baseSlug,
    body: form.body || '',
    keywords,
    categoryId: typeof form.categoryId === 'string' ? form.categoryId.trim().slice(0, 40) : '',
    coverImage: form.coverImage?.trim() || '',
    coverPublicId: form.coverPublicId?.trim() || '',
    coverPatternSeed: typeof form.coverPatternSeed === 'string'
      ? form.coverPatternSeed.trim().slice(0, 80)
      : '',
    galleryImages: isExternal
      ? []
      : normalizeEventImageList(form.galleryImages, BLOG_GALLERY_MAX),
    isExternal,
    externalUrl: isExternal ? form.externalUrl.trim() : '',
  };

  if (author) {
    payload.author = author;
  }

  return payload;
}

export function suggestSlugFromTitle(title) {
  return slugifyTitle(title);
}

export function validateBlogForm(form, { allowExternal = false } = {}) {
  if (!form.title.trim()) {
    return adminText('blog.form.errors.titleRequired');
  }

  if (form.title.trim().length > 200) {
    return adminText('blog.form.errors.titleTooLong');
  }

  const keywords = parseKeywordsInput(form.keywordsInput);
  if (keywords.length > MAX_BLOG_KEYWORDS) {
    return adminText('blog.form.errors.keywordsTooMany', { max: MAX_BLOG_KEYWORDS });
  }

  if (form.isExternal && allowExternal) {
    if (!form.externalUrl.trim()) {
      return adminText('blog.form.errors.externalUrlRequired');
    }

    if (!isValidHttpsUrl(form.externalUrl)) {
      return adminText('blog.form.errors.externalUrlInvalid');
    }

    if (!form.externalAuthorName.trim()) {
      return adminText('blog.form.errors.externalAuthorRequired');
    }

    return null;
  }

  if (!form.slug.trim()) {
    return adminText('blog.form.errors.slugRequired');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
    return adminText('blog.form.errors.slugInvalid');
  }

  const bodyText = stripHtml(form.body);
  if (!bodyText) {
    return adminText('blog.form.errors.bodyRequired');
  }

  return null;
}
