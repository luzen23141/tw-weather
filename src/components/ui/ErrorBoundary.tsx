import React, { ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GlassBackground } from '@/components/ui/GlassBackground';

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
        <GlassBackground>
          <ScrollView className="flex-1">
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-full max-w-[560px] items-center gap-4 rounded-[30px] border border-white/20 bg-white/14 px-6 py-10">
                <Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-md-error">
                  系統狀態
                </Text>
                <Text className="text-[24px] font-bold tracking-tight text-md-on-surface">
                  發生錯誤
                </Text>
                <Text className="text-center text-[14px] font-medium leading-6 text-md-on-surface-variant/84">
                  {this.state.error?.message || '未知錯誤'}
                </Text>
                <Button variant="filled" label="重試" onPress={this.handleRetry} />
              </View>
            </View>
          </ScrollView>
        </GlassBackground>
      );
    }

    return this.props.children;
  }
}
