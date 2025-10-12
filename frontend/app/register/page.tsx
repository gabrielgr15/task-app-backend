// app/register/page.tsx - REFORGED

'use client'
import { useAuth } from "@/context/Authcontext";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import AuthFormContainer from "@/components/AuthFormContainer"; // <-- Import the new container

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("The words do not echo. Passwords must match.");
      return;
    }

    setIsLoading(true);
    const result = await register(username, email, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      // Use our thematic error display
      setError(result.error || 'An unknown nightmare occurred.');
    }
  }

  return (
    <AuthFormContainer title="Forge a Covenant">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          placeholder="Name, Carved in Stone"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
        <Input
          type="password"
          placeholder="Echo the Word"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />

        {error && (
          <p className="text-blood-echo text-center font-serif text-sm animate-pulse">{error}</p>
        )}

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Inscribing...' : 'Pledge'}
          </Button>
        </div>
      </form>
    </AuthFormContainer>
  );
}