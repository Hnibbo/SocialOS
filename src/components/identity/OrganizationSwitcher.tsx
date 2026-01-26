import { useState } from "react";
import {
  Building2,
  Plus,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Badge } from "@/components/ui/badge";

export function OrganizationSwitcher() {
  const { organizations, currentOrg, switchOrganization } = useOrganizations();
  const [open, setOpen] = useState(false);

  if (organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-9 px-2"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentOrg?.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {currentOrg?.name?.substring(0, 2).toUpperCase() || "OR"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-[150px]">
            {currentOrg?.name || "Select Organization"}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="start"
        className="w-80 max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Organizations</span>
          <Badge variant="outline" className="text-xs">
            {organizations.length}
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              switchOrganization(org.id);
              setOpen(false);
            }}
            className={`cursor-pointer ${
              currentOrg?.id === org.id ? "bg-primary/5 text-primary" : ""
            }`}
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={org.logo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {org.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {org.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {org.custom_domain || org.slug}
                </p>
              </div>
              
              {currentOrg?.id === org.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer text-primary hover:text-primary/80">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Create New Organization</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
