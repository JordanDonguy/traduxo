// Silence console.error and console.warn
jest.spyOn(console, 'error').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });

  beforeEach(() => {
      jest.clearAllMocks(); 
  });
