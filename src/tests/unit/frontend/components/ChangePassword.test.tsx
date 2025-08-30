/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ChangePassword from "@/components/ChangePassword"
import { useChangePassword } from "@/lib/client/hooks/useChangePassword"

// ------ Mocks ------
const mockHandleSubmit = jest.fn()
jest.mock("@/lib/client/hooks/useChangePassword", () => ({
  useChangePassword: jest.fn(),
}))

jest.mock("lucide-react", () => ({
  Lock: () => <svg data-testid="lock" />
}))

beforeEach(() => {
  (useChangePassword as jest.Mock).mockReturnValue({
    isLoading: false,
    error: null,
    handleSubmit: mockHandleSubmit,
  })
  mockHandleSubmit.mockClear()
})

// ---- Tests ----
describe("ChangePassword component", () => {
  // ------ Test 1️⃣ ------
  it("renders correctly for isCredentials=true", () => {
    render(<ChangePassword isCredentials={true} showMenu={true} />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Change password")
    expect(screen.getByLabelText("Current password")).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument()
  })

  // ------ Test 2️⃣ ------
  it("renders correctly for isCredentials=false", () => {
    render(<ChangePassword isCredentials={false} showMenu={true} />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Create password")
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create password" })).toBeInTheDocument()
  })

  // ------ Test 3️⃣ ------
  it("applies opacity-0 when showMenu=false", () => {
    const { container } = render(<ChangePassword isCredentials={true} showMenu={false} />)
    expect(container.firstChild).toHaveClass("opacity-0")
  })

  // ------ Test 4️⃣ ------
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

  // ------ Test 5️⃣ ------
  it("displays error message if error exists", () => {
    (useChangePassword as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "Password too weak",
      handleSubmit: mockHandleSubmit,
    })
    render(<ChangePassword isCredentials={true} showMenu={true} />)
    expect(screen.getByText("Password too weak")).toBeInTheDocument()
  })

  // ------ Test 6️⃣ ------
  it("shows loading spinner when isLoading=true", () => {
    (useChangePassword as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
      handleSubmit: mockHandleSubmit,
    })
    render(<ChangePassword isCredentials={true} showMenu={true} />)
    expect(screen.getByText((content, element) =>
      element?.classList.contains("spinner") ?? false
    )).toBeInTheDocument()
  })
})
