import { act, render, screen } from "@testing-library/react"
import App from "./app"

test("renders Drill4J UI h1", () => {
  render(<App />)
  const linkElement = screen.getByText(/Drill4J UI/i)
  expect(linkElement).toBeInTheDocument()
})
