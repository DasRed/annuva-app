/**
 * Structured postal address. Empty parts are null.
 */
export default interface PostalAddress {
    /** Additional line, e.g. a department, "c/o" or a building part. */
    addition: string | null;
    city: string | null;
    /** ISO 3166-1 alpha-2 code. */
    country: string | null;
    houseNumber: string | null;
    postalCode: string | null;
    street: string | null;
}
