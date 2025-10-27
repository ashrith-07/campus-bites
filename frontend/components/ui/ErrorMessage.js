import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-elegant border border-border text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Oops!</h2>
        <p className="text-muted-foreground mb-6">{message || 'Something went wrong'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}