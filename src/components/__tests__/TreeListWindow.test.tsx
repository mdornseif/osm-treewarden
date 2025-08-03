import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TreeListWindow from '../TreeListWindow';
import TreeList from '../TreeList';

// Mock the TreeList component
vi.mock('../TreeList', () => ({
  default: vi.fn(() => <div data-testid="tree-list">Tree List Component</div>)
}));

describe('TreeListWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children and toggle button when closed', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('🌳')).toBeInTheDocument();
    expect(screen.getByTitle('Show tree list')).toBeInTheDocument();
  });

  it('should not render TreeList when closed', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    expect(screen.queryByTestId('tree-list')).not.toBeInTheDocument();
  });

  it('should render TreeList when opened', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('tree-list')).toBeInTheDocument();
  });

  it('should change toggle button to close button when opened', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    fireEvent.click(toggleButton);

    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByTitle('Hide tree list')).toBeInTheDocument();
  });

  it('should hide TreeList when closed after being opened', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    
    // Open the window
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('tree-list')).toBeInTheDocument();
    
    // Close the window
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('tree-list')).not.toBeInTheDocument();
    expect(screen.getByText('🌳')).toBeInTheDocument();
  });

  it('should have correct CSS classes for closed state', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const container = screen.getByTestId('child-content').closest('.tree-list-window-container');
    expect(container).not.toHaveClass('open');
  });

  it('should have correct CSS classes for open state', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    fireEvent.click(toggleButton);

    const container = screen.getByTestId('child-content').closest('.tree-list-window-container');
    expect(container).toHaveClass('open');
  });

  it('should render toggle button with correct styling classes', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    expect(toggleButton).toHaveClass('tree-list-toggle');
  });

  it('should render main content with correct styling classes', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const mainContent = screen.getByTestId('child-content').closest('.main-content');
    expect(mainContent).toBeInTheDocument();
  });

  it('should render tree list window with correct styling classes', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    fireEvent.click(toggleButton);

    const container = screen.getByTestId('child-content').closest('.tree-list-window-container');
    const treeListWindow = container?.querySelector('.tree-list-window');
    expect(treeListWindow).toBeInTheDocument();
  });

  it('should call TreeList component when window is open', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    fireEvent.click(toggleButton);

    expect(TreeList).toHaveBeenCalled();
  });

  it('should not call TreeList component when window is closed', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    expect(TreeList).not.toHaveBeenCalled();
  });

  it('should handle multiple toggle clicks correctly', () => {
    render(
      <TreeListWindow>
        <div data-testid="child-content">Map Content</div>
      </TreeListWindow>
    );

    const toggleButton = screen.getByText('🌳');
    
    // First click - open
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('tree-list')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    
    // Second click - close
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('tree-list')).not.toBeInTheDocument();
    expect(screen.getByText('🌳')).toBeInTheDocument();
    
    // Third click - open again
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('tree-list')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });
}); 