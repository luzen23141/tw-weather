import React, { ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { Button } from '@/components/ui/Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error('ErrorBoundary caught:', error);
    this.props.onError?.(error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ScrollView className="flex-1 bg-md-background">
          <View className="flex-1 items-center justify-center gap-4 px-6 py-12">
            <Text className="text-2xl font-bold text-md-error">發生錯誤</Text>
            <Text className="text-sm text-md-on-surface-variant text-center">
              {this.state.error?.message || '未知錯誤'}
            </Text>
            <Button variant="filled" label="重試" onPress={this.handleRetry} />
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}
