import Download from './Download';

describe('util', () => {
  describe('Download', () => {
    let appendChildSpy, createElementSpy, mockLink, clickSpy;

    beforeEach(() => {
      clickSpy = jest.fn();
      mockLink = {
        setAttribute: jest.fn(),
        click: clickSpy
      };
      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => node);
      // Ensure msSaveOrOpenBlob is not present
      delete (window.navigator as any).msSaveOrOpenBlob;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('creates a Download with filename, mimeType, and content', () => {
      const dl = new Download('report.csv', 'text/csv', 'data:text/csv,hello');
      expect(dl.filename).toBe('report.csv');
      expect(dl.mimeType).toBe('text/csv');
      expect(dl.content).toBe('data:text/csv,hello');
    });

    it('starts download by creating an anchor element and clicking it', () => {
      const dl = new Download('test.csv', 'text/csv', 'data:text/csv,content');
      dl.start();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', expect.any(String));
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test.csv');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
