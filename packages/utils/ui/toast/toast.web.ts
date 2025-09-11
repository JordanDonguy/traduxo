import { toast as webToast } from "react-toastify";

export const toast = {
  success: (msg: string) => webToast.success(msg),
  error: (msg: string) => webToast.error(msg),
};
