/**
 * API representation of an entity record (decimals for money, booleans for flags).
 */
type EntityRecord = Record<string, unknown> & {
    createdAt: string;
    id: string;
    updatedAt: string;
};

export default EntityRecord;
