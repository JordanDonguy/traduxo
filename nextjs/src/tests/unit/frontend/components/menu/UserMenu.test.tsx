/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import UserMenu from "@/components/menu/UserMenu";
import { useTheme } from "next-themes";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";

// ---- Mock modules/hooks ----
const mockSetShowLoginForm = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetTheme = jest.fn();

// Mock AppContext
jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  useApp: () => ({
    showLoginForm: false,
    setShowLoginForm: mockSetShowLoginForm,
  }),
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock AuthContext
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    status: "unauthenticated",
    token: undefined,
    providers: ["Credentials"],
    refresh: jest.fn(),
  })),
}));

// Mock useAuthHandlers
const handleLogoutMock = jest.fn();
jest.mock("@traduxo/packages/hooks/auth/useAuthHandlers", () => ({
  useAuthHandlers: () => ({
    handleLogout: handleLogoutMock,
  }),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Moon: () => <div>Moon</div>,
  Sun: () => <div>Sun</div>,
  User: () => <div>User</div>,
  LogOut: () => <div>LogOut</div>,
  Lock: () => <div>Lock</div>,
  CircleArrowLeft: () => <div>CircleArrowLeft</div>,
  CircleX: () => <div>CircleX</div>,
  BadgeMinus: () => <div>BadgeMinus</div>,
  History: () => <div>History</div>,
  Star: () => <div>Star</div>,
  Languages: () => <div>Languages</div>,
  Shield: () => <div>Shield</div>,
}));

// Mock subcomponents
// Login Mock
jest.mock("@/components/menu/Login", () => {
  const Login = () => <div data-testid="login">Login</div>;
  Login.displayName = "Login";
  return Login;
});

// ChangePassword Mock
jest.mock("@/components/menu/ChangePassword", () => {
  const ChangePassword = () => <div data-testid="change-password">ChangePassword</div>;
  ChangePassword.displayName = "ChangePassword";
  return ChangePassword;
});

// DeleteAccount Mock
jest.mock("@/components/menu/DeleteAccount", () => {
  const DeleteAccount = () => <div data-testid="delete-account">DeleteAccount</div>;
  DeleteAccount.displayName = "DeleteAccount";
  return DeleteAccount;
});

// TranslationHistory Mock
jest.mock("@/components/menu/TranslationHistory", () => {
  const TranslationHistory = () => <div data-testid="history">TranslationHistory</div>;
  TranslationHistory.displayName = "TranslationHistory";
  return TranslationHistory;
});

// FavoriteTranslations Mock
jest.mock("@/components/menu/FavoriteTranslations", () => {
  const FavoriteTranslations = () => <div data-testid="favorites">FavoriteTranslation</div>;
  FavoriteTranslations.displayName = "FavoriteTranslations";
  return FavoriteTranslations;
});

// ExplanationLanguage Mock
jest.mock("@/components/menu/ExplanationLanguage", () => {
  const ExplanationLanguage = () => <div data-testid="explanation-language">ExplanationLanguage</div>;
  ExplanationLanguage.displayName = "ExplanationLanguage";
  return ExplanationLanguage;
});

