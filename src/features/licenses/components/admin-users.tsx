import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Mail, Search, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  adminForcePasswordChange,
  adminSendPasswordReset,
  adminSetPassword,
} from "../admin.functions";

export function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const listUsers = useServerFn(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (await0 as never) ?? (undefined as never),
  );
  return <div />;
}
