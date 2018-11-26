import detectBrowser from 'detect-browser';

export function isIE10() {
  return detectBrowser.name === 'ie' && detectBrowser.version.startsWith('10.');
}

export function browserName() {
  return detectBrowser.name;
}
