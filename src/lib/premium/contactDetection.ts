export function containsContactInfo(content: string): boolean {
  const text = content.trim();
  if (!text) return false;

  const phone = /(^|[^0-9])(?:\+?[0-9]{1,3}[\s().-]?)?(?:\(?[0-9]{3}\)?[\s.-]?)?[0-9]{3}[\s.-]?[0-9]{4}([^0-9]|$)/i;
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const instagram = /(?:instagram\.com\/|ig:\s*|(?:^|\s)@[a-z0-9_.]{2,})/i;
  const facebook = /(?:facebook\.com\/|fb\.com\/)/i;
  const telegram = /(?:t\.me\/|telegram(?:\.me)?\/|(?:^|\s)telegram\b)/i;
  const whatsapp = /(?:wa\.me\/|whatsapp(?:\.com)?\/|(?:^|\s)whatsapp\b)/i;

  return phone.test(text) || email.test(text) || instagram.test(text) || facebook.test(text) || telegram.test(text) || whatsapp.test(text);
}
