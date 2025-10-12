// app/login/page.tsx - REFORGED

'use client';
import { useAuth } from "@/context/Authcontext";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import AuthFormContainer from "@/components/AuthFormContainer"; // <-- Import the new container

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // <-- State for error messages
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      // THIS IS THE FIX: We now set an error message to be displayed.
      setError(result.error || 'Invalid credentials. The night rejects your entry.');
    }
  }

  return (
    <AuthFormContainer title="Enter the Dream">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          placeholder="Hunter's Mark (Email)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Secret Word (Password)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-blood-echo text-center font-serif text-sm animate-pulse">{error}</p>
        )}

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Beckoning...' : 'Transcend'}
          </Button>
        </div>
      </form>
    </AuthFormContainer>
  );
}