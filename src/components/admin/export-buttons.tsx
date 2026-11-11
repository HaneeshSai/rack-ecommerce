"use client";

import { Button } from "@/components/ui";
import { useToast } from "@/components/admin/toast";

export function ExportButtons() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" onClick={() => toast("Exported sales + GST register for Tally (Excel). Demo only: no file is created.")}>Export to Tally (Excel)</Button>
      <Button variant="ghost" onClick={() => toast("Exported for Zoho Books (Excel). Demo only: no file is created.")}>Export to Zoho Books</Button>
    </div>
  );
}
