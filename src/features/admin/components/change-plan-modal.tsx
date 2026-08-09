import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminPlans, updateAdminUserPlan } from "@/lib/admin-plans.functions";
import { cn } from "@/lib/utils";

interface ChangePlanModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePlanModal({ user, isOpen, onClose }: ChangePlanModalProps) {
  const queryClient = useQueryClient();
  const fetchPlans = useServerFn(getAdminPlans);
  const updatePlan = useServerFn(updateAdminUserPlan);

  const [selectedTier, setSelectedTier] = useState<string>(
    user.subscription_tier?.toLowerCase() || "udaan"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => fetchPlans({ data: undefined }),
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: (variables: any) => updatePlan({ data: variables }),
    onSuccess: () => {
      toast.success("Plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plan");
    }
  });

  const handleConfirm = () => {
    mutation.mutate({
      userId: user.id,
      planTier: selectedTier,
      billingCycle: selectedTier === "free" ? "monthly" : billingCycle
    });
  };

  const getPrice = (tier: string) => {
    const plan = plans?.find((p: any) => p.tier === tier || p.code === tier);
    if (!plan) return "₹0";
    if (plan.tier === "free" || plan.code === "udaan") return "₹0";
    
    const minor = billingCycle === "monthly" 
      ? plan.price_monthly_minor 
      : plan.price_yearly_minor;
    
    return `₹${(minor || 0) / 100}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change User Plan</DialogTitle>
          <DialogDescription>
            Modify subscription for <strong>{user.display_name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed">
            <div className="text-sm">
              <span className="text-muted-foreground">Current Plan:</span>
              <Badge variant="secondary" className="ml-2 capitalize">
                {user.subscription_tier || "Free"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="billing-toggle" className={cn("text-xs font-medium", billingCycle === "monthly" ? "text-primary" : "text-muted-foreground")}>Monthly</Label>
              <Switch 
                id="billing-toggle"
                checked={billingCycle === "yearly"}
                onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                disabled={selectedTier === "free"}
              />
              <Label htmlFor="billing-toggle" className={cn("text-xs font-medium", billingCycle === "yearly" ? "text-primary" : "text-muted-foreground")}>Yearly</Label>
            </div>
          </div>

          <RadioGroup 
            value={selectedTier} 
            onValueChange={(val: any) => setSelectedTier(val)}
            className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2"
          >
            {plans?.map((plan: any) => (
              <Label
                key={plan.id}
                htmlFor={plan.code}
                className={cn(
                  "relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-muted/30",
                  selectedTier === plan.code ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={plan.code} id={plan.code} className="sr-only" />
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {plan.name}
                      {(user.subscription_tier?.toLowerCase() === plan.code || user.subscription_tier?.toLowerCase() === plan.name.toLowerCase()) && (
                        <Badge variant="outline" className="text-[10px] h-4">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                      {plan.description || "Premium features and limits"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{getPrice(plan.code)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {plan.tier === 'free' ? 'Forever' : `per ${billingCycle === 'monthly' ? 'month' : 'year'}`}
                  </div>
                </div>
                {selectedTier === plan.code && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={mutation.isPending || selectedTier === user.subscription_tier?.toLowerCase()}
            className="bg-primary hover:bg-primary/90"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Plan Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
