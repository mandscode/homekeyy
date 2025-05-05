import LoginForm from "@/components/auth/LoginForm";


export default function Page() {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-center">Admin Login</h1>
        <LoginForm />
      </div>
    </main>
  )
}
