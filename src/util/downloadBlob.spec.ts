import downloadBlob from './downloadBlob';

describe('util', () => {
  describe('downloadBlob', () => {
    let createObjectURL;
    let revokeObjectURL;

    beforeEach(() => {
      createObjectURL = jest.fn(() => 'blob:fake-url');
      revokeObjectURL = jest.fn();
      (URL as any).createObjectURL = createObjectURL;
      (URL as any).revokeObjectURL = revokeObjectURL;
    });

    it('clicks a download link pointing at the blob', () => {
      const clicks: any[] = [];
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation(tagName => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = () => clicks.push({
            href: element.getAttribute('href'),
            download: element.getAttribute('download'),
          });
        }
        return element;
      });

      const blob = new Blob(['x']);
      downloadBlob('report.xlsx', blob);

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(clicks).toEqual([{href: 'blob:fake-url', download: 'report.xlsx'}]);

      (document.createElement as any).mockRestore();
    });

    it('removes the link from the document', () => {
      downloadBlob('report.xlsx', new Blob(['x']));
      expect(document.querySelectorAll('a')).toHaveLength(0);
    });

    it('revokes the object url only after the click has been processed', () => {
      jest.useFakeTimers();
      try {
        downloadBlob('report.xlsx', new Blob(['x']));
        // Revoking synchronously can cancel a download the browser has only
        // queued, so it must not have happened yet.
        expect(revokeObjectURL).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
