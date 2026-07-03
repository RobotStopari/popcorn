import {
  fetchFirestoreDocument,
  fetchFirestoreDocumentWithAccessToken,
  queryFirestoreByFieldWithAccessToken,
} from './firestore.js';
import { getGoogleAccessToken, parseServiceAccountJson } from './firebase-service-account.js';

function getFirebaseApiKey(env) {
  return env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '';
}

function resolveSiteUrl(env, request) {
  const configured = (env.SITE_URL || env.VITE_SITE_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function resolveLogoUrl(settings, siteUrl) {
  const raw = settings?.logoUrl;
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `${siteUrl}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }
  return `${siteUrl}/assets/images/PopcornNew.png`;
}

const MONTHS_GENITIVE = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

function formatPublishedLabel(post) {
  if (!post?.publishedDate) return '';

  const [year, month, day] = post.publishedDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return '';

  const base = `${day}. ${MONTHS_GENITIVE[month - 1] || ''} ${year}`.trim();
  if (post.publishedTime) return `${base}, ${post.publishedTime}`;
  return base;
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  const withoutTags = String(value || '').replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseAdminEmailList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return [...new Set(
    raw.split(/[,;\n]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.includes('@')),
  )];
}

async function verifyFirebaseIdToken(idToken, env) {
  const apiKey = getFirebaseApiKey(env);
  if (!apiKey) {
    throw new Error('Missing FIREBASE_API_KEY for token verification.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) {
    throw new Error('Invalid Firebase ID token.');
  }

  const payload = await response.json();
  return payload.users?.[0] || null;
}

async function isCallerAllowedToNotify({ user, post, env }) {
  const uid = user.localId;
  const authorUid = post?.author?.uid;
  if (uid && authorUid && uid === authorUid) return true;

  const serviceAccount = parseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!serviceAccount || !uid) return false;

  const accessToken = await getGoogleAccessToken(serviceAccount);
  const profile = await fetchFirestoreDocumentWithAccessToken('users', uid, env, accessToken);
  return profile?.admin === true;
}

async function fetchAdminEmails(env, settings = null) {
  const resolvedSettings = settings || await fetchFirestoreDocument('siteSettings', 'config', env);
  const fromSettings = Array.isArray(resolvedSettings?.blogNotifyEmails)
    ? resolvedSettings.blogNotifyEmails
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter((entry) => entry.includes('@'))
    : [];
  if (fromSettings.length) {
    return [...new Set(fromSettings)];
  }

  const fromEnv = parseAdminEmailList(env.BLOG_NOTIFY_ADMIN_EMAILS);
  if (fromEnv.length) return fromEnv;

  const serviceAccount = parseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!serviceAccount) return [];

  const accessToken = await getGoogleAccessToken(serviceAccount);
  const admins = await queryFirestoreByFieldWithAccessToken(
    'users',
    'admin',
    true,
    env,
    accessToken,
    { limit: 100 },
  );

  return [...new Set(
    admins
      .map((user) => String(user.email || '').trim().toLowerCase())
      .filter((email) => email.includes('@')),
  )];
}

async function sendBrevoEmail({ env, to, subject, htmlContent }) {
  const apiKey = env.BREVO_API_KEY;
  const senderEmail = env.BREVO_SENDER_EMAIL;
  const senderName = env.BREVO_SENDER_NAME || 'Komunita Popcorn';

  if (!apiKey || !senderEmail) {
    throw new Error('Missing BREVO_API_KEY or BREVO_SENDER_EMAIL.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: to.map((email) => ({ email })),
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo send failed (${response.status}): ${text.slice(0, 240)}`);
  }
}

