/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "@/components/menu/Login";

// ---- Mock next/image (Next.js requires a custom mock in Jest) ----
jest.mock("next/image", () => {
  const MockedImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? "mocked-image"} />;
  };
  MockedImage.displayName = "MockedImage";
  return MockedImage;
});

// ---- Mock custom hook useAuthHandlers ----
const mockHandleLogin = jest.fn();
const mockHandleSignup = jest.fn();
const mockHandleGoogleButton = jest.fn();
const mockHandleForgotPassword = jest.fn();

jest.mock("@/lib/client/hooks/auth/useAuthForm", () => ({
  useAuthHandlers: () => ({
    handleLogin: mockHandleLogin,
    handleSignup: mockHandleSignup,
    handleGoogleButton: mockHandleGoogleButton,
    handleForgotPassword: mockHandleForgotPassword,
  }),
}));


// ---- Tests ----
describe("<Login />", () => {
  // ------ Test 1️⃣ ------
  it("renders login form by default", () => {
    render(<Login showMenu={true} />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("toggles to signup form", () => {
    render(<Login showMenu={true} />);

    // click the switch button
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    // check the title by testid
    expect(screen.getByTestId("title")).toHaveTextContent("Sign Up");

    // confirm password field should now exist
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();

    // the submit button should still say "Sign Up"
    expect(screen.getByRole("button", { name: /^Sign Up$/i })).toBeInTheDocument();
  });

  // ------ Test 3️⃣ ------
  it("calls handleLogin on submit", () => {
  render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });

    fireEvent.submit(screen.getByTestId("login-form"));

    expect(mockHandleLogin).toHaveBeenCalledWith(
      "test@example.com",
      "password",
      expect.any(Function), // setError
      expect.any(Function)  // setIsLoading
    );
  });

  // ------ Test 4️⃣ ------
  it("calls handleSignup on submit when in signup mode", () => {
    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password" },
    });

    fireEvent.submit(screen.getByTestId("login-form"));

    expect(mockHandleSignup).toHaveBeenCalledWith(
      "new@example.com",
      "password",
      "password",
      expect.any(Function), // setError
      expect.any(Function)  // setIsSignup
    );
  });

  // ------ Test 5️⃣ ------
  it("calls handleGoogleButton when Google button clicked", () => {
    render(<Login showMenu={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));
    expect(mockHandleGoogleButton).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("calls handleForgotPassword when clicked", () => {
    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "forgot@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Forgot your password/i }));
    expect(mockHandleForgotPassword).toHaveBeenCalledWith(
      "forgot@example.com",
      expect.any(Function),
      expect.any(Function)
    );
  });

  // ------ Test 7️⃣ ------
  it("applies opacity-100 when showMenu is true", () => {
    render(<Login showMenu={true} />);
    const form = screen.getByTestId("login-form");
    expect(form).toHaveClass("opacity-100");
  });

  // ------ Test 8️⃣ ------
  it("applies opacity-0 when showMenu is false", () => {
    render(<Login showMenu={false} />);
    const form = screen.getByTestId("login-form");
    expect(form).toHaveClass("opacity-0");
  });

  // ------ Test 9️⃣ ------
  it("shows loading spinner when isLoading is true", () => {
    // mock handleLogin to set isLoading immediately
    mockHandleLogin.mockImplementation(
      (_email, _password, _setError, setIsLoading) => {
        setIsLoading(true);
      }
    );

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });

    fireEvent.submit(screen.getByTestId("login-form"));

    // spinner should now be in the document
    expect(screen.getByText((_content, el) => el?.classList.contains("spinner") ?? false))
      .toBeInTheDocument();

    // also check that inputs become semi-transparent
    const container = screen.getByLabelText("Password").closest("div")!.parentElement;
    expect(container).toHaveClass("opacity-60");
  });

  // ------ Test 🔟 ------
  it("shows error message when error state is set", () => {
    // mock handleLogin to set an error immediately
    mockHandleLogin.mockImplementation(
      (_email, _password, setError) => {
        setError("Invalid credentials");
      }
    );

    render(<Login showMenu={true} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.submit(screen.getByTestId("login-form"));

    // check that error message appears
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.getByText("Invalid credentials")).toHaveClass("text-red-500");
  });
});
