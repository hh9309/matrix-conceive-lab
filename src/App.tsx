/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LabLayout } from './components/LabLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <LabLayout />
    </TooltipProvider>
  );
}
