import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography } from '@voxora/design-system';

type Props = { children: React.ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Voxora hit an unexpected error. This is not reported as success.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ error: null })}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.brand.purple,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
});
