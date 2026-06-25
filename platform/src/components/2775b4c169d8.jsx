"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ba221113eac7";
import { Button } from "@/components/2795b661f080";
export function TherapistInviteModal({ isOpen, therapistName, consultationRequestId, therapistId, onClose, }) {
    const router = useRouter();
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const isLoading = isAccepting || isDeclining;
    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const res = await fetch(`/api/consultations/requests/${consultationRequestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "accepted" }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || "Failed to accept invitation");
            }
            toast.success("You're now a client! Redirecting to booking...");
            onClose();
            router.push(`/booking?therapistId=${therapistId}`);
        }
        catch {
            toast.error("Something went wrong. Please try again.");
        }
        finally {
            setIsAccepting(false);
        }
    };
    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const res = await fetch(`/api/consultations/requests/${consultationRequestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "declined" }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || "Failed to decline invitation");
            }
            onClose();
            toast.info("Invitation declined.");
        }
        catch {
            toast.error("Something went wrong. Please try again.");
        }
        finally {
            setIsDeclining(false);
        }
    };
    return (<Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You&apos;ve been invited!</DialogTitle>
          <DialogDescription>
            {therapistName} has invited you to become their client.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => void handleDecline()} disabled={isLoading}>
            {isDeclining ? (<>
                <Loader2 className="h-4 w-4 animate-spin"/>
                Declining...
              </>) : ("Decline")}
          </Button>
          <Button onClick={() => void handleAccept()} disabled={isLoading}>
            {isAccepting ? (<>
                <Loader2 className="h-4 w-4 animate-spin"/>
                Accepting...
              </>) : ("Accept Invitation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
