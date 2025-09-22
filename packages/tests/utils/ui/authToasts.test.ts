import { showAuthToasts } from "@traduxo/packages/utils/ui/authToasts";

const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
};

describe("showAuthToasts", () => {
  let cleanCallback: jest.Mock;

  beforeEach(() => {
    cleanCallback = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("prevents duplicate toasts for same params", () => {
    const params = { login: true };
    showAuthToasts(mockToast, params, cleanCallback);
    showAuthToasts(mockToast, params, cleanCallback);

    expect(mockToast.success).toHaveBeenCalledTimes(1);
    expect(cleanCallback).toHaveBeenCalledTimes(1);
  });

  // ------ Test 2️⃣ ------
  it("does nothing if params are empty", () => {
    const cleanCallback = jest.fn();
    showAuthToasts(mockToast, {}, cleanCallback);

    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(cleanCallback).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("shows error toast when error param exists", () => {
    showAuthToasts(mockToast, { error: "NoUserFound" }, cleanCallback);
    expect(mockToast.error).toHaveBeenCalledWith("User not found, please sign up");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("shows success toast for login", () => {
    showAuthToasts(mockToast, { login: true }, cleanCallback);
    expect(mockToast.success).toHaveBeenCalledWith("Successfully logged in!");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("shows success toast for logout", () => {
    showAuthToasts(mockToast, { logout: true }, cleanCallback);
    expect(mockToast.success).toHaveBeenCalledWith("Successfully logged out.");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("shows success toast for account deletion", () => {
    showAuthToasts(mockToast, { delete: true }, cleanCallback);
    expect(mockToast.success).toHaveBeenCalledWith("Account successfully deleted.");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 7️⃣ ------
  it("shows success toast for password reset", () => {
    showAuthToasts(mockToast, { resetPassword: true }, cleanCallback);
    expect(mockToast.success).toHaveBeenCalledWith(
      "Your password has been updated, you can now login."
    );
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 8️⃣ ------
  it("shows unknown error toast for unrecognized error", () => {
    showAuthToasts(mockToast, { error: "RandomError" }, cleanCallback);
    expect(mockToast.error).toHaveBeenCalledWith("Unknown authentication error.");
    expect(cleanCallback).toHaveBeenCalled();
  });
});
