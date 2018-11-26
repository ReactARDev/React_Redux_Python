export function initiateDownload(blob, filename) {
  // in IE, use proprietary API to trigger file download
  // for everything else, create a link with a data url and then click on it
  // source: http://stackoverflow.com/a/33542499

  if (window.navigator.msSaveOrOpenBlob) {
    // for IE
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const a = document.createElement('a');
    const file_url = URL.createObjectURL(blob);
    a.href = file_url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(file_url);
  }
}
