import { showAuthToasts } from "@/lib/client/utils/ui/authToasts";
import { toast } from "react-toastify";

// Mock react-toastify to avoid real UI toasts during tests
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("showAuthToasts", () => {
  let router: { replace: jest.Mock<void, [url: string]> };
  const originalWindow = global.window;

  // Helper to mock window.location for different test URLs
  const setWindowUrl = (url: string) => {
    const mockLocation: Location = {
      href: url,
      ancestorOrigins: {} as DOMStringList,
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
      toString: () => url,
      hash: "",
      host: "",
      hostname: "",
      origin: "",
      pathname: "",
      port: "",
      protocol: "",
      search: "",
    };

    global.window = { location: mockLocation } as Window & typeof globalThis;
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
    router = { replace: jest.fn() }; // Mock router.replace
    setWindowUrl("http://localhost/"); // Default URL
  });

  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow;
  });

  // ------ Test 1️⃣ ------
  it("does nothing if window is undefined", () => {
    // @ts-expect-error delete window for server-side simulation
    delete global.window;

    expect(() => showAuthToasts(router)).not.toThrow();
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("shows error toast when error param exists", () => {
    setWindowUrl("http://localhost/?error=NoUserFound");

    showAuthToasts(router);

    expect(toast.error).toHaveBeenCalledWith("User not found, please sign up");
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });

  // ------ Test 3️⃣ ------
  it("shows success toast for login", () => {
    setWindowUrl("http://localhost/?login=true");

    showAuthToasts(router);

    expect(toast.success).toHaveBeenCalledWith("Successfully logged in!");
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });

  // ------ Test 4️⃣ ------
  it("shows success toast for logout", () => {
    setWindowUrl("http://localhost/?logout=true");

    showAuthToasts(router);

    expect(toast.success).toHaveBeenCalledWith("Successfully logged out.");
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });

  // ------ Test 5️⃣ ------
  it("shows success toast for account deletion", () => {
    setWindowUrl("http://localhost/?delete=true");

    showAuthToasts(router);

    expect(toast.success).toHaveBeenCalledWith("Accound successfully deleted.");
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });

  // ------ Test 6️⃣ ------
  it("shows success toast for password reset", () => {
    setWindowUrl("http://localhost/?reset-password=true");

    showAuthToasts(router);

    expect(toast.success).toHaveBeenCalledWith(
      "Your password has been updated, you can now login."
    );
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });

  // ------ Test 7️⃣ ------
  it("shows unknown error toast for unrecognized error", () => {
    setWindowUrl("http://localhost/?error=RandomError");

    showAuthToasts(router);

    expect(toast.error).toHaveBeenCalledWith("Unknown authentication error.");
    expect(router.replace).toHaveBeenCalledWith("http://localhost/");
  });
});
