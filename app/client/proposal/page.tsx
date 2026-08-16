import type { Metadata } from "next";
import { ClientProposal } from "@/components/client-proposal";

export const metadata: Metadata = {
  title: "Confirm Proposal | Libang Libu Travel",
  description: "Review the final expedition quotation, agreement and payment.",
};

export default function ClientProposalPage() {
  return <ClientProposal />;
}
