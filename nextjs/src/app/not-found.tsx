import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-[var(--text)] px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">Sorry, the page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-8 text-center py-3 bg-[var(--bg-2)]/70 border border-[var(--gray-1)] rounded-full hover-1 text-[var(--text)]"
      >
        Go to Home
      </Link>
    </div>
  );
}