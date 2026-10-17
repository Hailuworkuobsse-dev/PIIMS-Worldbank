import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main
      id="main"
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="text-center">
        <h1 className="text-display-1 text-primary-900">404</h1>
        <p className="text-neutral-600 mt-2">Page not found · ገጹ አልተገኘም</p>
        <Link
          to="/"
          className="btn btn-primary mt-4 inline-block px-4 py-2 rounded-md bg-primary-700 text-white"
        >
          Home
        </Link>
      </div>
    </main>
  );
}