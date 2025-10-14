import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

export async function createReader(res: Response) {
  const text = await res.text();
  const encoder = new TextEncoder();
  let done = false;

  return {
    read: async () => {
      if (done) return { done: true, value: undefined };
      done = true;
      return { done: false, value: encoder.encode(text) };
    },
  };
}