// ---- Tests ----
describe("<UserMenu />", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === "(prefers-color-scheme: dark)", // set true/false as needed
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated, but might be called
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    // Reset theme mock
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    });
    // Reset auth mock
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: null,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });
  });

  // ------- Test 1️⃣ -------
  it("renders top-level menu when mounted", () => {
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    expect(screen.getByText("User Settings")).toBeInTheDocument();
    expect(screen.getByText("Theme (light)")).toBeInTheDocument();
    expect(screen.getByText("Explanation language")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /History/i })).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("Privacy policy")).toBeInTheDocument();
  });

  // ------- Test 2️⃣ -------
  it("toggles theme on button click", () => {
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const themeButton = screen.getByText(/Theme/i).closest("button")!;
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  // ------- Test 3️⃣ -------
  it("opens Explanation language submenu", () => {
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const explButton = screen.getByText("Explanation language").closest("button")!;
    fireEvent.click(explButton);
    expect(mockPush).toHaveBeenCalledWith("/?menu=open&submenu=explanationLang");
  });

  // ------- Test 4️⃣ -------
  it("opens Login submenu if unauthenticated", () => {
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const loginButton = screen.getByText("Login").closest("button")!;
    fireEvent.click(loginButton);
    expect(mockPush).toHaveBeenCalledWith("/?menu=open&submenu=login");
  });

  // ------- Test 5️⃣ -------
  it("renders authenticated buttons when session exists", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    expect(screen.getByText("Change password")).toBeInTheDocument();
    expect(screen.getByText("Log Out")).toBeInTheDocument();
    expect(screen.getByText("Delete account")).toBeInTheDocument();
  });

  // ------- Test 6️⃣ -------
  it("opens login submenu automatically when showLoginForm is true", () => {
    const mockSetShowLoginFormLocal = jest.fn();
    const mockPushLocal = jest.fn();

    // Spy on useApp and override its return value
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const useAppSpy = jest.spyOn(require("@traduxo/packages/contexts/AppContext"), "useApp");
    useAppSpy.mockReturnValue({
      showLoginForm: true,
      setShowLoginForm: mockSetShowLoginFormLocal,
      error: "",
      setError: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
    });

    // Spy on useRouter and override push
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const useRouterSpy = jest.spyOn(require("next/navigation"), "useRouter");
    useRouterSpy.mockReturnValue({
      push: mockPushLocal,
      replace: jest.fn(),
    });

    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // useEffect should run immediately after mount
    expect(mockPushLocal).toHaveBeenCalledWith("/?menu=open&submenu=login");
    expect(mockSetShowLoginFormLocal).toHaveBeenCalledWith(false);

    // Login submenu is visible
    expect(screen.getByText("Login")).toBeInTheDocument();

    // Cleanup spies
    useAppSpy.mockRestore();
    useRouterSpy.mockRestore();
  });

  // ------- Test 7️⃣ -------
  it("calls router.replace on Back to Menu and Close Menu buttons", () => {
    const mockReplaceLocal = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const useRouterSpy = jest.spyOn(require("next/navigation"), "useRouter");
    useRouterSpy.mockReturnValue({
      push: jest.fn(),
      replace: mockReplaceLocal,
    });

    // Render UserMenu with a submenu open to show Back to Menu button
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // Simulate a submenu being open
    fireEvent.click(screen.getByText("Login").closest("button")!);

    // Back to Menu button should exist now
    const backButton = screen.getByText("CircleArrowLeft").closest("button")!;
    fireEvent.click(backButton);
    expect(mockReplaceLocal).toHaveBeenCalledWith("/?menu=open");

    // Close Menu button
    const closeButton = screen.getByText("CircleX").closest("button")!;
    fireEvent.click(closeButton);
    expect(mockReplaceLocal).toHaveBeenCalledWith("/");

    useRouterSpy.mockRestore();
  });

  // ------- Test 8️⃣ -------
  it("handles History, Favorites, Privacy, and authenticated actions clicks", () => {
    const mockPushLocal = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const useRouterSpy = jest.spyOn(require("next/navigation"), "useRouter");
    useRouterSpy.mockReturnValue({ push: mockPushLocal, replace: jest.fn() });

    // Mock authenticated session
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "my-auth-token",
      providers: ["Credentials"],
      refresh: jest.fn(),
    });

    // HISTORY BUTTON
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const historyButton = screen.getByRole("button", { name: /History/i });
    fireEvent.click(historyButton);
    expect(mockPushLocal).toHaveBeenCalledWith("/?menu=open&submenu=history");

    // FAVORITES BUTTON
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const favButton = screen.getByRole("button", { name: /Favorites/i });
    fireEvent.click(favButton);
    expect(mockPushLocal).toHaveBeenCalledWith("/?menu=open&submenu=favorites");

    // PRIVACY POLICY
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const privacyButton = screen.getByText("Privacy policy").closest("button")!;
    fireEvent.click(privacyButton);
    expect(mockPushLocal).toHaveBeenCalledWith("/privacy");

    // CHANGE PASSWORD
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const changePwdButton = screen.getByText(/Change password/i).closest("button")!;
    fireEvent.click(changePwdButton);
    expect(mockPushLocal).toHaveBeenCalledWith("/?menu=open&submenu=changePassword");

    // LOG OUT
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    fireEvent.click(screen.getByText(/Log Out/i).closest("button")!);
    expect(handleLogoutMock).toHaveBeenCalledTimes(1);

    // DELETE ACCOUNT
    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);
    const delButton = screen.getByText(/Delete account/i).closest("button")!;
    fireEvent.click(delButton);
    expect(mockPushLocal).toHaveBeenCalledWith("/?menu=open&submenu=deleteAccount");

    useRouterSpy.mockRestore();
  });

  // ------- Test 9️⃣ -------
  it("renders hidden menu when showMenu is false", () => {
    render(<UserMenu showMenu={false} submenu={null} pathname="/" />);

    const menuDiv = screen.getByTestId("user-menu");

    // Check main container classes
    expect(menuDiv).toHaveClass("scale-y-0");
    expect(menuDiv).toHaveClass("bg-[var(--bg)]");

    // Check top-level menu opacity
    const topLevelMenu = screen.getByTestId("top-level-menu");
    expect(topLevelMenu).toHaveClass("opacity-0");
  });

  it("renders Moon icon and toggles to light theme when isDark is true", () => {
    // Mock useTheme to return 'dark'
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    });

    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // Theme button
    const themeButton = screen.getByText(/Theme/i).closest("button")!;

    // Icon rendered should be Moon
    expect(screen.getByText("Moon")).toBeInTheDocument();

    // Click toggles to 'light'
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  // ------- Test 🔟 -------
  it("renders Sun icon and toggles to dark theme when isDark is false", () => {
    // Mock useTheme to return 'light'
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    });

    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    const themeButton = screen.getByText(/Theme/i).closest("button")!;

    // Icon rendered should be Sun
    expect(screen.getByText("Sun")).toBeInTheDocument();

    // Click toggles to 'dark'
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  // ------- Test 1️⃣1️⃣ -------
  it("renders 'Create password' when user is authenticated but has no Credentials provider", () => {
    // Mock authenticated session without Credentials
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
      providers: [],
      refresh: jest.fn(),
    });

    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // The button text should show "Create password"
    expect(screen.getByText("Create password")).toBeInTheDocument();

    // Click the button
    const createPwdButton = screen.getByText("Create password").closest("button")!;
    fireEvent.click(createPwdButton);

    // Router should navigate to changePassword submenu
    expect(mockPush).toHaveBeenCalledWith("/?menu=open&submenu=changePassword");
  });

  // ------- Test 1️⃣2️⃣ -------
  it("detects system dark mode when theme is 'system'", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "system",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    });

    render(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // The button should render Moon since system dark matches
    expect(screen.getByText(/Theme \(system\)/)).toBeInTheDocument();
    expect(screen.getByText("Moon")).toBeInTheDocument();
  });

  it("resets all submenus when submenu is null", () => {
    const { rerender } = render(
      <UserMenu showMenu={true} submenu="history" pathname="/" />
    );

    // simulate that the history submenu is open
    const historyButton = screen.getByRole("button", { name: /History/i });
    fireEvent.click(historyButton);

    // history submenu is rendered
    expect(screen.getByTestId("history")).toBeInTheDocument();

    // Rerender with submenu = null, which should close all submenus
    rerender(<UserMenu showMenu={true} submenu={null} pathname="/" />);

    // All submenus should now be gone
    expect(screen.queryByTestId("history")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login")).not.toBeInTheDocument();
    expect(screen.queryByTestId("change-password")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-account")).not.toBeInTheDocument();
    expect(screen.queryByTestId("favorites")).not.toBeInTheDocument();
    expect(screen.queryByTestId("explanation-language")).not.toBeInTheDocument();
  });
});
