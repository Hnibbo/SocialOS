import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    Settings,
    User,
    ShoppingBag,
    Shield,
    MessageSquare,
    Zap,
    Globe
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    // CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();

    // Key listener moved to AppLayout for global control

    const runCommand = React.useCallback((command: () => void) => {
        onOpenChange(false);
        command();
    }, [onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin"))}>
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/businesses"))}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Business Registry</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/support"))}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Support Hub</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/gdpr"))}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>GDPR Requests</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Platform Settings</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/settings?tab=integrations"))}>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Test AI Connectivity</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/admin/businesses"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Register New Business</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
