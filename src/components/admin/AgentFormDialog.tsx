import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    description: z.string().optional(),
    icon: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    category: z.string().min(1, "Category is required"),
    developer: z.string().min(1, "Developer name is required"),
    price_credits: z.coerce.number().min(0, "Price cannot be negative"),
    is_active: z.boolean().default(true),
});

interface Agent {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    category: string;
    developer: string;
    price_credits: number;
    is_active: boolean;
}

interface AgentFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent?: Agent;
    onSuccess: () => void;
}

export default function AgentFormDialog({
    open,
    onOpenChange,
    agent,
    onSuccess,
}: AgentFormDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            icon: "",
            category: "productivity",
            developer: "Hup",
            price_credits: 0,
            is_active: true,
        },
    });

    useEffect(() => {
        if (agent) {
            form.reset({
                name: agent.name,
                slug: agent.slug,
                description: agent.description || "",
                icon: agent.icon || "",
                category: agent.category || "productivity",
                developer: agent.developer || "Hup",
                price_credits: agent.price_credits || 0,
                is_active: agent.is_active,
            });
        } else {
            form.reset({
                name: "",
                slug: "",
                description: "",
                icon: "",
                category: "productivity",
                developer: "Hup",
                price_credits: 0,
                is_active: true,
            });
        }
    }, [agent, form, open]);

    // Auto-slug generation
    const watchName = form.watch("name");
    useEffect(() => {
        if (!agent && watchName) {
            const slug = watchName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            form.setValue("slug", slug);
        }
    }, [watchName, agent, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            const dataToSave = {
                name: values.name,
                slug: values.slug,
                description: values.description,
                icon: values.icon || null, // Convert empty string to null
                category: values.category,
                developer: values.developer,
                price_credits: values.price_credits,
                is_active: values.is_active,
            };

            let error;
            if (agent) {
                const { error: updateError } = await supabase
                    .from("marketplace_agents")
                    .update(dataToSave)
                    .eq("id", agent.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("marketplace_agents")
                    .insert(dataToSave);
                error = insertError;
            }

            if (error) throw error;

            toast.success(`Agent ${agent ? "updated" : "created"} successfully`);
            onSuccess();
        } catch (error: unknown) {
            console.error("Error saving agent:", error);
            const message = error instanceof Error ? error.message : "Failed to save agent";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{agent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
                    <DialogDescription>
                        {agent
                            ? "Update the details of this marketplace agent."
                            : "Create a new agent listing for the marketplace."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Writer Bot" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input placeholder="writer-bot" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of what this agent does..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="productivity">Productivity</SelectItem>
                                                <SelectItem value="coding">Coding</SelectItem>
                                                <SelectItem value="writing">Writing</SelectItem>
                                                <SelectItem value="data">Data Analysis</SelectItem>
                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                <SelectItem value="utility">Utility</SelectItem>
                                                <SelectItem value="fun">Fun</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="developer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Developer</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Hup" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price_credits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (Credits)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormDescription>0 for free agents</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Icon URL (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active Status</FormLabel>
                                        <FormDescription>
                                            Visible in marketplace immediately
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {agent ? "Save Changes" : "Create Agent"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
