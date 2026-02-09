export function buildMagicLinkEmail({ to, from, link, householdName, messageStream }) {
  return {
    From: from,
    To: to,
    Subject: `Your magic link for ${householdName || 'Dollar Drip'}`,
    HtmlBody: `<p>Click to sign in:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
    TextBody: `Sign in: ${link}\n\nThis link expires in 24 hours.`,
    MessageStream: messageStream,
  };
}

export function buildOtpEmail({ to, from, code, householdName, messageStream }) {
  return {
    From: from,
    To: to,
    Subject: `Your login code for ${householdName || 'Dollar Drip'}`,
    HtmlBody: `<p>Your one-time code:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${code}</p><p>This code expires in 10 minutes.</p>`,
    TextBody: `Your one-time code: ${code}\n\nThis code expires in 10 minutes.`,
    MessageStream: messageStream,
  };
}
