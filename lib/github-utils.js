/**
 * Encode strictly in UTF-8 before Base64 conversion
 * Essential for Haitian/French special characters
 */
export const safeBase64Encode = (str) => {
  return Buffer.from(unescape(encodeURIComponent(str)), 'binary').toString('base64');
};

/**
 * Decode Base64 back to UTF-8
 */
export const safeBase64Decode = (base64) => {
  return decodeURIComponent(escape(Buffer.atob(base64)));
};
