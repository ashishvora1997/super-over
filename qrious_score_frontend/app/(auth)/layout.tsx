export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background px-4 overflow-hidden">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
