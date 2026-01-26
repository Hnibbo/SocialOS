import { useState } from 'react';
import { useSafety } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Loader2 } from 'lucide-react';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetType: 'user' | 'content' | 'message' | 'group';
    targetId: string;
    targetName?: string;
}

const REPORT_REASONS = {
    user: [
        { value: 'harassment', label: 'Harassment or Bullying' },
        { value: 'fake', label: 'Fake Profile / Catfishing' },
        { value: 'inappropriate', label: 'Inappropriate Behavior' },
        { value: 'spam', label: 'Spam or Scam' },
        { value: 'underage', label: 'Underage User' },
        { value: 'other', label: 'Other' },
    ],
    content: [
        { value: 'nudity', label: 'Nudity or Sexual Content' },
        { value: 'violence', label: 'Violence or Threats' },
        { value: 'hate', label: 'Hate Speech' },
        { value: 'misinformation', label: 'Misinformation' },
        { value: 'copyright', label: 'Copyright Violation' },
        { value: 'other', label: 'Other' },
    ],
    message: [
        { value: 'harassment', label: 'Harassment' },
        { value: 'threats', label: 'Threats' },
        { value: 'spam', label: 'Spam' },
        { value: 'inappropriate', label: 'Inappropriate Content' },
        { value: 'other', label: 'Other' },
    ],
    group: [
        { value: 'hate', label: 'Hate Group' },
        { value: 'illegal', label: 'Illegal Activity' },
        { value: 'harassment', label: 'Coordinated Harassment' },
        { value: 'other', label: 'Other' },
    ],
};

export function ReportDialog({ open, onOpenChange, targetType, targetId, targetName }: ReportDialogProps) {
    const { report } = useSafety();
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reasons = REPORT_REASONS[targetType];

    const handleSubmit = async () => {
        if (!reason) return;
        setSubmitting(true);
        await report(targetType, targetId, reason, details);
        setSubmitting(false);
        onOpenChange(false);
        setReason('');
        setDetails('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" />
                        Report {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
                    </DialogTitle>
                    <DialogDescription>
                        {targetName ? `Reporting: ${targetName}` : 'Help us understand the issue.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Reason for Report</Label>
                        <RadioGroup value={reason} onValueChange={setReason}>
                            {reasons.map((r) => (
                                <div key={r.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={r.value} id={r.value} />
                                    <Label htmlFor={r.value} className="font-normal cursor-pointer">{r.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details">Additional Details (Optional)</Label>
                        <Textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Provide any additional context..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason || submitting}
                        variant="destructive"
                    >
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
