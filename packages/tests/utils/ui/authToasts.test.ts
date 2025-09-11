import { showAuthToasts } from "@traduxo/packages/utils/ui/authToasts";
import { toast } from "@traduxo/packages/utils/ui/toast";

jest.mock("@traduxo/packages/utils/ui/toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("showAuthToasts", () => {
  let cleanCallback: jest.Mock;

  beforeEach(() => {
    cleanCallback = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("prevents duplicate toasts for same params", () => {
    const params = { login: true };
    showAuthToasts(params, cleanCallback);
    showAuthToasts(params, cleanCallback);

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(cleanCallback).toHaveBeenCalledTimes(1);
  });

  // ------ Test 2️⃣ ------
  it("does nothing if params are empty", () => {
    const cleanCallback = jest.fn();
    showAuthToasts({}, cleanCallback);

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(cleanCallback).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("shows error toast when error param exists", () => {
    showAuthToasts({ error: "NoUserFound" }, cleanCallback);
    expect(toast.error).toHaveBeenCalledWith("User not found, please sign up");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("shows success toast for login", () => {
    showAuthToasts({ login: true }, cleanCallback);
    expect(toast.success).toHaveBeenCalledWith("Successfully logged in!");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("shows success toast for logout", () => {
    showAuthToasts({ logout: true }, cleanCallback);
    expect(toast.success).toHaveBeenCalledWith("Successfully logged out.");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("shows success toast for account deletion", () => {
    showAuthToasts({ delete: true }, cleanCallback);
    expect(toast.success).toHaveBeenCalledWith("Account successfully deleted.");
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 7️⃣ ------
  it("shows success toast for password reset", () => {
    showAuthToasts({ resetPassword: true }, cleanCallback);
    expect(toast.success).toHaveBeenCalledWith(
      "Your password has been updated, you can now login."
    );
    expect(cleanCallback).toHaveBeenCalled();
  });

  // ------ Test 8️⃣ ------
  it("shows unknown error toast for unrecognized error", () => {
    showAuthToasts({ error: "RandomError" }, cleanCallback);
    expect(toast.error).toHaveBeenCalledWith("Unknown authentication error.");
    expect(cleanCallback).toHaveBeenCalled();
  });
});
