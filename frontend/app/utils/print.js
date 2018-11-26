export function initiatePrinting(blob, filename) {
  // in IE, use proprietary API to trigger file download
  // for everything else, create a link with a data url and then click on it
  // source: http://stackoverflow.com/a/33542499
  // source: http://stackoverflow.com/questions/24007073/open-links-made-by-createobjecturl-in-ie11
  if (window.navigator.msSaveOrOpenBlob) {
    // for IE
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const file_url = URL.createObjectURL(blob);
    const win = window.open(file_url, '_blank');
    if (win) {
      win.print();
    } else {
      throw new Error('Could not open window');
    }
  }
}
