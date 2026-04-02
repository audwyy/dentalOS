import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
        <div className="text-2xl font-bold text-blue-600">DentalOS</div>
        <nav>
          <Link 
            href="/auth/sign-in" 
            className="px-5 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Sign In / Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto mt-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Modern Management for <br />
          <span className="text-blue-600">Your Dental Practice</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10">
          Streamline your appointments, patient records, and billing with our simple, secure platform.
        </p>
        
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Ready to get started?</h2>
          <p className="text-slate-500 mb-6">Access your dashboard to manage your clinic.</p>
          <Link 
            href="/dashboard" 
            className="inline-block px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}