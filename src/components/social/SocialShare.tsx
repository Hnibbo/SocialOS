import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Link as LinkIcon, Twitter, Facebook, Linkedin } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
    url?: string;
    title?: string;
    description?: string;
    variant?: "icon" | "button";
}

export function SocialShare({
    url = window.location.href,
    title = "Check this out on Hup!",
    description = "",
    variant = "button"
}: SocialShareProps) {

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const shareLinks = [
        {
            name: "Twitter",
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: "hover:text-sky-500",
        },
        {
            name: "Facebook",
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: "hover:text-blue-600",
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: "hover:text-blue-700",
        },
    ];

    if (variant === "icon") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyToClipboard}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Copy Link
                    </DropdownMenuItem>
                    {shareLinks.map((link) => (
                        <DropdownMenuItem key={link.name} asChild>
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                <link.icon className={`mr-2 h-4 w-4 ${link.color}`} />
                                {link.name}
                            </a>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy
            </Button>
            {shareLinks.map((link) => (
                <Button
                    key={link.name}
                    variant="outline"
                    size="icon"
                    asChild
                    className={link.color}
                >
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                        <link.icon className="h-4 w-4" />
                    </a>
                </Button>
            ))}
        </div>
    );
}
