/**
 * LinkedCheckoutModal — Handles the MINI ROAD SHOW CHECK OUT flow.
 * 
 * NEW BEHAVIOR (van-based check-in verification):
 * 1. Opens the form first (renders ProgramSubmitModal normally)
 * 2. When a number plate field is selected, ProgramSubmitModal calls the
 *    van-lookup endpoint to verify the van was checked in today
 * 3. If the van was NOT checked in → full-screen "Check-In Required" block
 * 4. If the van WAS checked in → auto-populate MSISDNs and allow submission
 * 
 * This wrapper simply passes the linked_checkin_program_id through to
 * ProgramSubmitModal which handles the van check-in verification internally.
 */
import { ProgramSubmitModal } from './program-submit-modal';
import type { SubmissionDetails } from './submit-handler';

interface LinkedCheckoutModalProps {
  program: any;
  userId: string;
  onClose: () => void;
  onSuccess: (pointsAwarded: number, newTotal: number, submissionDetails?: SubmissionDetails) => void;
}

export function LinkedCheckoutModal({ program, userId, onClose, onSuccess }: LinkedCheckoutModalProps) {
  // Pass through to ProgramSubmitModal with linked checkout context.
  // The van check-in verification happens inside ProgramSubmitModal when
  // the number plate field is selected (detected by field label matching).
  // We set session_checkin_enabled to false so it renders as a normal form.
  const programForForm = {
    ...program,
    session_checkin_enabled: false,
    // linked_checkin_program_id is already set on the program object
  };

  return (
    <ProgramSubmitModal
      program={programForForm}
      userId={userId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
