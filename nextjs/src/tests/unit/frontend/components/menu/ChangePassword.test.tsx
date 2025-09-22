/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ChangePassword from "@/components/menu/ChangePassword"
import { useChangePassword } from "@traduxo/packages/hooks/auth/useChangePassword"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

// ------ Mocks ------
const mockHandleSubmit = jest.fn()
const mockPush = jest.fn()

jest.mock("@traduxo/packages/hooks/auth/useChangePassword", () => ({
  useChangePassword: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("lucide-react", () => ({
  Lock: () => <svg data-testid="lock" />,
}))

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useChangePassword as jest.Mock).mockReturnValue({
    isLoading: false,
    error: null,
    handleSubmit: mockHandleSubmit,
    onSuccess: jest.fn(),
    onError: jest.fn(),
  })
  mockHandleSubmit.mockClear();
  mockPush.mockClear();
  (toast.success as jest.Mock).mockClear();
  (toast.error as jest.Mock).mockClear();
})

// ---- Tests ----
describe("ChangePassword component", () => {
  it("renders correctly for isCredentials=true", () => {
    render(<ChangePassword isCredentials={true} showMenu={true} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Change password")
    expect(screen.getByLabelText("Current password")).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument()
  })

  it("renders correctly for isCredentials=false", () => {
    render(<ChangePassword isCredentials={false} showMenu={true} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Create password")
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create password" })).toBeInTheDocument()
  })

  it("applies opacity-0 when showMenu=false", () => {
    const { container } = render(<ChangePassword isCredentials={true} showMenu={false} />)
    expect(container.firstChild).toHaveClass("opacity-0")
  })

  it("calls handleSubmit with input values on form submit", () => {
    render(<ChangePassword isCredentials={true} showMenu={true} />)

    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "current123" } })
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new123" } })
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "new123" } })
    fireEvent.click(screen.getByRole("button", { name: "Change password" }))

    expect(mockHandleSubmit).toHaveBeenCalledWith({
      currentPassword: "current123",
      password: "new123",
      confirmPassword: "new123",
    })
  })

  it("displays error message if error exists", () => {
    (useChangePassword as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "Password too weak",
      handleSubmit: mockHandleSubmit,
      fetcher: jest.fn(),
    })
    render(<ChangePassword isCredentials={true} showMenu={true} />)
    expect(screen.getByText("Password too weak")).toBeInTheDocument()
  })

  it("shows loading spinner when isLoading=true", () => {
    (useChangePassword as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
      handleSubmit: mockHandleSubmit,
      fetcher: jest.fn(),
    })
    render(<ChangePassword isCredentials={true} showMenu={true} />)
    expect(document.querySelector(".spinner")).toBeInTheDocument()
  })

  // ---- New tests for toast + router ----
  it("calls toast.success and router.push on onSuccess", () => {
    render(
      <ChangePassword
        isCredentials={true}
        showMenu={true}
      />
    )

    // Grab the hook mock and invoke onSuccess callback
    const hookReturn = (useChangePassword as jest.Mock).mock.calls[0][0]
    hookReturn.onSuccess("Password updated")

    expect(toast.success).toHaveBeenCalledWith("Password updated")
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("calls toast.error on onError", () => {
    render(
      <ChangePassword
        isCredentials={true}
        showMenu={true}
      />
    )

    const hookReturn = (useChangePassword as jest.Mock).mock.calls[0][0]
    hookReturn.onError("Some error")

    expect(toast.error).toHaveBeenCalledWith("Some error")
  })
})
