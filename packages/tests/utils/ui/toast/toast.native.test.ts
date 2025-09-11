import Toast from "react-native-toast-message";
import { toast } from "@traduxo/packages/utils/ui/toast/toast.native";

jest.mock("react-native-toast-message", () => {
  return {
    __esModule: true,
    default: {
      show: jest.fn(),
      hide: jest.fn(),
    },
  };
});

describe("RN toast wrapper", () => {
  const mockShow = Toast.show as jest.Mock;

  // ------ Test 1️⃣ ------
  it("calls Toast.show with success type", () => {
    toast.success("Success message");

    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith({
      type: "success",
      text1: "Success message",
    });
  });

  // ------ Test 2️⃣ ------
  it("calls Toast.show with error type", () => {
    toast.error("Error message");

    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "Error message",
    });
  });
});
