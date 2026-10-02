import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logClientError } from '../../utils/analytics';
import { AlertTriangle, RefreshCw, Home, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[BikriPilot Crash Boundary Caught]:', error, errorInfo);
    // Send telemetry to backend
    logClientError(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleResetStorage = () => {
    if (window.confirm('আপনি কি অ্যাপ্লিকেশন ডেটা রিসেট করে পুনরায় লোড করতে চান?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                দুঃখিত, একটি প্রযুক্তিগত ত্রুটি ঘটেছে
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                অ্যাপ্লিকেশনের এই অংশে একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। ত্রুটিটি স্বয়ংক্রিয়ভাবে আমাদের সিস্টেমে রেকর্ড করা হয়েছে।
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় লোড করুন</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>ড্যাশবোর্ডে ফিরুন</span>
              </button>
            </div>

            {/* Storage reset option */}
            <div className="pt-2">
              <button
                onClick={this.handleResetStorage}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition flex items-center justify-center gap-1 mx-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ক্যাশ মেমোরি পরিষ্কার করুন</span>
              </button>
            </div>

            {/* Collapsible Technical Details for Diagnostics */}
            <div className="border-t border-slate-100 pt-4 text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-600"
              >
                <span>কারিগরি বিবরণ (Error Details)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-slate-900 text-rose-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 space-y-1">
                  <div><strong>Error:</strong> {this.state.error?.message}</div>
                  {this.state.error?.stack && (
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
