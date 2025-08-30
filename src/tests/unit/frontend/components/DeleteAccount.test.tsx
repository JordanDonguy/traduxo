/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import DeleteAccount from "@/components/DeleteAccount"
import { useRouter } from "next/navigation"
import { useDeleteAccount } from "@/lib/client/hooks/useDeleteAccount"

// --- Mocks ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))
jest.mock("@/lib/client/hooks/useDeleteAccount", () => ({
  useDeleteAccount: jest.fn(),
}))

// Mock instances
const push = jest.fn()
const mockDeleteAccount = jest.fn()

beforeEach(() => {
  // reset all mocks before each test
  push.mockClear()
  mockDeleteAccount.mockClear()

    // default return values
    ; (useRouter as jest.Mock).mockReturnValue({ push })
    ; (useDeleteAccount as jest.Mock).mockReturnValue({
      deleteAccount: mockDeleteAccount,
      isLoading: false,
    })
})

// ---- Tests ----
describe("DeleteAccount component", () => {
  // ------ Test 1️⃣ ------
  it("renders correctly when showMenu is true", () => {
    render(<DeleteAccount showMenu={true} />)

    expect(screen.getByText("Delete Account")).toBeInTheDocument()
    expect(screen.getByText("Are you sure you want to delete your account?")).toBeInTheDocument()
  })

  // ------ Test 2️⃣ ------
  it("applies opacity-0 when showMenu is false", () => {
    const { container } = render(<DeleteAccount showMenu={false} />)
    expect(container.firstChild).toHaveClass("opacity-0")
  })

  // ------ Test 3️⃣ ------
  it("calls router.push when Cancel is clicked", () => {
    render(<DeleteAccount showMenu={true} />)

    fireEvent.click(screen.getByText("Cancel"))
    expect(push).toHaveBeenCalledWith("/?menu=open")
  })

  // ------ Test 4️⃣ ------
  it("calls deleteAccount when Yes is clicked", () => {
    render(<DeleteAccount showMenu={true} />)

    fireEvent.click(screen.getByText("Yes"))
    expect(mockDeleteAccount).toHaveBeenCalled()
  })

  // ------ Test 5️⃣ ------
  it("shows spinner when isLoading is true", () => {
    // Override the hook for this specific test
    ; (useDeleteAccount as jest.Mock).mockReturnValue({
      deleteAccount: mockDeleteAccount,
      isLoading: true,
    })

    render(<DeleteAccount showMenu={true} />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
