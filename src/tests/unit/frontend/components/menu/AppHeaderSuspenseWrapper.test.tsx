/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import AppHeaderSuspenseWrapper from "@/components/menu/AppHeaderSuspenseWrapper"

// Mock AppHeader so we don’t test its internals
jest.mock("@/components/menu/AppHeader", () => ({
  __esModule: true,
  default: () => <div>AppHeader Content</div>,
}))

describe("AppHeaderSuspenseWrapper", () => {
  it("renders AppHeader", () => {
    render(<AppHeaderSuspenseWrapper />)

    // The wrapper should render the mocked AppHeader
    expect(screen.getByText("AppHeader Content")).toBeInTheDocument()
  })
})
