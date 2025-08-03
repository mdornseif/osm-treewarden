import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsWindow from '../SettingsWindow';
import Settings from '../Settings';

// Mock the Settings component
vi.mock('../Settings', () => ({
  default: vi.fn(() => <div data-testid="settings">Settings Component</div>)
}));

describe('SettingsWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children and toggle button when closed', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
    expect(screen.getByTitle('Show settings')).toBeInTheDocument();
  });

  it('should not render Settings when closed', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
  });

  it('should render Settings when opened', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('settings')).toBeInTheDocument();
  });

  it('should change toggle button to close button when opened', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);

    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByTitle('Hide settings')).toBeInTheDocument();
  });

  it('should hide Settings when closed after being opened', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    
    // Open the window
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    
    // Close the window
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('should have correct CSS classes for closed state', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const container = screen.getByTestId('child-content').closest('.settings-window-container');
    expect(container).not.toHaveClass('open');
  });

  it('should have correct CSS classes for open state', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);

    const container = screen.getByTestId('child-content').closest('.settings-window-container');
    expect(container).toHaveClass('open');
  });

  it('should toggle between open and closed states', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    
    // First click - open
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    
    // Second click - close
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('should have correct toggle button styling', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    expect(toggleButton).toHaveClass('settings-toggle');
  });

  it('should have correct window styling', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);

    const settingsWindow = screen.getByTestId('settings').closest('.settings-window');
    expect(settingsWindow).toHaveClass('settings-window');
  });

  it('should maintain child content visibility when toggling', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const childContent = screen.getByTestId('child-content');
    
    // Should be visible when closed
    expect(childContent).toBeInTheDocument();
    
    // Should still be visible when opened
    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);
    expect(childContent).toBeInTheDocument();
    
    // Should still be visible when closed again
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(childContent).toBeInTheDocument();
  });

  it('should have correct button positioning', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    
    // Check that the button has the correct CSS class for positioning
    expect(toggleButton).toHaveClass('settings-toggle');
  });

  it('should handle multiple rapid toggles correctly', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    
    // Multiple rapid clicks
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    
    // Should end up in the opposite state from initial
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should have accessible button titles', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    // Initial state
    expect(screen.getByTitle('Show settings')).toBeInTheDocument();
    
    // After opening
    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);
    expect(screen.getByTitle('Hide settings')).toBeInTheDocument();
  });

  it('should render Settings component with correct props', () => {
    render(
      <SettingsWindow>
        <div data-testid="child-content">Map Content</div>
      </SettingsWindow>
    );

    const toggleButton = screen.getByText('⚙️');
    fireEvent.click(toggleButton);

    expect(Settings).toHaveBeenCalled();
  });
});