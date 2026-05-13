import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToPDF } from '@/lib/exportPDF';

export default function ExportPDFButton({ title, subtitle, sections, filename, variant = 'outline', size = 'sm' }) {
  return (
    <Button
      variant={variant}
      size={size}
      className="gap-2"
      onClick={() => exportToPDF({ title, subtitle, sections, filename })}
    >
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  );
}