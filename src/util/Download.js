class Download {

  constructor(filename, mimeType, content) {
    this.filename = filename;
    this.mimeType = mimeType;
    this.content = content;
  }

  start() {
    const encodedUri = encodeURI(this.content);

    if (window.navigator.msSaveOrOpenBlob) {
      const blob = new Blob([decodeURIComponent(encodedUri)], {
        type: this.mimeType,
      });
      navigator.msSaveBlob(blob, this.filename);
    } else {
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', this.filename);

      document.body.appendChild(link);

      link.click();
    }
  }
}

export default Download;
