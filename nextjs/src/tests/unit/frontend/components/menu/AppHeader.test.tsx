/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import AppHeader from "@/components/menu/AppHeader"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useSuggestion } from "@/lib/client/hooks/translation/useSuggestion"
import { AuthProvider } from "@traduxo/packages/contexts/AuthContext";

// --- Mocks ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}))

jest.mock("@/lib/client/hooks/translation/useSuggestion", () => ({
  useSuggestion: jest.fn(),
}))

jest.mock("@/components/menu/UserMenu", () => ({
  __esModule: true,
  default: () => <div>UserMenu</div>,
}))

jest.mock("@/components/Logo", () => ({
  __esModule: true,
  default: () => <div>Logo</div>,
}))

// Mock instances
const push = jest.fn()
const replace = jest.fn()
const suggestTranslation = jest.fn()

function renderWithAuth(ui: React.ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

const createSearchParamsMock = (params: Record<string, string>) => {
  const urlParams = new URLSearchParams(params);

  // Patch get to match object-like API
  urlParams.get = (key: string) => params[key] || null;

  // Patch forEach with correct signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  urlParams.forEach = (callback: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) => {
    Object.entries(params).forEach(([key, value]) => callback.call(thisArg, value, key, urlParams));
  };

  return urlParams;
};


beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push, replace });
  (usePathname as jest.Mock).mockReturnValue("/current-path");
  (useSearchParams as jest.Mock).mockReturnValue(createSearchParamsMock({}));
  (useSuggestion as jest.Mock).mockReturnValue({ suggestTranslation, isRolling: false });

  push.mockClear();
  replace.mockClear();
  suggestTranslation.mockClear();
})

// ---- Tests ----
describe("AppHeader component", () => {
  // ------ Test 1️⃣ ------
  it("renders UserMenu and Logo", () => {
    renderWithAuth(<AppHeader />)
    expect(screen.getByText("UserMenu")).toBeInTheDocument()
    expect(screen.getByText("Logo")).toBeInTheDocument()
  })

  // ------ Test 2️⃣ ------
  it("calls suggestTranslation when dice buttons are clicked", () => {
    renderWithAuth(<AppHeader />)

    const diceButtons = screen.getAllByRole("button").filter(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-dices")
    )

    diceButtons.forEach(btn => fireEvent.click(btn))
    expect(suggestTranslation).toHaveBeenCalledTimes(diceButtons.length)
  })

  // ------ Test 3️⃣ ------
  it("toggles menu when user button is clicked", () => {
    renderWithAuth(<AppHeader />)

    const userButtons = screen.getAllByRole("button").filter(btn =>
      btn.querySelector("svg")?.classList.contains("lucide-user")
    )

    fireEvent.click(userButtons[0])
    expect(push).toHaveBeenCalledWith("/current-path/?menu=open")

    fireEvent.click(userButtons[0])
    expect(push).toHaveBeenCalledWith("/")
  })

  // ------ Test 4️⃣ ------
  it("opens menu automatically if searchParams has menu=open", () => {
    (useSearchParams as jest.Mock).mockReturnValue(createSearchParamsMock({ menu: "open" }));
    renderWithAuth(<AppHeader />)
    expect(screen.getByText("UserMenu")).toBeInTheDocument()
  })

  // ------ Test 5️⃣ ------
  it("removes submenu param via router.replace if menu not open", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      createSearchParamsMock({ submenu: "login" })
    )

    renderWithAuth(<AppHeader />)
    expect(replace).toHaveBeenCalledWith("/current-path?")
  })

  // ------ Test 6️⃣ ------
  it("adds rolling animation class when isRolling is true", () => {
    (useSuggestion as jest.Mock).mockReturnValue({
      suggestTranslation,
      isRolling: true,
    })
    renderWithAuth(<AppHeader />)

    const diceSvgs = document.querySelectorAll("svg.lucide-dices.animate-dice-roll")

    expect(diceSvgs.length).toBeGreaterThan(0)
  })
})
