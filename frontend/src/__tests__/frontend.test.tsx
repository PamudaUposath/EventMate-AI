import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressBar } from '../components/ProgressBar';
import { ConfirmModal } from '../components/ConfirmModal';
import { PlanRescueModal } from '../components/PlanRescueModal';
import { Navbar } from '../components/Navbar';
import { ChatMessageContent } from '../components/ChatMessageContent';
import { AuthProvider } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('EventMate AI - Frontend Component Tests', () => {
  describe('ProgressBar Component', () => {
    it('renders readiness percentage and label accurately', () => {
      render(<ProgressBar percentage={75} readinessLevel="Good" />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Readiness: Good')).toBeInTheDocument();
    });

    it('clamps negative or exceeding percentages safely', () => {
      render(<ProgressBar percentage={120} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('ConfirmModal Component', () => {
    it('displays title, message and triggers onConfirm and onCancel callbacks', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmModal
          isOpen={true}
          title="Delete Confirmation"
          message="Are you sure you want to delete this milestone?"
          confirmLabel="Yes, Delete"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this milestone?')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Yes, Delete'));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmModal
          isOpen={false}
          title="Hidden"
          message="Hidden"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Plan Rescue Modal Flow', () => {
    it('renders calm heading and quick crisis presets', () => {
      render(
        <PlanRescueModal
          isOpen={true}
          onClose={() => {}}
          eventId="evt_test_123"
          onPlanApplied={() => {}}
        />
      );

      expect(screen.getByText('Plan Rescue')).toBeInTheDocument();
      expect(screen.getByText(/Calm, adaptive pivots/i)).toBeInTheDocument();
      expect(screen.getByText(/Our main speaker just cancelled/i)).toBeInTheDocument();
    });

    it('allows typing problem description and triggers analysis', async () => {
      render(
        <PlanRescueModal
          isOpen={true}
          onClose={() => {}}
          eventId="evt_demo_aws_workshop"
          onPlanApplied={() => {}}
        />
      );

      const textarea = screen.getByPlaceholderText(/Our main speaker just cancelled/i);
      fireEvent.change(textarea, { target: { value: 'Venue power backup failed' } });
      expect(textarea).toHaveValue('Venue power backup failed');

      const generateBtn = screen.getByText('Generate Rescue Options');
      expect(generateBtn).toBeEnabled();
    });
  });

  describe('Navbar Anchor Links', () => {
    it('renders Features, Plan Rescue, and How It Works with proper root-relative paths', () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Navbar />
          </MemoryRouter>
        </AuthProvider>
      );

      const featuresLink = screen.getAllByRole('link', { name: /Features/i })[0];
      const planRescueLink = screen.getAllByRole('link', { name: /Plan Rescue/i })[0];
      const howItWorksLink = screen.getAllByRole('link', { name: /How It Works/i })[0];

      expect(featuresLink).toHaveAttribute('href', '/#features');
      expect(planRescueLink).toHaveAttribute('href', '/#plan-rescue');
      expect(howItWorksLink).toHaveAttribute('href', '/#how-it-works');
    });
  });

  describe('ChatMessageContent Component', () => {
    it('strips raw double asterisks and renders structured task cards with priority badges', () => {
      const sampleMsg = `Here are the top priority tasks to focus on right now for **AWS Cloud Hands-on Workshop 2026**:

1. **Confirm Workshop Speaker & Content Outline** (Priority: HIGH, Deadline: 2026-11-10)
_Finalize speaker availability, topic outline, and hands-on lab scope._

2. **Prepare AWS Workshop Lab Environment & IAM Sandboxes** (Priority: HIGH, Deadline: 2026-11-14)
_Set up step-by-step guides for S3, Lambda, and DynamoDB architecture labs._

3. **Test Projector, Audio Mics & Backup Mobile Hotspot** (Priority: HIGH, Deadline: 2026-11-19)
_Dry run HDMI projection, presenter wireless microphone, and backup hotspot._

Would you like me to help you mark any of these as completed or update their deadlines?`;

      const { container } = render(
        <ChatMessageContent content={sampleMsg} role="assistant" />
      );

      // Verify NO raw double asterisks (**) remain in text content
      expect(container.textContent).not.toContain('**');

      // Verify NO raw underscores (_) remain around descriptions
      expect(container.textContent).not.toContain('_Finalize');

      // Verify task titles and badges are properly rendered
      expect(screen.getByText('Confirm Workshop Speaker & Content Outline')).toBeInTheDocument();
      expect(screen.getByText('Prepare AWS Workshop Lab Environment & IAM Sandboxes')).toBeInTheDocument();
      expect(screen.getByText('Test Projector, Audio Mics & Backup Mobile Hotspot')).toBeInTheDocument();

      // Verify priority badges (HIGH)
      const highBadges = screen.getAllByText('HIGH');
      expect(highBadges.length).toBe(3);

      // Verify deadlines are displayed
      expect(screen.getByText('2026-11-10')).toBeInTheDocument();
      expect(screen.getByText('2026-11-14')).toBeInTheDocument();
      expect(screen.getByText('2026-11-19')).toBeInTheDocument();

      // Verify description texts are rendered cleanly
      expect(screen.getByText(/Finalize speaker availability, topic outline/i)).toBeInTheDocument();
    });
  });
});
