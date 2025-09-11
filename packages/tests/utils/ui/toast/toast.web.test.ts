/**
 * @jest-environment jsdom
 */
import { toast } from "@traduxo/packages/utils/ui/toast";
import * as webToastModule from "react-toastify";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("toast wrapper", () => {
  // ------ Test 1️⃣ ------
  it("calls webToast.success when toast.success is called", () => {
    toast.success("Success message");
    expect(webToastModule.toast.success).toHaveBeenCalledWith("Success message");
  });

  // ------ Test 2️⃣ ------
  it("calls webToast.error when toast.error is called", () => {
    toast.error("Error message");
    expect(webToastModule.toast.error).toHaveBeenCalledWith("Error message");
  });
});
