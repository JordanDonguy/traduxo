// Silence noisy console.error logs during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
