export default interface Mail {
    attachments?: { content: Buffer; contentType: string; filename: string }[];
    /** Display name shown as "<fromName> via <app name>". */
    fromName?: string;
    replyTo?: string | null;
    subject: string;
    text: string;
    to: string;
}