function buildEmailHtml({ post, postUrl, siteUrl, settings = {} }) {
  const title = escapeHtml(post.title);
  const author = escapeHtml(post.author?.label || post.author?.name || 'Neznámý autor');
  const excerpt = escapeHtml(stripHtml(post.body).slice(0, 240));
  const publishedLabel = escapeHtml(formatPublishedLabel(post));
  const logoUrl = escapeHtml(resolveLogoUrl(settings, siteUrl));
  const brandLine1 = escapeHtml(settings?.brandLine1?.trim() || 'Komunita');
  const brandLine2 = escapeHtml(settings?.brandLine2?.trim() || 'Popcorn');
  const coverImage = typeof post.coverImage === 'string' && /^https?:\/\//i.test(post.coverImage.trim())
    ? escapeHtml(post.coverImage.trim())
    : '';

  const orange = '#faa908';
  const orangePale = '#ffbe3d';
  const black = '#111111';
  const offWhite = '#faf9f7';
  const gray = '#6b6b6b';
  const red = '#d62839';
  const white = '#ffffff';

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${offWhite};font-family:'Poppins',Arial,Helvetica,sans-serif;color:${black};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${offWhite};border-collapse:separate;border-spacing:0;">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="background:linear-gradient(135deg, ${orangePale} 0%, ${orange} 52%, #e89400 100%);border:3px solid ${black};border-bottom:none;border-radius:16px 16px 0 0;padding:22px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
                <tr>
                  <td width="72" valign="middle" style="padding-right:14px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td align="center" valign="middle" style="width:58px;height:58px;background:${white};border:3px solid ${black};border-radius:12px;">
                          <img src="${logoUrl}" alt="${brandLine2}" height="42" style="display:block;height:42px;width:auto;max-width:48px;border:0;outline:none;text-decoration:none;">
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle">
                    <div style="font-size:14px;font-weight:600;line-height:1.2;color:${black};">${brandLine1}</div>
                    <div style="font-size:24px;font-weight:800;line-height:1.05;color:${black};letter-spacing:-0.02em;">${brandLine2}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${white};border:3px solid ${black};border-top:none;border-radius:0 0 16px 16px;padding:0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
                <tr>
                  <td style="padding:24px 24px 8px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${red};">
                      Nový blogový příspěvek
                    </p>
                    <p style="margin:0;font-size:15px;line-height:1.55;color:${gray};">
                      Na webu byl právě publikován nový příspěvek.
                    </p>
                  </td>
                </tr>
                ${coverImage ? `
                <tr>
                  <td style="padding:0 24px 16px;">
                    <img src="${coverImage}" alt="" width="512" style="display:block;width:100%;max-width:100%;height:auto;border:3px solid ${black};border-radius:12px;">
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:${coverImage ? '0' : '8px'} 24px 0;">
                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;line-height:1.25;color:${black};letter-spacing:-0.02em;">
                      ${title}
                    </h1>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:0 0 16px;">
                      <tr>
                        ${publishedLabel ? `
                        <td style="padding-right:16px;font-size:13px;font-weight:700;color:${red};white-space:nowrap;">
                          ${publishedLabel}
                        </td>
                        ` : ''}
                        <td style="font-size:13px;font-weight:600;color:${gray};">
                          Autor: <span style="color:${black};">${author}</span>
                        </td>
                      </tr>
                    </table>
                    ${excerpt ? `
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${gray};">
                      ${excerpt}${stripHtml(post.body).length > 240 ? '…' : ''}
                    </p>
                    ` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 28px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td style="background:${orange};border:3px solid ${black};border-radius:10px;">
                          <a href="${escapeHtml(postUrl)}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;line-height:1;color:${black};text-decoration:none;">
                            Otevřít příspěvek
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${gray};">
                Tato zpráva byla odeslána z webu
                <a href="${escapeHtml(siteUrl)}" style="color:${black};font-weight:700;text-decoration:underline;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
              </p>
              <p style="margin:0;font-size:12px;color:${gray};">
                ${brandLine1} ${brandLine2}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function handleBlogNotifyCreatedRequest(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = request.headers.get('Authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return Response.json({ error: 'Missing Authorization bearer token.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const postId = typeof body?.postId === 'string' ? body.postId.trim() : '';
  if (!postId) {
    return Response.json({ error: 'Missing postId.' }, { status: 400 });
  }

  try {
    const user = await verifyFirebaseIdToken(idToken, env);
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const post = await fetchFirestoreDocument('blogPosts', postId, env);
    if (!post?.title || !post?.slug) {
      return Response.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const allowed = await isCallerAllowedToNotify({ user, post, env });
    if (!allowed) {
      return Response.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const siteSettings = await fetchFirestoreDocument('siteSettings', 'config', env);
    const adminEmails = await fetchAdminEmails(env, siteSettings);
    if (!adminEmails.length) {
      return Response.json({
        ok: true,
        skipped: true,
        reason: 'No admin notification emails configured.',
      });
    }

    const siteUrl = resolveSiteUrl(env, request);
    const postUrl = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
    const subject = `Nový blogový příspěvek: ${post.title}`;
    const htmlContent = buildEmailHtml({
      post,
      postUrl,
      siteUrl,
      settings: siteSettings || {},
    });

    await sendBrevoEmail({
      env,
      to: adminEmails,
      subject,
      htmlContent,
    });

    return Response.json({
      ok: true,
      recipients: adminEmails.length,
      triggeredBy: user.email || user.localId || null,
    });
  } catch (error) {
    console.error('Blog notify failed:', error);
    return Response.json(
      { error: error.message || 'Notification failed.' },
      { status: 500 },
    );
  }
}
