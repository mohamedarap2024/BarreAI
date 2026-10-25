"use client";

export function WelcomeScreen() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-fade-up text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What can I help you with today?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
          Welcome to Barre AI. Ask anything, explore ideas, learn, and create.
        </p>
        <p className="mt-8 text-sm text-muted">
          Type a message below to start chatting.
        </p>
      </div>
    </div>
  );
}
