export function truncate(str, length) {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - 1) + '…'; // eslint-disable-line prefer-template
}

export function verifyEmail(email) {
  return /^[A-Za-z0-9._%\-+&?#]+@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})+$/.test(email);
}
