
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Copy, 
  History,
  Tag as TagIcon,
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  toast,
  Label
} from "@/shared/ui";

import { Customer } from "../types";
import { getCustomerTimeline, updateCustomer } from "../lib/customer-api";
import { CustomerTimeline } from "./customer-timeline";

export function CustomerDetails({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(customer.notes || "");

  const updateMut = useMutation({
    mutationFn: (patch: Partial<Customer>) => updateCustomer(customer.id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Added {format(new Date(customer.created_at), "MMM d, yyyy")}</span>
              <span>•</span>
              <Badge variant="outline">{customer.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-3">
            {customer.email && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleCopy(customer.email!)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleCopy(customer.phone!)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">{customer.total_orders}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Orders</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">{customer.total_bookings}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Bookings</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="timeline"><History className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
          <TabsTrigger value="notes"><FileText className="mr-2 h-4 w-4" />Private Notes</TabsTrigger>
          <TabsTrigger value="tags"><TagIcon className="mr-2 h-4 w-4" />Tags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="pt-4">
          <CustomerTimeline customerId={customer.id} />
        </TabsContent>

        <TabsContent value="notes" className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label>Private CRM Notes</Label>
            <Textarea 
              placeholder="Add details about this customer..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <Button onClick={() => updateMut.mutate({ notes })}>Save Notes</Button>
        </TabsContent>

        <TabsContent value="tags" className="pt-4">
          <div className="flex flex-wrap gap-2">
            {(["Lead", "Customer", "VIP", "Returning", "Blocked"] as const).map(tag => (
              <Button 
                key={tag} 
                variant={customer.tags?.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newTags = customer.tags?.includes(tag) 
                    ? customer.tags.filter(t => t !== tag)
                    : [...(customer.tags || []), tag];
                  updateMut.mutate({ tags: newTags });
                }}
              >
                {tag}
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
