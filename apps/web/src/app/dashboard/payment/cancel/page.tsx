import { Suspense } from 'react';
import { CancelContent } from './cancel-content';

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <CancelContent />
    </Suspense>
  );
}
