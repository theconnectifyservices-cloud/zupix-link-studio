import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/shared/ui/error-state";
import { Button } from "@/components/ui/button";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportLovableError(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6">
          <ErrorState
            title="This section failed to load"
            description={this.state.error.message}
            action={<Button onClick={this.reset}>Try again</Button>}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
