import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
                    <div className="card w-full max-w-lg bg-base-100 shadow-2xl animate-scale-in">
                        <div className="card-body text-center">
                            <div className="mx-auto bg-error/10 p-6 rounded-full mb-6">
                                <AlertTriangle size={64} className="text-error" />
                            </div>
                            <h2 className="card-title justify-center text-3xl mb-2">
                                Oops! Something went wrong
                            </h2>
                            <p className="text-base-content/60 mb-6">
                                We're sorry for the inconvenience. An unexpected error occurred.
                            </p>
                            
                            {this.state.error && (
                                <div className="alert alert-error mb-6">
                                    <div className="flex-col items-start">
                                        <span className="font-semibold">Error Details:</span>
                                        <code className="text-xs mt-1">{this.state.error.toString()}</code>
                                    </div>
                                </div>
                            )}

                            <div className="card-actions justify-center gap-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn btn-gradient gap-2 shadow-lg"
                                >
                                    <RefreshCw size={20} />
                                    Reload Page
                                </button>
                                <Link to="/" className="btn btn-outline gap-2">
                                    <Home size={20} />
                                    Go Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
