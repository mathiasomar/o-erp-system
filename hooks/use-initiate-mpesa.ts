import {
  InitiateMpesaInput,
  initiateMpesaPayment,
} from "@/actions/mpesa.action";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useInitiateMpesa(
  onSuccess?: (checkoutRequestId: string) => void,
) {
  return useMutation({
    mutationFn: (input: InitiateMpesaInput) => initiateMpesaPayment(input),
    onSuccess: (result) => {
      if (result.success && result.checkoutRequestId) {
        toast.success("STK Push sent — check your phone");
        onSuccess?.(result.checkoutRequestId);
      } else {
        const err = result.error;
        const msg =
          typeof err === "object" && "root" in err
            ? err.root[0]
            : "Failed to initiate M-Pesa payment";
        toast.error(msg);
      }
    },
    onError: () => toast.error("M-Pesa request failed"),
  });
}
