export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-4 border-secondary border-t-transparent ${sizes[size]}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}