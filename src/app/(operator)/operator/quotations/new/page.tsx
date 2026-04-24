import { redirect } from "next/navigation";

export default function OperatorQuotationNewPage() {
  redirect("/operator/quotations?create=1");
}
