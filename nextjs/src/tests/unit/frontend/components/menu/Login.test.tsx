/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "@/components/menu/Login";

// ---- Mock next/image ----
/* eslint-disable @next/next/no-img-element */
jest.mock("next/image", () => {
  const MockedImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} alt={props.alt ?? "mocked-image"} />;
  };
  MockedImage.displayName = "MockedImage";
  return MockedImage;
});

// ---- Mock next/router ----
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// ---- Mock custom hook useAuthHandlers ----
const mockHandleLogin = jest.fn();
const mockHandleSignup = jest.fn();
const mockHandleGoogleButton = jest.fn();
const mockHandleForgotPassword = jest.fn();

jest.mock("@traduxo/packages/hooks/auth/useAuthHandlers", () => ({
  useAuthHandlers: () => ({
    handleLogin: mockHandleLogin,
    handleSignup: mockHandleSignup,
    handleGoogleButton: mockHandleGoogleButton,
    handleForgotPassword: mockHandleForgotPassword,
  }),
}));

// ---- Mock useAuth ----
const mockRefresh = jest.fn();
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: () => ({
    refresh: mockRefresh,
  }),
}));

describe("<Login />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form by default", () => {
    render(<Login showMenu={true} />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("toggles to signup form", () => {
    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    expect(screen.getByTestId("title")).toHaveTextContent("Sign Up");
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign Up$/i })).toBeInTheDocument();
  });

  it("calls handleLogin on submit", () => {
    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });

    fireEvent.submit(screen.getByTestId("login-form"));

    expect(mockHandleLogin).toHaveBeenCalledWith(
      "test@example.com",
      "password",
      expect.any(Function),
      expect.any(Function),
      mockRefresh
    );
  });

  it("calls handleSignup on submit when in signup mode", () => {
    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "password" } });

    fireEvent.submit(screen.getByTestId("login-form"));

    expect(mockHandleSignup).toHaveBeenCalledWith(
      "new@example.com",
      "password",
      "password",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("calls handleGoogleButton when Google button clicked", () => {
    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));
    expect(mockHandleGoogleButton).toHaveBeenCalled();
  });

  it("calls handleForgotPassword when clicked", async () => {
    mockHandleForgotPassword.mockResolvedValue({ success: true });

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "forgot@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Forgot your password/i }));

    await waitFor(() => {
      expect(mockHandleForgotPassword).toHaveBeenCalledWith(
        "forgot@example.com",
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it("applies opacity-100 when showMenu is true", () => {
    render(<Login showMenu={true} />);
    const form = screen.getByTestId("login-form");
    expect(form).toHaveClass("opacity-100");
  });

  it("applies opacity-0 when showMenu is false", () => {
    render(<Login showMenu={false} />);
    const form = screen.getByTestId("login-form");
    expect(form).toHaveClass("opacity-0");
  });

  it("shows loading spinner when isLoading is true", () => {
    mockHandleLogin.mockImplementation((_email, _password, _setError, setIsLoading) => setIsLoading(true));

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByTestId("login-form"));

    expect(screen.getByText((_content, el) => el?.classList.contains("spinner") ?? false)).toBeInTheDocument();

    const container = screen.getByLabelText("Password").closest("div")!.parentElement;
    expect(container).toHaveClass("opacity-60");
  });

  it("shows error message when error state is set", () => {
    mockHandleLogin.mockImplementation((_email, _password, setError) => setError("Invalid credentials"));

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass" } });
    fireEvent.submit(screen.getByTestId("login-form"));

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.getByText("Invalid credentials")).toHaveClass("text-red-500");
  });

  it("navigates to /?login=true on successful login", async () => {
    mockHandleLogin.mockResolvedValueOnce(true);

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?login=true");
    });
  });

  it("navigates to /?login=true on successful signup", async () => {
    mockHandleSignup.mockResolvedValueOnce(true);

    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?login=true");
    });
  });
});
