class Download {

  filename: string;
  mimeType: string;
  content: string;

  constructor(filename, mimeType, content) {
    this.filename = filename;
    this.mimeType = mimeType;
    this.content = content;
  }

  start() {
    const encodedUri = encodeURI(this.content);

    if ((window.navigator as any).msSaveOrOpenBlob) {
      const blob = new Blob([decodeURIComponent(encodedUri)], {
        type: this.mimeType,
      });
      (navigator as any).msSaveBlob(blob, this.filename);
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
