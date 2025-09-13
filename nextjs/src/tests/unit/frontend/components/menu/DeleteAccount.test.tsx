/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import DeleteAccount from "@/components/menu/DeleteAccount"
import { useDeleteAccount } from "@traduxo/packages/hooks/auth/useDeleteAccount"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

// ------ Mocks ------
const mockDeleteAccount = jest.fn()
const mockPush = jest.fn()

jest.mock("@traduxo/packages/hooks/auth/useDeleteAccount", () => ({
  useDeleteAccount: jest.fn(),
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

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useDeleteAccount as jest.Mock).mockReturnValue({
    deleteAccount: mockDeleteAccount,
    isLoading: false,
    onSuccess: jest.fn(),
    onError: jest.fn(),
  });
  mockDeleteAccount.mockClear();
  mockPush.mockClear();
  (toast.success as jest.Mock).mockClear();
  (toast.error as jest.Mock).mockClear();
})

// ---- Tests ----
describe("DeleteAccount component", () => {
  it("renders correctly when showMenu is true", () => {
    render(<DeleteAccount showMenu={true} />)
    expect(screen.getByText("Delete Account")).toBeInTheDocument()
    expect(screen.getByText("Are you sure you want to delete your account?")).toBeInTheDocument()
  })

  it("applies opacity-0 when showMenu is false", () => {
    const { container } = render(<DeleteAccount showMenu={false} />)
    expect(container.firstChild).toHaveClass("opacity-0")
  })

  it("calls router.push when Cancel is clicked", () => {
    render(<DeleteAccount showMenu={true} />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(mockPush).toHaveBeenCalledWith("/?menu=open")
  })

  it("calls deleteAccount when Yes is clicked", () => {
    render(<DeleteAccount showMenu={true} />)
    fireEvent.click(screen.getByText("Yes"))
    expect(mockDeleteAccount).toHaveBeenCalled()
  })

  it("shows spinner when isLoading is true", () => {
    ; (useDeleteAccount as jest.Mock).mockReturnValueOnce({
      deleteAccount: mockDeleteAccount,
      isLoading: true,
    })
    render(<DeleteAccount showMenu={true} />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  // ---- New tests for toast + router ----
  it("calls toast.success and router.push on onSuccess", () => {
    render(<DeleteAccount showMenu={true} />)

    // Grab the hook options and invoke onSuccess
    const hookReturn = (useDeleteAccount as jest.Mock).mock.calls[0][0]
    hookReturn.onSuccess()

    expect(toast.success).toHaveBeenCalledWith("Your account has been deleted")
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("calls toast.error on onError", () => {
    render(<DeleteAccount showMenu={true} />)

    const hookReturn = (useDeleteAccount as jest.Mock).mock.calls[0][0]
    hookReturn.onError("Some error")

    expect(toast.error).toHaveBeenCalledWith("Some error")
  })
})
